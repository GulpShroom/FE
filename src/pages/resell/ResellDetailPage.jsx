import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import {
  deleteResell,
  getResellDetail,
  normalizeConditionGrade,
} from '../../api/resells'
import { clearResellLetterDraft, getResellLetterDraft } from '../../api/resellLetterDraft'
import { loadResellSharedContents, resolveOwnedProductId } from '../../api/resellContent'
import { completeTransfer, createTransferLetter, startTransfer } from '../../api/transfers'
import { useProfile } from '../../context/ProfileContext'
import previewImageIcon from '../../assets/final/resell-preview-image.svg'
import checkCircleIcon from '../../assets/final/resell-check-circle.svg'
import previewChevronIcon from '../../assets/final/resell-preview-chevron.svg'
import resellModalLogo from '../../assets/final/resell-delete-logo.png'
import planeIcon from '../../assets/final/progress-plane.png'

function formatSummary(detail) {
  const summary = detail?.summary
  if (!summary) return '여정 요약 정보가 없습니다.'
  return `${summary.generationCount ?? 0}명의 주인 / ${summary.cityCount ?? 0}개 도시 / ${summary.productAgeYears ?? 0}년 여정`
}

function verifyPct(detail) {
  const ratio = detail?.summary?.verifyRatio
  if (ratio == null || Number.isNaN(Number(ratio))) return 0
  const value = Number(ratio)
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

function photoSlots(detail) {
  const sorted = [...(detail?.photos ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )
  const slots = [null, null, null]
  sorted.slice(0, 3).forEach((photo, index) => {
    slots[index] = photo?.photoUrl || null
  })
  return slots
}

function conditionLabel(grade) {
  return `상태 ${normalizeConditionGrade(grade)}급`
}

export default function ResellDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useProfile()
  const userId = Number(profile.userId ?? profile.id)
  const hasUserId = Number.isFinite(userId) && userId > 0

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [buyOpen, setBuyOpen] = useState(false)
  const [letterOpen, setLetterOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [buying, setBuying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [purchaseComplete, setPurchaseComplete] = useState(false)
  const [transferContext, setTransferContext] = useState(null)
  const [productId, setProductId] = useState(null)
  const [letterContent, setLetterContent] = useState('')
  const [careTipContent, setCareTipContent] = useState('')

  const historyRole = location.state?.resellHistoryRole
  const isBuyerHistory = historyRole === 'buyer'
  const isAuthorHistory = historyRole === 'author'

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setLoadError('리셀글 ID가 없습니다.')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    getResellDetail(id, {
      userId: hasUserId ? userId : undefined,
    })
      .then(async (data) => {
        if (cancelled || !data) return
        setDetail(data)

        const canReadPrivate =
          Boolean(data.isAuthor) || historyRole === 'author' || historyRole === 'buyer'
        if (!canReadPrivate) {
          setProductId(null)
          setLetterContent('')
          setCareTipContent('')
          return
        }

        const resolvedProductId = await resolveOwnedProductId({
          userId: hasUserId ? userId : undefined,
          officialName: data.officialName,
        })
        if (cancelled) return
        setProductId(resolvedProductId)

        const shared = await loadResellSharedContents({
          productId: resolvedProductId,
          generation: data.summary?.generationCount,
          wantLetter: Boolean(data.lockedJourney?.hasLetter),
          wantCareTip: Boolean(data.lockedJourney?.hasCareTip),
        })
        if (cancelled) return
        setLetterContent(shared.letter || '')
        setCareTipContent(shared.careTip || '')
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || '리셀글 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, userId, hasUserId, historyRole])

  const isAuthor = Boolean(detail?.isAuthor || isAuthorHistory)
  const isSold = detail?.postStatus && detail.postStatus !== 'active'
  const purchased = Boolean(isBuyerHistory || purchaseComplete || (isSold && !isAuthor))
  const photos = photoSlots(detail)
  const displayPrice = detail
    ? `${Number(detail.price || 0).toLocaleString('ko-KR')}원`
    : '—'
  const canBuy = !isAuthor && !purchased && detail?.postStatus === 'active'
  const canViewPrivateContent = Boolean(isAuthor || purchased || isBuyerHistory)
  const hasLetter = Boolean(detail?.lockedJourney?.hasLetter)
  const hasCareTip = Boolean(detail?.lockedJourney?.hasCareTip)
  const hasSelectedTags = Boolean(detail?.lockedJourney?.hasSelectedTags)

  const confirmBuy = async () => {
    if (!hasUserId || !id || buying) return false
    setBuying(true)
    setActionError(null)
    try {
      const started = await startTransfer({
        resellId: Number(id),
        buyerId: userId,
      })

      // 판매자가 리셀 등록 시 작성한 편지를 계승 transfer에 봉인 → complete 시 구매자에게 개봉
      const sellerLetter = getResellLetterDraft(id).trim()
      if (sellerLetter && started?.transferId != null && started?.fromUserId != null) {
        await createTransferLetter(started.transferId, {
          authorId: started.fromUserId,
          content: sellerLetter,
          isAiDraft: false,
        })
      }

      const completed = await completeTransfer(started.transferId, {
        newOwnerId: userId,
      })
      clearResellLetterDraft(id)
      setTransferContext({
        transferId: started.transferId,
        productId: completed.productId ?? started.productId,
        newGeneration: completed.newGeneration,
        letterOpened: completed.letterOpened,
        inheritedTags: Array.isArray(completed.inheritedTags) ? completed.inheritedTags : [],
      })
      if (completed.productId ?? started.productId) {
        setProductId(completed.productId ?? started.productId)
        const shared = await loadResellSharedContents({
          productId: completed.productId ?? started.productId,
          generation: completed.newGeneration,
          wantLetter: true,
          wantCareTip: true,
        })
        setLetterContent(shared.letter || sellerLetter || '')
        setCareTipContent(shared.careTip || '')
      }
      setBuyOpen(false)
      setPurchaseComplete(true)
      return true
    } catch (err) {
      setActionError(err?.message || '구매/계승을 완료하지 못했습니다.')
      return false
    } finally {
      setBuying(false)
    }
  }

  const confirmDelete = async () => {
    if (!hasUserId || !id || deleting) return false
    setDeleting(true)
    setActionError(null)
    try {
      await deleteResell(id, { sellerId: userId })
      navigate('/resell?manage=1')
      return true
    } catch (err) {
      setActionError(err?.message || '리셀글을 삭제하지 못했습니다.')
      return false
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AppShell showBack showNav={false}>
        <div className="page form-stack page--resell-detail">
          <p role="status">리셀글 정보를 불러오는 중입니다.</p>
        </div>
      </AppShell>
    )
  }

  if (loadError || !detail) {
    return (
      <AppShell showBack showNav={false}>
        <div className="page form-stack page--resell-detail">
          <p role="alert">{loadError || '리셀글 정보를 불러오지 못했습니다.'}</p>
          <button type="button" className="resell-next" onClick={() => navigate('/resell')}>
            목록으로
          </button>
        </div>
      </AppShell>
    )
  }

  if (purchaseComplete) {
    return (
      <AppShell showNav={false}>
        <main className="resell-purchase-complete">
          <img
            className="resell-purchase-complete__plane"
            src={planeIcon}
            alt=""
            width={43}
            height={43}
          />
          <p className="resell-purchase-complete__message">
            해당 알럿을 닫으면 디지털 패스포트가 노출되며,
            <br />
            제품의 별칭을 변경할 수 있습니다.
          </p>
          <button
            type="button"
            className="resell-purchase-complete__confirm"
            onClick={() =>
              navigate(`/resell/${id}/passport`, {
                state: {
                  productId: transferContext?.productId || productId,
                  transferId: transferContext?.transferId,
                  newGeneration: transferContext?.newGeneration,
                  inheritedTags: transferContext?.inheritedTags ?? [],
                  fromPurchase: true,
                },
              })
            }
          >
            확인
          </button>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell showBack showNav={false}>
      <div
        className={`page form-stack page--resell-detail${canBuy ? ' page--resell-detail-other' : ''}${isBuyerHistory ? ' page--resell-detail-buyer' : ''}${isAuthor ? ' page--resell-detail-author' : ''}`}
      >
        <h1 className="resell-create__title">서사 프리뷰</h1>

        <article className="resell-preview">
          <div
            className="resell-preview__overview resell-overview"
            aria-label={`${detail.officialName || '제품'} 리셀글`}
          >
            <div className="resell-overview__inner">
              <p className="resell-overview__eyebrow">Brand Name</p>
              <p className="resell-overview__alias">{detail.officialName || '—'}</p>
              <div className="resell-overview__meta">
                <span>
                  {detail.summary?.isAuthenticated ? '정품 인증 완료' : '인증 정보 없음'}
                </span>
                <span>{detail.summary?.journeyCount ?? 0}개의 여정 기록</span>
              </div>
              <p className="resell-overview__score">{detail.summary?.provenanceScore ?? 0}</p>
            </div>
          </div>

          <div className="resell-preview__photos">
            {photos.map((photo, i) => (
              <div key={i} className="resell-preview__photo">
                {photo ? (
                  <img className="resell-preview__uploaded-photo" src={photo} alt="" />
                ) : (
                  <img src={previewImageIcon} alt="" width={48} height={48} />
                )}
              </div>
            ))}
          </div>

          <div className="resell-preview__price-row">
            <p className="resell-preview__price">{displayPrice}</p>
            <span className="resell-preview__badge">{conditionLabel(detail.conditionGrade)}</span>
          </div>

          <div className="resell-preview__stats">
            <p className="resell-preview__stat">
              <img src={checkCircleIcon} alt="" width={14} height={14} />
              {formatSummary(detail)}
            </p>
            <p className="resell-preview__stat">
              <img src={checkCircleIcon} alt="" width={14} height={14} />
              전체 여정의 {verifyPct(detail)}% 검증 완료
            </p>
          </div>

          {purchased ? <p className="resell-detail__bought">구매가 완료된 상품입니다!</p> : null}

          <div className="resell-preview__row resell-preview__row--letter">
            {canViewPrivateContent && letterContent ? (
              <>
                <span>Letter</span>
                <p>{letterContent}</p>
              </>
            ) : canViewPrivateContent && hasLetter ? (
              <>
                <span>Letter</span>
                <p>편지가 등록되어 있습니다. 구매·계승 완료 후 새 주인에게 공개됩니다.</p>
              </>
            ) : (
              'Letter (구매자에게만 공개됩니다.)'
            )}
          </div>

          <div className="resell-preview__row resell-preview__row--care">
            {canViewPrivateContent && careTipContent ? (
              <>
                <span>Care Tips</span>
                <p>{careTipContent}</p>
              </>
            ) : canViewPrivateContent && hasCareTip ? (
              <>
                <span>Care Tips</span>
                <p>등록된 케어팁을 불러오지 못했습니다.</p>
              </>
            ) : (
              'Care Tips'
            )}
          </div>

          <button
            type="button"
            className="resell-preview__row resell-preview__row--btn resell-preview__row--journey"
            onClick={() => {
              if (!canViewPrivateContent) {
                setActionError(
                  hasSelectedTags
                    ? '선택된 여정 태그는 구매·계승 완료 후 디지털 패스포트에서 공개됩니다.'
                    : '판매자가 공유하기로 선택한 여정 태그가 없습니다.',
                )
                return
              }
              navigate(`/resell/${id}/journey`, {
                state: { fromDetail: true },
              })
            }}
          >
            <span>
              {hasSelectedTags && !canViewPrivateContent
                ? 'Journey Log · 선택 태그 있음'
                : 'Journey Log'}
            </span>
            <img className="resell-preview__chev" src={previewChevronIcon} alt="" width={24} height={24} />
          </button>
        </article>

        {isBuyerHistory ? (
          <div className="resell-detail__completed">구매가 완료된 상품입니다!</div>
        ) : purchased && !isAuthor ? (
          <button type="button" className="resell-next" onClick={() => setLetterOpen(true)}>
            봉인된 편지 열기
          </button>
        ) : null}

        {isAuthor ? (
          <div className="resell-dual">
            <button
              type="button"
              className="resell-dual__btn"
              onClick={() => {
                setActionError(null)
                setDeleteOpen(true)
              }}
            >
              삭제하기
            </button>
            <button
              type="button"
              className="resell-dual__btn"
              onClick={() => navigate(`/resell/${id}/edit`)}
            >
              수정하기
            </button>
          </div>
        ) : canBuy ? (
          <button
            type="button"
            className="resell-next"
            onClick={() => {
              setActionError(null)
              setBuyOpen(true)
            }}
          >
            구매/계승하기
          </button>
        ) : null}

        {actionError && !buyOpen && !deleteOpen ? (
          <p role="alert" className="resell-empty__desc">
            {actionError}
          </p>
        ) : null}
      </div>

      <Modal
        open={buyOpen}
        secondaryLabel="아니요"
        primaryLabel={buying ? '진행 중...' : '네'}
        variant="resell-buy"
        logoSrc={resellModalLogo}
        onPrimary={confirmBuy}
        onSecondary={() => setBuyOpen(false)}
        onClose={() => {
          if (!buying) setBuyOpen(false)
        }}
      >
        <p>
          구매하면 소유권이 이전되고
          <br />
          봉인된 편지가 열립니다. 진행할까요?
        </p>
        {actionError ? <p role="alert">{actionError}</p> : null}
      </Modal>

      <Modal
        open={letterOpen}
        title="Letter"
        primaryLabel="확인"
        hideSecondary
        onPrimary={() => setLetterOpen(false)}
        onClose={() => setLetterOpen(false)}
      >
        <p>{letterContent || '공개된 편지가 없습니다.'}</p>
        {careTipContent ? <p style={{ marginTop: 10 }}>{careTipContent}</p> : null}
      </Modal>

      <Modal
        open={deleteOpen}
        secondaryLabel="아니요"
        primaryLabel={deleting ? '삭제 중...' : '네'}
        variant="resell-buy"
        logoSrc={resellModalLogo}
        danger
        onPrimary={confirmDelete}
        onSecondary={() => setDeleteOpen(false)}
        onClose={() => {
          if (!deleting) setDeleteOpen(false)
        }}
      >
        <p>작성한 리셀 정보를 삭제하시겠습니까?</p>
        {actionError ? <p role="alert">{actionError}</p> : null}
      </Modal>
    </AppShell>
  )
}
