import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { EmptyProductState } from '../../components/EmptyProductState'
import { ProductSelect } from '../../components/ProductSelect'
import { useProfile } from '../../context/ProfileContext'
import { isNotFoundError, sameProductId } from '../../api/client'
import { uploadFile } from '../../api/files'
import {
  analyzeJourney,
  applyAnalyzeToForm,
  hasExifFromAnalyze,
  buildCreateJourneyBody,
  buildUpdateJourneyBody,
  cityToUi,
  countryToUi,
  createJourney,
  getCachedJourney,
  getJourney,
  mapJourneyDetail,
  monthToUi,
  regenerateJourneyRecall,
  updateJourney,
} from '../../api/journeys'
import { getUserProducts, mapUserProduct } from '../../api/products'
import { journeys } from '../../data/mock'
import addPhotoIcon from '../../assets/final/form-add-photo.svg'
import replayIcon from '../../assets/final/form-replay.svg'
import chevronIcon from '../../assets/final/form-chevron.png'
import logo from '../../assets/final/logo.png'

function pickUploadedUrl(uploaded) {
  if (!uploaded) return ''
  if (typeof uploaded === 'string') return uploaded
  return uploaded.url || uploaded.fileUrl || uploaded.photoUrl || ''
}

const TONES = ['감성적', '담백하게', '발랄하게']
const YEARS = Array.from({ length: 10 }, (_, i) => String(2026 - i))
const MONTHS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
  '모름',
]
const COUNTRIES = ['한국', '일본', '미국', '프랑스', '이탈리아']
const CITIES = {
  한국: ['서울', '부산', '제주', '모름'],
  일본: ['도쿄', '오사카', '모름'],
  미국: ['뉴욕', 'LA', '모름'],
  프랑스: ['파리', '모름'],
  이탈리아: ['밀라노', '로마', '모름'],
}
const QUOTE_SAMPLES = {
  감성적: '“뉴욕의 밤, 그래미 시상식을 함께한 날”',
  담백하게: '“비 오는 출근길, 가방이 우산이 되어준 날”',
  발랄하게: '“금요일 밤, 퇴근 후 쏘삼을 함께 한 날”',
}

const DEFAULT_TAG_SOURCES = {
  activity: 'free_text',
  situation: 'free_text',
  style: 'free_text',
}

