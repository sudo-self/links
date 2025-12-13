'use client';

import { Poppins, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { metadata as siteMetadata } from './siteMetadata'; 

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-source-code-pro',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Safe OpenGraph image handling
  const ogImage = (() => {
    const images = siteMetadata.openGraph?.images;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      if (typeof first === 'string') return first;
      if ('url' in first) return first.url;
      if (first instanceof URL) return first.toString();
      return '';
    } else if (typeof images === 'string') {
      return images;
    } else if (images instanceof URL) {
      return images.toString();
    }
    return '/icon.jpg';
  })();

  return (
    <html lang="en" className={`${poppins.variable} ${sourceCodePro.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteMetadata.title} />
        <meta property="og:description" content={siteMetadata.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={siteMetadata.metadataBase?.toString() ?? ''} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteMetadata.title} />
        <meta name="twitter:description" content={siteMetadata.description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Theme color */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f0c29" media="(prefers-color-scheme: dark)" />
      </head>
      <body>{children}</body>
    </html>
  );
}






