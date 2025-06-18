import { formatDate } from '@seriously-ai/shared';

export default function HomePage() {
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate, { format: 'long' });

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center">
          {/* Logo/Brand Section */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-primary-800 bg-clip-text text-transparent mb-4">
              Seriously AI
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto leading-relaxed">
              An AI-powered platform for generating actionable business insights 
              that help you make data-driven decisions with confidence.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 mb-16">
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Data Analytics
              </h3>
              <p className="text-secondary-600">
                Transform raw data into meaningful insights with our advanced AI algorithms.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-accent-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Real-time Insights
              </h3>
              <p className="text-secondary-600">
                Get instant recommendations and actionable insights as your data changes.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Smart Automation
              </h3>
              <p className="text-secondary-600">
                Automate decision-making processes with intelligent AI-driven workflows.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-secondary-600 mb-8 text-lg">
              Join thousands of companies using Seriously AI to make smarter, 
              data-driven decisions every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-3">
                Get Started Free
              </button>
              <button className="btn-secondary text-lg px-8 py-3">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center">
            <p className="text-secondary-500">
              Built with Next.js 14, TypeScript, and TailwindCSS
            </p>
            <p className="text-secondary-400 text-sm mt-2">
              Last updated: {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 