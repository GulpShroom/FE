import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { useProfile } from '../../context/ProfileContext'
import { usePhotoPick } from '../../hooks/usePhotoPick'
import { cacheLocalDiagnosis, createDiagnosis } from '../../api/my'
import cameraIcon from '../../assets/final/camera.svg'

/** conditionGrade 1~5 → 신호등: 1–2 수리필요, 3 주의, 4–5 양호 */
function gradeToSignal(grade) {
  const n = Number(grade)
  if (!Number.isFinite(n)) return 'idle'
  if (n >= 4) return 'good'
  if (n === 3) return 'warn'
  return 'bad'
}

function signalLabel(signal) {
  if (signal === 'good') return '양호'
  if (signal === 'warn') return '주의'
  if (signal === 'bad') return '수리 필요'
  return '대기'
}

function formatDotDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return String(iso || '')
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function shortText(text, max = 18) {
  const line = String(text ?? '').trim().split('\n')[0]
  if (line.length <= max) return line
  return `${line.slice(0, max)}…`
}

export default function AiDiagnosisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useProfile()
  const productId = id
  const detailPath = `/my/products/${productId}`
  const [photos, setPhotos] = useState([null, null, null])
  const [activeSlot, setActiveSlot] = useState(0)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const requestSeq = useRef(0)

  const diagnose = (files) => {
    if (!files.length || !productId) return
    const seq = ++requestSeq.current
    setLoading(true)
    setError('')
    setResult(null)
    createDiagnosis(productId, { userId: profile.id ?? 1, photos: files })
      .then((data) => {
        if (seq !== requestSeq.current) return
        setResult(data ?? null)
        if (data) {
          cacheLocalDiagnosis(productId, {
            id: data.diagnosisId != null ? `diag-${data.diagnosisId}` : `diag-${Date.now()}`,
            generation: data.generation != null ? `${data.generation}` : 'all',
            date: formatDotDate(data.diagnosedAt),
            title: shortText(data.resultText || `등급 ${data.conditionGrade ?? '-'}`),
            short: shortText(data.resultText || `등급 ${data.conditionGrade ?? '-'}`),
            result: data.resultText || '',
            solution: data.solutionText || '',
            keeper: data.generation != null ? `${data.generation} Keeper` : '현재 keeper',
            conditionGrade: data.conditionGrade,
            repairLinkUrl: data.repairLinkUrl || '',
          })
        }
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return
        setError(err.message || '진단에 실패했습니다.')
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false)
      })
  }

  const { pickers, openGallery, openCamera } = usePhotoPick({
    onPick: ({ file, url }) => {
      const next = photos.map((v, i) => (i === activeSlot ? { file, url } : v))
      setPhotos(next)
      setSourceOpen(false)
      const files = next.filter((slot) => slot?.file).map((slot) => slot.file)
      if (files.length >= 1) diagnose(files)
    },
  })

  const filled = photos.filter(Boolean).length
  const signal = useMemo(() => {
    if (loading || error || filled === 0 || !result) return 'idle'
    return gradeToSignal(result.conditionGrade)
  }, [loading, error, filled, result])

  const repairUrl = result?.repairLinkUrl

  return (
    <AppShell
      showBack
      onBack={() =>
        location.state?.fromResell
          ? navigate('/resell/new', {
              replace: true,
              state: {
                resellStep: location.state.resellStep,
                resellProductId: location.state.resellProductId,
              },
            })
          : navigate(detailPath)
      }
    >
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
                  <img className="ai-upload__preview" src={photo.url} alt="" />
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
              aria-label={signalLabel(signal)}
            >
              <span className="ai-signal__light ai-signal__light--green" />
              <span className="ai-signal__light ai-signal__light--yellow" />
              <span className="ai-signal__light ai-signal__light--red" />
            </div>
          </div>
          <div
            className={`ai-result__card${result && !loading && !error ? ' ai-result__card--filled' : ''}`}
          >
            {error ? (
              <p className="ai-result__error">{error}</p>
            ) : loading ? (
              <>
                <div className="ai-result__loader" aria-hidden />
                <p>AI가 제품 상태를 진단하고 있습니다.</p>
              </>
            ) : filled === 0 ? (
              <p>사진을 올리면 진단을 시작합니다.</p>
            ) : result ? (
              <>
                {result.conditionGrade != null ? (
                  <p className="ai-result__score">등급 {result.conditionGrade} / 5</p>
                ) : null}
                {result.resultText ? (
                  <p className="ai-result__text">{result.resultText}</p>
                ) : (
                  <p className="ai-result__text">진단 결과가 비어 있습니다.</p>
                )}
                {result.solutionText ? (
                  <p className="ai-result__solution">{result.solutionText}</p>
                ) : null}
              </>
            ) : (
              <p>사진을 올리면 진단을 시작합니다.</p>
            )}
          </div>
        </section>

        {repairUrl ? (
          <a
            className="ai-repair-cta"
            href={repairUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ai-repair-cta__sub">제품 수리가 필요하신가요?</span>
            <span className="ai-repair-cta__title">수리 하러 가기</span>
            <span className="ai-repair-cta__arrow" aria-hidden>
              →
            </span>
          </a>
        ) : (
          <button type="button" className="ai-repair-cta">
            <span className="ai-repair-cta__sub">제품 수리가 필요하신가요?</span>
            <span className="ai-repair-cta__title">수리 하러 가기</span>
            <span className="ai-repair-cta__arrow" aria-hidden>
              →
            </span>
          </button>
        )}
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
