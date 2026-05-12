import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#080c14', color: '#f0f4ff', fontFamily: 'inherit' }} className="min-h-screen">

      {/* NAVBAR */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#080c14', borderBottom: '1px solid #1e2d45' }}
      >
        <span className="text-white font-bold text-lg tracking-tight">RepuFlow</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/search')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Search Businesses
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-slate-300 hover:text-white text-sm px-4 py-1.5 rounded-md border border-slate-700 hover:border-blue-500 transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="relative flex items-center justify-center min-h-screen text-center px-6"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e2d45 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* subtle blue radial glow behind content */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(59,130,246,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <span
            className="text-xs px-3 py-1 rounded-full text-blue-400"
            style={{ border: '1px solid rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.1)' }}
          >
            Reputation Management for Trades
          </span>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
            Your reputation is<br />your business.
          </h1>

          <p className="text-xl max-w-lg mx-auto" style={{ color: '#94a3b8', lineHeight: '1.7' }}>
            RepuFlow helps plumbers, electricians, and contractors collect more
            5-star reviews and monitor what customers are saying — automatically.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Button
              onClick={() => navigate('/search')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium border-0 h-auto text-sm"
            >
              Search any business
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-6 py-2.5 rounded-md h-auto text-sm"
              style={{ backgroundColor: 'transparent' }}
            >
              Claim your business
            </Button>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section
        className="py-10 px-6"
        style={{ borderTop: '1px solid #1e2d45', borderBottom: '1px solid #1e2d45', backgroundColor: '#0d1424' }}
      >
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-0">
          <div className="flex flex-col items-center text-center px-6">
            <span className="text-white font-bold text-lg mb-1">5-star reviews</span>
            <span className="text-sm" style={{ color: '#64748b' }}>Automated SMS requests</span>
          </div>
          <div
            className="flex flex-col items-center text-center px-6"
            style={{ borderLeft: '1px solid #1e2d45', borderRight: '1px solid #1e2d45' }}
          >
            <span className="text-white font-bold text-lg mb-1">Sentiment analysis</span>
            <span className="text-sm" style={{ color: '#64748b' }}>Powered by AI</span>
          </div>
          <div className="flex flex-col items-center text-center px-6">
            <span className="text-white font-bold text-lg mb-1">Google Places</span>
            <span className="text-sm" style={{ color: '#64748b' }}>Real review data</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6" style={{ backgroundColor: '#080c14' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything you need to manage your reputation
            </h2>
            <p className="text-base" style={{ color: '#64748b' }}>
              Built specifically for trades businesses who rely on word of mouth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <EyeIcon />,
                title: 'Monitor your reviews',
                description:
                  'See all your Google reviews in one place with sentiment analysis that tells you exactly how customers feel.',
              },
              {
                icon: <MessageIcon />,
                title: 'Automate review requests',
                description:
                  'Send personalized SMS review requests to customers after every job. More reviews, less effort.',
              },
              {
                icon: <ChartIcon />,
                title: 'AI-powered insights',
                description:
                  'Get an instant AI summary of your review trends so you can focus on running your business, not reading reviews.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg p-6 transition-colors cursor-default group"
                style={{
                  backgroundColor: 'rgba(15,23,42,0.5)',
                  border: '1px solid #1e293b',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#475569' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b' }}
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6" style={{ backgroundColor: '#0d1424' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Up and running in minutes
          </h2>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* connector line */}
            <div
              className="hidden md:block absolute top-5 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)]"
              style={{ height: '1px', backgroundColor: '#1e2d45', top: '20px' }}
            />

            {[
              {
                step: '01',
                title: 'Search your business',
                description: 'Find your Google listing by searching your business name and location.',
              },
              {
                step: '02',
                title: 'Claim your profile',
                description: 'Verify you\'re the owner to unlock your full dashboard and tools.',
              },
              {
                step: '03',
                title: 'Start collecting reviews',
                description: 'Send SMS requests to customers after every job and watch the reviews roll in.',
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center px-8 relative z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm mb-5"
                  style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
                >
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" style={{ backgroundColor: '#080c14' }}>
        <div
          className="max-w-2xl mx-auto rounded-xl p-12 text-center"
          style={{
            backgroundColor: '#0d1424',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 0 60px rgba(59,130,246,0.06)',
          }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to grow your reputation?
          </h2>
          <p className="text-base mb-8" style={{ color: '#64748b' }}>
            Join trades businesses using RepuFlow to collect more reviews.
          </p>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium text-base border-0 h-auto"
          >
            Get started for free
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-8 text-center text-sm"
        style={{ color: '#64748b', borderTop: '1px solid #1e2d45' }}
      >
        © 2026 RepuFlow. All rights reserved.
      </footer>

    </div>
  )
}
