import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { usePhotoPick } from '../../hooks/usePhotoPick'
import cameraIcon from '../../assets/final/camera.svg'
import { products } from '../../data/mock'

function scoreToSignal(score) {
  if (score == null) return 'idle'
  if (score >= 85) return 'good'
  if (score >= 70) return 'warn'
  return 'bad'
}

export default function AiDiagnosisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === id) ?? products[0]
  const [photos, setPhotos] = useState([null, null, null])
  const [activeSlot, setActiveSlot] = useState(0)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(null)

  const { pickers, openGallery, openCamera } = usePhotoPick({
    onPick: ({ url }) => {
      setPhotos((prev) => prev.map((v, i) => (i === activeSlot ? url : v)))
      setSourceOpen(false)
      setLoading(true)
      setScore(null)
    },
  })

  const filled = photos.filter(Boolean).length
  const signal = useMemo(() => {
    if (loading || filled === 0) return 'idle'
    return scoreToSignal(score ?? product.careScore)
  }, [loading, filled, score, product.careScore])

  useEffect(() => {
    if (!loading) return undefined
    const timer = setTimeout(() => {
      setLoading(false)
      // Mock diagnosis: use product careScore with slight variance by photo count
      const base = product.careScore ?? 80
      const next = Math.max(40, Math.min(100, base - (3 - filled) * 4))
      setScore(next)
    }, 1800)
    return () => clearTimeout(timer)
  }, [loading, filled, product.careScore])

  const resultCopy =
    signal === 'good'
      ? '모서리 마모 · 스트랩 상태 양호'
      : signal === 'warn'
        ? '일부 마모 확인 · 케어 권장'
        : signal === 'bad'
          ? '수리가 필요한 손상이 감지되었습니다'
          : 'AI가 제품 상태를 진단하고 있습니다.'

  return (
    <AppShell showBack onBack={() => navigate(`/my/products/${product.id}`)}>
      {pickers}
      <div className="page page--ai">
        <section className="ai-upload">
          <p className="ai-upload__label">
            사진 업로드<span>*</span>
          </p>
          <div className="ai-upload__slots">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                className={`ai-upload__slot${i === 0 && !photo ? ' ai-upload__slot--dashed' : ''}${photo ? ' is-filled' : ''}`}
                onClick={() => {
                  setActiveSlot(i)
                  setSourceOpen(true)
                }}
                aria-label={`사진 ${i + 1} 업로드`}
              >
                {photo ? (
                  <img className="ai-upload__preview" src={photo} alt="" />
                ) : i === 0 ? (
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
            <div
              className={`ai-signal ai-signal--${signal}`}
              role="status"
              aria-label={
                signal === 'good'
                  ? '양호'
                  : signal === 'warn'
                    ? '주의'
                    : signal === 'bad'
                      ? '수리 필요'
                      : '대기'
              }
            >
              <span className="ai-signal__light ai-signal__light--green" />
              <span className="ai-signal__light ai-signal__light--yellow" />
              <span className="ai-signal__light ai-signal__light--red" />
            </div>
          </div>
          <div className="ai-result__card">
            {loading || filled === 0 ? (
              <>
                <div className="ai-result__loader" aria-hidden />
                <p>AI가 제품 상태를 진단하고 있습니다.</p>
              </>
            ) : (
              <>
                <p className="ai-result__score">{score} / 100</p>
                <p>{resultCopy}</p>
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

      {sourceOpen ? (
        <div
          className="sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="사진 선택"
          onClick={() => setSourceOpen(false)}
        >
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <p className="sheet-card__title">사진 업로드</p>
            <button type="button" className="sheet-card__action" onClick={openCamera}>
              카메라
            </button>
            <button type="button" className="sheet-card__action" onClick={openGallery}>
              갤러리
            </button>
            <button
              type="button"
              className="sheet-card__action sheet-card__action--muted"
              onClick={() => setSourceOpen(false)}
            >
              취소
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
