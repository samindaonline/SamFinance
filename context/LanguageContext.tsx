import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { loadFromStorage, saveToStorage } from '../utils/storage';

type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY_LANG = 'ls_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = loadFromStorage<Language>(STORAGE_KEY_LANG, 'en');
    setLanguageState(savedLang);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveToStorage(STORAGE_KEY_LANG, lang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};