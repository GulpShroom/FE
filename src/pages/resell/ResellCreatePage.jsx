import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { currentUser, journeys, products } from '../../data/mock'
import productBag from '../../assets/final/product-bag.png'
import planeTip from '../../assets/final/plane-tip-clear.png'
import cameraIcon from '../../assets/final/camera.svg'

const steps = [
  'select',
  'guide',
  'info',
  'share',
  'optional',
  'letter',
  'care',
  'confirm',
  'done',
]

/** Map internal steps onto Figma "Step X of 6" */
const STEP_OF_6 = {
  select: 1,
  guide: 1,
  info: 2,
  share: 3,
  optional: 3,
  letter: 4,
  care: 4,
  confirm: 5,
  done: 6,
}

const CONDITIONS = [
  { id: 'S', label: 'S급 (거의 새것)' },
  { id: 'A', label: 'A급 (사용감 적음)' },
  { id: 'B', label: 'B급 (사용감 있음)' },
]

const AI_LETTER =
  '안녕하세요. 이 가방과 함께한 시간들이 따뜻했습니다. 다음 주인님께도 좋은 여정이 이어지길 바랍니다.'

export default function ResellCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('S')
  const [photos, setPhotos] = useState([false, false, false])
  const [selectedJourneys, setSelectedJourneys] = useState(() =>
    journeys.filter((j) => j.productId === products[0]?.id).map((j) => j.id),
  )
  const [letter, setLetter] = useState('')
  const [careTip, setCareTip] = useState('')
  const [includeLetter, setIncludeLetter] = useState(true)
  const [includeCare, setIncludeCare] = useState(false)

  const product = products.find((p) => p.id === productId) ?? products[0]
  const productIndex = products.findIndex((p) => p.id === productId)
  const productJourneys = useMemo(
    () => journeys.filter((j) => j.productId === productId),
    [productId],
  )
  const key = steps[step]
  const stepOf6 = STEP_OF_6[key] ?? 1
  const fillPct = `${(stepOf6 / 6) * 100}%`
  const conditionLabel =
    CONDITIONS.find((c) => c.id === condition)?.label.replace(/급.*/, '급') ?? 'A급'

  const selectProduct = (id) => {
    setProductId(id)
    setSelectedJourneys(journeys.filter((j) => j.productId === id).map((j) => j.id))
  }

  const skipAdjust = (from, dir) => {
    let n = from
    while (n >= 0 && n < steps.length) {
      const k = steps[n]
      if (k === 'letter' && !includeLetter) {
        n += dir
        continue
      }
      if (k === 'care' && !includeCare) {
        n += dir
        continue
      }
      break
    }
    return Math.max(0, Math.min(n, steps.length - 1))
  }

  const next = () => setStep((s) => skipAdjust(s + 1, 1))
  const back = () => {
    if (step === 0) navigate('/resell')
    else setStep((s) => skipAdjust(s - 1, -1))
  }

  const progress = (
    <div className="reg-progress">
      <p className="reg-progress__label">Step {stepOf6} of 6</p>
      <div className="reg-progress__track">
        <div className="reg-progress__fill" style={{ width: fillPct }} />
        <img
          className="reg-progress__plane"
          src={planeTip}
          alt=""
          width={43}
          height={43}
          style={{ left: `max(0px, calc(${fillPct} - 21px))`, right: 'auto' }}
        />
      </div>
    </div>
  )

  return (
    <AppShell showNav={false} showBack onBack={back}>
      <div className="page form-stack">
        {key === 'select' ? (
          <>
            {progress}
            <h1 className="resell-create__title">어떤 물품을 리셀하시겠어요?</h1>
            <p className="resell-create__sub">
              보유하고 계신 물품 중 리셀할 물품(별칭)을 선택해주세요.
            </p>

            <div className="resell-pick">
              <button
                type="button"
                className="resell-overview"
                onClick={() => {
                  const nextId = products[(productIndex + 1) % products.length]?.id
                  if (nextId) selectProduct(nextId)
                }}
              >
                <div className="resell-overview__inner">
                  <p className="resell-overview__eyebrow">Journey Overview</p>
                  <p className="resell-overview__alias">{product.alias}</p>
                  <div className="resell-overview__meta">
                    <span>정품 인증 완료</span>
                    <span>{product.journeyCount}개의 여정 기록</span>
                  </div>
                  <img
                    className="resell-overview__stamp"
                    src={product.stamp}
                    alt=""
                    width={160}
                    height={160}
                  />
                  <p className="resell-overview__score">{product.careScore ?? 87}</p>
                </div>
              </button>
            </div>

            <div className="passport-rail" aria-label="제품 선택">
              {products.map((p, i) =>
                i === productIndex ? (
                  <span
                    key={p.id}
                    className="passport-rail__pill"
                    style={{ background: 'var(--mc-green)' }}
                  />
                ) : (
                  <button
                    key={p.id}
                    type="button"
                    className="passport-rail__dot"
                    style={{ background: 'var(--mc-green)', border: 0, padding: 0 }}
                    onClick={() => selectProduct(p.id)}
                    aria-label={p.alias}
                  />
                ),
              )}
            </div>

            <div className="resell-inherit">
              <p className="resell-inherit__label">계승 정보</p>
              <div className="resell-inherit__box">
                <span>이전 소유자</span>
                <strong>
                  {Math.max(0, (product?.generations?.length ?? 1) - 1)}명
                </strong>
              </div>
            </div>

            <button type="button" className="resell-next" onClick={next}>
              다음
            </button>
          </>
        ) : null}

        {key === 'guide' ? (
          <>
            {progress}
            <div className="resell-guide">
              <div className="resell-guide__clip" aria-hidden>
                <span className="resell-guide__clip-top" />
                <span className="resell-guide__clip-neck" />
              </div>
              <div className="resell-guide__board">
                <h1 className="resell-guide__title">리셀 서비스 가이드</h1>
                <p className="resell-guide__body">
                  원본 사진, 개인 메모, GPS, 인물은
                  <br />
                  나의 개인 기록으로만 남아요.
                  <br />
                  <br />
                  특정 정보는 거래 상대방에게 전달되지
                  <br />
                  않아 프라이버시가 보호됩니다.
                </p>
              </div>
            </div>
            <button type="button" className="resell-next" onClick={next}>
              확인하였습니다.
            </button>
          </>
        ) : null}

        {key === 'info' ? (
          <>
            {progress}
            <h1 className="resell-create__title">일반 리셀 정보</h1>
            <p className="resell-create__sub resell-create__sub--14">
              구매자가 가장 먼저 확인하는 기본 정보입니다.
            </p>

            <div className="resell-info-card">
              <div className="resell-info-card__row">
                <span>상품명</span>
                <strong>{product.nameEn ?? product.name}</strong>
              </div>
              <div className="resell-info-card__row">
                <span>판매자</span>
                <strong>{currentUser.handle}</strong>
              </div>
            </div>

            <div className="resell-field">
              <p className="resell-field__label">
                실물 사진 등록 <em>*</em>
              </p>
              <div className="resell-photos">
                {photos.map((filled, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`resell-photo${i === 0 && !filled ? ' is-upload' : ''}${filled ? ' is-filled' : ''}`}
                    onClick={() =>
                      setPhotos((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                    }
                    aria-label={filled ? '사진 제거' : '사진 추가'}
                  >
                    {filled ? (
                      <img src={productBag} alt="" width={72} height={72} />
                    ) : i === 0 ? (
                      <img
                        className="resell-photo__cam"
                        src={cameraIcon}
                        alt=""
                        width={24}
                        height={24}
                      />
                    ) : null}
                  </button>
                ))}
              </div>
              <p className="resell-field__hint">최소 1장 이상의 사진이 필요합니다.</p>
            </div>

            <div className="resell-field">
              <p className="resell-field__label">
                상품 상태 <em>*</em>
              </p>
              <div className="resell-condition">
                <p className="resell-condition__ai">⚡ AI 상태 추천</p>
                <div className="resell-condition__opts">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={condition === c.id ? 'is-active' : ''}
                      onClick={() => setCondition(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="resell-condition__note">
                  ※ 추천 결과는 참고용이며, 최종 상태 판정과 책임은 판매자에게 있습니다.
                </p>
              </div>
            </div>

            <div className="resell-field">
              <p className="resell-field__label">
                판매 가격 <em>*</em>
              </p>
              <div className="resell-price">
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="가격을 입력해주세요"
                  inputMode="numeric"
                />
                <span>원</span>
              </div>
            </div>

            <button type="button" className="resell-next" onClick={next}>
              다음
            </button>
          </>
        ) : null}

        {key === 'share' ? (
          <>
            {progress}
            <h1 className="resell-create__title">여정 기록을 공유하시겠어요?</h1>
            <p className="resell-create__sub">
              구매자에게 나의 소중한 여정 기록을 전달할 수 있습니다.
            </p>

            <div className="resell-share-card">
              <p>
                등록하신 제품의 여정 기록 {productJourneys.length}개 중 AI가 선별한 핵심
                회고와 태그가 구매자에게 전달됩니다.
              </p>
              <button type="button" className="resell-share-card__preview">
                계승될 여정 미리보기
              </button>
            </div>

            <div className="resell-share-head">
              <p className="resell-share-head__title">자유 텍스트 수정분 선택</p>
              <span>선택 사항</span>
            </div>
            <p className="resell-create__sub" style={{ marginTop: -4 }}>
              직접 수정한 여정 기록 중 구매자에게 공유하고 싶은 항목을 선택해주세요.
            </p>

            <div className="resell-journey-opts">
              {productJourneys.map((j) => {
                const on = selectedJourneys.includes(j.id)
                const title = j.quote.replace(/[“”"]/g, '')
                return (
                  <label key={j.id} className={`resell-journey-opt${on ? ' is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => {
                        setSelectedJourneys((prev) =>
                          e.target.checked
                            ? [...prev, j.id]
                            : prev.filter((id) => id !== j.id),
                        )
                      }}
                    />
                    <span className="resell-journey-opt__box" aria-hidden>
                      {on ? '✓' : ''}
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{j.body}</p>
                    </div>
                  </label>
                )
              })}
            </div>

            <button type="button" className="resell-next" onClick={next}>
              다음
            </button>
          </>
        ) : null}

        {key === 'optional' ? (
          <>
            {progress}
            <h1 className="resell-create__title">선택 공개 설정</h1>
            <p className="resell-opt__section">선택 공개 정보</p>
            <p className="resell-create__sub resell-create__sub--14">
              어떤 정보를 다음 구매자에게 공개할지 선택하세요.
            </p>

            <button
              type="button"
              className={`resell-opt-card${includeLetter ? ' is-on' : ''}`}
              onClick={() => setIncludeLetter((v) => !v)}
            >
              <span className="resell-opt-card__check" aria-hidden>
                {includeLetter ? '✓' : ''}
              </span>
              <div>
                <strong>Letter</strong>
                <p>다음 주인을 위한 남겨둔 메시지</p>
                <span>* 편지는 구매 후 구매한 사람에게만 노출됩니다.</span>
              </div>
            </button>

            <button
              type="button"
              className={`resell-opt-card${includeCare ? ' is-on' : ''}`}
              onClick={() => setIncludeCare((v) => !v)}
            >
              <span className="resell-opt-card__check" aria-hidden>
                {includeCare ? '✓' : ''}
              </span>
              <div>
                <strong>Care Tips</strong>
                <p>오래도록 잘 사용하기 위한 나만의 팁</p>
              </div>
            </button>

            <button type="button" className="resell-next" onClick={next}>
              다음
            </button>
          </>
        ) : null}

        {key === 'letter' ? (
          <>
            {progress}
            <h1 className="resell-create__title">
              다음 주인에게 전할
              <br />
              따뜻한 메시지를 남겨주세요.
            </h1>
            <p className="resell-create__sub">
              편지는 구매 완료 후 새 주인에게만 공개됩니다.
              <br />
              물건에 얽힌 추억이나 관리 팁, 따뜻한 인사를 자유롭게 적어주세요.
            </p>

            <div className="resell-compose">
              <textarea
                value={letter}
                maxLength={200}
                onChange={(e) => setLetter(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="resell-compose__bar">
              <button
                type="button"
                className="resell-compose__ai"
                onClick={() => setLetter(AI_LETTER.slice(0, 200))}
              >
                AI로 초안 만들기
              </button>
              <span className="resell-compose__count">{letter.length}/200</span>
            </div>

            <button type="button" className="resell-next" onClick={next}>
              다음
            </button>
          </>
        ) : null}

        {key === 'care' ? (
          <>
            {progress}
            <h1 className="resell-create__title">
              다음 주인에게 전할
              <br />
              케어팁을 남겨주세요.
            </h1>
            <p className="resell-create__sub">
              오래도록 잘 사용하기 위한 나만의 팁을 작성해주세요.
            </p>

            <div className="resell-compose">
              <textarea
                value={careTip}
                maxLength={200}
                onChange={(e) => setCareTip(e.target.value)}
                placeholder=""
              />
            </div>
            <p className="resell-compose__count resell-compose__count--end">
              {careTip.length}/200
            </p>

            <button type="button" className="resell-next" onClick={next}>
              다음
            </button>
          </>
        ) : null}

        {key === 'confirm' ? (
          <>
            {progress}
            <h1 className="resell-create__title">최종 확인 및 등록</h1>
            <p className="resell-create__sub">
              등록 전 마지막으로 정보를 확인해주세요.
              <br />
              다른 사용자에게 이렇게 보여집니다.
            </p>

            <p className="resell-preview-label">서사 프리뷰</p>
            <article className="resell-preview">
              <div className="resell-preview__photos">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="resell-preview__photo">
                    {photos[i] ? (
                      <img src={productBag} alt="" width={48} height={48} />
                    ) : (
                      <span className="resell-preview__photo-empty" aria-hidden />
                    )}
                  </div>
                ))}
              </div>

              <div className="resell-preview__price-row">
                <p className="resell-preview__price">
                  {price ? `${price}원` : '가격 미입력'}
                </p>
                <span className="resell-preview__badge">상태 {conditionLabel}</span>
              </div>

              <div className="resell-preview__stats">
                <p className="resell-preview__stat">{product.summary}</p>
                <p className="resell-preview__stat">
                  전체 여정의 {product.verifiedPct}% 검증 완료
                </p>
              </div>

              {includeLetter ? (
                <div className="resell-preview__row">
                  Letter (구매자에게만 공개됩니다.)
                </div>
              ) : null}
              {includeCare ? (
                <div className="resell-preview__row resell-preview__row--tall">Care Tips</div>
              ) : null}
              {selectedJourneys.length > 0 ? (
                <div className="resell-preview__row">
                  <span>Journey Log</span>
                  <span className="resell-preview__chev" aria-hidden>
                    ›
                  </span>
                </div>
              ) : null}
            </article>

            <button type="button" className="resell-next" onClick={next}>
              등록하기
            </button>
          </>
        ) : null}

        {key === 'done' ? (
          <>
            {progress}
            <div className="resell-done">
              <p className="resell-done__title">
                리셀 등록이
                <br />
                완료되었습니다!
              </p>
            </div>
            <button
              type="button"
              className="resell-next"
              onClick={() => navigate('/resell?manage=1')}
            >
              내 리셀글 보러가기
            </button>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
