import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { LeafletJourneyMap } from '../../components/LeafletJourneyMap'
import { MapJourneyDetailOverlay } from '../../components/MapJourneyDetailOverlay'
import { useProfile } from '../../context/ProfileContext'
import { getProductJourneys } from '../../api/journeys'
import {
  getMyProducts,
  getProductJourneyMap,
  getProductLineage,
  getProductSummary,
} from '../../api/dashboard'
import logo from '../../assets/final/logo-mark.png'
import planeIcon from '../../assets/final/progress-plane.png'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import emptyJourney from '../../assets/final/empty-journey.svg'
import backIcon from '../../assets/final/back.png'
import stamp from '../../assets/final/stamp.png'
import { allCountriesOption, countryGroups, searchableCountries } from '../../data/countries'

function formatOwnershipPeriod(ownedFrom, ownedTo, isCurrentOwner) {
  const start = ownedFrom ? String(new Date(ownedFrom).getFullYear()).slice(-2) : '—'
  const end = isCurrentOwner || !ownedTo
    ? '현재'
    : String(new Date(ownedTo).getFullYear()).slice(-2)
  return start === '—' ? end : `'${start}~${end === '현재' ? end : `'${end}`}`
}

function mapApiProduct(item, summary = {}) {
  const productId = item.productId ?? item.id
  const authenticated = summary.isAuthenticated ?? item.isAuthenticated ?? item.authenticated

  return {
    id: productId,
    alias: item.nickname || summary.nickname || item.officialName || '이름 없는 제품',
    authenticity: authenticated === false ? '정품 인증 확인 중' : '정품 인증 완료',
    journeyCount: item.journeyCount ?? summary.journeyCount ?? 0,
    overallScore: summary.score ?? summary.provenanceScore ?? item.score ?? item.provenanceScore ?? 0,
    stamp,
    generations: [],
    mapCounts: [],
  }
}

function toMapCountryId(value) {
  const normalized = String(value || '').replace(/\s/g, '').toLocaleLowerCase('ko-KR')
  const country = searchableCountries.find((item) => (
    item.id === normalized
      || item.isoCode.toLocaleLowerCase('en-US') === normalized
      || item.label.replace(/\s/g, '').toLocaleLowerCase('ko-KR') === normalized
  ))
  return country?.id || normalized
}

