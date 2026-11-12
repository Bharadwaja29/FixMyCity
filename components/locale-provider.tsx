'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { dictionary, type DictionaryKey, type Locale } from '@/lib/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: DictionaryKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    document.documentElement.lang = locale === 'hi' ? 'hi' : 'en'
  }, [locale])

  const t = (key: DictionaryKey) => dictionary[locale][key]

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function T({ k }: { k: DictionaryKey }) {
  const { t } = useLocale()
  return <>{t(k)}</>
}
