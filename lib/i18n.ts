export type Locale = 'en' | 'hi'

export const dictionary = {
  en: {
    navReport: 'Report',
    navTrack: 'Track',
    navLedger: 'Public Ledger',
    navOfficer: 'Officer Login',
    skip: 'Skip to main content',
    heroKicker: 'Civic complaint register · Bhagalpur pilot',
    heroTitleA: 'Report it.',
    heroTitleB: 'Track it.',
    heroTitleC: 'See it fixed.',
    heroBody:
      'File a complaint about a pothole, a dark streetlight or an overflowing drain. Every complaint gets a public case number, a responsible department and a timeline anyone can check.',
    reportCta: 'Report a problem',
    ledgerCta: 'Browse the public ledger',
    trackLabel: 'Track a complaint',
    trackHint: 'Enter the case number from your SMS receipt.',
    trackButton: 'Track',
    trackError: 'Use the format FMC-2026-004217.',
  },
  hi: {
    navReport: 'शिकायत करें',
    navTrack: 'स्थिति देखें',
    navLedger: 'सार्वजनिक रजिस्टर',
    navOfficer: 'अधिकारी लॉगिन',
    skip: 'मुख्य सामग्री पर जाएँ',
    heroKicker: 'नागरिक शिकायत रजिस्टर · भागलपुर पायलट',
    heroTitleA: 'शिकायत करें।',
    heroTitleB: 'स्थिति देखें।',
    heroTitleC: 'समाधान पाएँ।',
    heroBody:
      'गड्ढे, बंद स्ट्रीटलाइट या उफनती नाली की शिकायत दर्ज करें। हर शिकायत को एक सार्वजनिक केस नंबर, ज़िम्मेदार विभाग और समय-सीमा मिलती है जिसे कोई भी देख सकता है।',
    reportCta: 'समस्या दर्ज करें',
    ledgerCta: 'सार्वजनिक रजिस्टर देखें',
    trackLabel: 'शिकायत की स्थिति देखें',
    trackHint: 'अपनी SMS रसीद पर दिया केस नंबर दर्ज करें।',
    trackButton: 'देखें',
    trackError: 'इस प्रारूप का उपयोग करें: FMC-2026-004217',
  },
} as const

export type DictionaryKey = keyof (typeof dictionary)['en']
