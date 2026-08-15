import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import chevronsRight from '../../assets/final/chevrons-right.svg'
import { products } from '../../data/mock'

const PAGE_SIZE = 3
const SWIPE_THRESHOLD = 48

export default function ProductListPage() {
  const navigate = useNavigate()
  const [flipped, setFlipped] = useState(false)
  const [listPage, setListPage] = useState(0)
  const pointerStartX = useRef(null)
  const didSwipe = useRef(false)
  const pageRef = useRef(null)

  const product = products[0]

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const pageItems = useMemo(() => {
    const start = listPage * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [listPage])

  const goPrevPage = () => {
    if (pageCount <= 1) return
    setListPage((p) => (p - 1 + pageCount) % pageCount)
  }

  const goNextPage = () => {
    if (pageCount <= 1) return
    setListPage((p) => (p + 1) % pageCount)
  }

  const onPointerDown = (e) => {
    pointerStartX.current = e.clientX
    didSwipe.current = false
  }

  const onPointerUp = (e) => {
    if (pointerStartX.current == null) return
    const delta = e.clientX - pointerStartX.current
    pointerStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    didSwipe.current = true
    if (delta < 0) goNextPage()
    else goPrevPage()
  }

  const toggleFlip = (next) => {
    const scroller = pageRef.current?.closest('.phone-shell__body')
    const top = scroller?.scrollTop ?? 0
    setFlipped(next)
    // restore after paint + one more frame (focus/layout can fight us)
    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = top
      requestAnimationFrame(() => {
        if (scroller) scroller.scrollTop = top
      })
    })
  }

  const activeGenId = product.activeGenerationId ?? product.generations?.[0]?.id
  const journeyText = (product.journeyHeadline ?? '').replace(/^["“]|["”]$/g, '')

  return (
    <AppShell showBack onBack={() => navigate('/my')}>
      <div className="page page--my-products" ref={pageRef}>
        <div className="passport-scene">
          {!flipped ? (
            <div
              role="button"
              className="passport-card passport-card--front"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleFlip(true)}
              aria-label="패스포트 카드 뒤집기"
            >
              <img className="passport-card__stamp" src={product.stamp} alt="" width={188} height={189} />
              <p className="passport-card__eyebrow">DIGITAL PRODUCT PASSPORT</p>
              <p className="passport-card__serial">{product.serial}</p>
              <div className="passport-card__photo-wrap">
                <img
                  className="passport-card__photo"
                  src={product.image}
                  alt={product.name}
                  width={175}
                  height={190}
                />
              </div>
              <div className="passport-card__names">
                <span className="passport-card__alias">{product.alias}</span>
                <span className="passport-card__product">{product.name}</span>
              </div>
              <p className="passport-card__role">{product.role}</p>
              <div className="passport-card__info">
                <div className="passport-card__info-row">
                  <span>MCM 정품 인증 완료</span>
                  <span className="muted">{product.authenticityDate}</span>
                </div>
                <span>{product.material}</span>
                <span>{product.purchase}</span>
              </div>
            </div>
          ) : (
            <div
              role="button"
              className="passport-card passport-card--back"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleFlip(false)}
              aria-label="패스포트 앞면으로"
            >
              <img
                className="passport-card__stamp passport-card__stamp--back"
                src={product.stamp}
                alt=""
                width={188}
                height={189}
              />

              <p className="passport-back__journey">“{journeyText}”</p>

              <div className="passport-back__timeline" aria-label="소유 세대">
                <div className="passport-back__timeline-line" aria-hidden />
                <div
                  className="passport-back__timeline-nodes"
                  style={{ ['--gen-count']: String(Math.max(product.generations.length, 1)) }}
                >
                  {product.generations.map((g) => {
                    const active = g.id === activeGenId
                    return (
                      <div
                        key={g.id}
                        className={`passport-back__node${active ? ' is-active' : ''}`}
                      >
                        <span className="passport-back__node-owner">{g.label}</span>
                        <span className="passport-back__node-dot" />
                        <span className="passport-back__node-period">{g.period}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="passport-back__score-block">
                <div className="passport-back__score-row">
                  <p className="passport-back__score">
                    {product.overallScore}
                    <span> / 100</span>
                  </p>
                  <span className="passport-back__badge">{product.verifiedPct} % 검증</span>
                </div>

                <div className="passport-back__metrics">
                  <div className="passport-back__metric">
                    <strong>{product.narrativeScore}</strong>
                    <span>서사점수</span>
                  </div>
                  <div className="passport-back__metric">
                    <strong>{product.conditionScore}</strong>
                    <span>상태점수</span>
                  </div>
                  <div className="passport-back__metric">
                    <strong>{product.careMetric}</strong>
                    <span>케어점수</span>
                  </div>
                </div>
              </div>

              <div className="passport-back__panels">
                <div className="passport-back__panel-group">
                  <p className="passport-back__panel-label">편지</p>
                  <div className="passport-back__panel">
                    <p className="passport-back__panel-text">
                      {product.letterPreview || '안녕하세요. 계승 편지 입니다.'}
                    </p>
                  </div>
                </div>
                <div className="passport-back__panel-group">
                  <p className="passport-back__panel-label">케어 Tip</p>
                  <div className="passport-back__panel">
                    <p className="passport-back__panel-text">
                      {product.careTip || '가죽은 비오는 날에 주의해야 해요.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="my-product-carousel"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className="my-product-list">
            {pageItems.map((item, idx) => {
              const owned = listPage === 0 && idx === 0
              if (owned) {
                return (
                  <Link
                    key={item.id}
                    to={`/my/products/${item.id}`}
                    className="product-row product-row--owned"
                    onClick={(e) => {
                      if (didSwipe.current) {
                        e.preventDefault()
                        didSwipe.current = false
                      }
                    }}
                  >
                    <div className="product-row__thumb">
                      <img src={item.thumb} alt="" width={70} height={70} />
                    </div>
                    <div className="product-row__copy">
                      <p className="product-row__alias">{item.alias}</p>
                      <p className="product-row__name">{item.shortName}</p>
                    </div>
                    <span className="badge">소유중</span>
                    <img className="product-row__go" src={chevronsRight} alt="" width={24} height={24} />
                  </Link>
                )
              }

              return (
                <div key={item.id} className="product-row product-row--linked">
                  <div className="product-row__thumb product-row__thumb--bag">
                    <img src={item.image} alt="" width={66} height={80} />
                  </div>
                  <div className="product-row__copy">
                    <p className="product-row__alias">{item.alias}</p>
                    <p className="product-row__name">{item.shortName}</p>
                  </div>
                  <span className="badge">이어짐</span>
                </div>
              )
            })}
          </div>
        </div>

        {pageCount > 1 ? (
          <div className="list-pager" aria-label="제품 목록 페이지">
            {Array.from({ length: pageCount }, (_, i) =>
              i === listPage ? (
                <span key={i} className="list-pager__pill" />
              ) : (
                <button
                  key={i}
                  type="button"
                  className="list-pager__dot"
                  aria-label={`${i + 1}페이지`}
                  onClick={() => setListPage(i)}
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
