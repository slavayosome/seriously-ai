import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Seriously AI - AI-Powered Business Insights',
    template: '%s | Seriously AI',
  },
  description: 'An AI-powered platform for generating actionable business insights that help you make data-driven decisions with confidence.',
  keywords: [
    'AI',
    'artificial intelligence',
    'business insights',
    'data analytics',
    'machine learning',
    'business intelligence',
    'data-driven decisions'
  ],
  authors: [{ name: 'Seriously AI Team' }],
  creator: 'Seriously AI',
  publisher: 'Seriously AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://seriously-ai.com',
    title: 'Seriously AI - AI-Powered Business Insights',
    description: 'Transform your business with AI-powered insights and data-driven decision making.',
    siteName: 'Seriously AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Seriously AI - AI-Powered Business Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seriously AI - AI-Powered Business Insights',
    description: 'Transform your business with AI-powered insights and data-driven decision making.',
    images: ['/og-image.png'],
    creator: '@seriously_ai',
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
  verification: {
    google: 'your-google-verification-code',
    // Add other verification codes as needed
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        {/* Main content wrapper */}
        <div id="main-content" className="min-h-screen flex flex-col">
          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="bg-secondary-900 text-white py-8 mt-auto">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-bold">Seriously AI</h3>
                  <p className="text-secondary-300 text-sm">
                    AI-powered business insights
                  </p>
                </div>
                <div className="flex space-x-6 text-sm">
                  <a
                    href="/privacy"
                    className="text-secondary-300 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    className="text-secondary-300 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="/contact"
                    className="text-secondary-300 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-secondary-700 text-center text-secondary-400 text-sm">
                <p>&copy; 2024 Seriously AI. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
} 