import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translateText } from "./translations";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("lang") || "es");

  const setLang = (next) => {
    setLangState(next);
    localStorage.setItem("lang", next);
  };

  const t = (text) => {
    try {
      return translateText(text, lang);
    } catch (e) {
      console.error("Translation error:", text, e);
      return text;
    }
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
