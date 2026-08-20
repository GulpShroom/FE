import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { products, resellPosts } from '../../data/mock'
import resellModalLogo from '../../assets/final/resell-delete-logo.png'

export default function ResellAliasPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const post = resellPosts.find((item) => item.id === id) ?? resellPosts[0]
  const product = products.find((item) => item.id === post.productId) ?? products[0]
  const [alias, setAlias] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const submit = () => {
    if (!alias.trim()) return
    // TODO: 구매 계승 별칭 등록 API에 { resellId: id, productId: product.id, alias }를 전달합니다.
    console.info('resell alias payload', { resellId: id, productId: product.id, alias: alias.trim() })
    setConfirmOpen(true)
  }

  return (
    <AppShell showBack showNav={false}>
      <main className="resell-alias-page">
        <h1>별칭 등록</h1>
        <p className="resell-alias-page__intro">
          제품에 나만의 이름을 지어주세요.
          <br />
          디지털 패스포트에 기록되며, 제품의 고유한 정체성이 됩니다.
        </p>

        <section className="resell-alias-product">
          <img src={product.image} alt={product.name} width={64} height={64} />
          <div>
            <span>등록 대상 제품</span>
            <strong>{product.name}</strong>
          </div>
        </section>

        <label className="resell-alias-page__label" htmlFor="resell-alias">별칭 입력</label>
        <input
          id="resell-alias"
          value={alias}
          maxLength={20}
          placeholder="별칭을 입력해주세요."
          onChange={(event) => setAlias(event.target.value)}
        />
        <p className="resell-alias-page__count">{alias.length}/20</p>

        <div className="resell-alias-info">
          <span aria-hidden="true">i</span>
          <p>
            별칭은 리셀 시장에서 제품의 고유한 가치가 되며,
            <br />
            다음 주인에게도 그대로 계승됩니다.
          </p>
        </div>

        <button
          type="button"
          className="resell-alias-page__submit"
          disabled={!alias.trim()}
          onClick={submit}
        >
          별칭 등록하기
        </button>
      </main>

      <Modal
        open={confirmOpen}
        secondaryLabel="네"
        primaryLabel="아니요"
        variant="resell-buy"
        logoSrc={resellModalLogo}
        onSecondary={() => navigate('/resell')}
        onPrimary={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      >
        <p>
          구매하면 소유권이 이전되고
          <br />
          봉인된 편지가 열립니다. 진행할까요?
        </p>
      </Modal>
    </AppShell>
  )
}
