import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import logoMark from '../../assets/final/logo-mark.png'
import { products } from '../../data/mock'
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
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 2) return name
  return `${parts.slice(0, -1).join(' ')}\n${parts[parts.length - 1]}`
}

export default function JourneyPassportsPage() {
  const navigate = useNavigate()
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)

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
  }, [])

  const scrollTo = (idx) => {
    const el = trackRef.current
    const slide = el?.querySelectorAll('.passport-slide')[idx]
    if (!el || !slide) return
    el.scrollTo({ top: slide.offsetTop, behavior: 'smooth' })
  }

  return (
    <AppShell showBack logoSrc={logoMark} logoWidth={989} logoHeight={279}>
      <div className="passport-page">
        <header className="passport-page__head">
          <h1 className="passport-page__title">MY PASSPORTS</h1>
          <p className="passport-page__sub">내가 함께한 MCM의 여정</p>
        </header>

        <div className="passport-track" ref={trackRef}>
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className={`passport-slide${active === index ? ' is-active' : ''}`}
              style={{
                zIndex: active === index ? 40 : products.length - index,
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
                    src={bagAssets[index % bagAssets.length]}
                    alt={product.name}
                    width={180}
                    height={194}
                  />
                </div>

                <p className="passport-leather__journeys">{product.journeyCount} JOURNEYS</p>
                <span className="passport-leather__badge">소유중</span>
              </article>
            </button>
          ))}
        </div>

        <div className="passport-rail" aria-label="패스포트 위치">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={i === active ? 'is-active' : ''}
              aria-label={`${i + 1}번째 패스포트`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
