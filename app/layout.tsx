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
  const ogImage =
    Array.isArray(siteMetadata.openGraph?.images)
      ? siteMetadata.openGraph?.images[0]?.url
      : siteMetadata.openGraph?.images?.url;

  return (
    <html lang="en" className={`${poppins.variable} ${sourceCodePro.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

     
        <meta property="og:type" content={siteMetadata.openGraph?.type ?? 'website'} />
        <meta property="og:title" content={siteMetadata.title} />
        <meta property="og:description" content={siteMetadata.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={siteMetadata.metadataBase?.toString() ?? ''} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteMetadata.title} />
        <meta name="twitter:description" content={siteMetadata.description} />
        <meta name="twitter:image" content={ogImage} />

    
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f0c29" media="(prefers-color-scheme: dark)" />
      </head>
      <body>{children}</body>
    </html>
  );
}




