import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { journeys } from '../../data/mock'
import journeyHero from '../../assets/final/journey-detail-hero.png'
import mapPanel from '../../assets/final/map-panel.png'

export default function JourneyDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const journey = journeys.find((j) => j.id === id) ?? journeys[0]
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)

  const forced = searchParams.get('view')
  const mode =
    forced === 'other' || forced === 'linked' || forced === 'owned'
      ? forced
      : journey.status === 'owned'
        ? 'owned'
        : journey.status === 'linked'
          ? 'linked'
          : 'other'

  const canEdit = mode === 'owned' || mode === 'linked'
  const heroSrc =
    journey.id === 'j1' || mode === 'other' || mode === 'linked'
      ? journeyHero
      : journey.image

  const tagClass =
    mode === 'other'
      ? 'journey-tag journey-tag--soft'
      : mode === 'linked'
        ? 'journey-tag journey-tag--outline'
        : 'journey-tag'

  const goBack = () => navigate(`/journey/records/${journey.productId}`)

  return (
    <AppShell
      showBack
      showTagline={mode === 'owned'}
      showNav={mode === 'linked'}
      onBack={goBack}
    >
      <div className={`page page--journey-detail page--journey-detail--${mode}`}>
        {mode === 'other' || mode === 'owned' ? (
          <div className="journey-detail-map" aria-hidden>
            <img src={mapPanel} alt="" width={375} height={812} />
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

          {journey.tags?.length ? (
            <div
              className={
                mode === 'linked'
                  ? 'journey-detail-linked__tags'
                  : 'journey-detail-card__tags'
              }
            >
              {journey.tags.map((tag) => (
                <span key={tag} className={tagClass}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div
            className={
              mode === 'linked'
                ? 'journey-detail-linked__memo'
                : `journey-detail-card__memo${mode === 'other' ? ' journey-detail-card__memo--gold' : ''}`
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
              <p>{journey.memo ?? journey.body}</p>
            </div>
          </div>

          {mode === 'owned' && canEdit ? (
            <div className="journey-detail-card__actions">
              <button
                type="button"
                className="journey-detail-card__btn"
                onClick={() => navigate(`/journey/entry/${journey.id}/edit`)}
              >
                수정하기
              </button>
              <button
                type="button"
                className="journey-detail-card__btn journey-detail-card__btn--danger"
                onClick={() => setConfirmOpen(true)}
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
              onClick={() => navigate(`/journey/entry/${journey.id}/edit`)}
            >
              수정하기
            </button>
            <button
              type="button"
              className="journey-detail-linked__btn journey-detail-linked__btn--delete"
              onClick={() => setConfirmOpen(true)}
            >
              삭제하기
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        open={confirmOpen}
        title="이 여정을 삭제하시겠습니까?"
        primaryLabel="삭제하기"
        danger
        onPrimary={() => {
          setConfirmOpen(false)
          setDeletedOpen(true)
        }}
        onSecondary={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      >
        <p>삭제된 여정은 복구할 수 없습니다.</p>
      </Modal>

      <Modal
        open={deletedOpen}
        title="여정 기록이 성공적으로 삭제되었습니다."
        primaryLabel="확인"
        hideSecondary
        onPrimary={() => navigate(`/journey/records/${journey.productId}`)}
        onClose={() => navigate(`/journey/records/${journey.productId}`)}
      />
    </AppShell>
  )
}
