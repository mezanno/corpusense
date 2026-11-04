import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Welcome = () => {
  const { t } = useTranslation('welcome');
  return (
    <section className='flex max-h-full w-full flex-col items-center space-y-4 overflow-auto'>
      <img src={`${import.meta.env.VITE_BASE_PATH}/images/logo.png`} className='w-1/2'></img>
      <div className='space-y-2'>
        <h1 className='font-bold'>{t('title')}</h1>
        <p>{t('introduction.p1')}</p>
        <h2>{t('introduction.p2')}</h2>
        <ul>
          <li>
            <Trans
              i18nKey='features.import'
              ns='welcome'
              components={{ strong: <strong className='italic' /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey='features.process'
              ns='welcome'
              components={{ strong: <strong className='italic' /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey='features.analyze'
              ns='welcome'
              components={{ strong: <strong className='italic' /> }}
            />
          </li>
        </ul>
        <p>{t('conclusion')}</p>
      </div>
      <div className='w-full space-y-2'>
        <h2 className='font-bold'>{t('getting_started.title')}</h2>
        <p>{t('getting_started.description')}</p>
        <ul className='list-disc pl-5'>
          <li>
            <Link
              className='font-medium text-blue-600 hover:underline dark:text-blue-500'
              to={`/${CorpusenseRoutes.MANIFEST}?manifestId=https://gallica.bnf.fr/iiif/ark:/12148/bd6t543024772/manifest.json`}
            >
              {t('getting_started.example1')}
            </Link>
          </li>
          <li>
            <Link
              className='font-medium text-blue-600 hover:underline dark:text-blue-500'
              to={`/${CorpusenseRoutes.MANIFEST}?manifestId=https://gallica.bnf.fr/iiif/ark:/12148/bpt6k12410870/manifest.json`}
            >
              {t('getting_started.example2')}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Welcome;
