import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hil from "./locales/hil.json";
import fil from "./locales/fil.json";
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hil: { translation: hil },
    fil: { translation: fil },
  },
  lng: ["en", "hil", "fil"].includes(
    localStorage.getItem("kabango-language") ?? "",
  )
    ? localStorage.getItem("kabango-language")!
    : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});
i18n.on("languageChanged", (lang) => {
  localStorage.setItem("kabango-language", lang);
  document.documentElement.lang = lang;
});
export default i18n;
