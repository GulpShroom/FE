import { useEffect, useState } from 'react'
import { getJourney, mapJourneyDetail } from '../api/journeys'
import journeyHero from '../assets/final/journey-detail-hero.png'

function toTagLabel(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && value.tag != null && value.tag !== '') return String(value.tag)
  return ''
}

/**
 * 확대 지도 위에 여정 상세 내용만 올리는 오버레이.
 * 가짜 지도 배경 없이, 아래 Leaflet 지도를 그대로 유지한다.
 */
export function MapJourneyDetailOverlay({
  journeyId,
  productId,
  userId,
  preview,
  onClose,
}) {
  const [journey, setJourney] = useState(() => ({
    id: String(journeyId),
    productId,
    quote: preview?.recallText ? `“${preview.recallText}”` : '',
    memo: '',
    image: preview?.photoUrl || preview?.thumbnailUrl || null,
    activity: '',
    situation: '',
    style: '',
  }))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    getJourney(journeyId, { userId })
      .then((data) => {
        if (cancelled || !data) return
        setJourney(mapJourneyDetail(data, { productId }))
        setLoadError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err.message || '여정 상세를 불러오지 못했습니다')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [journeyId, productId, userId])

  const tags = (journey.tags?.length
    ? journey.tags
    : [journey.activity, journey.situation, journey.style]
  )
    .map(toTagLabel)
    .filter(Boolean)

  const quoteText = String(journey.quote || '').replace(/[“”"]/g, '').trim()
  const quoteDisplay = quoteText ? journey.quote : '한 줄 평이 없습니다.'
  const memoDisplay = String(journey.memo ?? '').trim() || '메모가 없습니다.'
  const heroSrc = journey.image || preview?.photoUrl || preview?.thumbnailUrl || journeyHero

  return (
    <div className="expanded-map__detail" role="dialog" aria-modal="true" aria-label="여정 상세">
      <button
        type="button"
        className="expanded-map__detail-scrim"
        aria-label="상세 닫기"
        onClick={onClose}
      />

      <div className="expanded-map__detail-panel">
        {loading ? <p className="journeys-status">여정 상세를 불러오는 중...</p> : null}
        {loadError ? (
          <p className="journeys-status journeys-status--error">{loadError}</p>
        ) : null}

        {!loading && !loadError ? (
          <>
            <div className="expanded-map__detail-photo">
              <img src={heroSrc} alt="" />
            </div>

            <p className={`expanded-map__detail-quote${quoteText ? '' : ' is-empty'}`}>
              {quoteDisplay}
            </p>

            <div className="expanded-map__detail-tags">
              {tags.length ? (
                tags.map((tag) => (
                  <span key={tag} className="journey-tag journey-tag--outline">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="journey-tag journey-tag--outline is-empty">
                  해시태그가 없습니다.
                </span>
              )}
            </div>

            <div className="expanded-map__detail-memo">
              <p className="expanded-map__detail-memo-label">메모</p>
              <div className="expanded-map__detail-memo-box">
                <p className={String(journey.memo ?? '').trim() ? '' : 'is-empty'}>{memoDisplay}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
