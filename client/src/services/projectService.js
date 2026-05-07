import axios from 'axios'

import { API_BASE, getAuthHeader } from '../config/api'
import applicationService from './applicationService'

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

const applyToProject = async (projectId, pitch, proposal, proposalPDF = '') => {
  return applicationService.applyToProject({ projectId, pitch, proposal, proposalPDF })
}

const getMyApplications = async () => {
  return applicationService.getMine()
}

const getApplicants = async (projectId) => {
  return applicationService.getForProject(projectId)
}

const updateStatus = async (applicationId, status) => {
  return applicationService.updateStatus(applicationId, status)
}

export default { getAllProjects, getMyProjects, createProject, applyToProject, getMyApplications, getApplicants, updateStatus }