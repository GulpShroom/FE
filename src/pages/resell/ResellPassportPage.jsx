import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import {
  getDigitalPassport,
  getProductLineage,
  mapDigitalPassport,
  mapLineageGeneration,
} from '../../api/products'
import stampImg from '../../assets/final/stamp.png'

export default function ResellPassportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const productId = location.state?.productId
  const [flipped, setFlipped] = useState(false)
  const [passport, setPassport] = useState(null)
  const [generations, setGenerations] = useState([])
  const [loading, setLoading] = useState(Boolean(productId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      setError('제품 정보가 없습니다. 구매 완료 후 다시 시도해 주세요.')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      getDigitalPassport(productId),
      getProductLineage(productId).catch(() => null),
    ])
      .then(([passportData, lineageData]) => {
        if (cancelled) return
        setPassport(mapDigitalPassport(passportData))
        setGenerations((lineageData?.generations ?? []).map(mapLineageGeneration))
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '디지털 패스포트를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  const activeGenId =
    generations.find((generation) => generation.active)?.id ?? generations[0]?.id
  const journeyText = ''
  const toggleFromKeyboard = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setFlipped((current) => !current)
  }

  const goAlias = () => {
    navigate(`/resell/${id}/alias`, {
      state: {
        productId,
        transferId: location.state?.transferId,
        officialName: passport?.name,
        image: passport?.image,
      },
    })
  }

  if (loading) {
    return (
      <AppShell hideHeader showNav={false}>
        <main className="resell-passport-page">
          <p role="status">디지털 패스포트를 불러오는 중입니다.</p>
        </main>
      </AppShell>
    )
  }

  if (error || !passport) {
    return (
      <AppShell hideHeader showNav={false}>
        <main className="resell-passport-page">
          <p role="alert">{error || '디지털 패스포트를 불러오지 못했습니다.'}</p>
          <button type="button" className="resell-passport-page__confirm" onClick={() => navigate('/resell')}>
            리셀로 돌아가기
          </button>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell hideHeader showNav={false}>
      <main className="resell-passport-page">
        {!flipped ? (
          <article
            className="passport-card passport-card--front resell-passport-card--front"
            role="button"
            tabIndex={0}
            aria-label="디지털 패스포트 뒷면 보기"
            onClick={() => setFlipped(true)}
            onKeyDown={toggleFromKeyboard}
          >
            <img className="passport-card__stamp" src={stampImg} alt="" width={188} height={189} />
            <p className="passport-card__eyebrow">DIGITAL PRODUCT PASSPORT</p>
            <p className="passport-card__serial">{passport.serial || passport.passportId}</p>
            <div className="passport-card__photo-wrap">
              {passport.image ? (
                <img
                  className="passport-card__photo"
                  src={passport.image}
                  alt={passport.name}
                  width={175}
                  height={190}
                />
              ) : null}
            </div>
            <div className="passport-card__names">
              <span className="passport-card__alias">{passport.alias || '별칭 없음'}</span>
              <span className="passport-card__product">{passport.name}</span>
            </div>
            <p className="passport-card__role">{passport.currentGeneration} Keeper</p>
            <div className="passport-card__info">
              <div className="passport-card__info-row">
                <span>{passport.isAuthenticated ? 'MCM 정품 인증 완료' : '인증 정보 없음'}</span>
                <span className="muted">{passport.authenticatedAt || ''}</span>
              </div>
              <span>{passport.material}</span>
              <span>{passport.purchase}</span>
            </div>
          </article>
        ) : (
          <article
            className="passport-card passport-card--back resell-passport-card--back"
            role="button"
            tabIndex={0}
            aria-label="디지털 패스포트 앞면 보기"
            onClick={() => setFlipped(false)}
            onKeyDown={toggleFromKeyboard}
          >
            <img
              className="passport-card__stamp passport-card__stamp--back"
              src={stampImg}
              alt=""
              width={188}
              height={189}
            />

            <p className="passport-back__journey">
              {journeyText ? `“${journeyText}”` : '계승된 여정이 시작됩니다.'}
            </p>

            <div className="passport-back__timeline" aria-label="소유 세대">
              <div className="passport-back__timeline-line" aria-hidden="true" />
              <div
                className="passport-back__timeline-nodes"
                style={{ '--gen-count': String(Math.max(generations.length, 1)) }}
              >
                {(generations.length > 0
                  ? generations
                  : [{ id: 'g1', label: '1 Keeper', period: '현재', active: true }]
                ).map((generation) => (
                  <div
                    key={generation.id}
                    className={`passport-back__node${generation.id === activeGenId ? ' is-active' : ''}`}
                  >
                    <span className="passport-back__node-owner">{generation.label}</span>
                    <span className="passport-back__node-dot" />
                    <span className="passport-back__node-period">{generation.period}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="passport-back__panels">
              <div className="passport-back__panel-group">
                <p className="passport-back__panel-label">편지</p>
                <div className="passport-back__panel">
                  <p className="passport-back__panel-text">계승 편지를 확인할 수 있습니다.</p>
                </div>
              </div>
              <div className="passport-back__panel-group">
                <p className="passport-back__panel-label">케어 Tip</p>
                <div className="passport-back__panel">
                  <p className="passport-back__panel-text">케어팁은 제품 상세에서 확인할 수 있어요.</p>
                </div>
              </div>
            </div>
          </article>
        )}
        <button type="button" className="resell-passport-page__confirm" onClick={goAlias}>
          확인
        </button>
      </main>
    </AppShell>
  )
}
