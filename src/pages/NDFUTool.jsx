import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function NDFUTool() {
  const [, setCallState] = useState(null)

  const handleStartOver = () => {
    setCallState(null)
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <TopBar title="NDFU Sales Call Tool" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800">NDFU Sales Call Tool</h1>
            <button
              onClick={handleStartOver}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Call / Start Over
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
