import { api, getAuthHeader } from '../config/api'

const getAnalytics = async () => {
  const res = await api.get('/api/admin/analytics')
  return res.data
}

const getDomainAnalytics = async () => {
  const res = await api.get('/api/admin/analytics/domains', getAuthHeader())
  return res.data
}

const getCashFlow = async () => {
  const res = await api.get('/api/admin/cashflow', getAuthHeader())
  return res.data
}

const addCashFlow = async (data) => {
  const res = await api.post('/api/admin/cashflow', data, getAuthHeader())
  return res.data
}

export default { getAnalytics, getDomainAnalytics, getCashFlow, addCashFlow }
