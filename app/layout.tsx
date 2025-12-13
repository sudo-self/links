import type { Metadata } from 'next';
import { Poppins, Source_Code_Pro } from 'next/font/google';
import './globals.css';

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

// Site configuration
const SITE_URL = 'https://links.jessejesse.com';
const SITE_TITLE = 'Jesse Roper - Software Engineer';
const SITE_DESCRIPTION = 'Professional portfolio and links for Jesse Roper, Software Engineer specializing in modern web development and cloud technologies';
const THUMBNAIL_URL = `${SITE_URL}/icon.jpg`;

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  keywords: ['Software Engineer', 'Web Developer', 'Portfolio', 'Jesse Roper', 'JavaScript', 'React', 'Next.js', 'TypeScript'],
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
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0c29' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${sourceCodePro.variable}`}>
      <head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" sizes="192x192" href="/favicon-192.png" />
        
        
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={SITE_URL} />
        
   
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={THUMBNAIL_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Jesse Roper - Software Engineer Portfolio" />
        <meta property="og:site_name" content="Jesse Roper Links" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@lightfighter719" />
        <meta name="twitter:creator" content="@lightfighter719" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={THUMBNAIL_URL} />
        <meta name="twitter:image:alt" content="Jesse Roper - Software Engineer Portfolio" />
        
 
        <meta name="author" content="Jesse Roper" />
        <meta name="keywords" content="Software Engineer, Web Developer, Portfolio, Jesse Roper, JavaScript, React, Next.js, TypeScript, Cloud, AWS" />
        
        
        {/* iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jesse Roper" />
        
        {/* Windows */}
        <meta name="msapplication-TileColor" content="#001F54" />
        <meta name="msapplication-starturl" content="/" />
      </head>
      <body>{children}</body>
    </html>
  );
}







