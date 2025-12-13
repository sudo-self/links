// app/siteMetadata.ts

import { Metadata } from 'next';

export const SITE_URL = 'https://links.jessejesse.com';
export const SITE_TITLE = 'Jesse Roper - Software Engineer';
export const SITE_DESCRIPTION =
  'Professional portfolio and links for Jesse Roper, Software Engineer specializing in modern web development and cloud technologies';
export const THUMBNAIL_URL = `${SITE_URL}/icon.jpg`;

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  keywords: [
    'Software Engineer',
    'Web Developer',
    'Portfolio',
    'Jesse Roper',
    'JavaScript',
    'React',
    'Next.js',
    'TypeScript',
  ],
  authors: [{ name: 'Jesse Roper' }],
  creator: 'Jesse Roper',
  publisher: 'Jesse Roper',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: 'Jesse Roper Links',
    images: [
      {
        url: THUMBNAIL_URL,
        width: 1200,
        height: 630,
        alt: 'Jesse Roper - Software Engineer Portfolio',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [THUMBNAIL_URL],
    creator: '@lightfighter719',
    site: '@lightfighter719',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  applicationName: 'Jesse Roper Links',
  appleWebApp: {
    capable: true,
    title: 'Jesse Roper',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: [
    { color: '#ffffff', media: '(prefers-color-scheme: light)' },
    { color: '#0f0c29', media: '(prefers-color-scheme: dark)' },
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/favicon-32.png', sizes: '32x32' },
      { rel: 'icon', url: '/favicon-192.png', sizes: '192x192' },
    ],
  },
};
