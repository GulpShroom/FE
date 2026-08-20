import type { AxiosRequestConfig } from 'axios'
import { api } from './client'

export interface ResellSummary {
  resellId: number
  nickname: string
  price: number
  postStatus: string
  provenanceScore: number
  conditionGrade: string
}

export interface ResellListResponse {
  totalCount: number
  resells: ResellSummary[]
}

export interface ApiResponseResellListResponse {
  code: string
  message: string
  data: ResellListResponse
  timestamp: string
}

export type ResellRole = 'seller' | 'buyer'

export interface ResellListParams {
  status?: string
  userId?: number
  role?: ResellRole
  page?: number
  size?: number
}

export interface ActiveResellListParams {
  status?: string
  page?: number
  size?: number
}

export interface MyResellHistoryParams {
  userId: number
  role: ResellRole
  page?: number
  size?: number
}

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 10
const RESELLS_ENDPOINT = '/resells'

function getRequestUrl(endpoint: string): string {
  const baseUrl = api.defaults.baseURL ?? ''
  const joinedUrl = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`

  if (/^https?:\/\//i.test(joinedUrl)) return joinedUrl
  if (typeof window !== 'undefined') {
    return new URL(joinedUrl, window.location.origin).toString()
  }

  return joinedUrl
}

/**
 * GET /api/v1/mcarry/resells
 *
 * 공통 axios 인터셉터가 ApiResponseResellListResponse의 data를 반환하므로
 * 이 함수의 반환 타입은 ResellListResponse입니다.
 */
export async function getResellList(
  {
    status,
    userId,
    role,
    page = DEFAULT_PAGE,
    size = DEFAULT_SIZE,
  }: ResellListParams = {},
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<ResellListResponse> {
  if (role && userId == null) {
    throw new Error('role을 지정할 때는 userId가 필요합니다.')
  }

  console.log('요청 URL:', getRequestUrl(RESELLS_ENDPOINT))

  return api.get<
    ApiResponseResellListResponse,
    ResellListResponse
  >(RESELLS_ENDPOINT, {
    ...config,
    params: {
      ...(status ? { status } : {}),
      ...(userId != null ? { userId } : {}),
      ...(role ? { role } : {}),
      page,
      size,
    },
  })
}

/** 전체 리셀글 목록 조회 */
export function getActiveResellList(
  { status = 'active', page = DEFAULT_PAGE, size = DEFAULT_SIZE }: ActiveResellListParams = {},
  config?: Pick<AxiosRequestConfig, 'signal'>,
): Promise<ResellListResponse> {
  return getResellList({ status, page, size }, config)
}

/** 내 리셀 내역 조회: role로 판매/구매 내역을 구분 */
export function getMyResellHistory(
  { userId, role, page = DEFAULT_PAGE, size = DEFAULT_SIZE }: MyResellHistoryParams,
  config?: Pick<AxiosRequestConfig, 'signal'>,
): Promise<ResellListResponse> {
  return getResellList({ userId, role, page, size }, config)
}
