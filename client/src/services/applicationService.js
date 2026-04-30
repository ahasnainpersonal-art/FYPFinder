import { api, getAuthHeader } from '../config/api'

const applyToProject = async ({ projectId, pitch, proposal }) => {
  const res = await api.post(
    '/api/applications',
    { type: 'group_to_project', projectId, pitch, proposal },
    getAuthHeader()
  )
  return res.data
}

const getMine = async () => {
  const res = await api.get('/api/applications/mine', getAuthHeader())
  return res.data
}

const getForProject = async (projectId) => {
  const res = await api.get(`/api/applications/project/${projectId}`, getAuthHeader())
  return res.data
}

const getIndustrialForProject = async (projectId) => {
  const res = await api.get(`/api/applications/industrial/${projectId}`, getAuthHeader())
  return res.data
}

const updateStatus = async (applicationId, status) => {
  const res = await api.put(
    `/api/applications/${applicationId}/status`,
    { status },
    getAuthHeader()
  )
  return res.data
}

const generateProposal = async (projectId) => {
  const res = await api.post(
    '/api/applications/generate-proposal',
    { projectId },
    getAuthHeader()
  )
  return res.data
}

export default {
  applyToProject,
  getMine,
  getForProject,
  getIndustrialForProject,
  updateStatus,
  generateProposal,
}
