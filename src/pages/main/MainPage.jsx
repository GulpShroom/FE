import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import logo from '../../assets/final/logo-mark.png'
import planeIcon from '../../assets/final/plane-tip-clear.png'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import emptyJourney from '../../assets/final/empty-journey.svg'
import { mapCountries, products } from '../../data/mock'

function OverviewSlide({
  product,
  generationId,
  onGeneration,
  countryId,
  countryLabel,
  countryOpen,
  onToggleCountry,
  onSelectCountry,
  mapExpanded,
  onToggleMap,
  catalog,
  productIndex,
  onDotClick,
  showDots,
}) {
  return (
    <div className="main-slide">
      <div className="main-slide__overview">
        <article className="overview-card">
          <div className="overview-card__inner">
            <img
              className="overview-card__stamp"
              src={product.stamp}
              alt=""
              width={167}
              height={168}
            />
            <p className="overview-card__label">Journey Overview</p>
            <h2 className="overview-card__title">{product.alias}</h2>
            <p className="overview-card__meta">
              <span>{product.authenticity}</span>
              <span>{product.journeyCount}개의 여정 기록</span>
            </p>
          </div>
        </article>

        <div className={`main-dots${showDots ? '' : ' is-spacer'}`} aria-hidden={!showDots}>
          {catalog.map((p, i) => (
            <button
              key={p.id}
              type="button"
              tabIndex={showDots ? 0 : -1}
              className={i === productIndex ? 'is-active' : ''}
              aria-label={`${p.alias} 선택`}
              onClick={() => showDots && onDotClick(i)}
            />
          ))}
        </div>
      </div>

      <div className="main-slide__lower">
        <section className="timeline" aria-label="소유 세대">
          <div className="timeline__line" />
          <div className="timeline__nodes">
            {product.generations.map((gen) => (
              <button
                key={gen.id}
                type="button"
                className={`timeline__node${generationId === gen.id ? ' is-active' : ''}`}
                onClick={() => onGeneration(gen.id)}
              >
                <span className="timeline__dot" />
                <span className="timeline__owner">{gen.label}</span>
                <span className="timeline__label">{gen.period}</span>
              </button>
            ))}
          </div>
          <img className="timeline__plane" src={planeIcon} alt="" width={43} height={43} />
        </section>

        <section className={`map-panel${mapExpanded ? ' is-expanded' : ''}`}>
          <button type="button" className="map-panel__chip-hit" onClick={onToggleCountry}>
            <span className="sr-only">{countryLabel}</span>
          </button>
          <button
            type="button"
            className="map-panel__expand-hit"
            aria-label={mapExpanded ? '지도 축소' : '지도 확대'}
            onClick={onToggleMap}
          />

          {countryOpen ? (
            <div className="map-country-menu" role="listbox">
              {mapCountries.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={countryId === c.id ? 'is-active' : ''}
                  onClick={() => onSelectCountry(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="map-panel__body">
            <img
              className="map-panel__img"
              src={product.map}
              alt="여정 지도"
              width={335}
              height={263}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function MainPage() {
  const [searchParams] = useSearchParams()
  const forceEmpty = searchParams.get('empty') === '1'
  const catalog = forceEmpty ? [] : products

  const trackRef = useRef(null)
  const [productIndex, setProductIndex] = useState(0)
  const product = catalog[productIndex] ?? catalog[0]

  const [generationByProduct, setGenerationByProduct] = useState(() => {
    const init = {}
    products.forEach((p) => {
      init[p.id] = p.generations[1]?.id ?? p.generations[0]?.id
    })
    return init
  })
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryId, setCountryId] = useState('all')
  const [mapExpanded, setMapExpanded] = useState(false)

  const countryLabel =
    mapCountries.find((c) => c.id === countryId)?.label ?? '전체'

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined

    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))
      setProductIndex((prev) => {
        if (idx === prev || idx < 0 || idx >= catalog.length) return prev
        setCountryOpen(false)
        setCountryId('all')
        setMapExpanded(false)
        return idx
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [catalog.length])

  const scrollToIndex = (idx) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setProductIndex(idx)
    setCountryOpen(false)
    setCountryId('all')
    setMapExpanded(false)
  }

  if (!product) {
    return (
      <AppShell hideHeader>
        <div className="page page--main page--main-empty">
          <div className="main-brand">
            <img className="main-brand__logo" src={logo} alt="M·Carry" width={131} height={39} />
            <p className="main-brand__tagline">Carry the Moment, Share the Value</p>
          </div>

          <div className="empty-hero empty-hero--main">
            <img
              className="empty-hero__illust"
              src={emptyJourney}
              alt=""
              width={144}
              height={144}
            />
            <p className="empty-hero__title">아직 등록된 제품이 없어요</p>
            <p className="empty-hero__desc">
              제품을 등록하면 정품 인증부터
              <br />
              나만의 소유 여정 기록이 시작돼요.
            </p>
          </div>

          <Link className="cta-dark cta-dark--empty" to="/register">
            <span className="cta-dark__copy">
              <span className="cta-dark__sub">MCM과 함께 여정을 시작해볼까요?</span>
              <span className="cta-dark__title">제품 등록하러 가기</span>
            </span>
            <img className="cta-dark__arrow" src={ctaArrow} alt="" width={50} height={50} />
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell hideHeader>
      <div className="page page--main">
        <div className="main-brand">
          <img className="main-brand__logo" src={logo} alt="M·Carry" width={131} height={39} />
          <p className="main-brand__tagline">Carry the Moment, Share the Value</p>
        </div>

        <div className="main-track" ref={trackRef}>
          {catalog.map((item, slideIndex) => {
            const generationId =
              generationByProduct[item.id] ??
              item.generations[1]?.id ??
              item.generations[0]?.id

            return (
              <OverviewSlide
                key={item.id}
                product={item}
                generationId={generationId}
                onGeneration={(id) =>
                  setGenerationByProduct((prev) => ({ ...prev, [item.id]: id }))
                }
                countryId={countryId}
                countryLabel={countryLabel}
                countryOpen={countryOpen && item.id === product.id}
                onToggleCountry={() => setCountryOpen((v) => !v)}
                onSelectCountry={(id) => {
                  setCountryId(id)
                  setCountryOpen(false)
                }}
                mapExpanded={mapExpanded && item.id === product.id}
                onToggleMap={() => setMapExpanded((v) => !v)}
                catalog={catalog}
                productIndex={productIndex}
                onDotClick={scrollToIndex}
                showDots={slideIndex === productIndex}
              />
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
