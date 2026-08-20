import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { LeafletJourneyMap } from '../../components/LeafletJourneyMap'
import { useProfile } from '../../context/ProfileContext'
import { getProductJourneys } from '../../api/journeys'
import logo from '../../assets/final/logo-mark.png'
import planeIcon from '../../assets/final/progress-plane.png'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import emptyJourney from '../../assets/final/empty-journey.svg'
import backIcon from '../../assets/final/back.png'
import expandedMap from '../../assets/final/expanded-map.png'
import mapMarker1 from '../../assets/final/map-marker-1.png'
import mapMarker2 from '../../assets/final/map-marker-2.png'
import mapMarker3 from '../../assets/final/map-marker-3.png'
import { products } from '../../data/mock'
import { allCountriesOption, countryGroups, searchableCountries } from '../../data/countries'
import { resellProductDummies } from '../../data/resellDummies'

const selectableProducts = resellProductDummies
  .map((dummy) => products.find((product) => product.id === dummy.productId))
  .filter(Boolean)

function OverviewSlide({
  product,
  catalog,
  productIndex,
  onDotClick,
  showDots,
  swipeHandlers,
}) {
  return (
    <div className="main-slide">
      <div className="main-slide__overview">
        <article className="overview-card" {...swipeHandlers}>
          <div className="overview-card__inner">
            <span className="overview-card__stamp-box" aria-hidden="true">
              <img
                className="overview-card__stamp"
                src={product.stamp}
                alt=""
                width={168}
                height={168}
              />
            </span>
            <p className="overview-card__label">Journey Overview</p>
            <h2 className="overview-card__title">{product.alias}</h2>
            <p className="overview-card__meta">
              <span>{product.authenticity}</span>
              <span>{product.journeyCount}개의 여정 기록</span>
            </p>
            <p className="overview-card__score">{product.overallScore}</p>
          </div>
        </article>

        <div className={`main-dots${showDots ? '' : ' is-spacer'}`} aria-hidden={!showDots}>
          {catalog.map((item, index) => (
            <button
              key={item.id}
              type="button"
              tabIndex={showDots ? 0 : -1}
              className={index === productIndex ? 'is-active' : ''}
              aria-label={`${item.alias} 선택`}
              onClick={() => showDots && onDotClick(index)}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

function ProductJourneyDetails({
  product,
  generationIndex,
  onGeneration,
  countryId,
  onSelectCountry,
  mapExpanded,
  onToggleMap,
}) {
  const [countryQuery, setCountryQuery] = useState('')
  const [countrySearchOpen, setCountrySearchOpen] = useState(false)
  const normalizedQuery = countryQuery.trim().toLocaleLowerCase('ko-KR')
  const filteredCountries = searchableCountries.filter((country) => (
    !normalizedQuery || country.label.toLocaleLowerCase('ko-KR').includes(normalizedQuery)
  ))
  const filteredCountryGroups = countryGroups
    .map((group) => ({
      ...group,
      countries: group.countries.filter((country) => filteredCountries.includes(country)),
    }))
    .filter((group) => group.countries.length > 0)

  const selectMapCountry = (country) => {
    onSelectCountry(country.id)
    setCountryQuery(country.id === 'all' ? '' : country.label)
    setCountrySearchOpen(false)
  }

  if (mapExpanded) {
    const markers = [
      { image: mapMarker1, className: 'expanded-map__marker--one', href: '/journey/entry/j1?view=owned&photo=1&from=map' },
      { image: mapMarker2, className: 'expanded-map__marker--two', href: '/journey/entry/j1?view=owned&photo=2&from=map' },
      { image: mapMarker3, className: 'expanded-map__marker--three', href: '/journey/entry/j4?view=other&photo=3&from=map' },
    ]

    return (
      <section className="expanded-map-view" aria-label="확대된 여정 지도">
        <header className="expanded-map__header">
          <button type="button" onClick={onToggleMap} aria-label="지도 닫기">
            <img src={backIcon} alt="" width={30} height={30} />
          </button>
          <img className="expanded-map__logo" src={logo} alt="M·Carry" width={133} height={40} />
        </header>
        <div className="expanded-map__canvas">
          <img className="expanded-map__background" src={expandedMap} alt="" />
          {markers.map((marker) => (
            <Link
              key={marker.className}
              to={marker.href}
              className={`expanded-map__marker ${marker.className}`}
              aria-label="여정 사진 보기"
            >
              <img src={marker.image} alt="" width={100} height={100} />
            </Link>
          ))}
          <span className="expanded-map__place">Casa</span>
        </div>
      </section>
    )
  }

  return (
      <div className="main-slide__lower">
        <section className="timeline" aria-label="소유 세대">
          <div className="timeline__line" />
          <div className="timeline__nodes">
          {product.generations.map((generation, index) => (
              <button
                key={generation.id}
                type="button"
              className={`timeline__node${generationIndex === index ? ' is-active' : ''}`}
              onClick={() => onGeneration(index)}
              >
                <span className="timeline__dot" />
                <span className="timeline__owner">{generation.label}</span>
                <span className="timeline__label">{generation.period}</span>
              </button>
            ))}
          </div>
          <img className="timeline__plane" src={planeIcon} alt="" width={43} height={43} />
        </section>

        <section className={`map-panel${mapExpanded ? ' is-expanded' : ''}`}>
        <div className="map-country-search">
          <div className="map-country-search__field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              value={countryQuery}
              placeholder="나라 검색"
              aria-label="나라 검색"
              aria-expanded={countrySearchOpen}
              aria-controls="map-country-options"
              onFocus={() => setCountrySearchOpen(true)}
              onBlur={() => setCountrySearchOpen(false)}
              onChange={(event) => {
                setCountryQuery(event.target.value)
                setCountrySearchOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filteredCountries.length === 1) {
                  event.preventDefault()
                  selectMapCountry(filteredCountries[0])
                }
                if (event.key === 'Escape') setCountrySearchOpen(false)
              }}
            />
            <button
              type="button"
              className={`map-country-search__toggle${countrySearchOpen ? ' is-open' : ''}`}
              aria-label={countrySearchOpen ? '국가 목록 닫기' : '국가 목록 열기'}
              aria-expanded={countrySearchOpen}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setCountrySearchOpen((open) => !open)}
            >
              <span aria-hidden="true" />
            </button>
          </div>
          {countrySearchOpen ? (
            <div id="map-country-options" className="map-country-search__options" role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={countryId === 'all'}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMapCountry(allCountriesOption)}
              >
                전체 국가
              </button>
              {filteredCountryGroups.map((group) => (
                <div className="map-country-search__group" key={group.continent} role="group" aria-label={group.continent}>
                  <p className="map-country-search__continent">
                    {group.continent} <span>{group.countries.length}개국</span>
                  </p>
                  {group.countries.map((country) => (
                    <button
                      key={country.id}
                      type="button"
                      role="option"
                      aria-selected={countryId === country.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectMapCountry(country)}
                    >
                      {country.label}
                    </button>
                  ))}
                </div>
              ))}
              {filteredCountries.length === 0 ? (
                <p>검색 결과가 없습니다.</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="map-panel__expand-hit"
          aria-label={mapExpanded ? '지도 축소' : '지도 확대'}
          onClick={onToggleMap}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M18 5h9v9M27 5 15 17M13 9H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
          </svg>
        </button>

          <div className="map-panel__body">
            <LeafletJourneyMap
              points={product.mapCounts}
              countryId={countryId}
            />
          </div>
        </section>
      </div>
  )
}

export default function MainPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useProfile()
  const forceEmpty = searchParams.get('empty') === '1'
  const hasProducts = !forceEmpty && profile.ownedCount > 0 && selectableProducts.length > 0
  const [catalog, setCatalog] = useState(() => (hasProducts ? selectableProducts : []))
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [productIndex, setProductIndex] = useState(0)
  const product = catalog[productIndex] ?? catalog[0]
  const activeProductId = product?.id

  const [generationIndex, setGenerationIndex] = useState(1)
  const [countryId, setCountryId] = useState('all')
  const [mapExpanded, setMapExpanded] = useState(() => searchParams.get('map') === 'expanded')

  useEffect(() => {
    if (!activeProductId) return undefined

    let cancelled = false
    getProductJourneys(activeProductId, {
      userId: profile.id,
      page: 0,
      size: 50,
    })
      .then((data) => {
        if (cancelled) return
        const journeyCount = data?.totalCount ?? data?.journeys?.length
        if (!Number.isFinite(journeyCount)) return
        setCatalog((current) => current.map((item) => (
          item.id === activeProductId ? { ...item, journeyCount } : item
        )))
      })
      .catch(() => {
        // Keep the seeded product overview when the API is unavailable.
      })

    return () => {
      cancelled = true
    }
  }, [activeProductId, profile.id])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const onScroll = () => {
      const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))
      setProductIndex((previous) => {
        if (index === previous || index < 0 || index >= catalog.length) return previous
        setCountryId('all')
        setMapExpanded(false)
        return index
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [catalog.length])

  const scrollToIndex = (index) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
    setProductIndex(index)
    setCountryId('all')
    setMapExpanded(false)
  }

  const startCardSwipe = (event) => {
    if (event.button !== 0) return
    const track = trackRef.current
    if (!track) return
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: track.scrollLeft,
    }
    track.classList.add('is-dragging')
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveCardSwipe = (event) => {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return
    track.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX)
  }

  const endCardSwipe = (event) => {
    const track = trackRef.current
    if (!track || !dragRef.current.active) return
    dragRef.current.active = false
    track.classList.remove('is-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))
    scrollToIndex(Math.max(0, Math.min(index, catalog.length - 1)))
  }

  if (!product) {
    return (
      <AppShell hideHeader>
        <main className="page--main-empty-product" aria-labelledby="empty-product-title">
          <div className="empty-product-brand">
            <img src={logo} alt="M·Carry" width={133} height={40} />
            <p>Carry the Moment, Share the Value</p>
          </div>

          <section className="empty-product-message">
            <img src={emptyJourney} alt="" width={144} height={144} />
            <h1 id="empty-product-title">아직 등록된 제품이 없어요</h1>
            <p>
              제품을 등록하면 정품 인증부터
              <br />
              나만의 소유 여정 기록이 시작돼요.
            </p>
          </section>

          <Link to="/register" className="cta-dark empty-product-cta">
            <span className="cta-dark__copy">
              <span className="cta-dark__sub">MCM과 함께 여정을 시작해볼까요?</span>
              <span className="cta-dark__title">제품 등록하러 가기</span>
            </span>
            <img className="cta-dark__arrow" src={ctaArrow} alt="" width={50} height={50} />
          </Link>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell hideHeader>
      <main className="page page--main">
        <div className="empty-product-brand main-dashboard-brand">
          <img src={logo} alt="M·Carry" width={133} height={40} />
          <p>Carry the Moment, Share the Value</p>
        </div>

        <div
          className="main-track"
          ref={trackRef}
        >
          {catalog.map((item, slideIndex) => {
            return (
              <OverviewSlide
                key={item.id}
                product={item}
                catalog={catalog}
                productIndex={productIndex}
                onDotClick={scrollToIndex}
                showDots={slideIndex === productIndex}
                swipeHandlers={{
                  onPointerDown: startCardSwipe,
                  onPointerMove: moveCardSwipe,
                  onPointerUp: endCardSwipe,
                  onPointerCancel: endCardSwipe,
                }}
              />
            )
          })}
        </div>

        <ProductJourneyDetails
          product={product}
          generationIndex={Math.min(generationIndex, product.generations.length - 1)}
          onGeneration={setGenerationIndex}
          countryId={countryId}
          onSelectCountry={(id) => {
            setCountryId(id)
          }}
          mapExpanded={mapExpanded}
          onToggleMap={() => setMapExpanded((expanded) => !expanded)}
        />

        <Link
          className="main-journey-add-button"
          to={`/journey/new?productId=${encodeURIComponent(product.id)}`}
        >
          <span>여정 기록하기</span>
        </Link>
      </main>
    </AppShell>
  )
}
