import { api, toApiId } from './client'
import journeyThumb from '../assets/final/journey-thumb.png'

const CACHE_KEY = 'mc-journey-list-cache'

export const TONE_TO_API = {
  감성적: 'emotional',
  담백하게: 'plain',
  발랄하게: 'lively',
}

export const TONE_TO_UI = {
  emotional: '감성적',
  plain: '담백하게',
  lively: '발랄하게',
}

export const COUNTRY_TO_API = {
  한국: 'KR',
  일본: 'JP',
  미국: 'US',
  프랑스: 'FR',
  이탈리아: 'IT',
}

export const COUNTRY_TO_UI = {
  KR: '한국',
  JP: '일본',
  US: '미국',
  FR: '프랑스',
  IT: '이탈리아',
}

export const CITY_TO_API = {
  서울: 'Seoul',
  부산: 'Busan',
  제주: 'Jeju',
  도쿄: 'Tokyo',
  오사카: 'Osaka',
  뉴욕: 'New York',
  LA: 'Los Angeles',
  파리: 'Paris',
  밀라노: 'Milan',
  로마: 'Rome',
}

const CITY_TO_UI = Object.fromEntries(
  Object.entries(CITY_TO_API).map(([ko, en]) => [en, ko]),
)

/** API tag 필드가 string 또는 { tag, source } 인 경우 모두 문자열로 정규화 */
function pickTag(entry) {
  if (entry == null) return ''
  if (typeof entry === 'string' || typeof entry === 'number') {
    const text = String(entry).trim()
    return text
  }
  if (typeof entry === 'object') {
    const text = entry.tag
    if (text == null || text === '') return ''
    return String(text).trim()
  }
  return ''
}

function pickTagSource(entry, fallback = 'free_text') {
  if (entry && typeof entry === 'object' && entry.source) return entry.source
  return fallback
}