function MiniSelect({ value, options, onChange, width, showChevron = true, disabled = false }) {
  const opts = options.includes(value) || !value ? options : [value, ...options]

  return (
    <label
      className={`mini-select${showChevron ? '' : ' mini-select--plain'}${disabled ? ' mini-select--locked' : ''}`}
      style={width ? { width } : undefined}
    >
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {opts.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {showChevron && !disabled ? <img src={chevronIcon} alt="" width={15} height={15} /> : null}
    </label>
  )
}

function withTag(list, value) {
  if (!value || list.includes(value)) return list
  return [value, ...list]
}

function seedForm(existing, fallbackProductId) {
  const country = existing?.country ? countryToUi(existing.country) : '한국'

  return {
    productId: existing?.productId ?? fallbackProductId,
    quote: existing?.quote ?? QUOTE_SAMPLES['감성적'],
    memo: existing?.memo ?? '',
    tone: existing?.tone ?? '감성적',
    year: existing?.journeyYear != null ? String(existing.journeyYear) : '2026',
    month: existing ? monthToUi(existing.journeyMonth) : '5월',
    country,
    city: existing ? cityToUi(existing.city) : '서울',
    activity: existing?.activity || '',
    situation: existing?.situation || '',
    style: existing?.style || '',
    tagSources: existing?.tagSources ?? { ...DEFAULT_TAG_SOURCES },
    photoName: existing?.photoName || (existing?.photoUrl || existing?.image ? '현재 사진' : ''),
    photoUrl: existing?.photoUrl || '',
    photoPreview: existing?.photoPreview || existing?.photoUrl || existing?.image || '',
  }
}

export default function JourneyFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { profile } = useProfile()
  const isEdit = Boolean(id)
  const existing = useMemo(() => {
    if (!isEdit) return null
    return getCachedJourney(id) ?? journeys.find((j) => j.id === id) ?? null
  }, [id, isEdit])

  const queryProductId = searchParams.get('productId') || ''
  const seedProductId = existing?.productId || queryProductId || ''

  const [catalog, setCatalog] = useState([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [productsError, setProductsError] = useState(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [exifExtracted, setExifExtracted] = useState(false)
  const [form, setForm] = useState(() => seedForm(existing, seedProductId))
  const [initial, setInitial] = useState(form)
  const photoFileRef = useRef(null)
  const photoInputRef = useRef(null)
  const photoUrlRef = useRef(form.photoUrl || '')
  const previewUrlRef = useRef('')

  useEffect(() => {
    let cancelled = false
    getUserProducts(profile.id, { status: 'owning' })
      .then((data) => {
        if (cancelled) return
        setCatalog((data?.products ?? []).map(mapUserProduct))
        setProductsError(null)
        setProductsLoaded(true)
      })
      .catch((err) => {
        if (cancelled) return
        if (isNotFoundError(err)) {
          setCatalog([])
          setProductsError(null)
        } else {
          setCatalog([])
          setProductsError(err.message || '보유 제품을 불러오지 못했습니다')
        }
        setProductsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [profile.id])

  useEffect(() => {
    if (!isEdit || !id) return undefined
    let cancelled = false
    getJourney(id, { userId: profile.id })
      .then((data) => {
        if (cancelled || !data) return
        const mapped = mapJourneyDetail(data, { productId: seedProductId || queryProductId })
        const photoUrl = data.photoUrl || ''
        const next = seedForm(
          {
            ...mapped,
            photoUrl,
            image: photoUrl,
            photoName: photoUrl ? '현재 사진' : '',
          },
          seedProductId || queryProductId || mapped.productId,
        )
        setForm(next)
        setInitial(next)
        photoUrlRef.current = next.photoUrl || ''
      })
      .catch(() => {
        // keep cached seed
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, id, profile.id, seedProductId, queryProductId])

  const productOptions = useMemo(() => {
    if (
      isEdit &&
      existing?.productId &&
      !catalog.some((p) => sameProductId(p.id, existing.productId))
    ) {
      return [
        {
          id: String(existing.productId),
          alias: existing.alias || '내 제품',
          name: existing.name || existing.productName || '',
          nameEn: existing.name || existing.productName || '',
        },
        ...catalog,
      ]
    }
    return catalog
  }, [catalog, existing, isEdit])

  useEffect(() => {
    if (!productsLoaded || productOptions.length === 0) return
    const matched = productOptions.some((p) => sameProductId(p.id, form.productId))
    if (!matched) {
      setForm((f) => ({ ...f, productId: productOptions[0].id }))
    }
  }, [productsLoaded, productOptions, form.productId])

  const product =
    productOptions.find((p) => sameProductId(p.id, form.productId)) ?? productOptions[0] ?? null
  const cityOptions = withTag(CITIES[form.country] ?? CITIES['한국'], form.city)
  const yearOptions = withTag(YEARS, form.year)
  const recordsPath = `/journey/records/${form.productId || seedProductId || productOptions[0]?.id || ''}`
  const hasNoProducts = productsLoaded && !productsError && catalog.length === 0 && !isEdit

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const setTag = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
      tagSources: { ...f.tagSources, [key]: 'free_text' },
    }))
  }

  const onTone = (next) => {
    setForm((f) => ({ ...f, tone: next }))

    // 수정: 선택한 톤으로 회고 재생성
    if (isEdit && id) {
      setAnalyzing(true)
      setError(null)
      regenerateJourneyRecall(id, { userId: profile.id, tone: next })
        .then((data) => {
          setForm((f) => applyAnalyzeToForm({ ...f, tone: next }, data))
        })
        .catch((err) => {
          setError(err.message || '회고 문장 재생성에 실패했습니다')
        })
        .finally(() => {
          setAnalyzing(false)
        })
      return
    }

    // 작성: 사진이 있으면 analyze로 톤에 맞는 회고 생성
    if (photoFileRef.current) {
      void runAnalyze({ tone: next })
      return
    }

    setForm((f) => ({
      ...f,
      tone: next,
      quote: QUOTE_SAMPLES[next] ?? f.quote,
    }))
  }

  const runAnalyze = async ({ file, tone, productId } = {}) => {
    const photo = file || photoFileRef.current
    if (!photo) {
      setError('AI 큐레이터를 쓰려면 먼저 사진을 업로드해 주세요.')
      return
    }
    setAnalyzing(true)
    try {
      const data = await analyzeJourney({
        productId: productId || form.productId,
        userId: profile.id,
        tone: tone || form.tone,
        photo,
      })
      setForm((f) => applyAnalyzeToForm(f, data))
      setExifExtracted(hasExifFromAnalyze(data))
    } catch {
      // EXIF/분석 실패 시 시점·지역 드롭다운을 열어 직접 입력 가능하게 함
      setExifExtracted(false)
    } finally {
      setAnalyzing(false)
    }
  }

  const onReplay = () => {
    // 수정: 저장된 여정 태그 기반 회고 재생성 API
    if (isEdit && id) {
      setAnalyzing(true)
      setError(null)
      regenerateJourneyRecall(id, { userId: profile.id, tone: form.tone })
        .then((data) => {
          setForm((f) => applyAnalyzeToForm(f, data))
        })
        .catch((err) => {
          setError(err.message || '회고 문장 재생성에 실패했습니다')
        })
        .finally(() => {
          setAnalyzing(false)
        })
      return
    }

    // 작성: 사진 + analyze API
    if (photoFileRef.current) {
      void runAnalyze({ tone: form.tone })
      return
    }
    setError('AI 큐레이터를 쓰려면 먼저 사진을 업로드해 주세요.')
  }

  const onPhoto = async (e) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    photoFileRef.current = file
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const localPreview = URL.createObjectURL(file)
    previewUrlRef.current = localPreview
    photoUrlRef.current = ''

    setUploading(true)
    setError(null)
    setExifExtracted(false)
    setForm((f) => ({
      ...f,
      photoName: file.name,
      photoUrl: '',
      photoPreview: localPreview,
    }))

    try {
      const uploaded = await uploadFile(file)
      const photoUrl = pickUploadedUrl(uploaded)
      if (!photoUrl) {
        throw new Error('업로드 응답에 사진 URL이 없습니다.')
      }
      photoUrlRef.current = photoUrl
      setForm((f) => ({
        ...f,
        photoName: file.name,
        photoUrl,
        photoPreview: localPreview,
      }))
      setUploading(false)
      // analyze는 저장을 막지 않도록 백그라운드 실행
      void runAnalyze({ file, tone: form.tone, productId: form.productId })
    } catch (err) {
      photoUrlRef.current = ''
      setError(err.message || '사진 업로드에 실패했습니다')
      setUploading(false)
    } finally {
      // 같은 파일 재선택 가능하도록 초기화
      input.value = ''
    }
  }

  const goBack = () => {
    if (searchParams.get('from') === 'map') {
      navigate('/main?map=expanded')
      return
    }
    if (isEdit) {
      navigate(
        `/journey/entry/${id}?productId=${encodeURIComponent(form.productId || seedProductId)}`,
      )
      return
    }
    navigate(recordsPath || '/journey')
  }

  const onSave = async () => {
    if (saving) return
    if (!form.productId) {
      setError('저장할 제품을 선택해 주세요.')
      return
    }
    if (uploading) {
      setError('사진 업로드가 끝날 때까지 기다려 주세요.')
      return
    }
    setError(null)

    const photoUrl =
      photoUrlRef.current || form.photoUrl || import.meta.env.VITE_JOURNEY_PHOTO_URL
    if (!isEdit && !photoUrl) {
      setError('사진을 업로드해 주세요. 저장에는 사진 URL이 필요합니다.')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateJourney(
          id,
          buildUpdateJourneyBody(
            { ...form },
            initial,
            { userId: profile.id, photoUrl: photoUrlRef.current || form.photoUrl },
          ),
        )
      } else {
        await createJourney(
          buildCreateJourneyBody({ ...form }, { userId: profile.id, photoUrl }),
        )
      }
      setSuccessOpen(true)
    } catch (err) {
      setError(err.message || '여정 저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  if (!productsLoaded) {
    return (
      <AppShell showBack showNav={false} onBack={goBack}>
        <div className="page page--journey-form">
          <p className="journeys-status">보유 제품을 불러오는 중...</p>
        </div>
      </AppShell>
    )
  }

  if (hasNoProducts) {
    return (
      <AppShell showBack showNav={false} onBack={() => navigate('/journey')}>
        <EmptyProductState />
      </AppShell>
    )
  }

  if (productsError) {
    return (
      <AppShell showBack showNav={false} onBack={goBack}>
        <div className="page page--journey-form">
          <p className="journeys-status journeys-status--error">{productsError}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showBack showNav={false} onBack={goBack}>
      <div className="page page--journey-form">
        <ProductSelect
          products={productOptions}
          value={form.productId}
          onChange={(pid) => setField('productId', pid)}
          variant="outline"
          disabled={isEdit}
        />

        <label
          className={`photo-upload${form.photoPreview || form.photoUrl ? ' photo-upload--filled' : ''}`}
        >
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhoto}
            disabled={uploading}
          />
          {form.photoPreview || form.photoUrl ? (
            <>
              <img
                className="photo-upload__preview"
                src={form.photoPreview || form.photoUrl}
                alt=""
              />
              <p className="photo-upload__name">
                {uploading
                  ? '업로드 중…'
                  : analyzing
                    ? 'AI 분석 중…'
                    : form.photoUrl
                      ? form.photoName || (isEdit ? '사진 변경하기' : '사진이 준비됐어요')
                      : form.photoName || '사진 선택됨'}
              </p>
            </>
          ) : (
            <>
              <img src={addPhotoIcon} alt="" width={30} height={30} />
              <span>{isEdit ? '사진 변경하기' : '사진 업로드 하기'}</span>
            </>
          )}
        </label>

        <div className="quote-block">
          <div className="tone-row">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                className={`tone-chip${form.tone === t ? ' is-active' : ''}`}
                onClick={() => onTone(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="quote-field">
            <input
              type="text"
              value={form.quote}
              onChange={(e) => setField('quote', e.target.value)}
              aria-label="한 줄 기록"
            />
            <button
              type="button"
              className="quote-field__replay"
              onClick={onReplay}
              disabled={analyzing}
              aria-label="AI 여정 큐레이터 다시 생성"
            >
              <img src={replayIcon} alt="" width={15} height={15} />
            </button>
          </div>
        </div>

        <div className="form-duo">
          <div className="form-duo__col">
            <p className="form-duo__label">시점</p>
            <div className="form-duo__row">
              <MiniSelect
                value={form.year}
                options={yearOptions}
                onChange={(v) => setField('year', v)}
                width={75}
                disabled={exifExtracted}
              />
              <MiniSelect
                value={form.month}
                options={MONTHS}
                onChange={(v) => setField('month', v)}
                width={75}
                disabled={exifExtracted}
              />
            </div>
          </div>
          <div className="form-duo__col">
            <p className="form-duo__label">지역</p>
            <div className="form-duo__row">
              <MiniSelect
                value={form.country}
                options={COUNTRIES}
                onChange={(v) => {
                  setForm((f) => ({
                    ...f,
                    country: v,
                    city: (CITIES[v] ?? CITIES['한국'])[0],
                  }))
                }}
                width={75}
                disabled={exifExtracted}
              />
              <MiniSelect
                value={form.city}
                options={cityOptions}
                onChange={(v) => setField('city', v)}
                width={75}
                disabled={exifExtracted}
              />
            </div>
          </div>
        </div>

        <div className="form-trio">
          <div className="form-trio__col">
            <p className="form-duo__label form-duo__label--solid">활동</p>
            <label className="mini-input">
              <input
                type="text"
                value={form.activity}
                placeholder="직접 입력"
                aria-label="활동 태그"
                onChange={(e) => setTag('activity', e.target.value)}
              />
            </label>
          </div>
          <div className="form-trio__col">
            <p className="form-duo__label form-duo__label--solid">상황</p>
            <label className="mini-input">
              <input
                type="text"
                value={form.situation}
                placeholder="직접 입력"
                aria-label="상황 태그"
                onChange={(e) => setTag('situation', e.target.value)}
              />
            </label>
          </div>
          <div className="form-trio__col">
            <p className="form-duo__label form-duo__label--solid">스타일</p>
            <label className="mini-input">
              <input
                type="text"
                value={form.style}
                placeholder="직접 입력"
                aria-label="스타일 태그"
                onChange={(e) => setTag('style', e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="memo-field">
          <p className="form-duo__label">메모</p>
          <textarea
            value={form.memo}
            onChange={(e) => setField('memo', e.target.value)}
            placeholder="이 날의 기억을 남겨보세요."
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="button" className="btn-form-save" onClick={onSave} disabled={saving}>
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      {successOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--form-success">
            <div className="modal-card--form-success__head">
              <img src={logo} alt="M·Carry" width={90} height={27} />
            </div>
            <p className="modal-card--form-success__msg">
              {isEdit
                ? '여정 기록이 수정되었습니다.'
                : `“${product?.alias}”의 새로운 여정이 기록되었습니다.`}
            </p>
            <button
              type="button"
              className="btn-modal-pill"
              onClick={() => {
                if (searchParams.get('from') === 'map') {
                  navigate('/main?map=expanded')
                  return
                }
                navigate(recordsPath)
              }}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
