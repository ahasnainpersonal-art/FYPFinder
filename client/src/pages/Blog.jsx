import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import blogService from '../services/blogService'

const TAGS = ['All', 'Industrial Projects', 'Tips', 'Experience', 'Announcement', 'News']

const roleBadge = (role) => {
  if (role === 'admin') return 'bg-red-100 text-red-700'
  if (role === 'supervisor') return 'bg-purple-100 text-purple-700'
  return 'bg-blue-100 text-blue-700'
}

export default function Blog() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [commentDrafts, setCommentDrafts] = useState({})
  const [form, setForm] = useState({ title: '', content: '', tag: 'Tips' })

  const buildNextUrl = (next) => {
    const value = typeof next === 'string' ? next : '/blog'
    return `/login?next=${encodeURIComponent(value)}`
  }

  useEffect(() => {
    blogService.getPosts().then(setPosts).catch(() => setPosts([]))
  }, [])

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const selectedTag = (() => {
    const tag = params.get('tag')
    if (tag && TAGS.includes(tag)) return tag
    return 'All'
  })()

  const expandedId = params.get('post') || null

  const updateQuery = (patch) => {
    const next = new URLSearchParams(location.search)
    for (const [k, v] of Object.entries(patch || {})) {
      if (v === null || v === undefined || v === '') next.delete(k)
      else next.set(k, String(v))
    }
    const qs = next.toString()
    navigate(`/blog${qs ? `?${qs}` : ''}${location.hash || ''}`)
  }

  useEffect(() => {
    const hash = String(location.hash || '')
    if (!hash.startsWith('#')) return
    const id = hash.slice(1)
    if (!id) return

    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [location.hash, expandedId])

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (selectedTag === 'All') return true
      if (selectedTag === 'Industrial Projects') return !!p.isIndustrialShowcase
      return p.tag === selectedTag
    })
  }, [posts, selectedTag])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!user) return navigate(buildNextUrl('/blog'))
    try {
      const created = await blogService.createPost(form)
      setPosts([created, ...posts])
      setForm({ title: '', content: '', tag: 'Tips' })
    } catch {
      // noop
    }
  }

  const handleToggleLike = async (postId) => {
    if (!user) return navigate(buildNextUrl(`/blog?post=${postId}#comments-${postId}`))
    try {
      const updated = await blogService.toggleLike(postId)
      setPosts(posts.map((p) => (p._id === postId ? updated : p)))
    } catch {
      // noop
    }
  }

  const handleAddComment = async (postId) => {
    if (!user) return navigate(buildNextUrl(`/blog?post=${postId}#comments-${postId}`))
    const text = commentDrafts[postId]
    if (!text) return
    try {
      const updated = await blogService.addComment(postId, text)
      setPosts(posts.map((p) => (p._id === postId ? updated : p)))
      setCommentDrafts({ ...commentDrafts, [postId]: '' })
    } catch {
      // noop
    }
  }

  const handleDelete = async (postId) => {
    if (!user) return navigate(buildNextUrl('/blog'))
    try {
      await blogService.deletePost(postId)
      setPosts(posts.filter((p) => p._id !== postId))
    } catch {
      // noop
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Blog</h1>

      {user && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-700">Write a Post</h2>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
          <select
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value="Tips">Tips</option>
            <option value="Experience">Experience</option>
            <option value="Announcement">Announcement</option>
            <option value="News">News</option>
          </select>
          <textarea
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            rows={4}
            required
          ></textarea>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm">
            Publish
          </button>
        </form>
      )}

      {!user && (
        <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-6">
          <p className="text-sm text-gray-700">Login to like and comment.</p>
          <button
            onClick={() => navigate(buildNextUrl('/blog'))}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
          >
            Login
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => updateQuery({ tag: t === 'All' ? null : t, post: null })}
            className={`rounded-md px-4 py-2 text-sm ${selectedTag === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-gray-500">No posts yet.</p>}

      <div className="space-y-4">
        {filtered.map((p) => {
          const preview = String(p.content || '').slice(0, 150)
          const showMore = String(p.content || '').length > 150
          const isExpanded = expandedId === p._id
          const liked = user?._id && Array.isArray(p.likedBy) && p.likedBy.some((id) => String(id) === String(user._id))
          const canDelete = user && (user.role === 'admin' || String(user._id) === String(p.author?._id))

          return (
            <div
              key={p._id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div
                    onClick={() => updateQuery({ post: isExpanded ? null : p._id })}
                    className="text-left w-full cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') updateQuery({ post: isExpanded ? null : p._id })
                    }}
                  >
                    <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500">By {p.author?.name}</span>
                      <span className={`px-2 py-1 rounded-full ${roleBadge(p.author?.role)}`}>{p.author?.role || 'user'}</span>
                      {p.isIndustrialShowcase ? (
                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700">Industrial Project</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">{p.tag}</span>
                      )}
                    </div>
                    {!isExpanded && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700">{preview}{showMore ? '…' : ''}</p>
                        {showMore && (
                          <button
                            type="button"
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                            onClick={() => updateQuery({ post: p._id })}
                          >
                            Read More
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.content}</p>

                      <button
                        type="button"
                        className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm"
                        onClick={() => updateQuery({ post: null })}
                      >
                        Show Less
                      </button>

                      <div className="mt-4">
                        <div id={`comments-${p._id}`}>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Comments ({p.comments?.length || 0})</p>
                        </div>
                        <div className="space-y-2">
                          {(p.comments || []).map((c, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-md p-3">
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:underline mb-1"
                                onClick={() => c.user && navigate(`/profile/${c.user}`)}
                              >
                                {c.name}
                              </button>
                              <p className="text-sm text-gray-700">{c.text}</p>
                            </div>
                          ))}
                          {(p.comments || []).length === 0 && (
                            <p className="text-sm text-gray-500">No comments yet.</p>
                          )}
                        </div>

                        {user ? (
                          <div className="mt-3 flex gap-2">
                            <input
                              value={commentDrafts[p._id] || ''}
                              onChange={(e) => setCommentDrafts({ ...commentDrafts, [p._id]: e.target.value })}
                              placeholder="Write a comment..."
                              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            />
                            <button
                              onClick={() => handleAddComment(p._id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                            >
                              Send
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(buildNextUrl(`/blog?post=${p._id}#comments-${p._id}`))}
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                          >
                            Login to comment
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-sm">
                  <button
                    onClick={() => handleToggleLike(p._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                    title={liked ? 'Unlike' : 'Like'}
                  >
                    Like ({p.likes || 0})
                  </button>
                  <span className="text-xs text-gray-500">Comments: {p.comments?.length || 0}</span>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}