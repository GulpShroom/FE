import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { useProfile } from '../../context/ProfileContext'
import { deleteJourney, getCachedJourney, getJourney, mapJourneyDetail } from '../../api/journeys'
import { journeys } from '../../data/mock'
import journeyHero from '../../assets/final/journey-detail-hero.png'
import expandedMap from '../../assets/final/expanded-map.png'
import mapMarker1 from '../../assets/final/map-marker-1.png'
import mapMarker2 from '../../assets/final/map-marker-2.png'
import mapMarker3 from '../../assets/final/map-marker-3.png'

function toTagLabel(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && value.tag != null && value.tag !== '') return String(value.tag)
  return ''
}

export default function JourneyDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const productIdParam = searchParams.get('productId') || ''
  const fromMap = searchParams.get('from') === 'map'
  const [journey, setJourney] = useState(() => {
    const cached = getCachedJourney(id)
    return (
      cached ||
      journeys.find((j) => j.id === id) || {
        id,
        productId: productIdParam,
        quote: '',
        tags: [],
        memo: '',
        status: 'owned',
        isAuthor: true,
      }
    )
  })
  const productId = productIdParam || journey.productId || ''
  const fetchKey = `${id}:${profile.id}`
  const [loadedKey, setLoadedKey] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const loading = loadedKey !== fetchKey
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getJourney(id, { userId: profile.id })
      .then((data) => {
        if (cancelled || !data) return
        // 지도에서 온 경우: 타 키퍼 여정도 상세 표시
        if (data.isAuthor === false && !fromMap) {
          setLoadError('다른 키퍼가 등록한 여정은 볼 수 없습니다.')
          setJourney((prev) => ({ ...prev, status: 'other', isAuthor: false }))
          setLoadedKey(fetchKey)
          return
        }
        setJourney(mapJourneyDetail(data, { productId }))
        setLoadError(null)
        setLoadedKey(fetchKey)
      })
      .catch((err) => {
        if (cancelled) return
        const cached = getCachedJourney(id)
        if (cached && (fromMap || cached.status !== 'other')) {
          setJourney(cached)
          setLoadError(null)
        } else {
          setLoadError(err.message || '여정 상세를 불러오지 못했습니다')
        }
        setLoadedKey(fetchKey)
      })
    return () => {
      cancelled = true
    }
  }, [id, profile.id, productId, fetchKey, fromMap])

  const forced = searchParams.get('view')
  const canManage = journey.isAuthor === true

  // 지도 진입: 지도 배경 카드 UI. 그 외는 기존 linked/owned/other
  const mode =
    forced === 'other' || forced === 'linked' || forced === 'owned'
      ? forced
      : fromMap
        ? canManage
          ? 'owned'
          : 'other'
        : canManage
          ? 'linked'
          : journey.status === 'other'
            ? 'other'
            : 'owned'

  const photoIndex = Number(searchParams.get('photo'))
  const markerPhotos = [mapMarker1, mapMarker2, mapMarker3]
  const heroSrc =
    mode === 'other'
      ? journey.image || journeyHero
      : mode === 'linked'
        ? journey.image || journeyHero
        : markerPhotos[photoIndex - 1] || journey.image || journeyHero
  const recordsPath = productId ? `/journey/records/${productId}` : '/journey'
  const editPath = `/journey/entry/${journey.id}/edit?productId=${encodeURIComponent(productId)}${
    fromMap ? '&from=map' : ''
  }`

  const tagClass =
    mode === 'other'
      ? 'journey-tag journey-tag--soft'
      : mode === 'linked'
        ? 'journey-tag journey-tag--outline'
        : 'journey-tag'

  const tags = (journey.tags?.length
    ? journey.tags
    : [journey.activity, journey.situation, journey.style]
  )
    .map(toTagLabel)
    .filter(Boolean)

  const quoteText = String(journey.quote || '').replace(/[“”"]/g, '').trim()
  const quoteDisplay = quoteText ? journey.quote : '한 줄 평이 없습니다.'
  const memoDisplay = String(journey.memo ?? journey.body ?? '').trim() || '메모가 없습니다.'

  const goBack = () => {
    if (fromMap) {
      navigate('/main?map=expanded')
      return
    }
    navigate(recordsPath)
  }

  const onDelete = async () => {
    if (deleting) return false
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteJourney(id, { userId: profile.id })
      setDeletedOpen(true)
    } catch (err) {
      setDeleteError(err.message || '여정 삭제에 실패했습니다')
      return false
    } finally {
      setDeleting(false)
    }
    return undefined
  }

  if (!loading && loadError && journey.status === 'other' && !fromMap) {
    return (
      <AppShell showBack showTagline={false} showNav={false} onBack={goBack}>
        <div className="page page--journey-detail">
          <p className="journeys-status journeys-status--error">{loadError}</p>
        </div>
      </AppShell>
    )
  }

  const showActions = canManage && (mode === 'linked' || fromMap)
  const showMemo = mode !== 'other'

  return (
    <AppShell showBack showTagline={false} showNav={false} onBack={goBack}>
      <div className={`page page--journey-detail page--journey-detail--${mode}`}>
        {loading ? <p className="journeys-status">여정 상세를 불러오는 중...</p> : null}
        {loadError && journey.status !== 'other' ? (
          <p className="journeys-status journeys-status--error">{loadError}</p>
        ) : null}

        {mode === 'other' || mode === 'owned' ? (
          <div className="journey-detail-map" aria-hidden>
            <img src={expandedMap} alt="" width={375} height={729} />
          </div>
        ) : null}

        <article
          className={mode === 'linked' ? 'journey-detail-linked' : 'journey-detail-card'}
        >
          <div
            className={
              mode === 'linked' ? 'journey-detail-linked__photo' : 'journey-detail-card__photo'
            }
          >
            <img
              src={heroSrc}
              alt=""
              width={mode === 'linked' ? 250 : 304}
              height={mode === 'linked' ? 400 : 486}
            />
          </div>

          <p
            className={
              mode === 'linked'
                ? `journey-detail-linked__quote${quoteText ? '' : ' is-empty'}`
                : `journey-detail-card__quote${quoteText ? '' : ' is-empty'}`
            }
          >
            {quoteDisplay}
          </p>

          <div
            className={
              mode === 'linked' ? 'journey-detail-linked__tags' : 'journey-detail-card__tags'
            }
          >
            {tags.length ? (
              tags.map((tag) => (
                <span key={tag} className={tagClass}>
                  {tag}
                </span>
              ))
            ) : (
              <span className={`${tagClass} is-empty`}>해시태그가 없습니다.</span>
            )}
          </div>

          {showMemo ? (
            <div
              className={
                mode === 'linked'
                  ? 'journey-detail-linked__memo'
                  : 'journey-detail-card__memo journey-detail-card__memo--gold'
              }
            >
              <p
                className={
                  mode === 'linked'
                    ? 'journey-detail-linked__memo-label'
                    : 'journey-detail-card__memo-label'
                }
              >
                메모
              </p>
              <div
                className={
                  mode === 'linked'
                    ? 'journey-detail-linked__memo-box'
                    : 'journey-detail-card__memo-box'
                }
              >
                <p className={String(journey.memo ?? journey.body ?? '').trim() ? '' : 'is-empty'}>
                  {memoDisplay}
                </p>
              </div>
            </div>
          ) : null}

          {showActions && mode !== 'linked' ? (
            <div className="journey-detail-card__actions">
              <button
                type="button"
                className="journey-detail-card__btn"
                onClick={() => navigate(editPath)}
              >
                수정하기
              </button>
              <button
                type="button"
                className="journey-detail-card__btn journey-detail-card__btn--danger"
                onClick={() => {
                  setDeleteError(null)
                  setConfirmOpen(true)
                }}
              >
                삭제하기
              </button>
            </div>
          ) : null}
        </article>

        {showActions && mode === 'linked' ? (
          <div className="journey-detail-linked__actions">
            <button
              type="button"
              className="journey-detail-linked__btn journey-detail-linked__btn--edit"
              onClick={() => navigate(editPath)}
            >
              수정하기
            </button>
            <button
              type="button"
              className="journey-detail-linked__btn journey-detail-linked__btn--delete"
              onClick={() => {
                setDeleteError(null)
                setConfirmOpen(true)
              }}
            >
              삭제하기
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        open={confirmOpen}
        title="이 여정을 삭제하시겠습니까?"
        primaryLabel={deleting ? '삭제 중...' : '삭제하기'}
        danger
        onPrimary={onDelete}
        onSecondary={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      >
        <p>삭제된 여정은 복구할 수 없습니다.</p>
        {deleteError ? <p className="form-error">{deleteError}</p> : null}
      </Modal>

      <Modal
        open={deletedOpen}
        title="여정 기록이 성공적으로 삭제되었습니다."
        primaryLabel="확인"
        hideSecondary
        onPrimary={() => navigate(fromMap ? '/main?map=expanded' : recordsPath)}
        onClose={() => navigate(fromMap ? '/main?map=expanded' : recordsPath)}
      />
    </AppShell>
  )
}
