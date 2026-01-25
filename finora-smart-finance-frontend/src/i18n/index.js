import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import { getUserPreferences } from '@/utils/userPreferences';

const preferences = getUserPreferences();
const initialLanguage = preferences.language || 'de';

const rtlLanguages = new Set(['ar']);

const setDocumentDirection = (language) => {
  if (typeof document === 'undefined') return;
  const isRtl = rtlLanguages.has(language);
  document.documentElement.lang = language;
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  if (document.body) {
    document.body.dir = isRtl ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', isRtl);
  }
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'de',
    supportedLngs: ['de', 'en', 'ar', 'ka'],
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
    react: {
      useSuspense: false,
    },
  });

setDocumentDirection(initialLanguage);

i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
});

export default i18n;
