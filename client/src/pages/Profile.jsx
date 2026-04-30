import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import profileService from '../services/profileService'
import groupService from '../services/groupService'

const MAX_GROUP_SIZE = 3

const getErrorMessage = (err, fallback) => err?.response?.data?.message || fallback

export default function Profile() {
  const { user } = useSelector((state) => state.auth)
  const fileRef = useRef(null)
  const slotRefs = useRef({})
  const slotDebounceTimers = useRef({})

  const [form, setForm] = useState({
    skills: '',
    interests: '',
    preferredDomain: 'any',
    github: '',
    bio: '',
    photo: '',
    cgpa: '3.0-3.5',
    researchInterests: '',
  })
  const [saved, setSaved] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)
  const [group, setGroup] = useState(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [disbandLoading, setDisbandLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState('')
  const [createError, setCreateError] = useState('')
  const [disbandError, setDisbandError] = useState('')
  const [slotErrors, setSlotErrors] = useState({})
  const [slotSearch, setSlotSearch] = useState({})

  const currentUserId = String(user?._id || '')
  const isLeader = group !== null && String(group.leader?._id) === currentUserId

  const refreshGroup = async () => {
    try {
      const nextGroup = await groupService.getMine()
      setGroup(nextGroup)
      setSlotErrors({})
      setSlotSearch({})
      setCreateError('')
      setDisbandError('')
    } catch {
      setGroup(null)
    }
  }

  useEffect(() => {
    profileService.getProfile().then((data) => {
      setForm({
        skills: data.skills || '',
        interests: data.interests || '',
        preferredDomain: data.preferredDomain || 'any',
        github: data.github || '',
        bio: data.bio || '',
        photo: data.photo || '',
        cgpa: data.cgpa || '3.0-3.5',
        researchInterests: data.researchInterests || '',
      })
    })

    refreshGroup()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, photo: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }

  const handleGenerateBio = async () => {
    setBioLoading(true)
    try {
      const res = await profileService.generateBio({
        name: user?.name,
        skills: form.skills,
        interests: form.interests,
        preferredDomain: form.preferredDomain,
        github: form.github,
        cgpa: form.cgpa,
      })
      setForm((prev) => ({ ...prev, bio: res.bio || '' }))
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to generate bio'))
    }
    setBioLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await profileService.updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSlotSearch = (index, patch) => {
    setSlotSearch((prev) => ({
      ...prev,
      [index]: {
        query: '',
        results: [],
        loading: false,
        selected: null,
        open: false,
        error: '',
        ...(prev[index] || {}),
        ...patch,
      },
    }))
  }

  const clearSlotSearch = (index) => {
    setSlotSearch((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    if (slotDebounceTimers.current[index]) {
      clearTimeout(slotDebounceTimers.current[index])
      delete slotDebounceTimers.current[index]
    }
  }

  const handleSlotQueryChange = (index, value) => {
    if (slotDebounceTimers.current[index]) {
      clearTimeout(slotDebounceTimers.current[index])
    }

    const trimmed = String(value || '').trim()

    updateSlotSearch(index, {
      query: value,
      loading: Boolean(trimmed),
      open: Boolean(trimmed),
      error: '',
      selected: null,
      results: [],
    })

    if (!trimmed) {
      updateSlotSearch(index, { query: '', results: [], loading: false, selected: null, open: false, error: '' })
      return
    }

    slotDebounceTimers.current[index] = setTimeout(async () => {
      try {
        const results = await groupService.searchStudents(trimmed)
        updateSlotSearch(index, {
          query: trimmed,
          results: Array.isArray(results) ? results : [],
          loading: false,
          open: true,
          error: '',
        })
      } catch {
        updateSlotSearch(index, {
          query: trimmed,
          results: [],
          loading: false,
          open: true,
          error: '',
        })
      }
    }, 300)
  }

  const handleSelectStudent = (index, student) => {
    if (slotDebounceTimers.current[index]) {
      clearTimeout(slotDebounceTimers.current[index])
      delete slotDebounceTimers.current[index]
    }

    updateSlotSearch(index, {
      query: student?.name || '',
      results: [],
      loading: false,
      selected: student,
      open: false,
      error: '',
    })
  }

  const handleAddSelectedStudent = async (index) => {
    if (!group?._id) return
    const selectedStudent = slotSearch[index]?.selected
    if (!selectedStudent?.email) return

    const errorKey = `empty-${index}`
    setSlotErrors((prev) => ({ ...prev, [errorKey]: '' }))
    setLoadingAction(`invite-${index}`)
    try {
      await groupService.invite(group._id, selectedStudent.email)
      clearSlotSearch(index)
      await refreshGroup()
    } catch (err) {
      setSlotErrors((prev) => ({ ...prev, [errorKey]: getErrorMessage(err, 'Failed to add member') }))
    }
    setLoadingAction('')
  }

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      const clickedInsideAnySearch = Object.values(slotRefs.current).some((el) => el && el.contains(event.target))
      if (!clickedInsideAnySearch) {
        setSlotSearch((prev) => {
          const next = {}
          Object.keys(prev).forEach((key) => {
            next[key] = { ...prev[key], open: false }
          })
          return next
        })
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [])

  useEffect(() => {
    return () => {
      Object.values(slotDebounceTimers.current).forEach((timerId) => clearTimeout(timerId))
      slotDebounceTimers.current = {}
    }
  }, [])

  const handleCreateGroup = async () => {
    setCreateError('')
    setCreateLoading(true)
    try {
      await groupService.create()
      await refreshGroup()
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Failed to create group'))
    }
    setCreateLoading(false)
  }

  const handleRemoveMember = async (userId) => {
    if (!group?._id) return
    setSlotErrors((prev) => ({ ...prev, [userId]: '' }))
    setLoadingAction(`remove-${userId}`)
    try {
      await groupService.removeMember(group._id, userId)
      await refreshGroup()
    } catch (err) {
      setSlotErrors((prev) => ({ ...prev, [userId]: getErrorMessage(err, 'Failed to remove member') }))
    }
    setLoadingAction('')
  }

  const handlePromoteMember = async (userId) => {
    if (!group?._id) return
    setSlotErrors((prev) => ({ ...prev, [userId]: '' }))
    setLoadingAction(`promote-${userId}`)
    try {
      await groupService.promote(group._id, userId)
      await refreshGroup()
    } catch (err) {
      setSlotErrors((prev) => ({ ...prev, [userId]: getErrorMessage(err, 'Failed to promote member') }))
    }
    setLoadingAction('')
  }

  const handleLeaveGroup = async () => {
    if (!group?._id) return
    setSlotErrors((prev) => ({ ...prev, [currentUserId]: '' }))
    setLoadingAction('leave')
    try {
      await groupService.leave(group._id)
      await refreshGroup()
    } catch (err) {
      setSlotErrors((prev) => ({ ...prev, [currentUserId]: getErrorMessage(err, 'Failed to leave group') }))
    }
    setLoadingAction('')
  }

  const handleDisbandGroup = async () => {
    if (!group?._id) return
    const confirmed = window.confirm('Are you sure you want to disband the group? This cannot be undone.')
    if (!confirmed) return

    setDisbandError('')
    setDisbandLoading(true)
    try {
      await groupService.disband(group._id)
      await refreshGroup()
    } catch (err) {
      setDisbandError(getErrorMessage(err, 'Failed to disband group'))
    }
    setDisbandLoading(false)
  }

  const slots = []
  if (group) {
    const leaderData = group.members?.find((member) => String(member._id) === String(group.leader?._id)) || group.leader
    slots.push({ filled: Boolean(leaderData), isLeaderSlot: true, user: leaderData || null })

    const nonLeaders = (group.members || []).filter((member) => String(member._id) !== String(group.leader?._id))
    nonLeaders.forEach((member) => {
      slots.push({ filled: true, isLeaderSlot: false, user: member })
    })

    while (slots.length < MAX_GROUP_SIZE) {
      slots.push({ filled: false })
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition"
          title="Upload photo"
        >
          {form.photo ? (
            <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-gray-600">Upload</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="skills"
          placeholder="Skills (e.g. Python, React, ML)"
          value={form.skills}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <input
          name="interests"
          placeholder="Interests (e.g. NLP, Computer Vision)"
          value={form.interests}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <select
          name="preferredDomain"
          value={form.preferredDomain}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        >
          <option value="any">Any Domain</option>
          <option value="AI">AI</option>
          <option value="Web">Web</option>
          <option value="Mobile">Mobile</option>
          <option value="Cybersecurity">Cybersecurity</option>
        </select>

        {user?.role === 'student' && (
          <select
            name="cgpa"
            value={form.cgpa}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value="2.0-2.5">2.0 - 2.5</option>
            <option value="2.5-3.0">2.5 - 3.0</option>
            <option value="3.0-3.5">3.0 - 3.5</option>
            <option value="3.5-4.0">3.5 - 4.0</option>
          </select>
        )}

        {user?.role === 'supervisor' && (
          <input
            name="researchInterests"
            placeholder="Research Interests (e.g. NLP, Computer Vision, HCI)"
            value={form.researchInterests}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        )}

        <input
          name="github"
          placeholder="GitHub URL"
          value={form.github}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <button
              type="button"
              onClick={handleGenerateBio}
              disabled={bioLoading}
              className="rounded-md px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {bioLoading ? 'Generating...' : 'Generate Bio with AI'}
            </button>
          </div>
          <textarea
            name="bio"
            placeholder="Short bio"
            value={form.bio}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
        >
          Save Profile
        </button>
        {saved && <p className="text-green-600 text-sm text-center">Profile saved!</p>}
      </form>

      {user?.role === 'student' && (
        <div className="mt-10 bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">My Group</h2>
            {group && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  group.status === 'complete'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {group.status}
              </span>
            )}
          </div>

          {!group ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">You are not in a group yet</p>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={createLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm disabled:opacity-60"
              >
                {createLoading ? 'Creating...' : 'Create Group'}
              </button>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                {slots.map((slot, index) => {
                  const slotNumber = index + 1
                  const isOwnSlot = slot.filled && String(slot.user?._id) === currentUserId
                  const isLeaderUser = slot.filled && String(slot.user?._id) === String(group.leader?._id)
                  const slotKey = slot.filled ? String(slot.user?._id) : `empty-${index}`
                  const slotError = slot.filled ? slotErrors[slotKey] : slotErrors[`empty-${index}`]
                  const loadingRemove = slot.filled && loadingAction === `remove-${slot.user._id}`
                  const loadingPromote = slot.filled && loadingAction === `promote-${slot.user._id}`

                  return (
                    <div
                      key={slotKey}
                      className={
                        slot.filled
                          ? 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
                          : 'rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4'
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Slot {slotNumber}</p>
                          {slot.filled ? (
                            <>
                              <p className="mt-1 text-sm font-semibold text-gray-900">{slot.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{slot.user?.email || '—'}</p>
                              <p className="mt-2 text-xs text-gray-600">Skills: {slot.user?.skills || '—'}</p>
                              <p className="text-xs text-gray-600">CGPA: {slot.user?.cgpa || '—'}</p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm font-semibold text-gray-700">Empty Slot</p>
                          )}
                        </div>

                        {slot.filled && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              isLeaderUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {isLeaderUser ? 'Leader' : 'Member'}
                          </span>
                        )}
                      </div>

                      {slot.filled ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {isLeader && !isLeaderUser && (
                            <>
                              <button
                                type="button"
                                disabled={loadingRemove}
                                onClick={() => handleRemoveMember(slot.user._id)}
                                className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                {loadingRemove ? 'Removing...' : 'Remove'}
                              </button>
                              <button
                                type="button"
                                disabled={loadingPromote}
                                onClick={() => handlePromoteMember(slot.user._id)}
                                className="rounded-md bg-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-800 disabled:opacity-60"
                              >
                                {loadingPromote ? 'Promoting...' : 'Make Leader'}
                              </button>
                            </>
                          )}

                          {!isLeader && isOwnSlot && !isLeaderUser && (
                            <button
                              type="button"
                              disabled={loadingAction === 'leave'}
                              onClick={handleLeaveGroup}
                              className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              {loadingAction === 'leave' ? 'Leaving...' : 'Leave Group'}
                            </button>
                          )}
                        </div>
                      ) : isLeader ? (
                        <div className="mt-3 space-y-2 relative" ref={(el) => {
                          if (el) {
                            slotRefs.current[index] = el
                          } else {
                            delete slotRefs.current[index]
                          }
                        }}>
                          <input
                            type="text"
                            value={slotSearch[index]?.query || ''}
                            onChange={(e) => handleSlotQueryChange(index, e.target.value)}
                            onFocus={() => {
                              if (String(slotSearch[index]?.query || '').trim()) {
                                updateSlotSearch(index, { open: true })
                              }
                            }}
                            placeholder="Enter member email"
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />

                          {slotSearch[index]?.loading && (
                            <p className="text-xs text-gray-500">Searching...</p>
                          )}

                          {slotSearch[index]?.open && String(slotSearch[index]?.query || '').trim() && (
                            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-gray-200 bg-white shadow-md overflow-hidden">
                              {slotSearch[index]?.results?.length > 0 ? (
                                slotSearch[index].results.map((student) => (
                                  <button
                                    key={student._id}
                                    type="button"
                                    onClick={() => handleSelectStudent(index, student)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 cursor-pointer"
                                  >
                                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                    <p className="text-xs text-gray-500">{student.email}</p>
                                  </button>
                                ))
                              ) : !slotSearch[index]?.loading ? (
                                <div className="px-3 py-2 text-sm text-gray-500">No students found</div>
                              ) : null}
                            </div>
                          )}

                          {slotSearch[index]?.selected && (
                            <button
                              type="button"
                              disabled={loadingAction === `invite-${index}`}
                              onClick={() => handleAddSelectedStudent(index)}
                              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {loadingAction === `invite-${index}` ? 'Adding...' : 'Add'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">Empty</p>
                      )}

                      {slotError && <p className="mt-2 text-sm text-red-600">{slotError}</p>}
                    </div>
                  )
                })}
              </div>

              {isLeader && (
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={handleDisbandGroup}
                    disabled={disbandLoading}
                    className="rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    {disbandLoading ? 'Disbanding...' : 'Disband Group'}
                  </button>
                  {disbandError && <p className="text-sm text-red-600">{disbandError}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