export function stripRecallQuotes(text) {
  return String(text || '')
    .trim()
    .replace(/^[“"']+|[”"']+$/g, '')
}

export function monthToApi(label) {
  if (!label || label === '모름') return null
  const n = Number.parseInt(label, 10)
  return Number.isFinite(n) ? n : null
}

export function monthToUi(value) {
  if (value == null || value === '') return '모름'
  return `${Number(value)}월`
}

export function countryToApi(label) {
  return COUNTRY_TO_API[label] || label || null
}

export function countryToUi(code) {
  if (!code) return '한국'
  return COUNTRY_TO_UI[code] || code
}

export function cityToApi(label) {
  if (!label || label === '모름') return null
  return CITY_TO_API[label] ?? label
}

export function cityToUi(name) {
  if (!name) return '모름'
  return CITY_TO_UI[name] || name
}

/**
 * GET /products/{productId}/journeys
 * 요청자가 작성한 여정만 반환 (타 세대 기록 제외)
 */
export function getProductJourneys(
  productId,
  { userId, sort = 'date', page = 0, size = 10 } = {},
) {
  return api.get(`/products/${toApiId(productId)}/journeys`, {
    params: { userId, sort, page, size },
  })
}

/** POST /journeys */
export function createJourney(body) {
  return api.post('/journeys', body)
}

/**
 * POST /journeys/analyze — AI 여정 큐레이터
 * OpenAPI: photo = multipart, productId/userId/tone = query
 */
export function analyzeJourney({ productId, userId, tone = 'emotional', photo }) {
  const form = new FormData()
  if (photo) form.append('photo', photo)
  return api.post('/journeys/analyze', form, {
    params: {
      productId: toApiId(productId),
      userId: toApiId(userId),
      tone: TONE_TO_API[tone] || tone || 'emotional',
    },
    timeout: 60000,
  })
}

/**
 * POST /journeys/{journeyId}/recall — 회고 문장 재생성
 * 저장된 여정 태그로 AI 회고를 다시 생성합니다.
 */
export function regenerateJourneyRecall(journeyId, { userId, tone = 'emotional' } = {}) {
  return api.post(
    `/journeys/${toApiId(journeyId)}/recall`,
    {
      userId: toApiId(userId),
      tone: TONE_TO_API[tone] || tone || 'emotional',
    },
    { timeout: 60000 },
  )
}

/** GET /journeys/{journeyId} */
export function getJourney(journeyId, { userId } = {}) {
  return api.get(`/journeys/${toApiId(journeyId)}`, {
    params: { userId: toApiId(userId) },
  })
}

/** GET /products/{productId}/on-this-day */
export function getOnThisDay(productId, { userId } = {}) {
  return api.get(`/products/${toApiId(productId)}/on-this-day`, {
    params: userId != null ? { userId: toApiId(userId) } : undefined,
  })
}

/** PATCH /journeys/{journeyId} */
export function updateJourney(journeyId, body) {
  return api.patch(`/journeys/${toApiId(journeyId)}`, body)
}

/** DELETE /journeys/{journeyId} */
export function deleteJourney(journeyId, { userId } = {}) {
  return api.delete(`/journeys/${toApiId(journeyId)}`, {
    params: { userId: toApiId(userId) },
  })
}

export function buildCreateJourneyBody(form, { userId, photoUrl }) {
  const recallText = stripRecallQuotes(form.quote)
  const userMemo = form.memo?.trim() || ''

  return {
    userId,
    productId: toApiId(form.productId),
    photoUrl,
    country: countryToApi(form.country),
    city: cityToApi(form.city),
    journeyYear: Number(form.year),
    journeyMonth: monthToApi(form.month),
    tags: {
      activity: form.activity || undefined,
      situation: form.situation || undefined,
      style: form.style || undefined,
    },
    tagSources: {
      activity: form.tagSources?.activity || 'free_text',
      situation: form.tagSources?.situation || 'free_text',
      style: form.tagSources?.style || 'free_text',
    },
    recallText: recallText || undefined,
    recallTone: TONE_TO_API[form.tone] || undefined,
    userMemo: userMemo || undefined,
  }
}

export function buildUpdateJourneyBody(form, initial, { userId, photoUrl } = {}) {
  const body = {
    userId,
    country: countryToApi(form.country),
    city: cityToApi(form.city),
    tags: {
      activity: form.activity || undefined,
      situation: form.situation || undefined,
      style: form.style || undefined,
    },
    tagSources: {
      activity:
        form.activity !== initial.activity
          ? 'free_text'
          : form.tagSources?.activity || 'free_text',
      situation:
        form.situation !== initial.situation
          ? 'free_text'
          : form.tagSources?.situation || 'free_text',
      style:
        form.style !== initial.style
          ? 'free_text'
          : form.tagSources?.style || 'free_text',
    },
    recallText: stripRecallQuotes(form.quote) || undefined,
    recallTone: TONE_TO_API[form.tone] || undefined,
    userMemo: form.memo?.trim() || undefined,
  }

  if (form.year !== initial.year || form.month !== initial.month) {
    body.journeyYear = Number(form.year)
    body.journeyMonth = monthToApi(form.month)
  }

  const nextPhoto = photoUrl || form.photoUrl
  if (nextPhoto && nextPhoto !== initial.photoUrl) {
    body.photoUrl = nextPhoto
  }

  return body
}

export function mapProductJourney(item, product) {
  const recall = item?.recallText?.trim() || ''
  const quoted =
    !recall || recall.startsWith('“') || recall.startsWith('"')
      ? recall
      : `“${recall}”`

  return {
    id: String(item.journeyId),
    productId: product.id,
    status: item.ownershipStatus === 'transferred' ? 'transferred' : 'owned',
    ownershipStatus: item.ownershipStatus || 'owning',
    alias: product.alias,
    productNameEn: product.nameEn ?? product.name,
    quote: quoted,
    image: item.thumbnailUrl || item.photoUrl || journeyThumb,
    country: item.country ?? null,
    city: item.city ?? null,
    journeyYear: item.journeyYear ?? null,
    journeyMonth: item.journeyMonth ?? null,
    memo: item.userMemo ?? '',
    tone: TONE_TO_UI[item.recallTone] || '감성적',
    activity: pickTag(item.tags?.activity),
    situation: pickTag(item.tags?.situation),
    style: pickTag(item.tags?.style),
    tagSources: {
      activity: pickTagSource(item.tags?.activity),
      situation: pickTagSource(item.tags?.situation),
      style: pickTagSource(item.tags?.style),
    },
  }
}

export function mapJourneyDetail(item, { productId } = {}) {
  const recall = item?.recallText?.trim() || ''
  const quoted =
    !recall || recall.startsWith('“') || recall.startsWith('"')
      ? recall
      : `“${recall}”`

  return {
    id: String(item.journeyId),
    productId: productId != null ? String(productId) : undefined,
    status: item.isAuthor === false ? 'other' : 'owned',
    quote: quoted,
    image: item.photoUrl || journeyThumb,
    country: item.country ?? null,
    city: item.city ?? null,
    journeyYear: item.journeyYear ?? null,
    journeyMonth: item.journeyMonth ?? null,
    memo: item.userMemo ?? '',
    tone: TONE_TO_UI[item.recallTone] || '감성적',
    activity: pickTag(item.tags?.activity),
    situation: pickTag(item.tags?.situation),
    style: pickTag(item.tags?.style),
    tagSources: {
      activity: pickTagSource(item.tags?.activity),
      situation: pickTagSource(item.tags?.situation),
      style: pickTagSource(item.tags?.style),
    },
    isAuthor: item.isAuthor,
    isFirstJourney: item.isFirstJourney,
  }
}

/** Apply AI curator response onto the journey form fields */
export function applyAnalyzeToForm(form, data) {
  if (!data) return form
  const next = { ...form }
  if (data.recallText) {
    const text = stripRecallQuotes(data.recallText)
    next.quote = text ? `“${text}”` : form.quote
  }
  if (data.recallTone && TONE_TO_UI[data.recallTone]) {
    next.tone = TONE_TO_UI[data.recallTone]
  }
  if (data.country) next.country = countryToUi(data.country) || data.country
  if (data.city) next.city = cityToUi(data.city) || data.city
  if (data.year != null) next.year = String(data.year)
  if (data.month != null) next.month = monthToUi(data.month)
  if (data.activityTag) {
    next.activity = data.activityTag
    next.tagSources = { ...next.tagSources, activity: 'ai' }
  }
  if (data.situationTag) {
    next.situation = data.situationTag
    next.tagSources = { ...next.tagSources, situation: 'ai' }
  }
  if (data.styleTag) {
    next.style = data.styleTag
    next.tagSources = { ...next.tagSources, style: 'ai' }
  }
  return next
}

export function cacheProductJourneys(productId, journeys) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ productId, journeys }))
}

export function getCachedJourney(journeyId) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    return parsed?.journeys?.find((j) => String(j.id) === String(journeyId)) ?? null
  } catch {
    return null
  }
}
