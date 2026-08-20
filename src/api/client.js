import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/mcarry'

export class ApiError extends Error {
  constructor({ status = 0, code = 'E500', message, errors = null, timestamp } = {}) {
    super(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
    this.timestamp = timestamp
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

function clearContentType(headers) {
  if (!headers) return
  if (typeof headers.delete === 'function') {
    headers.delete('Content-Type')
    headers.delete('content-type')
    return
  }
  delete headers['Content-Type']
  delete headers['content-type']
}

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    clearContentType(config.headers)
  }
  return config
})

function toApiError(status, body, fallbackMessage) {
  return new ApiError({
    status,
    code: body?.code ?? (status === 404 ? 'E404' : 'E500'),
    message: body?.message || fallbackMessage,
    errors: body?.errors ?? null,
    timestamp: body?.timestamp,
  })
}

api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (String(body.code).startsWith('S')) return body.data
      throw toApiError(res.status, body, body.message)
    }
    return body
  },
  (err) => {
    const status = err.response?.status ?? 0
    const body = err.response?.data
    const gateway = status === 502 || status === 503 || status === 504 || status === 0
    const payload =
      body && typeof body === 'object'
        ? body
        : {
            code: gateway ? 'E502' : 'E500',
            message: gateway
              ? '백엔드 서버에 연결하지 못했습니다. API 서버가 켜져 있는지 확인해 주세요.'
              : undefined,
          }

    throw toApiError(
      status,
      payload,
      payload.message ||
        err.message ||
        '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
    )
  },
)

/** mock `p1` → 1, numeric strings stay numeric */
export function toApiId(id) {
  if (id == null || id === '') return id
  const raw = String(id).replace(/^p/i, '')
  const n = Number(raw)
  return Number.isFinite(n) ? n : id
}

export function sameProductId(a, b) {
  return String(toApiId(a)) === String(toApiId(b))
}

export function isNotFoundError(error) {
  if (!error) return false
  if (error.status === 404 || error.code === 'E404') return true
  const message = String(error.message || '')
  return message.includes('제품을 찾을 수 없습니다') || message.includes('제품 정보를 찾을 수 없습니다')
}

export function isConnectionError(error) {
  const status = error?.status
  return status === 0 || status === 502 || status === 503 || status === 504
}
