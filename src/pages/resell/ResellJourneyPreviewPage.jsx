import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { resellPosts } from '../../data/mock'
import selectedCheckIcon from '../../assets/final/resell-selected-check.svg'

const JOURNEYS = [
  {
    title: '첫 세탁의 기억',
    body: '처음으로 드라이클리닝을 맡겼을 때의 조심스러움. 원단이 상하지 않게 신경 썼던 기억이 납니다.',
    situations: ['사과', '바나나', '포도'],
  },
  {
    title: '특별한 날의 착용',
    body: '친한 친구의 결혼식 날 착용했던 특별한 기억. 좋은 자리에 함께했던 옷입니다.',
    situations: ['결혼식', '친구', '기념일'],
  },
  {
    title: '단추 수선 완료',
    body: '떨어질 뻔한 단추를 비슷한 색상의 실로 튼튼하게 다시 달았습니다.',
    situations: ['단추', '수선', '관리'],
  },
]

export default function ResellJourneyPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const post = resellPosts.find((item) => item.id === id) ?? resellPosts[0]
  const selected = location.state?.shareSelections ?? post.shareSelections ?? [0]
  const selectedSituations =
    location.state?.situationSelections ?? post.situationSelections ?? []

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

  return (
    <AppShell showNav={false}>
      <main className="resell-journey-preview">
        <div className="resell-journey-preview__head">
          <h1>자유 텍스트 수정분 선택</h1>
          <span>선택 사항</span>
          <p>판매자가 구매자에게 공유한 여정 기록입니다.</p>
        </div>

        <div className="resell-journey-preview__list">
          {JOURNEYS.map((journey, index) => {
            const isSelected = selected.includes(index)
            return (
              <article
                key={journey.title}
                className={`resell-journey-preview__card${isSelected ? ' is-selected' : ''}`}
              >
                <span className="resell-journey-preview__check" aria-hidden="true">
                  {isSelected ? <img src={selectedCheckIcon} alt="" width={20} height={20} /> : null}
                </span>
                <strong>{journey.title}</strong>

                {isSelected ? (
                  <div className="resell-journey-preview__situations">
                    <span>상황</span>
                    {journey.situations.map((situation) => {
                      const key = `${index}-${situation}`
                      return (
                        <div key={situation}>
                          <i className={selectedSituations.includes(key) ? 'is-selected' : ''} />
                          {situation}
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                <p>{journey.body}</p>
              </article>
            )
          })}
        </div>

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
