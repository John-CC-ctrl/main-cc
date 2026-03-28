import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PricingCalculator from './pages/PricingCalculator'
import Users from './pages/admin/Users'
import NDFUTool from './pages/NDFUTool'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Redirect root → dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — all authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <PricingCalculator />
              </ProtectedRoute>
            }
          />

          {/* All staff roles */}
          <Route
            path="/ndfu"
            element={
              <ProtectedRoute>
                <NDFUTool />
              </ProtectedRoute>
            }
          />

          {/* Owner only */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
