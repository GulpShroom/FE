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
