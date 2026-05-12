import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import PublicSearch from './components/PublicSearch'
import PublicBusinessProfile from './components/PublicBusinessProfile'
import LandingPage from './components/LandingPage'
import CustomerManager from './components/CustomerManager'

function App() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/search" element={<PublicSearch />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/business/:placeId" element={<PublicBusinessProfile />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <CustomerManager />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App