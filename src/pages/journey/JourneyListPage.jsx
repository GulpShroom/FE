import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ProductSelect } from '../../components/ProductSelect'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import chevronIcon from '../../assets/final/chevron.svg'
import { journeys, mapCountries, products } from '../../data/mock'

export default function JourneyListPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const forceEmpty = searchParams.get('empty') === '1'

  const product = products.find((p) => p.id === productId) ?? products[0]
  const list = useMemo(() => {
    if (forceEmpty) return []
    return journeys.filter((j) => j.productId === product.id)
  }, [product.id, forceEmpty])

  const total = product.journeyCount ?? list.length
  const [countryId, setCountryId] = useState('kr')
  const [countryOpen, setCountryOpen] = useState(false)
  const countryLabel =
    mapCountries.find((c) => c.id === countryId)?.label ?? '한국'

  const onProductChange = (id) => {
    navigate(`/journey/records/${id}${forceEmpty ? '?empty=1' : ''}`)
  }

  const isEmpty = list.length === 0

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

        {isEmpty ? (
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
                  {mapCountries
                    .filter((c) => c.id !== 'all')
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={c.id === countryId ? 'is-active' : ''}
                        onClick={() => {
                          setCountryId(c.id)
                          setCountryOpen(false)
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                </div>
              ) : null}
            </div>

            <div className="journey-list">
              {list.map((journey) => (
                <Link
                  key={journey.id}
                  to={`/journey/entry/${journey.id}`}
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
                    {journey.status === 'owned' ? '소유중' : '이어짐'}
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
