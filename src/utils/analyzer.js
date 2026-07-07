// Client-side resume analysis engine.
// Everything here runs in the browser — no server, no API key, no data leaves the device.

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','for','to','of','in','on','at','by',
  'with','from','as','is','are','was','were','be','been','being','this','that','these','those',
  'it','its','into','about','over','after','before','than','so','such','can','will','would',
  'should','could','may','might','must','shall','you','your','we','our','they','their','i',
  'not','no','do','does','did','done','have','has','had','having','also','etc','per','via',
  'each','all','any','some','more','most','other','which','who','whom','what','when','where',
  'why','how','up','out','down','off','again','further','once','here','there','both','few',
  'own','same','just','only','very','job','role','work','team','company','position','looking'
])

const SECTION_PATTERNS = {
  contact: /(?:email|phone|linkedin|github|@\S+\.\S+|\(\d{3}\)|\d{3}[-.\s]\d{3}[-.\s]\d{4})/i,
  summary: /\b(summary|objective|profile|about me)\b/i,
  experience: /\b(experience|employment|work history|professional background)\b/i,
  education: /\b(education|academic|degree|university|college|b\.?tech|b\.?sc|m\.?tech|mba)\b/i,
  skills: /\b(skills|technologies|technical skills|tools|proficiencies)\b/i,
  projects: /\b(projects|portfolio)\b/i,
}

const ACTION_VERBS = [
  'led','built','created','designed','developed','implemented','launched','managed','improved',
  'increased','reduced','decreased','optimized','automated','architected','delivered','drove',
  'spearheaded','coordinated','analyzed','engineered','streamlined','negotiated','mentored',
  'trained','executed','established','initiated','transformed','scaled','resolved','saved',
  'generated','achieved','directed','organized','presented','researched','deployed'
]

const WEAK_PHRASES = [
  'responsible for', 'duties included', 'worked on', 'helped with', 'in charge of',
  'tasked with', 'involved in'
]

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z][a-z0-9+.#/-]{1,}/g) || [])
}

