import { api, getAuthHeader } from '../config/api'

const getPosts = async () => {
  const res = await api.get('/api/blog')
  return res.data
}

const createPost = async (data) => {
  const res = await api.post('/api/blog', data, getAuthHeader())
  return res.data
}

const toggleLike = async (postId) => {
  const res = await api.post(`/api/blog/${postId}/like`, {}, getAuthHeader())
  return res.data
}

const addComment = async (postId, text) => {
  const res = await api.post(`/api/blog/${postId}/comment`, { text }, getAuthHeader())
  return res.data
}

const deletePost = async (postId) => {
  const res = await api.delete(`/api/blog/${postId}`, getAuthHeader())
  return res.data
}

export default { getPosts, createPost, toggleLike, addComment, deletePost }
