import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { CalculatorProvider } from '../context/CalculatorContext'
import Tabs from '../components/pricing/Tabs'
import ResidentialTab from '../components/pricing/residential/ResidentialTab'
import CommercialTab from '../components/pricing/commercial/CommercialTab'

export default function PricingCalculator() {
  const [activeTab, setActiveTab] = useState('residential')

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar title="Pricing Calculator" />

        <CalculatorProvider>
          <div className="flex-1 bg-gray-cc-50">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="max-w-5xl mx-auto px-4 py-6">
              {activeTab === 'residential' ? <ResidentialTab /> : <CommercialTab />}
            </main>
          </div>
        </CalculatorProvider>
      </div>
    </div>
  )
}
