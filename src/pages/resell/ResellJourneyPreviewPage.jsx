import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { getResellInheritPreview } from '../../api/resells'
import selectedCheckIcon from '../../assets/final/resell-selected-check.svg'

export default function ResellJourneyPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const resetScroll = () => {
      const scroller = document.querySelector('.phone-shell__body')
      if (scroller) scroller.scrollTop = 0
      window.scrollTo(0, 0)
    }

    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('리셀글 ID가 없습니다.')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getResellInheritPreview(id)
      .then((data) => {
        if (cancelled) return
        setJourneys(data?.journeys ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '계승 여정 미리보기를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <AppShell showNav={false} showBack onBack={() => navigate(`/resell/${id}`)}>
      <main className="resell-journey-preview">
        <div className="resell-journey-preview__head">
          <h1>자유 텍스트 수정분 선택</h1>
          <span>선택 사항</span>
          <p>판매자가 구매자에게 공유한 여정 기록입니다.</p>
        </div>

        {loading ? (
          <p role="status">여정 기록을 불러오는 중입니다.</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : journeys.length === 0 ? (
          <p>공유된 여정 기록이 없습니다.</p>
        ) : (
          <div className="resell-journey-preview__list">
            {journeys.map((journey, index) => (
              <article
                key={`${journey.title}-${index}`}
                className="resell-journey-preview__card is-selected"
              >
                <span className="resell-journey-preview__check" aria-hidden="true">
                  <img src={selectedCheckIcon} alt="" width={20} height={20} />
                </span>
                <strong>{journey.title}</strong>

                {journey.situations?.length ? (
                  <div className="resell-journey-preview__situations">
                    <span>상황</span>
                    {journey.situations.map((situation) => (
                      <div key={situation}>
                        <i className="is-selected" />
                        {situation}
                      </div>
                    ))}
                  </div>
                ) : null}

                <p>{journey.body}</p>
              </article>
            ))}
          </div>
        )}

        <button
          type="button"
          className="resell-journey-preview__confirm"
          onClick={() => navigate(`/resell/${id}`)}
        >
          확인
        </button>
      </main>
    </AppShell>
  )
}
