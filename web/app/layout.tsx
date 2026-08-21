import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Instrument_Sans, Google_Sans_Code } from 'next/font/google'

import { asset, CATALOG_NAME, SITE_IDENTITY, SITE_URL } from '@/lib/site'
import { TopBar } from './_components/TopBar'
import { Footer } from './_components/Footer'
import './globals.css'

/** next/font self-hosts both families at build time; no request to a Google host survives
 *  in out/. Declared here rather than per page because preloading is per route. */
const display = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
})

const mono = Google_Sans_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  // next/font has no metric data for this family and cannot synthesise a matched fallback,
  // so the fallbacks are named rather than left to the platform's generic.
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
})

/**
 * Resolves the theme before first paint; with no server this inline script is the only way
 * to avoid a flash of the wrong theme. Two attributes: `data-theme-setting` is what the
 * reader chose (system | light | dark), `data-color-mode` is what that resolves to now.
 * Setting `color-scheme` to a concrete value stops `prefers-color-scheme` from matching,
 * so "follow the system" cannot be expressed by the resolved value alone.
 */
const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem('msu-theme');
if(s!=='light'&&s!=='dark')s='system';
var m=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;
var r=document.documentElement;
r.setAttribute('data-theme-setting',s);
r.setAttribute('data-color-mode',m);
}catch(e){}})()`

export const metadata: Metadata = {
  // Trailing slash is load-bearing: without it `new URL('og.png', base)` resolves against
  // the host root.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${CATALOG_NAME} — ${SITE_IDENTITY}`,
    template: `%s — ${SITE_IDENTITY}`
  },
  openGraph: {
    type: 'website',
    siteName: CATALOG_NAME,
    images: [{ url: 'og.png', width: 1200, height: 630 }]
  },
  twitter: { card: 'summary_large_image' },
  verification: { google: 'uKu1Yw-fWiPDATOK12extDRbn3mS2TIV_wiCyflDOPc' },
  // MEASURED: Next does not apply basePath to metadata icon URLs; a bare '/favicon.svg'
  // 404s on a project Pages site.
  icons: { icon: [{ url: asset('favicon.svg'), type: 'image/svg+xml' }] }
  // No `alternates.canonical` here: a layout canonical is inherited verbatim by every route
  // including 404, so all of them would declare themselves duplicates of the home page.
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable}`}
      // THEME_SCRIPT rewrites two attributes on this element before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <TopBar />
        <div id="main">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
