import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { uploadFile } from '../../api/files'
import {
  getResellDetail,
  normalizeConditionGrade,
  updateResell,
} from '../../api/resells'
import { loadResellSharedContents, resolveOwnedProductId } from '../../api/resellContent'
import { useProfile } from '../../context/ProfileContext'
import previewImageIcon from '../../assets/final/resell-preview-image.svg'

function pickUploadedUrl(uploaded) {
  if (!uploaded) return ''
  if (typeof uploaded === 'string') return uploaded
  return uploaded.url || uploaded.fileUrl || uploaded.photoUrl || ''
}

function emptySlots() {
  return [null, null, null]
}

function slotsFromDetail(detail) {
  const sorted = [...(detail?.photos ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )
  const slots = emptySlots()
  sorted.slice(0, 3).forEach((photo, index) => {
    if (photo?.photoUrl) slots[index] = { url: photo.photoUrl, file: null }
  })
  return slots
}

function formatSummary(detail) {
  const summary = detail?.summary
  if (!summary) return '여정 요약 정보가 없습니다.'
  const owners = summary.generationCount ?? 0
  const cities = summary.cityCount ?? 0
  const years = summary.productAgeYears ?? 0
  return `${owners}명의 주인 / ${cities}개 도시 / ${years}년 여정`
}

function verifyPct(detail) {
  const ratio = detail?.summary?.verifyRatio
  if (ratio == null || Number.isNaN(Number(ratio))) return 0
  const value = Number(ratio)
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

export default function ResellEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useProfile()
  const sellerId = Number(profile.userId ?? profile.id)
  const inputRef = useRef(null)

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [activeSlot, setActiveSlot] = useState(0)
  const [photos, setPhotos] = useState(emptySlots)
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('A')
  const [letter, setLetter] = useState(location.state?.resellLetter ?? '')
  const [careTip, setCareTip] = useState(location.state?.resellCareTip ?? '')
  const [shareSelections] = useState(location.state?.resellShareSelections ?? [])
  const [situationSelections] = useState(location.state?.resellSituationSelections ?? [])
  const [letterShared, setLetterShared] = useState(false)
  const [caretipShared, setCaretipShared] = useState(false)
  const [productId, setProductId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setLoadError('리셀글 ID가 없습니다.')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    getResellDetail(id, {
      userId: Number.isFinite(sellerId) && sellerId > 0 ? sellerId : undefined,
    })
      .then(async (data) => {
        if (cancelled || !data) return
        setDetail(data)
        setPhotos(slotsFromDetail(data))
        setPrice(String(data.price ?? '').replace(/[^0-9]/g, ''))
        setCondition(normalizeConditionGrade(data.conditionGrade))
        setLetterShared(Boolean(data.lockedJourney?.hasLetter))
        setCaretipShared(Boolean(data.lockedJourney?.hasCareTip))

        const resolvedProductId = await resolveOwnedProductId({
          userId: sellerId,
          officialName: data.officialName,
        })
        if (cancelled) return
        setProductId(resolvedProductId)

        const shared = await loadResellSharedContents({
          productId: resolvedProductId,
          generation: data.summary?.generationCount,
          wantLetter: Boolean(data.lockedJourney?.hasLetter),
          wantCareTip: Boolean(data.lockedJourney?.hasCareTip),
        })
        if (cancelled) return
        if (!location.state?.resellLetter) setLetter(shared.letter || '')
        if (!location.state?.resellCareTip) setCareTip(shared.careTip || '')
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err?.message || '리셀글 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, sellerId, location.state?.resellLetter, location.state?.resellCareTip])

  const pickPhoto = (index) => {
    setActiveSlot(index)
    inputRef.current?.click()
  }

  const changePhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const url = URL.createObjectURL(file)
    setPhotos((current) =>
      current.map((photo, index) => (index === activeSlot ? { url, file } : photo)),
    )
  }

  const resolvePhotoUrls = async () => {
    const urls = []
    for (const photo of photos) {
      if (!photo) continue
      if (photo.file) {
        const uploaded = await uploadFile(photo.file)
        const photoUrl = pickUploadedUrl(uploaded)
        if (!photoUrl) throw new Error('업로드 응답에 사진 URL이 없습니다.')
        urls.push(photoUrl)
      } else if (photo.url) {
        urls.push(photo.url)
      }
    }
    return urls
  }

  const save = async () => {
    if (saving) return
    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      setSaveError('프로필을 선택한 뒤 수정해 주세요.')
      return
    }
    if (!price) {
      setSaveError('판매 가격을 입력해 주세요.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const photoUrls = await resolvePhotoUrls()
      await updateResell(id, {
        sellerId,
        price: Number(price),
        conditionGrade: condition,
        letterShared: letterShared || Boolean(letter),
        caretipShared: caretipShared || Boolean(careTip),
        ...(photoUrls.length > 0 ? { photoUrls } : {}),
      })
      navigate('/resell?manage=1')
    } catch (err) {
      setSaveError(err?.message || '리셀글 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const editContent = (step) => {
    navigate('/resell/new', {
      state: {
        resellStep: step,
        resellProductId: productId,
        resellLetter: letter,
        resellCareTip: careTip,
        resellShareSelections: shareSelections,
        resellSituationSelections: situationSelections,
        resellEditReturn: `/resell/${id}/edit`,
      },
    })
  }

  if (loading) {
    return (
      <AppShell showBack showNav={false} onBack={() => navigate('/resell?manage=1')}>
        <main className="resell-edit">
          <p role="status">리셀글 정보를 불러오는 중입니다.</p>
        </main>
      </AppShell>
    )
  }

  if (loadError || !detail) {
    return (
      <AppShell showBack showNav={false} onBack={() => navigate('/resell?manage=1')}>
        <main className="resell-edit">
          <p role="alert">{loadError || '리셀글 정보를 불러오지 못했습니다.'}</p>
          <button type="button" className="resell-edit__submit" onClick={() => navigate('/resell?manage=1')}>
            관리로 돌아가기
          </button>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell showBack showNav={false} onBack={() => navigate('/resell?manage=1')}>
      <main className="resell-edit">
        <section className="resell-edit__panel" aria-label="리셀글 수정">
          <input
            ref={inputRef}
            className="resell-edit__file"
            type="file"
            accept="image/*"
            onChange={changePhoto}
          />

          <div
            className="resell-edit__overview resell-overview"
            aria-label={`${detail.officialName || '제품'} 리셀글`}
          >
            <div className="resell-overview__inner">
              <p className="resell-overview__eyebrow">Brand Name</p>
              <p className="resell-overview__alias">{detail.officialName || '—'}</p>
              <div className="resell-overview__meta">
                <span>{detail.summary?.isAuthenticated ? '정품 인증 완료' : '인증 정보 없음'}</span>
                <span>{detail.summary?.journeyCount ?? 0}개의 여정 기록</span>
              </div>
              <p className="resell-overview__score">{detail.summary?.provenanceScore ?? 0}</p>
            </div>
          </div>

          <div className="resell-edit__photos">
            {photos.map((photo, index) => (
              <button
                key={index}
                type="button"
                className="resell-edit__photo"
                onClick={() => pickPhoto(index)}
                aria-label={`${index + 1}번째 제품 사진 수정`}
              >
                {photo?.url ? (
                  <img className="resell-edit__uploaded" src={photo.url} alt="" />
                ) : (
                  <img src={previewImageIcon} alt="" width={48} height={48} />
                )}
              </button>
            ))}
          </div>

          <div className="resell-edit__price-row">
            <label className="resell-edit__price-field">
              <input
                value={price}
                inputMode="numeric"
                aria-label="판매 가격"
                onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ''))}
              />
              <span>원</span>
            </label>
            <label className="resell-edit__condition-field">
              <span className="sr-only">상태 등급</span>
              <select value={condition} onChange={(event) => setCondition(event.target.value)}>
                <option value="S">상태 S급</option>
                <option value="A">상태 A급</option>
                <option value="B">상태 B급</option>
              </select>
            </label>
          </div>

          <div className="resell-edit__stats">
            <p>{formatSummary(detail)}</p>
            <p>전체 여정의 {verifyPct(detail)}% 검증 완료</p>
          </div>

          {[
            {
              key: 'letter',
              label: 'Letter',
              value: letter,
              empty: letterShared ? '등록된 편지가 있습니다.' : '등록된 편지가 없습니다.',
            },
            {
              key: 'care',
              label: 'Care Tips',
              value: careTip,
              empty: caretipShared ? '등록된 케어팁이 있습니다.' : '등록된 케어팁이 없습니다.',
            },
          ].map((field) => (
            <div key={field.key} className="resell-edit__content">
              <div className="resell-edit__content-copy">
                <span>{field.label}</span>
                <small>{field.value || field.empty}</small>
              </div>
              <button
                type="button"
                className="resell-edit__modify"
                onClick={() => editContent(field.key)}
              >
                수정하기
              </button>
            </div>
          ))}

          <div className="resell-edit__content">
            <div className="resell-edit__content-copy">
              <span>Journey Log</span>
              <small>
                {shareSelections.length > 0
                  ? `${shareSelections.length}개의 여정 기록을 공유합니다.`
                  : '등록된 여정 기록이 없습니다.'}
              </small>
            </div>
            <button
              type="button"
              className="resell-edit__modify"
              onClick={() => editContent('share')}
            >
              수정하기
            </button>
          </div>
        </section>

        {saveError ? (
          <p role="alert" className="resell-empty__desc">
            {saveError}
          </p>
        ) : null}

        <button
          type="button"
          className="resell-edit__submit"
          onClick={save}
          disabled={saving}
        >
          {saving ? '수정 중...' : '수정 완료'}
        </button>
      </main>
    </AppShell>
  )
}
