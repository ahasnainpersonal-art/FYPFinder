const { GoogleGenerativeAI } = require('@google/generative-ai')

let cachedWorkingModel = null

const getApiKeys = () => {
  const keys = []

  const primary = process.env.GEMINI_API_KEY
  if (primary) keys.push(primary)

  const list = process.env.GEMINI_API_KEYS
  if (list) {
    for (const k of String(list).split(',')) {
      const trimmed = k.trim()
      if (trimmed) keys.push(trimmed)
    }
  }

  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]
    if (k) keys.push(k)
  }

  const unique = []
  for (const k of keys) {
    if (!k) continue
    if (!unique.includes(k)) unique.push(k)
  }
  return unique
}

const getGenAI = () => {
  const keys = getApiKeys()
  if (keys.length === 0) throw new Error('GEMINI_API_KEY is not set on the server')
  return new GoogleGenerativeAI(keys[0])
}

const stripCodeFences = (text) => {
  if (!text) return ''
  return text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim()
}

const getCandidateModels = () => {
  const configured = process.env.GEMINI_MODEL

  const candidates = [
    cachedWorkingModel,
    configured,
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro',
  ]

  const unique = []
  for (const name of candidates) {
    if (!name) continue
    if (!unique.includes(name)) unique.push(name)
  }
  return unique
}

const isModelNotFoundError = (err) => {
  const status = err?.status || err?.response?.status
  if (status === 404) return true

  const msg = String(err?.message || '')
  const lower = msg.toLowerCase()

  if (lower.includes('not supported') && lower.includes('generatecontent')) {
    return true
  }

  // Example seen in the wild:
  // "[GoogleGenerativeAI Error]: ... [404 Not Found] models/gemini-1.5-flash is not found ... or is not supported for generateContent"
  return msg.includes('404') && (lower.includes('not found') || lower.includes('not supported'))
}

const isRateLimitOrQuotaError = (err) => {
  const status = err?.status || err?.response?.status
  if (status === 429) return true

  const msg = String(err?.message || '').toLowerCase()
  if (msg.includes('resource_exhausted')) return true
  if (msg.includes('quota')) return true
  if (msg.includes('rate limit')) return true
  if (msg.includes('too many requests')) return true
  return false
}

const generateTextWithFallbackModels = async (prompt) => {
  const apiKeys = getApiKeys()
  if (apiKeys.length === 0) throw new Error('GEMINI_API_KEY is not set on the server')
  const candidates = getCandidateModels()

  let lastErr
  let exhaustedByLimits = false

  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey)

    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        cachedWorkingModel = modelName
        return {
          text: result?.response?.text?.() || '',
          modelName,
        }
      } catch (err) {
        lastErr = err
        if (isModelNotFoundError(err)) {
          continue
        }
        if (isRateLimitOrQuotaError(err)) {
          exhaustedByLimits = true
          break
        }
        throw err
      }
    }
  }

  if (exhaustedByLimits) {
    throw new Error('API limit reached')
  }

  const attempted = candidates.join(', ')
  const originalMessage = String(lastErr?.message || lastErr || 'Unknown error')
  throw new Error(
    `No available Gemini model worked. Attempted: ${attempted}. Last error: ${originalMessage}. ` +
    `Set GEMINI_MODEL to a supported model for your API key/project.`
  )
}

const tryParseRecommendations = (rawText) => {
  const cleanText = stripCodeFences(rawText)

  try {
    const parsed = JSON.parse(cleanText)
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response JSON is not an array')
    }
    return parsed
  } catch (err) {
    const firstBracket = cleanText.indexOf('[')
    const lastBracket = cleanText.lastIndexOf(']')
    if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
      throw new Error('Gemini response is not valid JSON')
    }

    const extracted = cleanText.slice(firstBracket, lastBracket + 1)
    const parsed = JSON.parse(extracted)
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response JSON is not an array')
    }
    return parsed
  }
}