function keywordFrequency(text) {
  const freq = new Map()
  for (const word of tokenize(text)) {
    const w = word.replace(/^[-./#+]+|[-./#+]+$/g, '')
    if (!w || w.length < 3 || STOPWORDS.has(w)) continue
    freq.set(w, (freq.get(w) || 0) + 1)
  }
  return freq
}

// Pull likely "important" terms out of a job description: multi-occurrence words
// plus capitalized/technical-looking tokens from the original (unlowered) text.
function extractKeyKeywords(jobText, limit = 25) {
  const freq = keywordFrequency(jobText)
  const techLike = new Set()
  const rawTokens = jobText.match(/[A-Za-z][A-Za-z0-9+.#/-]{1,}/g) || []
  for (const raw of rawTokens) {
    const clean = raw.replace(/^[-./#+]+|[-./#+]+$/g, '')
    const lower = clean.toLowerCase()
    if (lower.length < 2 || STOPWORDS.has(lower)) continue
    const looksTechnical = /[A-Z]{2,}/.test(clean) || /[0-9]/.test(clean) || /[+#./]/.test(clean)
    const isCapitalizedWord = /^[A-Z][a-z]+$/.test(clean) && clean.length > 2
    if (looksTechnical || isCapitalizedWord) techLike.add(lower)
  }

  const scored = [...freq.entries()].map(([word, count]) => ({
    word,
    score: count + (techLike.has(word) ? 2 : 0),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.word)
}

function countOccurrences(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${escaped}\\b`, 'gi')
  return (text.match(re) || []).length
}

export function analyzeResume(resumeText, jobText) {
  const resume = (resumeText || '').trim()
  const job = (jobText || '').trim()

  const wordCount = tokenize(resume).length
  const bulletLines = resume.split('\n').map((l) => l.trim()).filter(Boolean)

  // --- Section / structure checks -----------------------------------------
  const sectionChecks = Object.entries(SECTION_PATTERNS).map(([key, pattern]) => ({
    key,
    label: {
      contact: 'Contact info (email / phone / LinkedIn)',
      summary: 'Summary or objective',
      experience: 'Work experience section',
      education: 'Education section',
      skills: 'Skills section',
      projects: 'Projects section',
    }[key],
    passed: pattern.test(resume),
  }))

  // --- Action verbs & weak phrasing ----------------------------------------
  let strongVerbLines = 0
  for (const line of bulletLines) {
    const firstWord = (line.replace(/^[-•*▪●\s]+/, '').split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '')
    if (ACTION_VERBS.includes(firstWord)) strongVerbLines++
  }
  const weakPhraseHits = WEAK_PHRASES.filter((p) => resume.toLowerCase().includes(p))

  // --- Quantified impact ----------------------------------------------------
  const numberMatches = resume.match(/\d+(\.\d+)?%|\$\d|\b\d{2,}\b/g) || []
  const hasQuantifiedImpact = numberMatches.length >= 2

  // --- Length check ----------------------------------------------------------
  let lengthStatus = 'good'
  if (wordCount < 250) lengthStatus = 'short'
  else if (wordCount > 950) lengthStatus = 'long'

  // --- Keyword match against job description ---------------------------------
  let keywordResult = { matched: [], missing: [], matchPercent: null, topKeywords: [] }
  if (job.length > 0) {
    const topKeywords = extractKeyKeywords(job, 25)
    const matched = []
    const missing = []
    for (const kw of topKeywords) {
      const inResume = countOccurrences(resume, kw) > 0
      ;(inResume ? matched : missing).push(kw)
    }
    const matchPercent = topKeywords.length
      ? Math.round((matched.length / topKeywords.length) * 100)
      : null
    keywordResult = { matched, missing, matchPercent, topKeywords }
  }

  // --- Scoring ------------------------------------------------------------
  const sectionScore = (sectionChecks.filter((s) => s.passed).length / sectionChecks.length) * 100
  const verbScore = bulletLines.length ? Math.min(100, (strongVerbLines / Math.max(bulletLines.length * 0.4, 1)) * 100) : 40
  const weakPenalty = Math.min(30, weakPhraseHits.length * 10)
  const impactScore = hasQuantifiedImpact ? 100 : numberMatches.length === 1 ? 55 : 20
  const lengthScore = lengthStatus === 'good' ? 100 : lengthStatus === 'short' ? 45 : 65
  const keywordScore = keywordResult.matchPercent !== null ? keywordResult.matchPercent : null

  const weights = keywordScore !== null
    ? { section: 0.22, verb: 0.18, impact: 0.18, length: 0.12, keyword: 0.30 }
    : { section: 0.30, verb: 0.25, impact: 0.25, length: 0.20, keyword: 0 }

  let overall =
    sectionScore * weights.section +
    Math.max(0, verbScore - weakPenalty) * weights.verb +
    impactScore * weights.impact +
    lengthScore * weights.length +
    (keywordScore || 0) * weights.keyword

  overall = Math.round(Math.max(0, Math.min(100, overall)))

  // --- Suggestions ----------------------------------------------------------
  const suggestions = []
  if (keywordResult.missing.length > 0) {
    suggestions.push({
      severity: 'high',
      text: `Work these missing keywords from the job description into your resume where they genuinely apply: ${keywordResult.missing.slice(0, 8).join(', ')}.`,
    })
  }
  sectionChecks.filter((s) => !s.passed).forEach((s) => {
    suggestions.push({ severity: 'high', text: `Add a clear "${s.label}" section — it's missing or not detectable.` })
  })
  if (weakPhraseHits.length > 0) {
    suggestions.push({
      severity: 'medium',
      text: `Replace weak phrasing (${weakPhraseHits.join(', ')}) with a strong action verb at the start of the bullet, e.g. "Led", "Built", "Reduced".`,
    })
  }
  if (!hasQuantifiedImpact) {
    suggestions.push({
      severity: 'medium',
      text: 'Add numbers to your bullet points — team size, % improvement, revenue, users, time saved. Quantified impact is what gets noticed.',
    })
  }
  if (lengthStatus === 'short') {
    suggestions.push({ severity: 'medium', text: 'Your resume looks thin. Add more detail to your experience and projects — aim for roughly 400–800 words.' })
  }
  if (lengthStatus === 'long') {
    suggestions.push({ severity: 'low', text: 'Your resume is on the longer side. Trim to the most relevant, recent, and impressive points — aim for 1-2 pages.' })
  }
  if (strongVerbLines < bulletLines.length * 0.3) {
    suggestions.push({ severity: 'low', text: 'Start more bullet points with strong action verbs (Led, Built, Designed, Improved...) instead of nouns or "I".' })
  }
  if (suggestions.length === 0) {
    suggestions.push({ severity: 'low', text: 'Solid resume overall. Do one more pass for typos and consistent tense before sending it out.' })
  }

  return {
    overall,
    wordCount,
    sectionChecks,
    strongVerbLines,
    bulletCount: bulletLines.length,
    weakPhraseHits,
    hasQuantifiedImpact,
    numberCount: numberMatches.length,
    lengthStatus,
    keywordResult,
    suggestions: suggestions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.severity] - order[b.severity]
    }),
  }
}