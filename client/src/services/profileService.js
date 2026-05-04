import axios from 'axios'

import { API_BASE, getStoredUser } from '../config/api'

const API = `${API_BASE}/api/profile`

const getAuthHeader = () => {
  const user = getStoredUser()
  if (!user?.token) {
    throw new Error('Not authenticated (missing token)')
  }
  return { headers: { Authorization: `Bearer ${user.token}` } }
}

const getProfile = async () => {
  const res = await axios.get(API, getAuthHeader())
  return res.data
}

const updateProfile = async (data) => {
  const res = await axios.put(API, data, getAuthHeader())
  return res.data
}

const getRecommendations = async () => {
  const res = await axios.get(`${API}/recommendations`, getAuthHeader())
  return res.data
}

const generateBio = async (data) => {
  const res = await axios.post(`${API}/generate-bio`, data, getAuthHeader())
  return res.data
}

export default { getProfile, updateProfile, getRecommendations, generateBio }