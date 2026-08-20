import { Link } from 'react-router-dom'
import logo from '../assets/final/logo-mark.png'
import ctaArrow from '../assets/final/cta-arrow.svg'
import emptyJourney from '../assets/final/empty-journey.svg'

/** Figma 1175:826 / 1118:2278 — 등록된 제품이 없는 경우 */
export function EmptyProductState() {
  return (
    <main className="page--main-empty-product" aria-labelledby="empty-product-title">
      <div className="empty-product-brand">
        <img src={logo} alt="M·Carry" width={133} height={40} />
        <p>Carry the Moment, Share the Value</p>
      </div>

      <section className="empty-product-message">
        <img src={emptyJourney} alt="" width={144} height={144} />
        <h1 id="empty-product-title">아직 등록된 제품이 없어요</h1>
        <p>
          제품을 등록하면 정품 인증부터
          <br />
          나만의 소유 여정 기록이 시작돼요.
        </p>
      </section>

      <Link to="/register" className="cta-dark empty-product-cta">
        <span className="cta-dark__copy">
          <span className="cta-dark__sub">MCM과 함께 여정을 시작해볼까요?</span>
          <span className="cta-dark__title">제품 등록하러 가기</span>
        </span>
        <img className="cta-dark__arrow" src={ctaArrow} alt="" width={50} height={50} />
      </Link>
    </main>
  )
}
