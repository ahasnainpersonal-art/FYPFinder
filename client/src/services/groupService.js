import { api, getAuthHeader } from '../config/api'

const getMine = async () => {
  const res = await api.get('/api/groups/mine', getAuthHeader())
  return res.data
}

const searchStudents = async (q) => {
  const res = await api.get(`/api/groups/search?q=${encodeURIComponent(q || '')}`, getAuthHeader())
  return res.data
}

const create = async () => {
  const res = await api.post('/api/groups', {}, getAuthHeader())
  return res.data
}

const invite = async (groupId, email) => {
  const res = await api.post(`/api/groups/${groupId}/invite`, { email }, getAuthHeader())
  return res.data
}

const removeMember = async (groupId, userId) => {
  const res = await api.delete(`/api/groups/${groupId}/member/${userId}`, getAuthHeader())
  return res.data
}

const promote = async (groupId, userId) => {
  const res = await api.put(`/api/groups/${groupId}/promote/${userId}`, {}, getAuthHeader())
  return res.data
}

const leave = async (groupId) => {
  const res = await api.post(`/api/groups/${groupId}/leave`, {}, getAuthHeader())
  return res.data
}

const disband = async (groupId) => {
  const res = await api.delete(`/api/groups/${groupId}`, getAuthHeader())
  return res.data
}

export default { getMine, searchStudents, create, invite, removeMember, promote, leave, disband }
