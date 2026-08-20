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

/**
 * GET /products/{productId}/care-tips
 * 현재 소유자 + 계승 선택된 이전 세대 케어팁 목록
 */
export function getCareTips(productId) {
  return api.get(`/products/${toApiId(productId)}/care-tips`)
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

/**
 * GET /products/{productId}/diagnosis
 * 제품의 세대별 AI 상태 진단 이력
 */
export function getDiagnoses(productId) {
  return api.get(`/products/${toApiId(productId)}/diagnosis`)
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

/** 여권 표시용: 해당 세대(또는 전체) 중 가장 최근 케어팁 */
export function pickPreferredCareTip(tips, generation) {
  const rows = Array.isArray(tips) ? tips : []
  if (!rows.length) return null
  const gen = generation != null && generation !== '' ? String(generation) : null
  const matched = gen ? rows.filter((t) => String(t.generation) === gen) : rows
  const pool = matched.length ? matched : rows
  return pool.reduce((best, tip) => {
    const bestId = Number(best?.careTipId) || 0
    const tipId = Number(tip?.careTipId) || 0
    if (tipId !== bestId) return tipId > bestId ? tip : best
    return tip
  }, pool[0])
}

export function mapDiagnosis(item) {
  const resultText = item?.resultText || ''
  const generation = item?.generation != null ? String(item.generation) : ''
  const diagnosedAt = item?.diagnosedAt || ''
  const date = /^\d{4}-\d{2}-\d{2}/.test(String(diagnosedAt))
    ? String(diagnosedAt).slice(0, 10).replace(/-/g, '.')
    : String(diagnosedAt)
  const short = (() => {
    const line = resultText.trim().split('\n')[0]
    if (line.length <= 18) return line || `등급 ${item?.conditionGrade ?? '-'}`
    return `${line.slice(0, 18)}…`
  })()

  return {
    id: item?.diagnosisId != null ? `diag-${item.diagnosisId}` : `diag-${date}-${short}`,
    diagnosisId: item?.diagnosisId,
    generation,
    date,
    title: short,
    short,
    result: resultText,
    solution: item?.solutionText || '',
    keeper: generation ? `${generation} Keeper` : 'Keeper',
    conditionGrade: item?.conditionGrade,
  }
}

/** 목록 GET 실패 시 대비 로컬 캐시 */
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
