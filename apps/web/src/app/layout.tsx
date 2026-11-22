import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Yantramanav } from 'next/font/google';
import { THEME_SCRIPT } from '@/lib/theme/theme-script';
import { Providers } from './providers';
import './globals.css';

/** Yantramanav's figures are tabular by design: every digit is one width, so money columns align. */
const yantramanav = Yantramanav({
  variable: '--font-yantramanav',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

/** Identifiers only (pi_3QgT8a, LED-7Q2K9): a monospace keeps 0/O and 1/l apart. */
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: { default: 'Paritas', template: '%s · Paritas' },
  description: 'Transaction reconciliation for finance teams: match, investigate, report.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f6f6' },
    { media: '(prefers-color-scheme: dark)', color: '#001219' },
  ],
};

const RootLayout = ({ children }: LayoutProps<'/'>) => (
  <html
    lang="en"
    className={`${yantramanav.variable} ${jetbrainsMono.variable} h-full antialiased`}
    suppressHydrationWarning
  >
    <head>
      {/* Sets the theme class before first paint, so a dark preference never flashes light. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    </head>
    <body className="min-h-full">
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
