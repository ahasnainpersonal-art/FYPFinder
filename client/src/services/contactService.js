import { api, getAuthHeader } from '../config/api'

const submit = async (data) => {
  const res = await api.post('/api/contact', data)
  return res.data
}

const getAll = async () => {
  const res = await api.get('/api/contact', getAuthHeader())
  return res.data
}

export default { submit, getAll }
