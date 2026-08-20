import { useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { products, resellPosts } from '../../data/mock'
import { resellProductDummies } from '../../data/resellDummies'
import previewImageIcon from '../../assets/final/resell-preview-image.svg'

export default function ResellEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const savedPost = resellPosts.find((item) => item.id === id)
  const managedProduct = resellProductDummies.find((item) => item.id === id)
  const post = savedPost ?? {
    ...managedProduct,
    price: '150,000원',
    summary: '3명의 주인 / 8개 도시 / 4년 여정',
    verifiedPct: 88,
  }
  const selectedProduct = products.find((item) => item.id === post.productId) ?? products[0]
  const inputRef = useRef(null)
  const [activeSlot, setActiveSlot] = useState(0)
  const [photos, setPhotos] = useState(
    post.photos ?? (id === 'resell-product-1' ? [null, null, null] : [post.image ?? null, null, null]),
  )
  const [price, setPrice] = useState(post.price.replace(/[^0-9]/g, ''))
  const [condition, setCondition] = useState(post.condition ?? 'A')
  const [letter] = useState(location.state?.resellLetter ?? post.letter ?? '')
  const [careTip] = useState(location.state?.resellCareTip ?? post.careTip ?? '')
  const [journeyLog] = useState(post.journeyLog ?? '')
  const [shareSelections] = useState(
    location.state?.resellShareSelections ?? post.shareSelections ?? [0],
  )
  const [situationSelections] = useState(
    location.state?.resellSituationSelections ?? post.situationSelections ?? [],
  )

  const pickPhoto = (index) => {
    setActiveSlot(index)
    inputRef.current?.click()
  }

  const changePhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const url = URL.createObjectURL(file)
    setPhotos((current) => current.map((photo, index) => (index === activeSlot ? url : photo)))
  }

  const save = () => {
    const payload = {
      id,
      photos,
      price: Number(price),
      condition,
      letter,
      careTip,
      journeyLog,
      shareSelections,
      situationSelections,
    }

    // TODO: 리셀 수정 API가 연결되면 payload를 PATCH 요청으로 전달합니다.
    console.info('resell edit payload', payload)
    navigate('/resell?manage=1')
  }

  const editContent = (step) => {
    navigate('/resell/new', {
      state: {
        resellStep: step,
        resellProductId: post.productId,
        resellLetter: letter,
        resellCareTip: careTip,
        resellShareSelections: shareSelections,
        resellSituationSelections: situationSelections,
        resellEditReturn: `/resell/${id}/edit`,
      },
    })
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

          <div className="resell-edit__overview resell-overview" aria-label={`${post.alias} 제품`}>
            <div className="resell-overview__inner">
              <p className="resell-overview__eyebrow">Brand Name</p>
              <p className="resell-overview__alias">{post.alias ?? selectedProduct.alias}</p>
              <div className="resell-overview__meta">
                <span>정품 인증 완료</span>
                <span>{post.journeyCount ?? selectedProduct.journeyCount}개의 여정 기록</span>
              </div>
              {selectedProduct.stamp ? (
                <span className="resell-overview__stamp-box" aria-hidden="true">
                  <img className="resell-overview__stamp" src={selectedProduct.stamp} alt="" />
                </span>
              ) : null}
              <p className="resell-overview__score">
                {post.score ?? selectedProduct.overallScore}
              </p>
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
                {photo ? (
                  <img className="resell-edit__uploaded" src={photo} alt="" />
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
            <p>{post.summary}</p>
            <p>전체 여정의 {post.verifiedPct}% 검증 완료</p>
          </div>

          {[
            {
              key: 'letter',
              label: 'Letter',
              value: letter,
              empty: '등록된 편지가 없습니다.',
            },
            {
              key: 'care',
              label: 'Care Tips',
              value: careTip,
              empty: '등록된 케어팁이 없습니다.',
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
                  : journeyLog || '등록된 여정 기록이 없습니다.'}
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

        <button
          type="button"
          className="resell-edit__submit"
          onClick={save}
        >
          수정 완료
        </button>
      </main>
    </AppShell>
  )
}
