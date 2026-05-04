import axios from 'axios'

import { API_BASE, getAuthHeader } from '../config/api'

const API = `${API_BASE}/api`

const getAllProjects = async () => {
  const res = await axios.get(`${API}/projects`)
  return res.data
}

const getMyProjects = async () => {
  const res = await axios.get(`${API}/projects/mine`, getAuthHeader())
  return res.data
}

const createProject = async (data) => {
  const res = await axios.post(`${API}/projects`, data, getAuthHeader())
  return res.data
}

const applyToProject = async (projectId, message) => {
  const res = await axios.post(`${API}/applications`, { projectId, message }, getAuthHeader())
  return res.data
}

const getMyApplications = async () => {
  const res = await axios.get(`${API}/applications/mine`, getAuthHeader())
  return res.data
}

const getApplicants = async (projectId) => {
  const res = await axios.get(`${API}/applications/project/${projectId}`, getAuthHeader())
  return res.data
}

const updateStatus = async (applicationId, status) => {
  const res = await axios.put(`${API}/applications/${applicationId}/status`, { status }, getAuthHeader())
  return res.data
}

export default { getAllProjects, getMyProjects, createProject, applyToProject, getMyApplications, getApplicants, updateStatus }