import { LLMProfileFormValues } from '@/components/common/forms/LLMProfileForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { LLMProfile } from '@/data/models/LLMProfile';
import useDialog from '@/hooks/ui/useDialog';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'llm-profiles';

function loadProfiles(): LLMProfile[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as LLMProfile[]) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: LLMProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

const ConfigurationLLMTab = () => {
  const { t } = useTranslation();
  const { openAddLLMProfileDialog, openEditLLMProfileDialog } = useDialog();
  const [profiles, setProfiles] = useState<LLMProfile[]>(loadProfiles);
  const { openDialog } = useAlertDialogContext();

  const persist = (updated: LLMProfile[]) => {
    setProfiles(updated);
    saveProfiles(updated);
  };

  const handleAdd = () => {
    openAddLLMProfileDialog((values: LLMProfileFormValues) => {
      persist([...profiles, { id: crypto.randomUUID(), ...values }]);
    });
  };

  const handleEdit = (profile: LLMProfile) => {
    openEditLLMProfileDialog(profile, (values: LLMProfileFormValues) => {
      persist(profiles.map((p) => (p.id === profile.id ? { ...profile, ...values } : p)));
    });
  };

  const handleDuplicate = (profile: LLMProfile) => {
    const { id, ...rest } = profile;
    persist([...profiles, { id: crypto.randomUUID(), ...rest }]);
  };

  const handleRemove = (id: string) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_profile'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => persist(profiles.filter((p) => p.id !== id)),
      },
    });
  };

  return (
    <div className='mt-2'>
      <div className='mb-2 flex items-center justify-between'>
        <h2>{t('section_llm_profiles')}</h2>
        <button className='soft-button' onClick={handleAdd}>
          <Plus size={16} />
          {t('btn_add_llm_profile')}
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('info_no_llm_profiles')}</p>
      ) : (
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='pr-4 pb-1'>{t('form_label_llm_profile_name')}</th>
              <th className='pr-4 pb-1'>{t('form_label_llm_profile_base_url')}</th>
              <th className='pr-4 pb-1'>{t('form_label_llm_profile_model')}</th>
              <th className='pb-1' />
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className='border-b last:border-0'>
                <td className='py-1 pr-4 font-medium'>{profile.name}</td>
                <td className='py-1 pr-4 text-muted-foreground'>{profile.baseUrl}</td>
                <td className='py-1 pr-4 text-muted-foreground'>{profile.model}</td>
                <td className='py-1'>
                  <div className='flex gap-1'>
                    <button
                      className='soft-button'
                      onClick={() => handleEdit(profile)}
                      title={t('btn_edit')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className='soft-button'
                      onClick={() => handleDuplicate(profile)}
                      title={t('btn_duplicate')}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className='soft-button'
                      onClick={() => handleRemove(profile.id)}
                      title={t('btn_delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ConfigurationLLMTab;
