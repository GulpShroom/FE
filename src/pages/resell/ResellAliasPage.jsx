import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { updateProductNickname } from '../../api/products'
import { useProfile } from '../../context/ProfileContext'
import resellModalLogo from '../../assets/final/resell-delete-logo.png'

export default function ResellAliasPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useProfile()
  const userId = Number(profile.userId ?? profile.id)
  const productId = location.state?.productId
  const officialName = location.state?.officialName || '계승 제품'
  const image = location.state?.image || ''

  const [alias, setAlias] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!alias.trim() || saving) return
    if (!productId) {
      setError('제품 정보가 없습니다.')
      return
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      setError('프로필을 선택한 뒤 등록해 주세요.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updateProductNickname(productId, {
        userId,
        nickname: alias.trim(),
      })
      setConfirmOpen(true)
    } catch (err) {
      setError(err?.message || '별칭 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
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
          {image ? <img src={image} alt={officialName} width={64} height={64} /> : null}
          <div>
            <span>등록 대상 제품</span>
            <strong>{officialName}</strong>
          </div>
        </section>

        <label className="resell-alias-page__label" htmlFor="resell-alias">
          별칭 입력
        </label>
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

        {error ? (
          <p role="alert" className="resell-empty__desc">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="resell-alias-page__submit"
          disabled={!alias.trim() || saving}
          onClick={submit}
        >
          {saving ? '등록 중...' : '별칭 등록하기'}
        </button>
      </main>

      <Modal
        open={confirmOpen}
        primaryLabel="확인"
        hideSecondary
        variant="resell-buy"
        logoSrc={resellModalLogo}
        onPrimary={() => navigate('/resell')}
        onClose={() => navigate('/resell')}
      >
        <p>
          별칭이 등록되었습니다.
          <br />
          리셀 목록으로 이동합니다.
        </p>
      </Modal>
    </AppShell>
  )
}
