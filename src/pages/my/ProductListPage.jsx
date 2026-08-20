import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { EmptyProductState } from '../../components/EmptyProductState'
import { useProfile } from '../../context/ProfileContext'
import { createCareTip, cacheLocalCareTip } from '../../api/my'
import {
  buildKeeperGenerations,
  getDigitalPassport,
  getGenerationLetter,
  getProductLineage,
  getProductSummary,
  getUserProducts,
  mapDigitalPassport,
  mapGenerationLetter,
  mapLineageGeneration,
  mapProductSummary,
  mapUserProduct,
  ownershipBadge,
} from '../../api/products'
import chevronsRight from '../../assets/final/chevrons-right.svg'
import stampImg from '../../assets/final/stamp.png'
import bagFallback from '../../assets/final/bag-1.png'

const PAGE_SIZE = 3
const SWIPE_THRESHOLD = 48

function formatAuthDate(value) {
  if (!value) return ''
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10).replace(/-/g, '.')
  }
  return raw
}

function provenanceLabel(summary) {
  if (!summary) return '—'
  // 요약바 API의 provenanceScore를 우선 표시
  if (summary.provenanceScore != null && Number.isFinite(Number(summary.provenanceScore))) {
    return String(summary.provenanceScore)
  }
  if (summary.provenanceStatus === 'calculating') return '산출 중'
  if (summary.provenanceStatus === 'insufficient') return '미산출'
  return '—'
}

function provenanceBadge(summary) {
  if (!summary) return '요약'
  if (summary.provenanceScore != null && Number.isFinite(Number(summary.provenanceScore))) {
    return '프로비넌스'
  }
  if (summary.provenanceStatus === 'calculating') return '산출 중'
  if (summary.provenanceStatus === 'insufficient') return '미산출'
  if (summary.provenanceStatus === 'calculated') return '프로비넌스'
  return '요약'
}

function hasProvenanceScore(summary) {
  return summary?.provenanceScore != null && Number.isFinite(Number(summary.provenanceScore))
}

