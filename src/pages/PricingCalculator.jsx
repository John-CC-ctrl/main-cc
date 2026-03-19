import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function PricingCalculator() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar title="Pricing Calculator" />

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              💲
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Pricing Calculator</h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Full build coming next session. This page will let you generate accurate quotes
              for residential and commercial cleaning jobs.
            </p>
            <div className="mt-6 inline-block bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-2 rounded-full">
              Coming Next Session
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
