import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ProductSelect } from '../../components/ProductSelect'
import { useProfile } from '../../context/ProfileContext'
import { cacheProductJourneys, getProductJourneys, mapProductJourney } from '../../api/journeys'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import chevronIcon from '../../assets/final/chevron.svg'
import { products } from '../../data/mock'

const SORT_DATE = 'date'
const SORT_COUNTRY = 'country'

export default function JourneyListPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useProfile()
  const forceEmpty = searchParams.get('empty') === '1'

  const product = products.find((p) => p.id === productId) ?? products[0]
  const [sort, setSort] = useState(SORT_DATE)
  const [countryOpen, setCountryOpen] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(!forceEmpty)
  const [error, setError] = useState(null)

  const countryLabel = sort === SORT_COUNTRY ? '국가순' : '날짜순'

  useEffect(() => {
    if (forceEmpty) {
      setList([])
      setTotal(0)
      setLoading(false)
      setError(null)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getProductJourneys(product.id, {
      userId: profile.id,
      sort,
      page: 0,
      size: 50,
    })
      .then((data) => {
        if (cancelled) return
        const rows = data?.journeys ?? []
        setTotal(data?.totalCount ?? rows.length)
        const mapped = rows.map((item) => mapProductJourney(item, product))
        setList(mapped)
        cacheProductJourneys(product.id, mapped)
      })
      .catch((err) => {
        if (cancelled) return
        setList([])
        setTotal(0)
        setError(err.message || '여정 목록을 불러오지 못했습니다')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [product, profile.id, sort, forceEmpty])

  const isEmpty = !loading && !error && list.length === 0

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

  return (
    <AppShell showBack>
      <div className={`page page--journeys${isEmpty ? ' page--journeys-empty' : ''}`}>
        <header className="journeys-head">
          <h1 className="journeys-head__title">MY JOURNEYS</h1>
          <p className="journeys-head__sub">총 {total}개의 여행 기록</p>
        </header>

        <ProductSelect
          products={products}
          value={product.id}
          onChange={onProductChange}
          variant={isEmpty ? 'outline' : 'gold'}
        />

        {loading ? (
          <p className="journeys-status">여정 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="journeys-status journeys-status--error">{error}</p>
        ) : isEmpty ? (
          <Link to="/journey/new" className="cta-dark cta-dark--journeys-empty">
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
              {list.map((journey) => (
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

            <Link to="/journey/new" className="btn-journeys-add">
              + 여정 기록하기
            </Link>
          </>
        )}
      </div>
    </AppShell>
  )
}
