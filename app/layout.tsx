import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Devanagari, Public_Sans, Source_Serif_4 } from 'next/font/google'
import { LocaleProvider } from '@/components/locale-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' })
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-devanagari',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FixMyCity — Report it. Track it. See it fixed.',
    template: '%s · FixMyCity',
  },
  description:
    'A public register of civic complaints for Indian cities. File a complaint, get a case number, and track it until the fix is confirmed.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F7F3EA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${publicSans.variable} ${sourceSerif.variable} ${notoDevanagari.variable} bg-background`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <LocaleProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </LocaleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
