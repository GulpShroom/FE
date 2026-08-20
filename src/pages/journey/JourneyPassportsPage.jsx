import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { EmptyProductState } from '../../components/EmptyProductState'
import { useProfile } from '../../context/ProfileContext'
import { isNotFoundError } from '../../api/client'
import { getUserProducts, mapUserProduct } from '../../api/products'
import logoMark from '../../assets/final/logo-mark.png'
import leather1 from '../../assets/final/leather-1.png'
import leather2 from '../../assets/final/leather-2.png'
import leather3 from '../../assets/final/leather-3.png'
import bag1 from '../../assets/final/bag-1.png'
import bag2 from '../../assets/final/bag-2.png'
import bag3 from '../../assets/final/bag-3.png'

const leatherAssets = [leather1, leather2, leather3]
const bagAssets = [bag1, bag2, bag3]

function formatNameEn(name) {
  if (!name) return ''
  return name.trim()
}

function badgeLabel(status) {
  if (status === 'transferred') return '양도됨'
  return '소유중'
}

export default function JourneyPassportsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useProfile()
  const forceEmpty = searchParams.get('empty') === '1'
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const [catalog, setCatalog] = useState([])
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const fetchKey = `products:${profile.id}`
  const loading = forceEmpty ? false : loadedKey !== fetchKey

  useEffect(() => {
    if (forceEmpty) return undefined

    let cancelled = false

    getUserProducts(profile.id)
      .then((data) => {
        if (cancelled) return
        const rows = data?.products ?? []
        setCatalog(rows.map((item) => mapUserProduct(item)))
        setError(null)
        setLoadedKey(fetchKey)
      })
      .catch((err) => {
        if (cancelled) return
        setCatalog([])
        if (isNotFoundError(err)) {
          setError(null)
        } else {
          setError(err.message || '제품 목록을 불러오지 못했습니다')
        }
        setLoadedKey(fetchKey)
      })

    return () => {
      cancelled = true
    }
  }, [profile.id, forceEmpty, fetchKey])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined

    const onScroll = () => {
      const slides = [...el.querySelectorAll('.passport-slide')]
      if (!slides.length) return
      const trackTop = el.getBoundingClientRect().top + 24
      let best = 0
      let bestDist = Infinity
      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.getBoundingClientRect().top - trackTop)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      })
      setActive(best)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [catalog.length])

  const scrollTo = (idx) => {
    const el = trackRef.current
    const slide = el?.querySelectorAll('.passport-slide')[idx]
    if (!el || !slide) return
    el.scrollTo({ top: slide.offsetTop, behavior: 'smooth' })
  }

  if (!loading && !error && (forceEmpty || catalog.length === 0)) {
    return (
      <AppShell hideHeader>
        <EmptyProductState />
      </AppShell>
    )
  }

  return (
    <AppShell showBack logoSrc={logoMark} logoWidth={989} logoHeight={279} onBack={() => navigate('/main')}>
      <div className="passport-page">
        <header className="passport-page__head">
          <h1 className="passport-page__title">MY PASSPORTS</h1>
          <p className="passport-page__sub">내가 함께한 MCM의 여정</p>
        </header>

        {loading ? (
          <p className="journeys-status">패스포트를 불러오는 중...</p>
        ) : error ? (
          <p className="journeys-status journeys-status--error">{error}</p>
        ) : (
          <>
            <div className="passport-track" ref={trackRef}>
              {catalog.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  className={`passport-slide${active === index ? ' is-active' : ''}`}
                  style={{
                    zIndex: active === index ? 40 : catalog.length - index,
                  }}
                  onClick={() => navigate(`/journey/records/${product.id}`)}
                >
                  <article
                    className="passport-leather"
                    style={{
                      backgroundImage: `url(${leatherAssets[index % leatherAssets.length]})`,
                    }}
                  >
                    <div className="passport-leather__copy">
                      <p className="passport-leather__index">
                        {String(index + 1).padStart(2, '0')} {product.alias}
                      </p>
                      <p className="passport-leather__name">{formatNameEn(product.nameEn)}</p>
                      <p className="passport-leather__serial">{product.serial}</p>
                    </div>

                    <div className="passport-leather__photo">
                      <img
                        src={product.image || bagAssets[index % bagAssets.length]}
                        alt={product.name}
                        width={180}
                        height={194}
                      />
                    </div>

                    <p className="passport-leather__journeys">{product.journeyCount} JOURNEYS</p>
                    <span className="passport-leather__badge">{badgeLabel(product.ownershipStatus)}</span>
                  </article>
                </button>
              ))}
            </div>

            <div className="passport-rail" aria-label="패스포트 위치">
              {catalog.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={i === active ? 'is-active' : ''}
                  aria-label={`${i + 1}번째 패스포트`}
                  onClick={() => scrollTo(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
