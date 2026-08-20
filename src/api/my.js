import { api, toApiId } from './client'

const CARE_CACHE = 'mc-care-tip-cache'
const DIAG_CACHE = 'mc-diagnosis-cache'

function readCache(key, productId) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) || '{}')
    const list = parsed[String(toApiId(productId))]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeCache(key, productId, list) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) || '{}')
    parsed[String(toApiId(productId))] = list
    sessionStorage.setItem(key, JSON.stringify(parsed))
  } catch {
    // ignore quota / private mode
  }
}

export function createCareTip(productId, { authorId, content }) {
  return api.post(`/products/${toApiId(productId)}/care-tip`, {
    authorId: toApiId(authorId),
    content,
  })
}

export function getCareTips(productId) {
  return api.get(`/products/${toApiId(productId)}/care-tips`)
}

export function mapCareTip(item) {
  const content = item?.content || item?.result || ''
  const generation = item?.generation != null ? String(item.generation) : ''
  return {
    id: item?.careTipId != null ? `tip-${item.careTipId}` : item?.id || `tip-${content.slice(0, 12)}`,
    careTipId: item?.careTipId,
    generation,
    content,
    title: content.length > 18 ? `${content.slice(0, 18)}…` : content,
    short: content.length > 18 ? `${content.slice(0, 18)}…` : content,
    result: content,
    solution: '',
    keeper: generation ? `${generation} Keeper` : 'Keeper',
    date: item?.date || '',
  }
}

export function pickPreferredCareTip(tips, generation) {
  const rows = Array.isArray(tips) ? tips : []
  if (!rows.length) return null
  const gen = generation != null && generation !== '' ? String(generation) : null
  const matched = gen ? rows.filter((tip) => String(tip.generation) === gen) : rows
  const pool = matched.length ? matched : rows
  return pool.reduce((best, tip) => (
    Number(tip?.careTipId) > Number(best?.careTipId) ? tip : best
  ), pool[0])
}

/**
 * POST /products/{productId}/diagnosis
 * OpenAPI: photos = multipart, userId = query
 */
export function createDiagnosis(productId, { userId, photos }) {
  const form = new FormData()
  for (const file of photos ?? []) {
    if (file) form.append('photos', file)
  }
  return api.post(`/products/${toApiId(productId)}/diagnosis`, form, {
    params: { userId: toApiId(userId) },
    timeout: 60000,
  })
}

/** POST /transfers/{transferId}/letter/draft */
export function createLetterDraft(transferId, { userId, prompt } = {}) {
  return api.post(`/transfers/${toApiId(transferId)}/letter/draft`, {
    userId: userId == null ? undefined : toApiId(userId),
    prompt,
  })
}

/** GET /products/{productId}/diagnosis */
export async function getProductDiagnoses(productId, { userId } = {}) {
  const data = await api.get(`/products/${toApiId(productId)}/diagnosis`, {
    params: userId == null ? undefined : { userId: toApiId(userId) },
  })
  return Array.isArray(data) ? data : data?.diagnoses ?? []
}

/** 목록 GET API가 없어 세션에만 보관 (서버 이력 조회 불가 시 대비) */
export function getLocalCareTips(productId) {
  return readCache(CARE_CACHE, productId)
}

export function cacheLocalCareTip(productId, tip) {
  const next = [tip, ...getLocalCareTips(productId)]
  writeCache(CARE_CACHE, productId, next)
  return next
}

export function getLocalDiagnoses(productId) {
  return readCache(DIAG_CACHE, productId)
}

export function cacheLocalDiagnosis(productId, item) {
  const next = [item, ...getLocalDiagnoses(productId)]
  writeCache(DIAG_CACHE, productId, next)
  return next
}
