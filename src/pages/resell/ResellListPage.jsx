import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { deleteResell } from '../../api/resells'
import { useProfile } from '../../context/ProfileContext'
import { useResellList } from '../../hooks/useResellList'
import fabRing from '../../assets/final/resell-fab-main.svg'
import fabVertical from '../../assets/final/resell-fab-detail-a.svg'
import fabHorizontal from '../../assets/final/resell-fab-detail-b.svg'
import resellLogo from '../../assets/final/resell-logo.png'
import deleteModalLogo from '../../assets/final/resell-delete-logo.png'

export default function ResellListPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { profile } = useProfile()
  const userId = Number(profile.userId ?? profile.id)
  const hasUserId = Number.isFinite(userId) && userId > 0
  const manageFromUrl = params.get('manage') === '1'
  const [localManaging, setLocalManaging] = useState(false)
  const managing = manageFromUrl || localManaging
  const [scope, setScope] = useState(manageFromUrl ? 'mine' : 'all')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [manageIndex, setManageIndex] = useState(0)
  const [completedNotice, setCompletedNotice] = useState(false)
  const completedNoticeTimer = useRef(null)
  const isMineScope = scope === 'mine' || managing
  const { data, isLoading, error, refetch } = useResellList(
    isMineScope
      ? { userId, role: 'seller', page: 0, size: 10 }
      : { status: 'active', page: 0, size: 10 },
    { enabled: !isMineScope || hasUserId },
  )
  const list = data.resells

  useEffect(
    () => () => {
      if (completedNoticeTimer.current) window.clearTimeout(completedNoticeTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (list.length === 0) {
      setManageIndex(0)
      return
    }
    if (manageIndex >= list.length) setManageIndex(list.length - 1)
  }, [list.length, manageIndex])

  const showCompletedNotice = () => {
    setCompletedNotice(true)
    if (completedNoticeTimer.current) window.clearTimeout(completedNoticeTimer.current)
    completedNoticeTimer.current = window.setTimeout(() => {
      setCompletedNotice(false)
      completedNoticeTimer.current = null
    }, 3000)
  }

  const managePost = list[manageIndex] ?? list[0]

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteId(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteId || !hasUserId || deleting) return false
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteResell(deleteId, { sellerId: userId })
      setDeleteId(null)
      setManageIndex(0)
      refetch()
      return true
    } catch (err) {
      setDeleteError(err?.message || '리셀글을 삭제하지 못했습니다.')
      return false
    } finally {
      setDeleting(false)
    }
  }

  if (managing) {
    return (
      <AppShell
        showNav={false}
        showBack
        onBack={() => {
          setLocalManaging(false)
          setScope('all')
          navigate('/resell', { replace: true })
        }}
      >
        <div
          className={`page page--resell-manage form-stack${list.length === 0 ? ' page--resell-manage-empty' : ''}`}
        >
          <h1 className="resell-create__title">내 리셀글 관리</h1>

          {!hasUserId ? (
            <div className="resell-empty" role="alert">
              <p className="resell-empty__title">프로필을 선택한 뒤 이용해 주세요.</p>
            </div>
          ) : isLoading ? (
            <div className="resell-empty" role="status">
              <p className="resell-empty__title">리셀글을 불러오는 중입니다.</p>
            </div>
          ) : error ? (
            <div className="resell-empty" role="alert">
              <p className="resell-empty__title">리셀글을 불러오지 못했습니다.</p>
              <button type="button" className="resell-head__manage" onClick={refetch}>
                다시 시도
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="resell-empty resell-empty--manage" aria-label="등록된 리셀 제품 없음" />
          ) : (
            <>
              <button
                key={managePost.resellId}
                type="button"
                className="resell-overview"
                onClick={() => setManageIndex((current) => (current + 1) % list.length)}
                aria-label="다음 리셀 제품 보기"
              >
                <div className="resell-overview__inner">
                  <p className="resell-overview__eyebrow">Journey Overview</p>
                  <p className="resell-overview__alias">{managePost.nickname}</p>
                  <div className="resell-overview__meta">
                    <span>{managePost.postStatus}</span>
                    <span>상태 {managePost.conditionGrade}</span>
                  </div>
                  <p className="resell-overview__score">{managePost.provenanceScore}</p>
                </div>
              </button>

              <div className="passport-rail" aria-label="리셀글 선택">
                {list.map((post, index) =>
                  index === manageIndex ? (
                    <span key={post.resellId} className="passport-rail__pill" />
                  ) : (
                    <button
                      key={post.resellId}
                      type="button"
                      className="passport-rail__dot"
                      onClick={() => setManageIndex(index)}
                      aria-label={`${index + 1}번째 리셀글`}
                    />
                  ),
                )}
              </div>

              <div className="resell-dual">
                <button
                  type="button"
                  className="resell-dual__btn"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleteId(managePost.resellId)
                  }}
                >
                  삭제하기
                </button>
                <button
                  type="button"
                  className="resell-dual__btn"
                  onClick={() => navigate(`/resell/${managePost.resellId}/edit`)}
                >
                  수정하기
                </button>
              </div>
            </>
          )}
        </div>

        <Modal
          open={Boolean(deleteId)}
          title="이 리셀글을 삭제하시겠습니까?"
          primaryLabel={deleting ? '삭제 중...' : '삭제하기'}
          secondaryLabel="취소하기"
          variant="resell-delete"
          logoSrc={deleteModalLogo}
          danger
          onPrimary={confirmDelete}
          onSecondary={closeDeleteModal}
          onClose={closeDeleteModal}
        >
          <p>삭제된 리셀글은 복구할 수 없습니다.</p>
          {deleteError ? <p role="alert">{deleteError}</p> : null}
        </Modal>

        <Modal
          open={hasUserId && !isLoading && !error && list.length === 0}
          primaryLabel="확인"
          hideSecondary
          variant="resell-empty-notice"
          onPrimary={() => {
            setLocalManaging(false)
            setScope('all')
            navigate('/resell', { replace: true })
          }}
        >
          <p>내 리셀글이 없습니다.</p>
        </Modal>
      </AppShell>
    )
  }

  return (
    <AppShell
      logoSrc={resellLogo}
      logoWidth={317}
      logoHeight={172}
      floatingAction={
        <button
          type="button"
          className="resell-fab"
          aria-label="리셀 등록"
          onClick={() => navigate('/resell/new')}
        >
          <img className="resell-fab__ring" src={fabRing} alt="" width={41} height={41} />
          <img className="resell-fab__vertical" src={fabVertical} alt="" width={2} height={17} />
          <img className="resell-fab__horizontal" src={fabHorizontal} alt="" width={17} height={2} />
        </button>
      }
    >
      <div className="page page--resell">
        <div className="resell-head">
          <h1 className="resell-head__title">Resell</h1>
          <button
            type="button"
            className="resell-head__manage"
            onClick={() => {
              setLocalManaging(true)
              setScope('mine')
              setManageIndex(0)
            }}
          >
            내 리셀글 관리
          </button>
        </div>

        <div className="resell-segmented">
          <button
            type="button"
            className={scope === 'all' ? 'is-active' : ''}
            onClick={() => setScope('all')}
          >
            전체 리셀글
          </button>
          <button
            type="button"
            className={scope === 'mine' ? 'is-active' : ''}
            onClick={() => setScope('mine')}
          >
            내 리셀 내역
          </button>
        </div>

        {isMineScope && !hasUserId ? (
          <div className="resell-empty" role="alert">
            <p className="resell-empty__title">프로필을 선택한 뒤 이용해 주세요.</p>
          </div>
        ) : isLoading ? (
          <div className="resell-empty" role="status">
            <p className="resell-empty__title">리셀글을 불러오는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="resell-empty" role="alert">
            <p className="resell-empty__title">리셀글을 불러오지 못했습니다.</p>
            <p className="resell-empty__desc">잠시 후 다시 시도해 주세요.</p>
            <button type="button" className="resell-head__manage" onClick={refetch}>
              다시 시도
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="resell-empty">
            <p className="resell-empty__title">리셀글이 없습니다.</p>
            <p className="resell-empty__desc">보유 제품으로 리셀글을 등록해 보세요.</p>
          </div>
        ) : (
          <div className="resell-list">
            {data.resells.map((post) => (
              <article
                key={post.resellId}
                className="resell-card"
                data-provenance-score={post.provenanceScore}
                data-condition-grade={post.conditionGrade}
              >
                <Link
                  to={`/resell/${post.resellId}`}
                  state={scope === 'mine' ? { resellHistoryRole: 'author' } : undefined}
                  className="resell-card__link"
                  onClick={(event) => {
                    if (post.postStatus === 'active') return
                    event.preventDefault()
                    showCompletedNotice()
                  }}
                >
                  <div className="resell-card__thumb" aria-hidden="true" />
                  <div className="resell-card__copy">
                    <h3 className="resell-card__title">{post.nickname}</h3>
                    <p className="resell-card__price">
                      {post.price.toLocaleString('ko-KR')}원
                    </p>
                  </div>
                </Link>
                <span className="resell-card__status">{post.postStatus}</span>
              </article>
            ))}
          </div>
        )}
      </div>

      {completedNotice ? (
        <div className="resell-completed-toast" role="status" aria-live="polite">
          이미 거래된 상품입니다!
        </div>
      ) : null}
    </AppShell>
  )
}
