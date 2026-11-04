import { SourceWithContent } from '@/data/models/source/source';
import { getSourceRepository } from '@/data/repositories/indexeddb/dbFactory';
import { FilePermissionDeniedError } from '@/data/utils/errors';
import { getErrorMessage } from '@/utils/utils';
import { Octokit } from '@octokit/rest';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const GITHUB_TOKEN_STORAGE_KEY = 'github_token';
const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com';

const useRepository = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  }, []);
  const getToken = (): string | null => {
    return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY);
  };

  const fileToBase64 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  const textToBase64 = (text: string): string => {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  };

  const updateManifestImageUrls = (
    manifestContent: string,
    owner: string,
    repo: string,
    folder: string,
  ): string => {
    const rawBaseUrl = `${GITHUB_RAW_BASE_URL}/${owner}/${repo}/main`;
    return manifestContent.replace(new RegExp(`"(${folder}/[^"]+)"`, 'g'), `"${rawBaseUrl}/$1"`);
  };

  const uploadDirectoryContents = async (
    octokit: Octokit,
    handle: FileSystemDirectoryHandle,
    owner: string,
    repo: string,
    skipFileName: string,
    totalFiles: number,
    uploadedRef: { count: number },
    basePath = '',
  ): Promise<void> => {
    for await (const [name, entry] of handle.entries()) {
      const entryPath = basePath ? `${basePath}/${name}` : name;
      if (entry.kind === 'file') {
        if (name === skipFileName) continue;
        const fileHandle = entry as FileSystemFileHandle;
        const fileObj = await fileHandle.getFile();
        const content = await fileToBase64(fileObj);
        addLog(t('log_upload_file', { filename: entryPath }));
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: entryPath,
          message: `Add ${entryPath}`,
          content,
        });
        uploadedRef.count++;
        setProgress(Math.round((uploadedRef.count / totalFiles) * 90));
      } else if (entry.kind === 'directory') {
        await uploadDirectoryContents(
          octokit,
          entry as FileSystemDirectoryHandle,
          owner,
          repo,
          skipFileName,
          totalFiles,
          uploadedRef,
          entryPath,
        );
      }
    }
  };

  const uploadToRepository = async (
    source: SourceWithContent,
    repositoryName: string,
  ): Promise<void> => {
    if (source.content.type !== 'local') {
      throw new Error('Source content is not local');
    }
    const token = getToken();
    if (token === null || token.trim().length === 0) {
      throw new Error('GitHub token not configured');
    }

    const handle = source.content.localFile.outputDirectoryHandle;
    const perm = await handle.queryPermission({ mode: 'read' });
    if (perm !== 'granted') {
      throw new FilePermissionDeniedError({ directory: handle.name });
    }

    try {
      setStatus('processing');
      setLogs([]);
      setProgress(0);
      addLog(t('log_upload_start'));

      const octokit = new Octokit({ auth: token });

      const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
        name: repositoryName,
        private: false,
        auto_init: false,
      });
      addLog(t('log_upload_repo_created', { repoName: newRepo.full_name }));

      const folderName = handle.name;

      // Count files first (excluding manifest) for progress tracking
      let totalFiles = 0;
      for await (const [name, entry] of handle.entries()) {
        if (entry.kind === 'file' && name !== source.content.localFile.manifestName) totalFiles++;
      }
      const uploadedRef = { count: 0 };

      await uploadDirectoryContents(
        octokit,
        handle,
        newRepo.owner.login,
        newRepo.name,
        source.content.localFile.manifestName,
        totalFiles,
        uploadedRef,
        folderName,
      );

      addLog(t('log_upload_manifest'));
      const manifestFileHandle = await handle.getFileHandle(source.content.localFile.manifestName);
      const manifestFile = await manifestFileHandle.getFile();
      const manifestContent = await manifestFile.text();
      const updatedManifest = updateManifestImageUrls(
        manifestContent,
        newRepo.owner.login,
        newRepo.name,
        folderName,
      );

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: newRepo.owner.login,
        repo: newRepo.name,
        path: `${folderName}/${source.content.localFile.manifestName}`,
        message: `Add ${folderName}/${source.content.localFile.manifestName}`,
        content: textToBase64(updatedManifest),
      });

      setProgress(100);

      const githubManifestUrl = `${GITHUB_RAW_BASE_URL}/${newRepo.owner.login}/${newRepo.name}/main/${folderName}/${source.content.localFile.manifestName}`;
      const sourceRepository = getSourceRepository();
      await sourceRepository.update(source.id, { githubManifestUrl });

      addLog(t('log_upload_completed'));
      setStatus('done');
    } catch (err) {
      setStatus('error');
      addLog(t('log_error', { message: getErrorMessage(err) }));
      throw err;
    }
  };

  const nameAlreadyExists = async (name: string): Promise<boolean> => {
    const token = getToken();
    if (token === null || token.trim().length === 0) return false;
    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      await octokit.rest.repos.get({ owner: user.login, repo: name });
      return true;
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return false;
      }
      return false;
    }
  };

  return {
    uploadToRepository,
    nameAlreadyExists,
    logs,
    status,
    progress,
  };
};

export default useRepository;
