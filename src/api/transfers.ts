import type { AxiosRequestConfig } from 'axios'
import { api, toApiId } from './client'

const TRANSFERS_ENDPOINT = '/transfers'

export interface StartTransferBody {
  resellId: number
  buyerId: number
}

export interface TransferStartResult {
  transferId: number
  productId: number
  fromUserId: number
  toUserId: number
  transferType: string
  isOfficial: boolean
  transferStatus: string
  requestedAt: string
}

export interface CreateTransferLetterBody {
  authorId: number
  content: string
  isAiDraft?: boolean
  aiDraftOrDefault?: boolean
}

export interface TransferLetterResult {
  letterId: number
  isSealed: boolean
  isAiDraft: boolean
}

export interface TransferLetterDraftResult {
  draftContent: string
}

export interface CompleteTransferBody {
  newOwnerId: number
}

export type InheritedTagType = 'activity' | 'situation' | 'style'

export interface InheritedTag {
  type: InheritedTagType
  value: string
  city: string
  year: number
}

export interface TransferCompleteResult {
  productId: number
  newGeneration: number
  letterOpened: boolean
  transferStatus: string
  completedAt: string
  /** 구매·계승 완료 후에만 공개되는 판매자 선택 태그 */
  inheritedTags: InheritedTag[]
}

/** POST /api/v1/mcarry/transfers — 계승 시작 */
export function startTransfer(
  body: StartTransferBody,
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<TransferStartResult> {
  return api.post<unknown, TransferStartResult>(
    TRANSFERS_ENDPOINT,
    {
      resellId: toApiId(body.resellId),
      buyerId: toApiId(body.buyerId),
    },
    config,
  )
}

/** POST /api/v1/mcarry/transfers/{transferId}/letter — 계승 편지 작성 */
export function createTransferLetter(
  transferId: number | string,
  body: CreateTransferLetterBody,
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<TransferLetterResult> {
  return api.post<unknown, TransferLetterResult>(
    `${TRANSFERS_ENDPOINT}/${toApiId(transferId)}/letter`,
    {
      ...body,
      authorId: toApiId(body.authorId),
    },
    config,
  )
}

/** POST /api/v1/mcarry/transfers/{transferId}/letter/draft — 편지 LLM 초안 */
export function createTransferLetterDraft(
  transferId: number | string,
  { authorId }: { authorId: number },
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<TransferLetterDraftResult> {
  return api.post<unknown, TransferLetterDraftResult>(
    `${TRANSFERS_ENDPOINT}/${toApiId(transferId)}/letter/draft`,
    { authorId: toApiId(authorId) },
    config,
  )
}

/** POST /api/v1/mcarry/transfers/{transferId}/complete — 소유권 이전 완료 */
export function completeTransfer(
  transferId: number | string,
  body: CompleteTransferBody,
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<TransferCompleteResult> {
  return api.post<unknown, TransferCompleteResult>(
    `${TRANSFERS_ENDPOINT}/${toApiId(transferId)}/complete`,
    { newOwnerId: toApiId(body.newOwnerId) },
    config,
  )
}
