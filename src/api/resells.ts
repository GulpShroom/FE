import type { AxiosRequestConfig } from 'axios'
import { api, toApiId } from './client'

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

export interface ResellSaveRequest {
  productId: number
  sellerId: number
  price: number
  conditionGrade: string
  letterShared: boolean
  caretipShared: boolean
  photoUrls: string[]
}

export interface ResellSaveResponse {
  productId: number
  price: number
  postStatus: string
  resellId: number
}

export interface ResellDetailResponse {
  resellId: number
  officialName: string
  sellerNickname: string | null
  isAuthor: boolean
  price: number
  conditionGrade: string | null
  postStatus: string
  photos: Array<{
    photoId: number
    photoUrl: string
    sortOrder: number
  }>
  summary: {
    journeyCount: number
    generationCount: number
    countryCount: number
    cityCount: number
    isAuthenticated: boolean
    productAgeYears: number
    provenanceScore: number | null
    verifyRatio: number
  }
  lockedJourney: {
    cities: string[]
    countryCount: number
    cityCount: number
    hasLetter: boolean
    hasCareTip: boolean
  }
}

export type ResellRole = 'seller' | 'buyer'

export interface ResellListParams {
  status?: string
  userId?: number
  sellerId?: number
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
    sellerId,
    role,
    page = DEFAULT_PAGE,
    size = DEFAULT_SIZE,
  }: ResellListParams = {},
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<ResellListResponse> {
  if (role && userId == null) {
    throw new Error('role을 지정할 때는 userId가 필요합니다.')
  }

  const response = await api.get<
    ApiResponseResellListResponse,
    ResellListResponse
  >(RESELLS_ENDPOINT, {
    ...config,
    params: {
      ...(status ? { status } : {}),
      ...(userId != null ? { userId } : {}),
      ...(sellerId != null ? { sellerId } : {}),
      ...(role ? { role } : {}),
      page,
      size,
    },
  })

  const rows = Array.isArray(response)
    ? response
    : response?.resells ?? response?.posts ?? response?.content ?? []
  return {
    totalCount: response?.totalCount ?? rows.length,
    resells: rows,
  }
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

/** GET /api/v1/mcarry/resells/{resellId}?userId={userId} */
export function getResellDetail(
  resellId: string | number,
  { userId, signal }: { userId?: number; signal?: AbortSignal } = {},
): Promise<ResellDetailResponse> {
  return api.get(`${RESELLS_ENDPOINT}/${toApiId(resellId)}`, {
    signal,
    params: userId != null ? { userId } : undefined,
  })
}

/** POST /api/v1/mcarry/files */
export async function uploadResellPhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const result = await api.post<FormData, { url: string }>('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  if (!result?.url) throw new Error('업로드된 사진 URL을 받지 못했습니다.')
  return result.url
}

/** POST /api/v1/mcarry/resells */
export function createResell(
  body: Omit<ResellSaveRequest, 'productId'> & { productId: string | number },
): Promise<ResellSaveResponse> {
  return api.post(RESELLS_ENDPOINT, {
    ...body,
    productId: toApiId(body.productId),
  })
}
