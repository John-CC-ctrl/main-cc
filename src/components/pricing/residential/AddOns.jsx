import { useCalc } from '../../../context/CalculatorContext'

const ADDON_LIST = [
  { key: 'oven',    label: 'Oven Cleaning',   price: '$59', hours: '+1 hr' },
  { key: 'fridge',  label: 'Inside Fridge',   price: '$59', hours: '+1 hr' },
  { key: 'windows', label: 'Inside Windows',  price: '$59', hours: '+1 hr' },
]

export default function AddOns() {
  const { addons, toggleAddon, selectedService } = useCalc()
  const isDeluxe = selectedService === 'deluxe'

  return (
    <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-3">Add-On Services</p>

      {isDeluxe && (
        <div className="mb-3 bg-blue-cc-bg border border-navy/20 rounded-lg px-4 py-2.5 text-sm text-navy font-medium">
          All add-ons included with Deluxe Clean.
        </div>
      )}

      <div className={isDeluxe ? 'opacity-40 pointer-events-none' : ''}>
        {ADDON_LIST.map(({ key, label, price, hours }) => (
          <label
            key={key}
            className="flex items-center gap-3 py-2.5 border-b border-gray-cc-50 last:border-0 cursor-pointer hover:bg-gray-cc-50 -mx-2 px-2 rounded"
          >
            <input
              type="checkbox"
              checked={addons[key]}
              onChange={() => toggleAddon(key)}
              disabled={isDeluxe}
              className="w-4 h-4 accent-navy rounded"
            />
            <span className="flex-1 text-sm text-gray-cc-700">
              {label}{' '}
              <span className="text-gray-cc-400 text-xs font-medium">{hours}</span>
            </span>
            <span className="text-navy font-bold text-sm">{price}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
