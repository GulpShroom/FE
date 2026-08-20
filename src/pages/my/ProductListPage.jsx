import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { EmptyProductState } from '../../components/EmptyProductState'
import { useProfile } from '../../context/ProfileContext'
import { isNotFoundError } from '../../api/client'
import { createCareTip, cacheLocalCareTip, getCareTips, getLocalCareTips, mapCareTip, pickPassportCareTip, pickPreferredCareTip } from '../../api/my'
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

/** 동일 productId가 owning/transferred로 중복될 때 소유중을 우선 */
function ownershipRank(status) {
  if (status === 'owning') return 0
  if (status === 'linked') return 1
  return 2
}

function preferOwningProduct(matches) {
  if (!matches?.length) return null
  return [...matches].sort(
    (a, b) => ownershipRank(a.ownershipStatus) - ownershipRank(b.ownershipStatus),
  )[0]
}

function dedupeProductsPreferOwning(rows) {
  const byId = new Map()
  for (const item of rows) {
    const key = String(item.id)
    const prev = byId.get(key)
    if (!prev || ownershipRank(item.ownershipStatus) < ownershipRank(prev.ownershipStatus)) {
      byId.set(key, item)
    }
  }
  return [...byId.values()]
}

function letterFromInheritance(inheritanceLetter) {
  if (!inheritanceLetter?.content) return null
  return {
    content: inheritanceLetter.content,
    fromKeeperLabel: inheritanceLetter.fromKeeperLabel,
    letterId: inheritanceLetter.letterId,
    openedAt: inheritanceLetter.openedAt,
  }
}

/** 계승(리셀 구매) 후 패스포트 뒷면에 보여줄 편지 세대 후보 */
function letterGenerationCandidates(gens, currentGeneration) {
  const current = Number(currentGeneration)
  const openedDesc = [...(gens ?? [])]
    .filter((g) => g.hasOpenedLetter && g.generation != null)
    .sort((a, b) => Number(b.generation) - Number(a.generation))
    .map((g) => Number(g.generation))

  return [
    Number.isFinite(current) && current > 1 ? current - 1 : null,
    ...openedDesc,
  ].filter((value, index, arr) => value != null && value > 0 && arr.indexOf(value) === index)
}

