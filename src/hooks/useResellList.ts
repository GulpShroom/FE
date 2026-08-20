import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import {
  getResellList,
  type ResellListParams,
  type ResellListResponse,
} from '../api/resells'

const INITIAL_DATA: ResellListResponse = {
  totalCount: 0,
  resells: [],
}

export interface UseResellListOptions {
  enabled?: boolean
}

export interface UseResellListResult {
  data: ResellListResponse
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * React Query가 없는 현재 프로젝트에서 사용할 리셀 목록 데이터 패칭 훅입니다.
 * params가 변경되면 자동으로 다시 요청하며, 이전 요청은 취소합니다.
 */
export function useResellList(
  {
    status,
    userId,
    role,
    page = 0,
    size = 10,
  }: ResellListParams = {},
  { enabled = true }: UseResellListOptions = {},
): UseResellListResult {
  const [data, setData] = useState<ResellListResponse>(INITIAL_DATA)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    getResellList(
      { status, userId, role, page, size },
      { signal: controller.signal },
    )
      .then(setData)
      .catch((requestError: unknown) => {
        if (axios.isCancel(requestError)) return
        console.error('API 요청 에러 상세:', requestError)
        setError(
          requestError instanceof Error
            ? requestError
            : new Error('리셀 목록을 불러오지 못했습니다.'),
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [enabled, page, requestVersion, role, size, status, userId])

  return { data, isLoading, error, refetch }
}