export default function ProductListPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [flipped, setFlipped] = useState(false)
  const [listPage, setListPage] = useState(0)
  const [careDraft, setCareDraft] = useState('')
  const [careTipText, setCareTipText] = useState('')
  const [careSaving, setCareSaving] = useState(false)
  const [careError, setCareError] = useState('')
  const [careEditing, setCareEditing] = useState(false)
  const [catalog, setCatalog] = useState([])
  const [passport, setPassport] = useState(null)
  const [summary, setSummary] = useState(null)
  const [lineage, setLineage] = useState([])
  const [letter, setLetter] = useState(null)
  const [listError, setListError] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [listLoadedKey, setListLoadedKey] = useState(null)
  const [detailLoadedKey, setDetailLoadedKey] = useState(null)
  const pointerStartX = useRef(null)
  const didSwipe = useRef(false)
  const pageRef = useRef(null)

  const listKey = `products:${profile.id}:all`
  const listLoading = listLoadedKey !== listKey
  // 여권/케어팁은 현재 소유 제품을 우선 표시
  const featured =
    catalog.find((p) => p.ownershipStatus === 'owning') ?? catalog[0] ?? null
  const detailKey = featured ? `detail:${featured.id}` : null
  const canWriteCareTip = featured?.ownershipStatus === 'owning'

  useEffect(() => {
    if (!canWriteCareTip && careEditing) setCareEditing(false)
  }, [canWriteCareTip, careEditing])

  useEffect(() => {
    let cancelled = false
    getUserProducts(profile.id, { status: 'all' })
      .then((data) => {
        if (cancelled) return
        const rows = (data?.products ?? []).map(mapUserProduct)
        setCatalog(rows)
        setListError(null)
        setListPage(0)
        setListLoadedKey(listKey)
      })
      .catch((err) => {
        if (cancelled) return
        setCatalog([])
        setListError(err.message || '제품 목록을 불러오지 못했습니다')
        setListLoadedKey(listKey)
      })
    return () => {
      cancelled = true
    }
  }, [profile.id, listKey])

  useEffect(() => {
    if (!featured) return undefined

    let cancelled = false
    const productId = featured.id
    Promise.all([
      getDigitalPassport(productId),
      getProductSummary(productId),
      getProductLineage(productId),
    ])
      .then(async ([passportData, summaryData, lineageData]) => {
        if (cancelled) return
        const gens = (lineageData?.generations ?? []).map(mapLineageGeneration)
        setPassport(mapDigitalPassport(passportData))
        setSummary(mapProductSummary(summaryData))
        setLineage(gens)
        setDetailError(null)
        setCareTipText('')
        setCareEditing(false)

        const letterTarget =
          gens.find((g) => g.active && g.hasOpenedLetter) ||
          gens.find((g) => g.hasOpenedLetter) ||
          null
        if (letterTarget) {
          try {
            const letterData = await getGenerationLetter(productId, letterTarget.generation)
            if (!cancelled) setLetter(mapGenerationLetter(letterData))
          } catch {
            if (!cancelled) setLetter(null)
          }
        } else if (featured.inheritanceLetter?.content) {
          setLetter({
            content: featured.inheritanceLetter.content,
            fromKeeperLabel: featured.inheritanceLetter.fromKeeperLabel,
            letterId: featured.inheritanceLetter.letterId,
            openedAt: featured.inheritanceLetter.openedAt,
          })
        } else {
          setLetter(null)
        }

        if (!cancelled) setDetailLoadedKey(`detail:${productId}`)
      })
      .catch((err) => {
        if (cancelled) return
        setPassport(null)
        setSummary(null)
        setLineage([])
        setLetter(null)
        setDetailError(err.message || '디지털 여권을 불러오지 못했습니다')
        setDetailLoadedKey(`detail:${productId}`)
      })

    return () => {
      cancelled = true
    }
  }, [featured])

  const activePassport =
    featured && passport && String(passport.id) === String(featured.id) ? passport : null
  const activeSummary =
    featured && summary && String(summary.id) === String(featured.id) ? summary : null
  const detailLoading = Boolean(featured) && detailLoadedKey !== detailKey

  const pageCount = Math.max(1, Math.ceil(catalog.length / PAGE_SIZE))
  const pageItems = useMemo(() => {
    const start = listPage * PAGE_SIZE
    return catalog.slice(start, start + PAGE_SIZE)
  }, [catalog, listPage])

  const generations = useMemo(() => {
    if (lineage.length > 0 && featured && detailLoadedKey === detailKey) return lineage
    return buildKeeperGenerations(
      activeSummary?.keeperCount ?? activePassport?.currentGeneration ?? featured?.generation ?? 1,
      featured?.generation ?? activePassport?.currentGeneration ?? 1,
    )
  }, [lineage, featured, detailLoadedKey, detailKey, activeSummary, activePassport])

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
    if (!next) setCareEditing(false)
    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = top
      requestAnimationFrame(() => {
        if (scroller) scroller.scrollTop = top
      })
    })
  }

  const stopPassportGesture = (e) => {
    e.stopPropagation()
  }

  const onPassportBackClick = (e) => {
    // 케어팁 작성 중이거나 입력 영역 클릭 시 뒤집기 금지
    if (careEditing) return
    const interactive = e.target.closest(
      'button, a, input, textarea, select, label, .passport-back__care-form, .passport-back__panel-group',
    )
    if (interactive) return
    toggleFlip(false)
  }

  const onPassportMouseDown = (e) => {
    const interactive = e.target.closest(
      'button, a, input, textarea, select, label, .passport-back__care-form',
    )
    if (interactive) return
    e.preventDefault()
  }

  const saveCareTip = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!featured) return
    if (featured.ownershipStatus !== 'owning') {
      setCareError('소유 중인 제품에서만 케어팁을 작성할 수 있습니다.')
      setCareEditing(false)
      return
    }
    const content = careDraft.trim()
    if (!content) {
      setCareError('케어팁 내용을 입력해 주세요.')
      return
    }
    setCareSaving(true)
    setCareError('')
    try {
      const data = await createCareTip(featured.id, {
        authorId: profile.id ?? 1,
        content,
      })
      const generation = String(
        featured.generation ??
          activePassport?.currentGeneration ??
          lineage.find((g) => g.active)?.generation ??
          1,
      )
      cacheLocalCareTip(featured.id, {
        id: data?.careTipId != null ? `tip-${data.careTipId}` : `tip-${Date.now()}`,
        generation,
        date: (() => {
          const d = data?.createdAt ? new Date(data.createdAt) : new Date()
          if (Number.isNaN(d.getTime())) return ''
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}.${m}.${day}`
        })(),
        title: content.length > 18 ? `${content.slice(0, 18)}…` : content,
        short: content.length > 18 ? `${content.slice(0, 18)}…` : content,
        result: content,
        solution: '',
        keeper:
          lineage.find((g) => String(g.generation) === generation)?.label ||
          `${generation} Keeper`,
      })
      setCareTipText(content)
      setCareDraft('')
      setCareEditing(false)
    } catch (err) {
      setCareError(err.message || '케어팁 저장에 실패했습니다.')
    } finally {
      setCareSaving(false)
    }
  }

  if (!listLoading && !listError && catalog.length === 0) {
    return (
      <AppShell hideHeader>
        <EmptyProductState />
      </AppShell>
    )
  }

  const cardAlias = activePassport?.alias || featured?.alias || ''
  const cardName = activePassport?.name || featured?.name || ''
  const cardImage = activePassport?.image || featured?.image || bagFallback
  const cardSerial = activePassport?.serial || featured?.serial || ''
  const authDate = formatAuthDate(activePassport?.authenticatedAt)
  const roleLabel = (() => {
    const n = featured?.generation ?? activePassport?.currentGeneration ?? 1
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
    return `${n}${suffix} Keeper`
  })()
  const journeyHeadline = activeSummary
    ? `여정 ${activeSummary.journeyCount} · ${activeSummary.keeperCount}세대`
    : featured
      ? `여정 ${featured.journeyCount}`
      : ''
  const scoreMain = provenanceLabel(activeSummary)
  const letterPreview =
    letter?.content ||
    featured?.inheritanceLetter?.content ||
    '조회 가능한 계승 편지가 없습니다.'
  const displayedCareTip = careTipText || '가죽은 비오는 날에 주의해야 해요.'

  return (
    <AppShell showBack onBack={() => navigate('/my')}>
      <div className="page page--my-products" ref={pageRef}>
        {listLoading ? (
          <p className="journeys-status">제품 목록을 불러오는 중...</p>
        ) : listError ? (
          <p className="journeys-status journeys-status--error">{listError}</p>
        ) : (
          <>
            {detailLoading ? (
              <p className="journeys-status">디지털 여권을 불러오는 중...</p>
            ) : detailError ? (
              <p className="journeys-status journeys-status--error">{detailError}</p>
            ) : null}

            <div className="passport-scene">
              {!flipped ? (
                <div
                  role="button"
                  className="passport-card passport-card--front"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleFlip(true)}
                  aria-label="패스포트 카드 뒤집기"
                >
                  <img className="passport-card__stamp" src={stampImg} alt="" width={188} height={189} />
                  <p className="passport-card__eyebrow">DIGITAL PRODUCT PASSPORT</p>
                  <p className="passport-card__serial">{cardSerial}</p>
                  <div className="passport-card__photo-wrap">
                    <img
                      className="passport-card__photo"
                      src={cardImage}
                      alt={cardName}
                      width={175}
                      height={190}
                      onError={(e) => {
                        e.currentTarget.src = bagFallback
                      }}
                    />
                  </div>
                  <div className="passport-card__names">
                    <span className="passport-card__alias">{cardAlias}</span>
                    <span className="passport-card__product">{cardName}</span>
                  </div>
                  <p className="passport-card__role">{roleLabel}</p>
                  <div className="passport-card__info">
                    <div className="passport-card__info-row">
                      <span>
                        {activePassport?.isAuthenticated === false
                          ? '정품 인증 대기'
                          : 'MCM 정품 인증 완료'}
                      </span>
                      {authDate ? <span className="muted">{authDate}</span> : null}
                    </div>
                    {activePassport?.material ? <span>{activePassport.material}</span> : null}
                    {activePassport?.purchase ? <span>{activePassport.purchase}</span> : null}
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  className="passport-card passport-card--back"
                  onMouseDown={onPassportMouseDown}
                  onClick={onPassportBackClick}
                  aria-label="패스포트 앞면으로"
                >
                  <img
                    className="passport-card__stamp passport-card__stamp--back"
                    src={stampImg}
                    alt=""
                    width={188}
                    height={189}
                  />

                  <p className="passport-back__journey">“{journeyHeadline}”</p>

                  <div className="passport-back__timeline" aria-label="소유 세대">
                    <div className="passport-back__timeline-line" aria-hidden />
                    <div
                      className="passport-back__timeline-nodes"
                      style={{ ['--gen-count']: String(Math.max(generations.length, 1)) }}
                    >
                      {generations.map((g) => (
                        <div
                          key={g.id}
                          className={`passport-back__node${g.active ? ' is-active' : ''}`}
                        >
                          <span className="passport-back__node-owner">{g.label}</span>
                          <span className="passport-back__node-dot" />
                          <span className="passport-back__node-period">{g.period}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="passport-back__score-block">
                    <div className="passport-back__score-row">
                      <p className="passport-back__score">
                        {scoreMain}
                        {hasProvenanceScore(activeSummary) ? <span> / 100</span> : null}
                      </p>
                      <span className="passport-back__badge">{provenanceBadge(activeSummary)}</span>
                    </div>

                    <div className="passport-back__metrics">
                      <div className="passport-back__metric">
                        <strong>{activeSummary?.journeyCount ?? featured?.journeyCount ?? 0}</strong>
                        <span>여정 수</span>
                      </div>
                      <div className="passport-back__metric">
                        <strong>{activeSummary?.keeperCount ?? generations.length}</strong>
                        <span>Keeper</span>
                      </div>
                      <div className="passport-back__metric">
                        <strong>
                          {hasProvenanceScore(activeSummary)
                            ? String(activeSummary.provenanceScore)
                            : scoreMain}
                        </strong>
                        <span>프로비넌스 스코어</span>
                      </div>
                    </div>
                  </div>

                  <div className="passport-back__panels">
                    <div className="passport-back__panel-group">
                      <p className="passport-back__panel-label">편지</p>
                      <div className="passport-back__panel">
                        <p className="passport-back__panel-text">{letterPreview}</p>
                      </div>
                    </div>
                    <div
                      className="passport-back__panel-group"
                      onClick={stopPassportGesture}
                      onMouseDown={stopPassportGesture}
                      onPointerDown={stopPassportGesture}
                      onKeyDown={stopPassportGesture}
                    >
                      <div className="passport-back__panel-head">
                        <p className="passport-back__panel-label">케어 Tip</p>
                        {canWriteCareTip ? (
                          <button
                            type="button"
                            className="passport-back__panel-edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCareEditing((v) => !v)
                              setCareError('')
                              setCareDraft(careTipText || '')
                            }}
                          >
                            {careEditing ? '취소' : '작성'}
                          </button>
                        ) : null}
                      </div>
                      {canWriteCareTip && careEditing ? (
                        <form
                          className="passport-back__care-form"
                          onSubmit={saveCareTip}
                          onClick={stopPassportGesture}
                          onMouseDown={stopPassportGesture}
                        >
                          <textarea
                            value={careDraft}
                            maxLength={500}
                            rows={3}
                            placeholder="다음 주인에게 전할 케어팁을 남겨주세요."
                            onChange={(e) => {
                              setCareDraft(e.target.value)
                              if (careError) setCareError('')
                            }}
                            onClick={stopPassportGesture}
                            onMouseDown={stopPassportGesture}
                          />
                          <div className="passport-back__care-actions">
                            <span>{careDraft.length}/500</span>
                            <button type="submit" disabled={careSaving || !careDraft.trim()}>
                              {careSaving ? '저장 중…' : '저장'}
                            </button>
                          </div>
                          {careError ? <p className="passport-back__care-error">{careError}</p> : null}
                        </form>
                      ) : (
                        <div className="passport-back__panel">
                          <p className="passport-back__panel-text">{displayedCareTip}</p>
                        </div>
                      )}
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
                {pageItems.map((item) => {
                  const owned = item.ownershipStatus === 'owning'
                  return (
                    <Link
                      key={item.id}
                      to={`/my/products/${item.id}`}
                      className={`product-row${owned ? ' product-row--owned' : ' product-row--linked'}`}
                      onClick={(e) => {
                        if (didSwipe.current) {
                          e.preventDefault()
                          didSwipe.current = false
                        }
                      }}
                    >
                      <div className={`product-row__thumb${owned ? '' : ' product-row__thumb--bag'}`}>
                        <img
                          src={item.thumb || item.image || bagFallback}
                          alt=""
                          width={owned ? 70 : 66}
                          height={owned ? 70 : 80}
                          onError={(e) => {
                            e.currentTarget.src = bagFallback
                          }}
                        />
                      </div>
                      <div className="product-row__copy">
                        <p className="product-row__alias">{item.alias}</p>
                        <p className="product-row__name">{item.shortName || item.name}</p>
                      </div>
                      <span className="badge">{ownershipBadge(item.ownershipStatus)}</span>
                      {owned ? (
                        <img className="product-row__go" src={chevronsRight} alt="" width={24} height={24} />
                      ) : null}
                    </Link>
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
          </>
        )}
      </div>
    </AppShell>
  )
}
