'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { en } from './locales/en';
import { fr } from './locales/fr';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (path: string, fallback?: string) => string;
}

const dictionaries: Record<Language, any> = { en, fr };

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (path: string, fallback?: string) => fallback || path
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  // Load persisted language choice on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'fr') {
        setLangState(saved);
      }
    } catch (e) {
      // Storage access fallback
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('app_language', newLang);
    } catch (e) {}
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'fr' : 'en');
  };

  // Helper function to resolve dot-notated paths like t('nav.planner')
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let cur = dictionaries[lang];
    for (const k of keys) {
      if (!cur || cur[k] === undefined) {
        // Fallback to English dictionary if key is missing in French
        let enCur = dictionaries['en'];
        for (const ek of keys) {
          if (!enCur || enCur[ek] === undefined) return fallback || path;
          enCur = enCur[ek];
        }
        return typeof enCur === 'string' ? enCur : (fallback || path);
      }
      cur = cur[k];
    }
    return typeof cur === 'string' ? cur : (fallback || path);
  };

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);