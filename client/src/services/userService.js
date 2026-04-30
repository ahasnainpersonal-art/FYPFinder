import { api, getAuthHeader } from '../config/api'

const searchStudents = async (q) => {
  const res = await api.get(`/api/users/students/search?q=${encodeURIComponent(q || '')}`, getAuthHeader())
  return res.data
}

export default { searchStudents }
