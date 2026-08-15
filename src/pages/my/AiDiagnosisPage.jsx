import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShell } from '../../components/AppShell'
import cameraIcon from '../../assets/final/camera.svg'
import { products } from '../../data/mock'

export default function AiDiagnosisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === id) ?? products[0]
  const [photos, setPhotos] = useState([false, false, false])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!loading) return undefined
    const timer = setTimeout(() => setLoading(false), 2200)
    return () => clearTimeout(timer)
  }, [loading])

  const filled = photos.filter(Boolean).length

  return (
    <AppShell showBack onBack={() => navigate(`/my/products/${product.id}`)}>
      <div className="page page--ai">
        <section className="ai-upload">
          <p className="ai-upload__label">
            사진 업로드<span>*</span>
          </p>
          <div className="ai-upload__slots">
            {photos.map((filledSlot, i) => (
              <button
                key={i}
                type="button"
                className={`ai-upload__slot${i === 0 && !filledSlot ? ' ai-upload__slot--dashed' : ''}${filledSlot ? ' is-filled' : ''}`}
                onClick={() => {
                  setPhotos((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                  if (!photos[i]) setLoading(true)
                }}
                aria-label={`사진 ${i + 1}`}
              >
                {i === 0 && !filledSlot ? (
                  <img src={cameraIcon} alt="" width={24} height={24} />
                ) : null}
              </button>
            ))}
          </div>
          <p className="ai-upload__hint">
            제품이 잘 보이도록 여러 각도에서 찍은 사진 여러 장을 올려주세요.
          </p>
          <p className="ai-upload__hint">
            여러 각도, 상세한 사진이 많을수록 진단이 정확해집니다.
          </p>
        </section>

        <section className="ai-result">
          <div className="ai-result__head">
            <h2 className="ai-result__title">AI 진단 결과</h2>
            <span className="ai-result__dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="ai-result__card">
            {loading || filled === 0 ? (
              <>
                <div className="ai-result__loader" aria-hidden />
                <p>AI가 제품 상태를 진단하고 있습니다.</p>
              </>
            ) : (
              <>
                <p className="ai-result__score">88 / 100</p>
                <p>모서리 마모 · 스트랩 상태 양호</p>
              </>
            )}
          </div>
        </section>

        <button type="button" className="ai-repair-cta">
          <span className="ai-repair-cta__sub">제품 수리가 필요하신가요?</span>
          <span className="ai-repair-cta__title">수리 하러 가기</span>
          <span className="ai-repair-cta__arrow" aria-hidden>
            →
          </span>
        </button>
      </div>
    </AppShell>
  )
}
