import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_BASE,
})

export const getStoredUser = () => {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getAuthHeader = () => {
  const user = getStoredUser()
  return { headers: { Authorization: `Bearer ${user?.token}` } }
}
