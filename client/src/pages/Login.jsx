import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { setUser, setError } from '../features/auth/authSlice'
import authService from '../services/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const getSafeNext = () => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('next')
    const decoded = raw ? decodeURIComponent(raw) : ''
    const fromState = location.state?.next

    const candidate = decoded || fromState || ''
    if (typeof candidate !== 'string') return ''
    if (!candidate.startsWith('/')) return ''
    return candidate
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await authService.login({ email, password })
      dispatch(setUser(data))
      const next = getSafeNext()
      navigate(next || '/dashboard', { replace: true })
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Login failed'))
      alert(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Login to FYPFinder</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm"
          >
            Back to Home
          </button>
        </form>
        <p className="mt-4 text-sm">
          Don't have an account? <a href="/register" className="text-blue-600">Register</a>
        </p>
      </div>
    </div>
  )
}