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

export type ResellSelectedTagType = 'activity' | 'situation' | 'style'

export interface ResellSelectedTag {
  journeyId: number
  type: ResellSelectedTagType
}

export interface ResellSaveRequest {
  productId: number
  sellerId: number
  price: number
  conditionGrade: string
  letterShared: boolean
  caretipShared: boolean
  photoUrls: string[]
  selectedTags: ResellSelectedTag[]
  /** 판매자 편지 본문 — 백엔드가 무시할 수 있으나 구매 전 초안 전달용으로 함께 전송 */
  letterContent?: string
}

export interface ResellSaveResponse {
  productId: number
  price: number
  postStatus: string
  resellId: number
}

export interface ResellPhoto {
  photoId: number
  photoUrl: string
  sortOrder: number
}

export interface ResellDetailSummary {
  journeyCount: number
  generationCount: number
  countryCount: number
  cityCount: number
  isAuthenticated: boolean
  productAgeYears: number
  provenanceScore: number | null
  verifyRatio: number
}

export interface ResellLockedJourney {
  cities: string[]
  countryCount: number
  cityCount: number
  hasLetter: boolean
  hasCareTip: boolean
  /** 구매 전에는 선택 내용 대신 존재 여부만 공개됩니다. */
  hasSelectedTags: boolean
}

export interface ResellDetailResponse {
  resellId: number
  officialName: string
  sellerNickname: string | null
  isAuthor: boolean
  price: number
  conditionGrade: string | null
  postStatus: string
  photos: ResellPhoto[]
  summary: ResellDetailSummary
  lockedJourney: ResellLockedJourney
}

/** @deprecated Use ResellDetailResponse */
export type ResellDetail = ResellDetailResponse

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

export interface GetResellDetailParams {
  userId?: number
  signal?: AbortSignal
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
    role,
    page = DEFAULT_PAGE,
    size = DEFAULT_SIZE,
  }: ResellListParams = {},
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<ResellListResponse> {
  if (role && userId == null) {
    throw new Error('role을 지정할 때는 userId가 필요합니다.')
  }

  return api.get<ApiResponseResellListResponse, ResellListResponse>(RESELLS_ENDPOINT, {
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

/** GET /api/v1/mcarry/resells/{resellId} */
export function getResellDetail(
  resellId: number | string,
  { userId, signal }: GetResellDetailParams = {},
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<ResellDetailResponse> {
  return api.get<unknown, ResellDetailResponse>(`${RESELLS_ENDPOINT}/${toApiId(resellId)}`, {
    ...config,
    signal: signal ?? config.signal,
    params: {
      ...(userId != null ? { userId: toApiId(userId) } : {}),
    },
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

export interface DeleteResellParams {
  sellerId: number
}

/** DELETE /api/v1/mcarry/resells/{resellId} */
export function deleteResell(
  resellId: number | string,
  { sellerId }: DeleteResellParams,
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<string> {
  return api.delete<unknown, string>(`${RESELLS_ENDPOINT}/${toApiId(resellId)}`, {
    ...config,
    params: { sellerId: toApiId(sellerId) },
  })
}

export interface UpdateResellBody {
  sellerId: number
  price: number
  conditionGrade: string
  letterShared?: boolean
  caretipShared?: boolean
  photoUrls?: string[]
  letterContent?: string
}

export interface UpdateResellResult {
  resellId: number
  price: number
  conditionGrade: string
  letterShared: boolean
  caretipShared: boolean
}

/** PATCH /api/v1/mcarry/resells/{resellId} */
export function updateResell(
  resellId: number | string,
  body: UpdateResellBody,
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<UpdateResellResult> {
  return api.patch<unknown, UpdateResellResult>(
    `${RESELLS_ENDPOINT}/${toApiId(resellId)}`,
    {
      ...body,
      sellerId: toApiId(body.sellerId),
    },
    config,
  )
}

/** API conditionGrade("S급" 등) → 폼 값 S|A|B */
export function normalizeConditionGrade(grade?: string | null): 'S' | 'A' | 'B' {
  const raw = String(grade || '').trim().toUpperCase()
  if (raw.startsWith('S')) return 'S'
  if (raw.startsWith('B')) return 'B'
  return 'A'
}

export interface InheritPreviewJourney {
  title: string
  body: string
  situations: string[]
}

export interface ResellInheritPreview {
  journeys: InheritPreviewJourney[]
  cities: string[]
  countryCount: number
  cityCount: number
  hasLetter: boolean
  hasCareTip: boolean
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function mapInheritJourney(item: Record<string, unknown>, index: number): InheritPreviewJourney {
  const tags = item.tags && typeof item.tags === 'object' ? (item.tags as Record<string, unknown>) : null
  const situationTag = tags?.situation
  const situations = asArray<string>(item.situations)
    .concat(asArray<string>(item.situationTags))
    .concat(typeof situationTag === 'string' && situationTag ? [situationTag] : [])
    .filter(Boolean)

  return {
    title: String(item.title || item.headline || `여정 기록 ${index + 1}`),
    body: String(item.body || item.content || item.recallText || item.userMemo || ''),
    situations,
  }
}

/** GET /api/v1/mcarry/resells/{resellId}/inherit-preview */
export async function getResellInheritPreview(
  resellId: number | string,
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<ResellInheritPreview> {
  const data = await api.get<unknown, Record<string, unknown>>(
    `${RESELLS_ENDPOINT}/${toApiId(resellId)}/inherit-preview`,
    config,
  )

  const rawJourneys = asArray<Record<string, unknown>>(
    data?.journeys ?? data?.sharedJourneys ?? data?.items ?? data?.previews,
  )

  const locked =
    data?.lockedJourney && typeof data.lockedJourney === 'object'
      ? (data.lockedJourney as Record<string, unknown>)
      : null

  return {
    journeys: rawJourneys.map(mapInheritJourney),
    cities: asArray<string>(data?.cities ?? locked?.cities),
    countryCount: Number(data?.countryCount ?? locked?.countryCount ?? 0),
    cityCount: Number(data?.cityCount ?? locked?.cityCount ?? 0),
    hasLetter: Boolean(data?.hasLetter ?? locked?.hasLetter),
    hasCareTip: Boolean(data?.hasCareTip ?? locked?.hasCareTip),
  }
}
