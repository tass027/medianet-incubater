'use client';

import { useState, useEffect } from 'react';
import en from '@/app/locales/en';
import fr from '@/app/locales/fr';
import ar from '@/app/locales/ar';
import es from '@/app/locales/es';
import de from '@/app/locales/de';
import it from '@/app/locales/it';
import pt from '@/app/locales/pt';
import zh from '@/app/locales/zh';
import ja from '@/app/locales/ja';
import ko from '@/app/locales/ko';

const translations = { en, fr, ar, es, de, it, pt, zh, ja, ko };

export default function useTranslation() {
  const [language, setLanguage] = useState('en');
  const [t, setT] = useState(translations.en);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
    setT(translations[savedLang] || translations.en);
    
    // Gérer la direction RTL pour l'arabe
    if (savedLang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, []);

  const changeLanguage = (lang) => {
    localStorage.setItem('language', lang);
    setLanguage(lang);
    setT(translations[lang] || translations.en);
    
    // Appliquer RTL pour l'arabe
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  return { t, language, changeLanguage };
}