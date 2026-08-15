import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import chevronsRight from '../../assets/final/chevrons-right.svg'
import { products } from '../../data/mock'

export default function ProductListPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const product = products[index] ?? products[0]
  const linked = products.filter((p) => p.id !== product.id)

  return (
    <AppShell showBack onBack={() => navigate('/my')}>
      <div className="page page--my-products">
        <article className="passport-card">
          <img className="passport-card__stamp" src={product.stamp} alt="" width={190} height={190} />
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

        <div className="my-product-list">
          <Link to={`/my/products/${product.id}`} className="product-row product-row--owned">
            <div className="product-row__thumb">
              <img src={product.thumb} alt="" width={70} height={70} />
            </div>
            <div className="product-row__copy">
              <p className="product-row__alias">{product.alias}</p>
              <p className="product-row__name">{product.shortName}</p>
            </div>
            <span className="badge">소유중</span>
            <img className="product-row__go" src={chevronsRight} alt="" width={24} height={24} />
          </Link>

          {linked.map((item) => (
            <button
              key={item.id}
              type="button"
              className="product-row product-row--linked"
              onClick={() => setIndex(products.findIndex((p) => p.id === item.id))}
            >
              <div className="product-row__thumb product-row__thumb--bag">
                <img src={item.image} alt="" width={66} height={80} />
              </div>
              <div className="product-row__copy">
                <p className="product-row__alias">{item.alias}</p>
                <p className="product-row__name">{item.shortName}</p>
              </div>
              <span className="badge">이어짐</span>
            </button>
          ))}
        </div>

        <div className="passport-rail" aria-hidden="true">
          <span className="passport-rail__pill" />
          {products.slice(1).map((p) => (
            <span key={p.id} className="passport-rail__dot" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
