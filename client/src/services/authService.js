import axios from 'axios'

import { API_BASE } from '../config/api'

const API = `${API_BASE}/api/auth`

const register = async (userData) => {
  const res = await axios.post(`${API}/register`, userData)
  return res.data
}

const login = async (userData) => {
  const res = await axios.post(`${API}/login`, userData)
  return res.data
}

export default { register, login }