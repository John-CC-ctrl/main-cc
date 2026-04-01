export default function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'residential', label: 'Residential' },
    { id: 'commercial',  label: 'Commercial'  },
  ]

  return (
    <div className="bg-navy-dark border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={[
              'px-7 py-3 text-sm font-semibold border-b-2 transition-colors',
              activeTab === tab.id
                ? 'text-white border-white'
                : 'text-white/45 border-transparent hover:text-white/70 hover:border-white/30',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