const getRecommendations = async (studentProfile, projects) => {
  const limitedProjects = Array.isArray(projects) ? projects.slice(0, 25) : []

  const prompt = `
You are an FYP recommendation assistant for a university platform.

Student Profile:
Name: ${studentProfile.name}
Skills: ${studentProfile.skills || 'not specified'}
Interests: ${studentProfile.interests || 'not specified'}
Preferred Domain: ${studentProfile.preferredDomain || 'any'}

Available Projects Listed on Platform:
${limitedProjects.map((p, i) => `
${i + 1}. ${p._id}
Title: ${p.title}
Description: ${p.description}
Domain: ${p.domain}
SupervisorName: ${p.supervisor?.name || ''}
SupervisorEmail: ${p.supervisor?.email || ''}
`).join('')}

Task 1: From the available projects above, pick the top 3 that best match this student based on semantic understanding of their skills and interests vs project descriptions. Do not just match keywords.

Task 2: Suggest 3 completely new FYP project ideas that are NOT from the list above, purely based on the student profile.

Return ONLY this exact JSON, no markdown, no extra text:
{
  "existingMatches": [
    {
      "projectId": "_id string",
      "title": "title",
      "domain": "domain",
      "supervisorName": "name",
      "supervisorEmail": "email",
      "reason": "one sentence why this matches"
    }
  ],
  "aiIdeas": [
    {
      "title": "idea title",
      "description": "2 sentence description",
      "domain": "suggested domain"
    }
  ]
}
`

  const { text } = await generateTextWithFallbackModels(prompt)
  const cleanText = stripCodeFences(text)

  let parsed
  try {
    parsed = JSON.parse(cleanText)
  } catch (err) {
    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Gemini response is not valid JSON')
    }
    parsed = JSON.parse(cleanText.slice(firstBrace, lastBrace + 1))
  }

  const existingMatches = Array.isArray(parsed.existingMatches) ? parsed.existingMatches : []
  const aiIdeas = Array.isArray(parsed.aiIdeas) ? parsed.aiIdeas : []

  return {
    existingMatches: existingMatches.slice(0, 3).map((m) => ({
      projectId: String(m.projectId || ''),
      title: String(m.title || ''),
      domain: String(m.domain || ''),
      supervisorName: String(m.supervisorName || ''),
      supervisorEmail: String(m.supervisorEmail || ''),
      reason: String(m.reason || ''),
    })),
    aiIdeas: aiIdeas.slice(0, 3).map((idea) => ({
      title: String(idea.title || ''),
      description: String(idea.description || ''),
      domain: String(idea.domain || ''),
    })),
  }
}

const generateBio = async ({ name, skills, interests, preferredDomain, github, cgpa }) => {
  const prompt = `Write a short 3-sentence professional biography for a computer science student with the following profile:
Name: ${name || ''}
Skills: ${skills || ''}
Interests: ${interests || ''}
Preferred Domain: ${preferredDomain || ''}
GitHub: ${github || ''}
CGPA Range: ${cgpa || ''}
Write in third person. Keep it professional and suitable for an academic FYP platform. Return only the bio text, no labels, no extra text, no markdown.`

  const { text } = await generateTextWithFallbackModels(prompt)
  return stripCodeFences(text)
}

const generateProposal = async ({ project, members }) => {
  const safeMembers = Array.isArray(members) ? members.slice(0, 3) : []

  const prompt = `
You are an academic FYP proposal assistant. Generate a concise, high-quality group proposal for a supervisor.

Project:
Title: ${project?.title || ''}
Domain: ${project?.domain || ''}
Description: ${project?.description || ''}

Group Members (from profiles):
${safeMembers
  .map(
    (m, i) => `${i + 1}. Name: ${m?.name || ''}\n   CGPA Range: ${m?.cgpa || ''}\n   Skills: ${m?.skills || ''}\n   GitHub: ${m?.github || ''}`
  )
  .join('\n')}

Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{
  "projectUnderstanding": "string",
  "proposedApproach": "string",
  "relevantSkills": "string",
  "timeline": "string",
  "whyThisGroup": "string",
  "memberDetails": [
    { "name": "string", "cgpa": "string", "skills": "string", "github": "string" }
  ]
}

Write each section in 4-8 lines, practical and specific to this project and these members.
`

  const { text } = await generateTextWithFallbackModels(prompt)
  const cleanText = stripCodeFences(text)

  let parsed
  try {
    parsed = JSON.parse(cleanText)
  } catch (err) {
    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Gemini response is not valid JSON')
    }
    parsed = JSON.parse(cleanText.slice(firstBrace, lastBrace + 1))
  }

  const memberDetails = Array.isArray(parsed.memberDetails) ? parsed.memberDetails : []
  return {
    projectUnderstanding: String(parsed.projectUnderstanding || ''),
    proposedApproach: String(parsed.proposedApproach || ''),
    relevantSkills: String(parsed.relevantSkills || ''),
    timeline: String(parsed.timeline || ''),
    whyThisGroup: String(parsed.whyThisGroup || ''),
    memberDetails: memberDetails.slice(0, 3).map((m) => ({
      name: String(m?.name || ''),
      cgpa: String(m?.cgpa || ''),
      skills: String(m?.skills || ''),
      github: String(m?.github || ''),
    })),
  }
}

module.exports = { getRecommendations, generateBio, generateProposal }