function OverviewSlide({
  product,
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
  isLoading,
  error,
  onRetry,
  userId,
}) {
  const [countryQuery, setCountryQuery] = useState('')
  const [countrySearchOpen, setCountrySearchOpen] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const normalizedQuery = countryQuery.trim().toLocaleLowerCase('ko-KR')

  useEffect(() => {
    if (!mapExpanded) setSelectedMarker(null)
  }, [mapExpanded])

  useEffect(() => {
    setSelectedMarker(null)
  }, [generationIndex, product.id])

  const filteredCountries = searchableCountries.filter((country) => (
    !normalizedQuery || country.label.toLocaleLowerCase('ko-KR').includes(normalizedQuery)
  ))
  const filteredCountryGroups = countryGroups
    .map((group) => ({
      ...group,
      countries: group.countries.filter((country) => filteredCountries.includes(country)),
    }))
    .filter((group) => group.countries.length > 0)

  const selectedGeneration = product.generations[generationIndex]
  const mapPoints = useMemo(() => {
    const rows = product.mapCounts ?? []
    if (!selectedGeneration) return rows
    return rows.filter((marker) => {
      const markerGen = marker.generation ?? marker.generationId ?? marker.ownershipId
      if (markerGen == null || markerGen === '') return true
      return (
        String(markerGen) === String(selectedGeneration.generation)
        || String(markerGen) === String(selectedGeneration.id)
        || String(markerGen) === String(generationIndex + 1)
      )
    })
  }, [generationIndex, product.mapCounts, selectedGeneration])

  const openJourneyDetail = (point) => {
    const journeyId = point?.journeyId ?? point?.id ?? point?.journey_id
    if (journeyId == null || journeyId === '') return
    setSelectedMarker({ ...point, journeyId })
  }

  const selectMapCountry = (country) => {
    onSelectCountry(country.id)
    setCountryQuery(country.id === 'all' ? '' : country.label)
    setCountrySearchOpen(false)
  }

  if (isLoading) {
    return (
      <div className="main-dashboard-state main-dashboard-state--details" role="status">
        <span className="main-dashboard-spinner" aria-hidden="true" />
        <p>제품의 여정 정보를 불러오는 중입니다.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="main-dashboard-state main-dashboard-state--details" role="alert">
        <p>{error.message || '여정 정보를 불러오지 못했습니다.'}</p>
        <button type="button" onClick={onRetry}>다시 시도</button>
      </div>
    )
  }

  if (mapExpanded) {
    const selectedJourneyId = selectedMarker?.journeyId
    return (
      <section className="expanded-map-view" aria-label="확대된 여정 지도">
        <header className="expanded-map__header">
          <button
            type="button"
            onClick={() => {
              if (selectedJourneyId != null && selectedJourneyId !== '') {
                setSelectedMarker(null)
                return
              }
              onToggleMap()
            }}
            aria-label={
              selectedJourneyId != null && selectedJourneyId !== ''
                ? '여정 상세 닫기'
                : '지도 닫기'
            }
          >
            <img src={backIcon} alt="" width={30} height={30} />
          </button>
          <img className="expanded-map__logo" src={logo} alt="M·Carry" width={133} height={40} />
        </header>
        <div className="expanded-map__canvas">
          <LeafletJourneyMap
            points={mapPoints}
            countryId={countryId}
            onMarkerClick={openJourneyDetail}
          />
          {selectedJourneyId != null && selectedJourneyId !== '' ? (
            <MapJourneyDetailOverlay
              journeyId={selectedJourneyId}
              productId={product.id}
              userId={userId}
              preview={selectedMarker}
              onClose={() => setSelectedMarker(null)}
            />
          ) : null}
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
              points={mapPoints}
              countryId={countryId}
            />
          </div>
        </section>
      </div>
  )
}

export default function MainPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useProfile()
  const profileId = profile?.userId ?? profile?.id
  const forceEmpty = searchParams.get('empty') === '1'
  const missingProfileId = profileId == null || profileId === ''
  const [catalog, setCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState(null)
  const [catalogRequestVersion, setCatalogRequestVersion] = useState(0)
  const [detailsLoadedProductId, setDetailsLoadedProductId] = useState(null)
  const [detailsFailure, setDetailsFailure] = useState(null)
  const [detailsRequestVersion, setDetailsRequestVersion] = useState(0)
  const trackRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [productIndex, setProductIndex] = useState(0)
  const product = catalog[productIndex] ?? catalog[0]
  const activeProductId = product?.id
  const detailsError = detailsFailure
    && String(detailsFailure.productId) === String(activeProductId)
    ? detailsFailure.error
    : null
  const detailsLoading = Boolean(
    activeProductId
      && String(detailsLoadedProductId) !== String(activeProductId)
      && !detailsError,
  )

  const [generationIndex, setGenerationIndex] = useState(0)
  const [countryId, setCountryId] = useState('all')
  const [mapExpanded, setMapExpanded] = useState(() => searchParams.get('map') === 'expanded')

  useEffect(() => {
    setMapExpanded(searchParams.get('map') === 'expanded')
  }, [searchParams])
  useEffect(() => {
    if (forceEmpty || missingProfileId) return undefined
    let cancelled = false

    getMyProducts(profileId)
      .then(async (data) => {
        const items = Array.isArray(data) ? data : data?.products ?? []
        const summaries = await Promise.all(items.map((item) => (
          getProductSummary(item.productId ?? item.id).catch(() => ({}))
        )))
        if (cancelled) return
        setCatalog(items.map((item, index) => mapApiProduct(item, summaries[index])))
        setProductIndex(0)
      })
      .catch((error) => {
        if (cancelled) return
        setCatalog([])
        setCatalogError(error)
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [catalogRequestVersion, forceEmpty, missingProfileId, profileId])

  useEffect(() => {
    if (!activeProductId) return undefined

    let cancelled = false

    Promise.all([
      getProductJourneys(activeProductId, {
        userId: profileId,
        page: 0,
        size: 100,
      }),
      getProductLineage(activeProductId),
      getProductJourneyMap(activeProductId, profileId),
    ])
      .then(([journeyData, lineageData, mapData]) => {
        if (cancelled) return

        const journeys = journeyData?.journeys ?? []
        const journeyById = new Map(journeys.map((journey) => [String(journey.journeyId), journey]))
        const rawGenerations = lineageData?.generations ?? journeyData?.generations ?? []
        const generations = rawGenerations.map((generation, index) => ({
          id: generation.ownershipId ?? generation.id ?? generation.generation ?? index + 1,
          generation: generation.generation ?? index + 1,
          label: String(
            generation.keeperLabel
              || generation.label
              || `${generation.generation ?? index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Owner`,
          ).replace('Keeper', 'Owner'),
          period: generation.durationText || generation.period || formatOwnershipPeriod(
            generation.ownedFrom,
            generation.ownedTo,
            generation.isCurrentOwner,
          ),
        }))
        const rawMarkers = mapData?.markers?.length
          ? mapData.markers
          : journeys.filter((journey) => (
            Number.isFinite(journey.latitude) && Number.isFinite(journey.longitude)
          ))
        const mapCounts = rawMarkers.map((marker) => {
          const journey = journeyById.get(String(marker.journeyId ?? marker.id)) ?? {}
          return {
            ...marker,
            journeyId: marker.journeyId ?? marker.id ?? journey.journeyId ?? journey.id,
            country: toMapCountryId(marker.country || journey.country),
            latitude: marker.latitude ?? journey.latitude,
            longitude: marker.longitude ?? journey.longitude,
            photoUrl: marker.photoUrl || marker.thumbnailUrl || journey.photoUrl || journey.thumbnailUrl,
            value: marker.value ?? 1,
          }
        })
        const journeyCount = journeyData?.totalCount ?? journeys.length

        setCatalog((current) => current.map((item) => (
          String(item.id) === String(activeProductId)
            ? { ...item, journeyCount, generations, mapCounts }
            : item
        )))
        setGenerationIndex(Math.max(generations.length - 1, 0))
        setDetailsLoadedProductId(activeProductId)
        setDetailsFailure(null)
      })
      .catch((error) => {
        if (!cancelled) setDetailsFailure({ productId: activeProductId, error })
      })

    return () => {
      cancelled = true
    }
  }, [activeProductId, detailsRequestVersion, profileId])

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

  if (missingProfileId && !forceEmpty) {
    return (
      <AppShell hideHeader>
        <main className="page--main-empty-product main-dashboard-state" role="alert">
          <div className="empty-product-brand">
            <img src={logo} alt="M·Carry" width={133} height={40} />
            <p>Carry the Moment, Share the Value</p>
          </div>
          <p>로그인 사용자 정보를 확인할 수 없습니다. 프로필을 다시 선택해주세요.</p>
          <Link to="/">프로필 다시 선택하기</Link>
        </main>
      </AppShell>
    )
  }

  if (catalogLoading && !forceEmpty) {
    return (
      <AppShell hideHeader>
        <main className="page--main-empty-product main-dashboard-state" role="status">
          <div className="empty-product-brand">
            <img src={logo} alt="M·Carry" width={133} height={40} />
            <p>Carry the Moment, Share the Value</p>
          </div>
          <span className="main-dashboard-spinner" aria-hidden="true" />
          <p>등록 제품을 불러오는 중입니다.</p>
        </main>
      </AppShell>
    )
  }

  if (catalogError && !forceEmpty) {
    return (
      <AppShell hideHeader>
        <main className="page--main-empty-product main-dashboard-state" role="alert">
          <div className="empty-product-brand">
            <img src={logo} alt="M·Carry" width={133} height={40} />
            <p>Carry the Moment, Share the Value</p>
          </div>
          <p>{catalogError.message || '등록 제품을 불러오지 못했습니다.'}</p>
          <button type="button" onClick={() => {
            setCatalogLoading(true)
            setCatalogError(null)
            setCatalogRequestVersion((version) => version + 1)
          }}>
            다시 시도
          </button>
        </main>
      </AppShell>
    )
  }

  if (!product || forceEmpty) {
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
          {catalog.map((item) => {
            return (
              <OverviewSlide
                key={item.id}
                product={item}
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

        <div className="main-dots" aria-label="제품 선택">
          {catalog.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === productIndex ? 'is-active' : ''}
              aria-label={`${item.alias} 선택`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
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
          onToggleMap={() => {
            setMapExpanded((expanded) => {
              const next = !expanded
              const params = new URLSearchParams(searchParams)
              if (next) params.set('map', 'expanded')
              else params.delete('map')
              setSearchParams(params, { replace: true })
              return next
            })
          }}
          isLoading={detailsLoading}
          error={detailsError}
          userId={profileId}
          onRetry={() => {
            setDetailsLoadedProductId(null)
            setDetailsFailure(null)
            setDetailsRequestVersion((version) => version + 1)
          }}
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
