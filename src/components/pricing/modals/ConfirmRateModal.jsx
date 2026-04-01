export default function ConfirmRateModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-gray-cc-800 text-base mb-1">Change Hourly Rate</h3>
            <p className="text-sm text-gray-cc-500 leading-relaxed">
              Are you sure you want to change the hourly rate? Only approved hourly rates are allowed.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-cc-500 bg-gray-cc-100 hover:bg-gray-cc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-navy hover:bg-navy-dark transition-colors"
          >
            Yes, Edit Rates
          </button>
        </div>
      </div>
    </div>
  )
}
