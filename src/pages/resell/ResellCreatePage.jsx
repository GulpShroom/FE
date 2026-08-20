import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { currentUser, products } from '../../data/mock'
import planeTip from '../../assets/final/progress-plane.png'
import cameraIcon from '../../assets/final/camera.svg'
import checkCircleIcon from '../../assets/final/resell-check-circle.svg'
import documentAddIcon from '../../assets/final/resell-document-add.svg'
import selectedCheckIcon from '../../assets/final/resell-selected-check.svg'
import messageHelperRing from '../../assets/final/resell-message-helper.svg'
import messageHelperMark from '../../assets/final/resell-message-connector.svg'
import previewImageIcon from '../../assets/final/resell-preview-image.svg'
import previewChevronIcon from '../../assets/final/resell-preview-chevron.svg'
import { resellProductDummies } from '../../data/resellDummies'

const steps = [
  'select',
  'guide',
  'info',
  'defaults',
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
  defaults: 3,
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

const SHARE_JOURNEYS = [
  {
    title: '첫 세탁의 기억',
    body: '처음으로 드라이클리닝을 맡겼을 때의 조심스러움. 원단이 상하지 않게 신경 썼던 기억이 납니다.',
    situations: ['사과', '바나나', '포도'],
  },
  {
    title: '특별한 날의 착용',
    body: '친한 친구의 결혼식 날 착용했던 특별한 기억. 좋은 자리에 함께했던 옷입니다.',
    situations: ['결혼식', '친구', '기념일'],
  },
  {
    title: '단추 수선 완료',
    body: '떨어질 뻔한 단추를 비슷한 색상의 실로 튼튼하게 다시 달았습니다.',
    situations: ['단추', '수선', '관리'],
  },
]

export default function ResellCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnStep = steps.indexOf(location.state?.resellStep)
  const [step, setStep] = useState(returnStep >= 0 ? returnStep : 0)
  const [productId, setProductId] = useState(
    location.state?.resellProductId ?? products[0]?.id ?? '',
  )
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('S')
  const [photos, setPhotos] = useState([null, null, null])
  const [photoSlot, setPhotoSlot] = useState(0)
  const photoInputRef = useRef(null)
  const [letter, setLetter] = useState(location.state?.resellLetter ?? '')
  const [careTip, setCareTip] = useState(location.state?.resellCareTip ?? '')
  const [includeLetter, setIncludeLetter] = useState(true)
  const [includeCare, setIncludeCare] = useState(false)
  const [aiPromptOpen, setAiPromptOpen] = useState(false)
  const [shareSelections, setShareSelections] = useState(
    location.state?.resellShareSelections ?? [0],
  )
  const [situationSelections, setSituationSelections] = useState(
    location.state?.resellSituationSelections ?? [],
  )

  const product = products.find((p) => p.id === productId) ?? products[0]
  const productIndex = products.findIndex((p) => p.id === productId)
  const selectProductIndex = Math.max(0, Math.min(productIndex, resellProductDummies.length - 1))
  const selectProductDetails = resellProductDummies[selectProductIndex]
  const key = steps[step]
  const isContentEdit = Boolean(
    location.state?.resellEditReturn && ['letter', 'care', 'share'].includes(key),
  )
  const stepOf6 = STEP_OF_6[key] ?? 1
  const fillPct = `${(stepOf6 / 6) * 100}%`
  const conditionLabel =
    CONDITIONS.find((c) => c.id === condition)?.label.replace(/급.*/, '급') ?? 'A급'

  useEffect(() => {
    const resetScroll = () => {
      const scroller = document.querySelector('.phone-shell__body')
      if (scroller) {
        scroller.scrollTop = 0
        scroller.scrollLeft = 0
      }
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)
    const timer = window.setTimeout(resetScroll, 50)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [step])

  const selectProduct = (id) => {
    setProductId(id)
  }

  const openPhotoPicker = (index) => {
    setPhotoSlot(index)
    photoInputRef.current?.click()
  }

  const uploadPhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const photo = { file, url: URL.createObjectURL(file) }
    setPhotos((previous) =>
      previous.map((item, index) => (index === photoSlot ? photo : item)),
    )

    // API 연동 전 임시 AI 판정: 이미지 용량을 기준으로 추천 상태를 생성합니다.
    if (file.size >= 5 * 1024 * 1024) setCondition('B')
    else if (file.size >= 2 * 1024 * 1024) setCondition('A')
    else setCondition('S')
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

  const next = () => {
    if (location.state?.resellEditReturn && ['letter', 'care', 'share'].includes(key)) {
      navigate(location.state.resellEditReturn, {
        replace: true,
        state: {
          resellLetter: letter,
          resellCareTip: careTip,
          resellShareSelections: shareSelections,
          resellSituationSelections: situationSelections,
        },
      })
      return
    }
    setStep((s) => skipAdjust(s + 1, 1))
  }
  const generateAiLetter = () => {
    // 실제 AI API 연동 시 이 함수의 본문만 API 호출로 교체합니다.
    setLetter(AI_LETTER.slice(0, 200))
    setAiPromptOpen(false)
  }
  const back = () => {
    if (step === 0) navigate('/resell')
    else setStep((s) => skipAdjust(s - 1, -1))
  }

  const progress = isContentEdit ? null : (
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
          style={{
            left:
              key === 'done'
                ? 'calc(100% - 43px)'
                : `max(0px, calc(${fillPct} - 21px))`,
            right: 'auto',
          }}
        />
      </div>
    </div>
  )

  return (
    <AppShell showNav={false} showBack={!isContentEdit} onBack={back}>
      <div
        className={`page form-stack page--resell-create${
          key === 'select'
            ? ' page--resell-create-select'
            : key === 'guide'
              ? ' page--resell-create-guide'
              : key === 'info'
                ? ' page--resell-create-info'
                : key === 'defaults'
                  ? ' page--resell-create-defaults'
                  : key === 'share'
                    ? ' page--resell-create-share'
                    : key === 'optional'
                      ? ' page--resell-create-optional'
                      : key === 'letter'
                        ? ' page--resell-create-letter'
                        : key === 'care'
                          ? ' page--resell-create-care'
                          : key === 'confirm'
                            ? ' page--resell-create-confirm'
                            : key === 'done'
                              ? ' page--resell-create-done'
              : ''
        }${isContentEdit ? ' page--resell-content-edit' : ''}`}
        style={{
          '--share-expanded': shareSelections.length,
          '--confirm-reduction': `${(includeLetter ? 0 : 52) + (includeCare ? 0 : 199)}px`,
        }}
      >
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
                  const nextId = resellProductDummies[
                    (selectProductIndex + 1) % resellProductDummies.length
                  ]?.productId
                  if (nextId) selectProduct(nextId)
                }}
              >
                <div className="resell-overview__inner">
                  <p className="resell-overview__eyebrow">Journey Overview</p>
                  <p className="resell-overview__alias">{selectProductDetails.alias}</p>
                  <div className="resell-overview__meta">
                    <span>정품 인증 완료</span>
                    <span>{selectProductDetails.journeyCount}개의 여정 기록</span>
                  </div>
                  <span className="resell-overview__stamp-box" aria-hidden="true">
                    <img
                      className="resell-overview__stamp"
                      src={product.stamp}
                      alt=""
                      width={168}
                      height={168}
                    />
                  </span>
                  <p className="resell-overview__score">{selectProductDetails.score}</p>
                </div>
              </button>
            </div>

            <div className="passport-rail" aria-label="제품 선택">
              {resellProductDummies.map((dummy, i) =>
                i === selectProductIndex ? (
                  <span
                    key={dummy.id}
                    className="passport-rail__pill"
                    style={{ background: 'var(--mc-green)' }}
                  />
                ) : (
                  <button
                    key={dummy.id}
                    type="button"
                    className="passport-rail__dot"
                    style={{ background: 'var(--mc-green)', border: 0, padding: 0 }}
                    onClick={() => selectProduct(dummy.productId)}
                    aria-label={`${dummy.alias} 선택`}
                  />
                ),
              )}
            </div>

            <div className="resell-inherit">
              <p className="resell-inherit__label">계승 정보</p>
              <div className="resell-inherit__box">
                <span>이전 소유자</span>
                <strong>{selectProductDetails.previousOwnerCount}명</strong>
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

            <div className="resell-field resell-field--photos">
              <p className="resell-field__label">
                실물 사진 등록 <em>*</em>
              </p>
              <div className="resell-photos">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={uploadPhoto}
                />
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`resell-photo${i === 0 && !photo ? ' is-upload' : ''}${photo ? ' is-filled' : ''}`}
                    onClick={() => openPhotoPicker(i)}
                    aria-label={photo ? '사진 변경' : '사진 추가'}
                  >
                    {photo ? (
                      <img src={photo.url} alt="업로드한 상품" width={96} height={96} />
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

            <div className="resell-field resell-field--condition">
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

            <div className="resell-field resell-field--price">
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

        {key === 'defaults' ? (
          <>
            {progress}
            <h1 className="resell-defaults__title">디폴트 공개 설정</h1>

            <article className="resell-defaults-summary">
              <div className="resell-defaults-summary__inner">
                <p className="resell-defaults-summary__alias">{selectProductDetails.alias}</p>
                <div className="resell-defaults-summary__facts">
                  {[
                    'MCM 정품 인증 완료',
                    '3명의 주인 / 8개 도시 / 4년 여정',
                    '전체 여정의 88% 검증 완료',
                  ].map((fact) => (
                    <p key={fact}>
                      <img src={checkCircleIcon} alt="" width={14} height={14} />
                      <span>{fact}</span>
                    </p>
                  ))}
                </div>
                <span className="resell-defaults-summary__stamp-box" aria-hidden="true">
                  <img src={product.stamp} alt="" width={168} height={168} />
                </span>
                <p className="resell-defaults-summary__score">{selectProductDetails.score}</p>
              </div>
            </article>

            <section className="resell-diagnosis">
              <h2>n대별 진단 이력</h2>
              {['1st keeper', '2nd keeper'].map((keeper) => (
                <article className="resell-diagnosis__card" key={keeper}>
                  <span className="resell-diagnosis__keeper">{keeper}</span>
                  <dl>
                    <div>
                      <dt>진단 날짜</dt>
                      <dd>2023. 10. 26</dd>
                    </div>
                    <div>
                      <dt>진단 결과</dt>
                      <dd>탈모 진행 초기 (M자형)</dd>
                    </div>
                    <div className="resell-diagnosis__solution">
                      <dt>솔루션</dt>
                      <dd>
                        두피 스케일링 및 영양 앰플 집중 케어 권장.<br />
                        스트레스 관리 및 충분한 수면 필요
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}

              <article className="resell-diagnosis__empty">
                <img src={documentAddIcon} alt="" width={48} height={48} />
                <strong>진단 이력이 없을 경우</strong>
                <p>없어도 계속 진행 가능합니다.</p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/my/products/${product.id}/ai`, {
                      state: {
                        fromResell: true,
                        resellStep: 'defaults',
                        resellProductId: product.id,
                      },
                    })
                  }
                >
                  진단하러 가기
                </button>
              </article>
            </section>

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
                등록하신 제품의 여정 기록 32개 중 AI가 선별한 핵심
                <br />
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
              {SHARE_JOURNEYS.map((journey, index) => {
                const on = shareSelections.includes(index)
                return (
                  <div
                    key={journey.title}
                    className={`resell-journey-opt${on ? ' is-on' : ''}${index === 0 ? ' resell-journey-opt--featured' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {}}
                      aria-label={`${journey.title} 공유`}
                    />
                    <button
                      type="button"
                      className="resell-journey-opt__toggle"
                      onClick={() =>
                        setShareSelections((previous) =>
                          previous.includes(index)
                            ? previous.filter((item) => item !== index)
                            : [...previous, index],
                        )
                      }
                      aria-label={`${journey.title} ${on ? '선택 해제' : '선택'}`}
                    >
                      <span className="resell-journey-opt__box" aria-hidden>
                        {on ? <img src={selectedCheckIcon} alt="" width={20} height={20} /> : null}
                      </span>
                      <strong>{journey.title}</strong>
                    </button>
                    {on ? (
                      <div className="resell-journey-opt__situations">
                        <span>상황</span>
                        {journey.situations.map((situation) => {
                          const selectionKey = `${index}-${situation}`
                          return (
                          <label key={situation}>
                            <input
                              type="checkbox"
                              checked={situationSelections.includes(selectionKey)}
                              onChange={(event) =>
                                setSituationSelections((previous) =>
                                  event.target.checked
                                    ? [...previous, selectionKey]
                                    : previous.filter((item) => item !== selectionKey),
                                )
                              }
                            />
                            <i aria-hidden />
                            {situation}
                          </label>
                          )
                        })}
                      </div>
                    ) : null}
                    <div className="resell-journey-opt__copy">
                      <p>{journey.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <button type="button" className="resell-next" onClick={next}>
              {isContentEdit ? '수정하기' : '다음'}
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
                {includeLetter ? (
                  <img src={selectedCheckIcon} alt="" width={16} height={16} />
                ) : null}
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
                {includeCare ? (
                  <img src={selectedCheckIcon} alt="" width={16} height={16} />
                ) : null}
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
              <span className="resell-compose__count">{letter.length}/200</span>
            </div>

            <div
              className="resell-ai-helper-area"
              onMouseEnter={() => setAiPromptOpen(true)}
              onMouseLeave={() => setAiPromptOpen(false)}
            >
              {aiPromptOpen ? (
                <button
                  type="button"
                  className="resell-compose__ai"
                  onClick={generateAiLetter}
                >
                  AI로 초안 만들기
                </button>
              ) : null}
              <button
                type="button"
                className="resell-message-helper"
                onClick={() => setAiPromptOpen((open) => !open)}
                aria-label="AI 초안 메뉴"
                aria-expanded={aiPromptOpen}
              >
                <img className="resell-message-helper__ring" src={messageHelperRing} alt="" />
                <img className="resell-message-helper__mark" src={messageHelperMark} alt="" />
              </button>
            </div>

            <button type="button" className="resell-next" onClick={next}>
              {isContentEdit ? '수정하기' : '다음'}
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
              오래도록 잘 사용하기 위한 나만의 팁을 작성헤주세요.
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
              {isContentEdit ? '수정하기' : '다음'}
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
            <article
              className={`resell-preview${includeLetter ? '' : ' resell-preview--no-letter'}${includeCare ? '' : ' resell-preview--no-care'}`}
            >
              <div className="resell-overview resell-preview__overview">
                <div className="resell-overview__inner">
                  <p className="resell-overview__eyebrow">Brand Name</p>
                  <p className="resell-overview__alias">{selectProductDetails.alias}</p>
                  <div className="resell-overview__meta">
                    <span>정품 인증 완료</span>
                    <span>{selectProductDetails.journeyCount}개의 여정 기록</span>
                  </div>
                  <span className="resell-overview__stamp-box" aria-hidden="true">
                    <img
                      className="resell-overview__stamp"
                      src={product.stamp}
                      alt=""
                      width={168}
                      height={168}
                    />
                  </span>
                  <p className="resell-overview__score">{selectProductDetails.score}</p>
                </div>
              </div>

              <div className="resell-preview__photos">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="resell-preview__photo">
                    {photos[i] ? (
                      <img
                        className="resell-preview__uploaded-photo"
                        src={photos[i].url}
                        alt={`업로드한 상품 사진 ${i + 1}`}
                        width={93}
                        height={89}
                      />
                    ) : (
                      <img
                        className="resell-preview__photo-placeholder"
                        src={previewImageIcon}
                        alt=""
                        width={48}
                        height={48}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="resell-preview__price-row">
                <p className="resell-preview__price">
                  {price ? `${Number(price.replace(/,/g, '')).toLocaleString()}원` : '150,000원'}
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
                <div className="resell-preview__row resell-preview__row--letter">
                  Letter (구매·계승한 사람에게만 공개됩니다.)
                </div>
              ) : null}
              {includeCare ? (
                <div className="resell-preview__row resell-preview__row--tall resell-preview__row--care">
                  <span>Care Tips</span>
                  <p>{careTip || '작성한 케어팁이 없습니다.'}</p>
                </div>
              ) : null}
              {shareSelections.length > 0 ? (
                <button
                  type="button"
                  className="resell-preview__row resell-preview__row--journey resell-preview__row--btn"
                  onClick={() => setStep(steps.indexOf('share'))}
                >
                  <span>Journey Log</span>
                  <img
                    className="resell-preview__chev"
                    src={previewChevronIcon}
                    alt=""
                    width={24}
                    height={24}
                  />
                </button>
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