async function resolvePassportLetter({ productId, inheritanceLetter, gens, currentGeneration }) {
  const inherited = letterFromInheritance(inheritanceLetter)
  if (inherited) return inherited

  for (const gen of letterGenerationCandidates(gens, currentGeneration)) {
    try {
      const letterData = await getGenerationLetter(productId, gen)
      const mapped = mapGenerationLetter(letterData)
      if (mapped.content?.trim()) return mapped
    } catch (error) {
      if (!isNotFoundError(error)) break
    }
  }

  return null
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
  const [selectedId, setSelectedId] = useState(null)
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
  const featured = useMemo(() => {
    if (!catalog.length) return null
    if (selectedId != null) {
      const matches = catalog.filter((p) => String(p.id) === String(selectedId))
      const selected = preferOwningProduct(matches)
      if (selected) return selected
    }
    return catalog.find((p) => p.ownershipStatus === 'owning') ?? catalog[0] ?? null
  }, [catalog, selectedId])
  const detailKey = featured ? `detail:${featured.id}` : null
  const canEditCareTip = Boolean(featured)

  useEffect(() => {
    if (!featured && careEditing) setCareEditing(false)
  }, [featured, careEditing])

  useEffect(() => {
    let cancelled = false
    getUserProducts(profile.id, { status: 'all' })
      .then((data) => {
        if (cancelled) return
        const rows = dedupeProductsPreferOwning((data?.products ?? []).map(mapUserProduct))
        setCatalog(rows)
        setSelectedId((prev) => {
          if (prev != null && rows.some((p) => String(p.id) === String(prev))) return prev
          const initial = rows.find((p) => p.ownershipStatus === 'owning') ?? rows[0]
          return initial ? String(initial.id) : null
        })
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
    const generationHint =
      featured.generation ?? featured.currentGeneration ?? null

    Promise.all([
      getDigitalPassport(productId),
      getProductSummary(productId),
      getProductLineage(productId),
    ])
      .then(async ([passportData, summaryData, lineageData]) => {
        if (cancelled) return
        const mappedPassport = mapDigitalPassport(passportData)
        const gens = (lineageData?.generations ?? []).map(mapLineageGeneration)
        setPassport(mappedPassport)
        setSummary(mapProductSummary(summaryData))
        setLineage(gens)
        setDetailError(null)
        setCareEditing(false)

        const generation =
          generationHint ??
          mappedPassport.currentGeneration ??
          gens.find((g) => g.active)?.generation ??
          1

        // 케어팁은 여권과 분리 조회 — 실패해도 여권은 유지, 로컬 캐시로 복구
        // 현재 세대 팁이 없으면 직전 세대(리셀 판매자) 팁을 패스포트 뒷면에 표시
        try {
          const careTipsData = await getCareTips(productId)
          if (cancelled) return
          const remoteTips = (careTipsData?.careTips ?? []).map(mapCareTip)
          const localTips = getLocalCareTips(productId).map(mapCareTip)
          const tips = remoteTips.length ? remoteTips : localTips
          const preferred = pickPassportCareTip(tips, generation)
          setCareTipText(preferred?.content || '')
        } catch {
          if (cancelled) return
          const localTips = getLocalCareTips(productId).map(mapCareTip)
          const preferred = pickPassportCareTip(localTips, generation)
          setCareTipText(preferred?.content || '')
        }

        const resolvedLetter = await resolvePassportLetter({
          productId,
          inheritanceLetter: featured.inheritanceLetter,
          gens,
          currentGeneration: generation,
        })
        if (!cancelled) setLetter(resolvedLetter)

        if (!cancelled) setDetailLoadedKey(`detail:${productId}`)
      })
      .catch((err) => {
        if (cancelled) return
        setPassport(null)
        setSummary(null)
        setLineage([])
        setLetter(null)
        // 여권 로드 실패 시에도 로컬 케어팁은 유지 시도
        const localTips = getLocalCareTips(productId).map(mapCareTip)
        const preferred = pickPassportCareTip(localTips, generationHint)
        setCareTipText(preferred?.content || '')
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
        careTipId: data?.careTipId,
        generation,
        content,
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

      // 저장 후 목록 재조회로 최신 팁 확정 (다른 제품 갔다 와도 유지)
      try {
        const careTipsData = await getCareTips(featured.id)
        const tips = (careTipsData?.careTips ?? []).map(mapCareTip)
        const preferred = pickPreferredCareTip(tips, generation)
        setCareTipText(preferred?.content || content)
      } catch {
        setCareTipText(content)
      }
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
  const displayedCareTip = careTipText || '아직 작성된 케어팁이 없습니다.'
  const careEditLabel = careTipText ? '수정' : '작성'

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
                        {canEditCareTip ? (
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
                            {careEditing ? '취소' : careEditLabel}
                          </button>
                        ) : null}
                      </div>
                      {canEditCareTip && careEditing ? (
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
                  const selected = featured && String(featured.id) === String(item.id)
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className={`product-row${owned ? ' product-row--owned' : ' product-row--linked'}${selected ? ' is-selected' : ''}`}
                      onClick={() => {
                        if (didSwipe.current) {
                          didSwipe.current = false
                          return
                        }
                        setSelectedId(String(item.id))
                        setFlipped(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedId(String(item.id))
                          setFlipped(false)
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
                        <Link
                          to={`/my/products/${item.id}`}
                          className="product-row__go-link"
                          aria-label={`${item.alias} 상세 이력`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img className="product-row__go" src={chevronsRight} alt="" width={24} height={24} />
                        </Link>
                      ) : null}
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
          </>
        )}
      </div>
    </AppShell>
  )
}
