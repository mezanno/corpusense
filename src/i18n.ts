import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// Normalisation de la barre oblique finale, identique à celle de vite.config.ts :
// avec le défaut `/`, `loadPath` sinon produit `//locales/…` (URL relative au
// protocole → mauvais hôte) — le bug était masqué localement par VITE_BASE_PATH=/corpusense-dev/.
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
const basePath: string = ((import.meta.env.VITE_BASE_PATH || '/') as string).replace(/\/?$/, '/');

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
      // Les copies « fr-FR » de public/locales ont été supprimées au profit de
      // « fr » (Q5) ; languageOnly charge « fr » quand le navigateur ou le
      // localStorage réclame encore « fr-FR », sans route supplémentaire.
      load: 'languageOnly',
      // supportedLngs: ['fr', 'en'],
      // Namespaces loaded on init; other namespaces can still be lazy-loaded via useTranslation(ns).
      ns: ['translation', 'welcome'],
      defaultNS: 'translation',

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
        loadPath: `${basePath}locales/{{lng}}/{{ns}}.json`, // Prend en compte le `base` de la configuration de Vite
      },
    });
}

export default i18n;
