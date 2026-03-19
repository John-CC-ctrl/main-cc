import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-navy-light mb-4">404</div>
        <h1 className="text-white text-2xl font-semibold mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-white text-navy font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
