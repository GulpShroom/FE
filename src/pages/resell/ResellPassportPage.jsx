import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { products, resellPosts } from '../../data/mock'

export default function ResellPassportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const post = resellPosts.find((item) => item.id === id) ?? resellPosts[0]
  const product = products.find((item) => item.id === post.productId) ?? products[0]
  const [flipped, setFlipped] = useState(false)
  const activeGenId = product.activeGenerationId ?? product.generations?.[0]?.id
  const journeyText = (product.journeyHeadline ?? '').replace(/^["“]|["”]$/g, '')
  const toggleFromKeyboard = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setFlipped((current) => !current)
  }

  return (
    <AppShell hideHeader showNav={false}>
      <main className="resell-passport-page">
        {!flipped ? (
        <article
          className="passport-card passport-card--front resell-passport-card--front"
          role="button"
          tabIndex={0}
          aria-label="디지털 패스포트 뒷면 보기"
          onClick={() => setFlipped(true)}
          onKeyDown={toggleFromKeyboard}
        >
          <img
            className="passport-card__stamp"
            src={product.stamp}
            alt=""
            width={188}
            height={189}
          />
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
        </article>
        ) : (
          <article
            className="passport-card passport-card--back resell-passport-card--back"
            role="button"
            tabIndex={0}
            aria-label="디지털 패스포트 앞면 보기"
            onClick={() => setFlipped(false)}
            onKeyDown={toggleFromKeyboard}
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
              <div className="passport-back__timeline-line" aria-hidden="true" />
              <div
                className="passport-back__timeline-nodes"
                style={{ '--gen-count': String(Math.max(product.generations.length, 1)) }}
              >
                {product.generations.map((generation) => (
                  <div
                    key={generation.id}
                    className={`passport-back__node${generation.id === activeGenId ? ' is-active' : ''}`}
                  >
                    <span className="passport-back__node-owner">{generation.label}</span>
                    <span className="passport-back__node-dot" />
                    <span className="passport-back__node-period">{generation.period}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="passport-back__score-block">
              <div className="passport-back__score-row">
                <p className="passport-back__score">
                  {product.overallScore}<span> / 100</span>
                </p>
                <span className="passport-back__badge">{product.verifiedPct} % 검증</span>
              </div>
              <div className="passport-back__metrics">
                <div className="passport-back__metric">
                  <strong>{product.narrativeScore}</strong><span>서사점수</span>
                </div>
                <div className="passport-back__metric">
                  <strong>{product.conditionScore}</strong><span>상태점수</span>
                </div>
                <div className="passport-back__metric">
                  <strong>{product.careMetric}</strong><span>케어점수</span>
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
          </article>
        )}
        <button
          type="button"
          className="resell-passport-page__confirm"
          onClick={() => navigate(`/resell/${id}/alias`)}
        >
          확인
        </button>
      </main>
    </AppShell>
  )
}
