const VersionDisplay = () => {
  const buildDate =
    import.meta.env.VITE_BUILD_DATE !== undefined
      ? new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(import.meta.env.VITE_BUILD_DATE as string))
      : 'Unknown';

  return (
    <div className='flex w-full flex-col text-sm font-light'>
      <span>Corpusense v{import.meta.env.VITE_APP_VERSION}</span>
      <span>Build : {buildDate}</span>
      <span>Commit : {import.meta.env.VITE_GIT_HASH ?? 'Unknown'}</span>
    </div>
  );
};

export default VersionDisplay;
