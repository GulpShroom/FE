import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { resellPosts } from '../../data/mock'

export default function ResellDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const post = resellPosts.find((p) => p.id === id) ?? resellPosts[0]
  const [buyOpen, setBuyOpen] = useState(false)
  const [letterOpen, setLetterOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [purchased, setPurchased] = useState(post.purchased)

  return (
    <AppShell showBack showNav={false}>
      <div className="page form-stack page--resell-detail">
        <h1 className="resell-create__title">서사 프리뷰</h1>

        <article className="resell-preview">
          <div className="resell-preview__photos">
            {[0, 1, 2].map((i) => (
              <div key={i} className="resell-preview__photo">
                {i === 0 ? (
                  <img src={post.image} alt="" width={48} height={48} />
                ) : (
                  <span className="resell-preview__photo-empty" aria-hidden />
                )}
              </div>
            ))}
          </div>

          <div className="resell-preview__price-row">
            <p className="resell-preview__price">{post.price}</p>
            <span className="resell-preview__badge">상태 A급</span>
          </div>

          <div className="resell-preview__stats">
            <p className="resell-preview__stat">{post.summary}</p>
            <p className="resell-preview__stat">
              전체 여정의 {post.verifiedPct}% 검증 완료
            </p>
          </div>

          {purchased ? (
            <p className="resell-detail__bought">구매가 완료된 상품입니다!</p>
          ) : null}

          <div className="resell-preview__row">Letter (구매자에게만 공개됩니다.)</div>
          <div className="resell-preview__row resell-preview__row--tall">
            {purchased ? post.careTip || 'Care Tips' : 'Care Tips'}
          </div>
          <button type="button" className="resell-preview__row resell-preview__row--btn">
            <span>Journey Log</span>
            <span className="resell-preview__chev" aria-hidden>
              ›
            </span>
          </button>
        </article>

        {purchased && !post.mine ? (
          <button type="button" className="resell-next" onClick={() => setLetterOpen(true)}>
            봉인된 편지 열기
          </button>
        ) : null}

        {post.mine ? (
          <div className="resell-dual">
            <button type="button" className="resell-dual__btn" onClick={() => setDeleteOpen(true)}>
              삭제하기
            </button>
            <button
              type="button"
              className="resell-dual__btn"
              onClick={() => navigate('/resell/new')}
            >
              수정하기
            </button>
          </div>
        ) : !purchased ? (
          <button type="button" className="resell-next" onClick={() => setBuyOpen(true)}>
            구매/계승하기
          </button>
        ) : null}
      </div>

      <Modal
        open={buyOpen}
        title="구매하면 소유권이 이전되고 봉인된 편지가 열립니다. 진행할까요?"
        primaryLabel="구매/계승하기"
        onPrimary={() => {
          setPurchased(true)
          setBuyOpen(false)
          setLetterOpen(true)
        }}
        onSecondary={() => setBuyOpen(false)}
        onClose={() => setBuyOpen(false)}
      />

      <Modal
        open={letterOpen}
        title="Letter"
        primaryLabel="확인"
        hideSecondary
        onPrimary={() => setLetterOpen(false)}
        onClose={() => setLetterOpen(false)}
      >
        <p>{post.letter}</p>
        <p style={{ marginTop: 10 }}>{post.careTip}</p>
      </Modal>

      <Modal
        open={deleteOpen}
        title="이 리셀글을 삭제하시겠습니까?"
        primaryLabel="삭제하기"
        danger
        onPrimary={() => navigate('/resell?manage=1')}
        onSecondary={() => setDeleteOpen(false)}
        onClose={() => setDeleteOpen(false)}
      >
        <p>삭제된 리셀글은 복구할 수 없습니다.</p>
      </Modal>
    </AppShell>
  )
}
