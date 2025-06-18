import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/strict-boolean-expressions
const basePath: string = import.meta.env.VITE_BASE_PATH || '/';

export async function initI18n() {
  return i18n
    .use(initReactI18next)
    .use(Backend)
    .use(LanguageDetector)
    .init({
      // Specifies the default language (locale) used
      // when a user visits our site for the first time.
      // lng: 'fr',
      // Fallback locale used when a translation is
      // missing in the active locale. Again, use your
      // preferred locale here.
      fallbackLng: 'fr',
      // supportedLngs: ['fr', 'en'],

      debug: true,
      // Normally, we want `escapeValue: true` as it
      // ensures that i18next escapes any code in
      // translation messages, safeguarding against
      // XSS (cross-site scripting) attacks. However,
      // React does this escaping itself, so we turn
      // it off in i18next.
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['navigator', 'querystring', 'localStorage'],
        caches: ['localStorage'],
      },
      backend: {
        loadPath: `${basePath}/locales/{{lng}}/{{ns}}.json`, // Prend en compte le `base` de la configuration de Vite
      },
    });
}

export default i18n;
