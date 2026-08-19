import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Instrument_Sans, Google_Sans_Code } from 'next/font/google'

import { asset, CATALOG_NAME, SITE_IDENTITY, SITE_URL } from '@/lib/site'
import { TopBar } from './_components/TopBar'
import { Footer } from './_components/Footer'
import './globals.css'

/**
 * next/font self-hosts both families at build time — measured on this exact setup: the
 * export writes woff2 into out/_next/static/media/ and no request to fonts.googleapis.com
 * or fonts.gstatic.com survives anywhere in out/. Two families, latin only, 64 KB total.
 *
 * They are declared here rather than per page because preloading is per route: a font
 * function called on one page is not preloaded on the others.
 */
const display = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
})

/** MONO is left at its default of 1. Prose is Instrument Sans, so the proportional end of
 *  the axis is never asked for and requesting the range would only add bytes. */
const mono = Google_Sans_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  // next/font has no metric data for this family, so it cannot synthesise a
  // metric-matched fallback and says so at build time. Naming the fallbacks keeps the
  // swap from landing on whatever generic the platform picks.
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
})

/**
 * Resolves the theme before first paint. There is no server, so this inline script is the
 * only way to avoid a flash of the wrong theme.
 *
 * Two attributes, not one: `data-theme-setting` is what the reader chose (system | light |
 * dark) and survives reloads; `data-color-mode` is what that resolves to right now. The
 * split matters because setting `color-scheme` to a concrete value stops
 * `prefers-color-scheme` from matching, so "follow the system" cannot be expressed by the
 * resolved value alone.
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
  // The trailing slash is load-bearing: without it `new URL('og.png', base)` resolves
  // against the host root, because URL resolution drops the last non-slash segment.
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
  // MEASURED: metadata icon URLs are emitted verbatim — Next does NOT apply basePath to
  // them the way it does to next/link. A bare '/favicon.svg' 404s on a project Pages site.
  icons: { icon: [{ url: asset('favicon.svg'), type: 'image/svg+xml' }] }
  // No `alternates.canonical` here on purpose. MEASURED: a canonical on the root layout is
  // inherited verbatim by every route including 404, so all of them declare themselves
  // duplicates of the home page. Each page sets its own.
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable}`}
      // The inline script above rewrites two attributes on this element before React
      // hydrates, which is exactly what the warning is for.
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
