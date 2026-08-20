import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { EmptyProductState } from '../../components/EmptyProductState'
import { ProductSelect } from '../../components/ProductSelect'
import { useProfile } from '../../context/ProfileContext'
import { isNotFoundError, sameProductId } from '../../api/client'
import { cacheProductJourneys, getProductJourneys, mapProductJourney } from '../../api/journeys'
import { getUserProducts, mapUserProduct } from '../../api/products'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import chevronIcon from '../../assets/final/chevron.svg'
import { products as mockProducts } from '../../data/mock'

const SORT_DATE = 'date'
const SORT_COUNTRY = 'country'

export default function JourneyListPage() {
  const { productId: routeProductId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useProfile()
  const forceEmpty = searchParams.get('empty') === '1'

  const [apiProducts, setApiProducts] = useState([])
  const [productsError, setProductsError] = useState(null)
  const [productsLoadedKey, setProductsLoadedKey] = useState(null)

  const [sort, setSort] = useState(SORT_DATE)
  const [countryOpen, setCountryOpen] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const productsKey = `products:${profile.id}`
  const productsLoading = forceEmpty ? false : productsLoadedKey !== productsKey

  useEffect(() => {
    if (forceEmpty) return undefined

    let cancelled = false

    getUserProducts(profile.id)
      .then((data) => {
        if (cancelled) return
        const rows = data?.products ?? []
        setApiProducts(rows.map((item) => mapUserProduct(item)))
        setProductsError(null)
        setProductsLoadedKey(productsKey)
      })
      .catch((err) => {
        if (cancelled) return
        if (isNotFoundError(err)) {
          setApiProducts([])
          setProductsError(null)
        } else {
          setApiProducts([])
          setProductsError(err)
        }
        setProductsLoadedKey(productsKey)
      })

    return () => {
      cancelled = true
    }
  }, [profile.id, forceEmpty, productsKey])

  const catalog = useMemo(() => {
    if (forceEmpty) return mockProducts
    return apiProducts
  }, [forceEmpty, apiProducts])

  const hasNoProducts =
    !forceEmpty && !productsLoading && !productsError && apiProducts.length === 0

  const product = useMemo(
    () => catalog.find((p) => sameProductId(p.id, routeProductId)) ?? catalog[0],
    [catalog, routeProductId],
  )
  const fetchKey = `${product?.id ?? 'none'}:${profile.id}:${sort}`
  const countryLabel = sort === SORT_COUNTRY ? '국가순' : '날짜순'

  useEffect(() => {
    if (forceEmpty) return undefined
    if (productsLoading || productsError || hasNoProducts || !product) return undefined

    let cancelled = false

    getProductJourneys(product.id, {
      userId: profile.id,
      sort,
      page: 0,
      size: 50,
    })
      .then((data) => {
        if (cancelled) return
        const rows = data?.journeys ?? []
        // 현재 키퍼(소유중)가 등록한 여정만 표시 — 타 세대/양도 기록 제외
        const mapped = rows
          .filter((item) => (item.ownershipStatus || 'owning') === 'owning')
          .map((item) => mapProductJourney(item, product))
        setTotal(mapped.length)
        setList(mapped)
        cacheProductJourneys(product.id, mapped)
        setError(null)
        setLoadedKey(fetchKey)
      })
      .catch((err) => {
        if (cancelled) return
        setList([])
        setTotal(0)
        if (isNotFoundError(err)) {
          setError(null)
        } else {
          setError(err.message || '여정 목록을 불러오지 못했습니다')
        }
        setLoadedKey(fetchKey)
      })

    return () => {
      cancelled = true
    }
  }, [
    product,
    profile.id,
    sort,
    forceEmpty,
    fetchKey,
    productsLoading,
    productsError,
    hasNoProducts,
  ])

  const displayList = forceEmpty ? [] : list
  const displayTotal = forceEmpty ? 0 : total
  const displayLoading =
    !forceEmpty &&
    !productsError &&
    !hasNoProducts &&
    (productsLoading || loadedKey !== fetchKey)
  const displayError = forceEmpty
    ? null
    : productsError
      ? productsError.message || '제품 목록을 불러오지 못했습니다'
      : error

  const isEmpty = !displayLoading && !displayError && displayList.length === 0

  const newJourneyPath = product
    ? `/journey/new?productId=${encodeURIComponent(product.id)}`
    : '/journey/new'

  const onProductChange = (id) => {
    navigate(`/journey/records/${id}${forceEmpty ? '?empty=1' : ''}`)
  }

  const badgeLabel = (status) => {
    if (status === 'transferred') return '양도됨'
    if (status === 'linked') return '이어짐'
    return '소유중'
  }

  const sortOptions = useMemo(
    () => [
      { id: SORT_DATE, label: '날짜순' },
      { id: SORT_COUNTRY, label: '국가순' },
    ],
    [],
  )

  if (hasNoProducts) {
    return (
      <AppShell hideHeader>
        <EmptyProductState />
      </AppShell>
    )
  }

  return (
    <AppShell showBack onBack={() => navigate('/journey')}>
      <div className={`page page--journeys${isEmpty ? ' page--journeys-empty' : ''}`}>
        <header className="journeys-head">
          <h1 className="journeys-head__title">MY JOURNEYS</h1>
          <p className="journeys-head__sub">총 {displayTotal}개의 여행 기록</p>
        </header>

        <ProductSelect
          products={catalog}
          value={product?.id}
          onChange={onProductChange}
          variant={isEmpty ? 'outline' : 'gold'}
        />

        {displayLoading ? (
          <p className="journeys-status">여정 목록을 불러오는 중...</p>
        ) : displayError ? (
          <p className="journeys-status journeys-status--error">{displayError}</p>
        ) : isEmpty ? (
          <Link to={newJourneyPath} className="cta-dark cta-dark--journeys-empty">
            <span className="cta-dark__copy">
              <span className="cta-dark__sub">아직 기록된 여정이 없으신가요?</span>
              <span className="cta-dark__title">여정 등록하러 가기</span>
            </span>
            <img className="cta-dark__arrow" src={ctaArrow} alt="" width={50} height={50} />
          </Link>
        ) : (
          <>
            <div className="journey-filter">
              <button
                type="button"
                className="journey-filter__chip"
                onClick={() => setCountryOpen((v) => !v)}
                aria-expanded={countryOpen}
              >
                <span>{countryLabel}</span>
                <img src={chevronIcon} alt="" width={14} height={14} />
              </button>
              {countryOpen ? (
                <div className="journey-filter__menu" role="listbox">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={opt.id === sort ? 'is-active' : ''}
                      onClick={() => {
                        setSort(opt.id)
                        setCountryOpen(false)
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="journey-list">
              {displayList.map((journey) => (
                <Link
                  key={journey.id}
                  to={`/journey/entry/${journey.id}?productId=${encodeURIComponent(product.id)}`}
                  className={`journey-card${
                    journey.status === 'owned' ? ' journey-card--owned' : ' journey-card--linked'
                  }`}
                >
                  <div className="journey-card__thumb">
                    <img src={journey.image} alt="" width={70} height={70} />
                  </div>
                  <div className="journey-card__body">
                    <div className="journey-card__title">
                      <span className="journey-card__alias">{journey.alias}</span>
                      <span className="journey-card__name">
                        {journey.productNameEn ?? 'MCM STARK BACKPACK'}
                      </span>
                    </div>
                    <p className="journey-card__quote">{journey.quote}</p>
                  </div>
                  <span
                    className={`journey-card__badge${
                      journey.status === 'owned' ? ' is-owned' : ' is-linked'
                    }`}
                  >
                    {badgeLabel(journey.status)}
                  </span>
                </Link>
              ))}
            </div>

            <Link to={newJourneyPath} className="btn-journeys-add">
              + 여정 기록하기
            </Link>
          </>
        )}
      </div>
    </AppShell>
  )
}
