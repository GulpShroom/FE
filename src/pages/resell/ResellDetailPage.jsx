import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { products, resellPosts } from '../../data/mock'
import previewImageIcon from '../../assets/final/resell-preview-image.svg'
import checkCircleIcon from '../../assets/final/resell-check-circle.svg'
import previewChevronIcon from '../../assets/final/resell-preview-chevron.svg'
import resellModalLogo from '../../assets/final/resell-delete-logo.png'
import planeIcon from '../../assets/final/progress-plane.png'

export default function ResellDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const post = resellPosts.find((p) => p.id === id) ?? resellPosts[0]
  const [buyOpen, setBuyOpen] = useState(false)
  const [letterOpen, setLetterOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isBuyerHistory = location.state?.resellHistoryRole === 'buyer'
  const isAuthorHistory = location.state?.resellHistoryRole === 'author'
  const [purchased, setPurchased] = useState(post.purchased || isBuyerHistory)
  const [purchaseComplete, setPurchaseComplete] = useState(false)
  const isOtherListing = !post.mine && !purchased && !isAuthorHistory
  const photos = post.photos ?? [null, null, null]
  const selectedProduct = products.find((product) => product.id === post.productId) ?? products[0]
  const buyerLetter = post.letter?.trim() ?? ''
  const buyerCareTip = post.careTip?.trim() ?? ''
  const canViewPrivateContent = isBuyerHistory || isAuthorHistory
  const displayPrice = isAuthorHistory ? '150,000원' : post.price
  const displaySummary = isAuthorHistory ? '3명의 주인 / 8개 도시 / 4년 여정' : post.summary
  const displayVerifiedPct = isAuthorHistory ? 88 : post.verifiedPct

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
            onClick={() => navigate(`/resell/${post.id}/passport`)}
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
        className={`page form-stack page--resell-detail${isOtherListing ? ' page--resell-detail-other' : ''}${isBuyerHistory ? ' page--resell-detail-buyer' : ''}${isAuthorHistory ? ' page--resell-detail-author' : ''}`}
      >
        <h1 className="resell-create__title">서사 프리뷰</h1>

        <article
          className={`resell-preview${isBuyerHistory && buyerLetter ? ' has-letter' : ''}${isBuyerHistory && buyerCareTip ? ' has-care' : ''}`}
        >
          <div className="resell-preview__overview resell-overview" aria-label={`${selectedProduct.alias} 제품`}>
            <div className="resell-overview__inner">
              <p className="resell-overview__eyebrow">Brand Name</p>
              <p className="resell-overview__alias">{selectedProduct.alias}</p>
              <div className="resell-overview__meta">
                <span>{selectedProduct.authenticity}</span>
                <span>{selectedProduct.journeyCount}개의 여정 기록</span>
              </div>
              {selectedProduct.stamp ? (
                <span className="resell-overview__stamp-box" aria-hidden="true">
                  <img className="resell-overview__stamp" src={selectedProduct.stamp} alt="" />
                </span>
              ) : null}
              <p className="resell-overview__score">{selectedProduct.overallScore}</p>
            </div>
          </div>

          <div className="resell-preview__photos">
            {photos.slice(0, 3).map((photo, i) => (
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
            <span className="resell-preview__badge">상태 A급</span>
          </div>

          <div className="resell-preview__stats">
            <p className="resell-preview__stat">
              <img src={checkCircleIcon} alt="" width={14} height={14} />
              {displaySummary}
            </p>
            <p className="resell-preview__stat">
              <img src={checkCircleIcon} alt="" width={14} height={14} />
              전체 여정의 {displayVerifiedPct}% 검증 완료
            </p>
          </div>

          {purchased ? (
            <p className="resell-detail__bought">구매가 완료된 상품입니다!</p>
          ) : null}

          {canViewPrivateContent && buyerLetter ? (
            <div className="resell-preview__row resell-preview__row--letter">
              <span>Letter</span>
              <p>{buyerLetter}</p>
            </div>
          ) : !canViewPrivateContent ? (
            <div className="resell-preview__row resell-preview__row--letter">
              Letter (구매자에게만 공개됩니다.)
            </div>
          ) : null}
          {canViewPrivateContent && !buyerCareTip ? null : (
            <div className="resell-preview__row resell-preview__row--care">
              {canViewPrivateContent ? (
                <>
                  <span>Care Tips</span>
                  <p>{buyerCareTip}</p>
                </>
              ) : purchased ? post.careTip || 'Care Tips' : 'Care Tips'}
            </div>
          )}
          <button
            type="button"
            className="resell-preview__row resell-preview__row--btn resell-preview__row--journey"
            onClick={() =>
              navigate(`/resell/${post.id}/journey`, {
                state: {
                  shareSelections: post.shareSelections,
                  situationSelections: post.situationSelections,
                },
              })
            }
          >
            <span>Journey Log</span>
            <img className="resell-preview__chev" src={previewChevronIcon} alt="" width={24} height={24} />
          </button>
        </article>

        {isBuyerHistory ? (
          <div className="resell-detail__completed">구매가 완료된 상품입니다!</div>
        ) : purchased && !post.mine ? (
          <button type="button" className="resell-next" onClick={() => setLetterOpen(true)}>
            봉인된 편지 열기
          </button>
        ) : null}

        {post.mine || isAuthorHistory ? (
          <div className="resell-dual">
            <button type="button" className="resell-dual__btn" onClick={() => setDeleteOpen(true)}>
              삭제하기
            </button>
            <button
              type="button"
              className="resell-dual__btn"
              onClick={() => navigate(`/resell/${isAuthorHistory ? id : post.id}/edit`)}
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
        secondaryLabel="네"
        primaryLabel="아니요"
        variant="resell-buy"
        logoSrc={resellModalLogo}
        onSecondary={() => {
          setPurchased(true)
          setBuyOpen(false)
          setPurchaseComplete(true)
        }}
        onPrimary={() => setBuyOpen(false)}
        onClose={() => setBuyOpen(false)}
      >
        <p>
          구매하면 소유권이 이전되고
          <br />
          봉인된 편지가 열립니다. 진행할까요?
        </p>
      </Modal>

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
        secondaryLabel="네"
        primaryLabel="아니요"
        variant="resell-buy"
        logoSrc={resellModalLogo}
        onSecondary={() => navigate('/resell')}
        onPrimary={() => setDeleteOpen(false)}
        onClose={() => setDeleteOpen(false)}
      >
        <p>작성한 리셀 정보를 삭제하시겠습니까?</p>
      </Modal>
    </AppShell>
  )
}
