import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { useProfile } from '../../context/ProfileContext'
import { deleteJourney, getCachedJourney } from '../../api/journeys'
import { journeys, products } from '../../data/mock'
import journeyHero from '../../assets/final/journey-detail-hero.png'
import expandedMap from '../../assets/final/expanded-map.png'
import mapMarker1 from '../../assets/final/map-marker-1.png'
import mapMarker2 from '../../assets/final/map-marker-2.png'
import mapMarker3 from '../../assets/final/map-marker-3.png'

export default function JourneyDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const cached = getCachedJourney(id)
  const journey =
    cached ||
    journeys.find((j) => j.id === id) || {
      id,
      productId: searchParams.get('productId') || products[0]?.id,
      quote: '',
      tags: [],
      memo: '',
      status: 'owned',
    }
  const productId = searchParams.get('productId') || journey.productId || products[0]?.id
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const forced = searchParams.get('view')
  const mode =
    forced === 'other' || forced === 'linked' || forced === 'owned'
      ? forced
      : journey.status === 'owned' || journey.status === 'transferred'
        ? 'owned'
        : journey.status === 'linked'
          ? 'linked'
          : 'other'

  const canEdit = mode === 'owned' || mode === 'linked'
  const photoIndex = Number(searchParams.get('photo'))
  const markerPhotos = [mapMarker1, mapMarker2, mapMarker3]
  const product = products.find((item) => item.id === productId)
  const heroSrc = mode === 'other'
    ? product?.image || journey.image || journeyHero
    : markerPhotos[photoIndex - 1] || journey.image || journeyHero
  const recordsPath = `/journey/records/${productId}`
  const editPath = `/journey/entry/${journey.id}/edit?productId=${encodeURIComponent(productId)}`

  const tagClass =
    mode === 'other'
      ? 'journey-tag journey-tag--soft'
      : mode === 'linked'
        ? 'journey-tag journey-tag--outline'
        : 'journey-tag'

  const tags = journey.tags?.length
    ? journey.tags
    : [journey.activity, journey.situation, journey.style].filter(Boolean)

  const goBack = () => {
    if (searchParams.get('from') === 'map') {
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

  return (
    <AppShell
      showBack
      showTagline={false}
      showNav={false}
      onBack={goBack}
    >
      <div className={`page page--journey-detail page--journey-detail--${mode}`}>
        {mode === 'other' || mode === 'owned' ? (
          <div className="journey-detail-map" aria-hidden>
            <img src={expandedMap} alt="" width={375} height={729} />
          </div>
        ) : null}

        <article
          className={
            mode === 'linked'
              ? 'journey-detail-linked'
              : 'journey-detail-card'
          }
        >
          <div
            className={
              mode === 'linked'
                ? 'journey-detail-linked__photo'
                : 'journey-detail-card__photo'
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
                ? 'journey-detail-linked__quote'
                : 'journey-detail-card__quote'
            }
          >
            {journey.quote}
          </p>

          {tags.length ? (
            <div
              className={
                mode === 'linked'
                  ? 'journey-detail-linked__tags'
                  : 'journey-detail-card__tags'
              }
            >
              {tags.map((tag) => (
                <span key={tag} className={tagClass}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {mode !== 'other' ? <div
            className={mode === 'linked' ? 'journey-detail-linked__memo' : 'journey-detail-card__memo journey-detail-card__memo--gold'}
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
              <p>{journey.memo ?? journey.body}</p>
            </div>
          </div> : null}

          {mode === 'owned' && canEdit && searchParams.get('actions') === '1' ? (
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

        {mode === 'linked' ? (
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
        onPrimary={() => navigate(recordsPath)}
        onClose={() => navigate(recordsPath)}
      />
    </AppShell>
  )
}
