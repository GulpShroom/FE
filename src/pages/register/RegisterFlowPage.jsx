import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { useProfile } from '../../context/ProfileContext'
import {
  getDigitalPassport,
  getStores,
  registerProduct,
  scanProduct,
  updateFirstJourneyMemo,
} from '../../api/register'
import stampImg from '../../assets/final/stamp.png'
import productBag from '../../assets/final/product-bag.png'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import planeTip from '../../assets/final/progress-plane.png'

const steps = ['qr', 'auth', 'purchase', 'alias', 'passport', 'first-journey']

const stepMeta = {
  qr: { n: 1, label: '제품 스캔' },
  auth: { n: 2, label: '정품 확인' },
  purchase: { n: 3, label: '구매 정보 확인' },
  alias: { n: 4, label: '별칭 등록' },
  passport: { n: 5, label: '디지털 여권' },
  'first-journey': { n: 6, label: '첫 여정' },
}

const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1)

function toUiDate(value) {
  if (!value) return ''
  const text = String(value)
  const datePart = text.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart)
    ? datePart.replaceAll('-', '.')
    : text.replaceAll('-', '.')
}

function keeperLabel(generation = 1) {
  const suffix = generation === 1 ? 'st' : generation === 2 ? 'nd' : generation === 3 ? 'rd' : 'th'
  return `${generation}${suffix} Keeper`
}

function Progress({ n, label }) {
  const pct = Math.min(100, (n / 6) * 100)
  return (
    <div className="reg-progress">
      <p className="reg-progress__label">Step {n} of 6 {label}</p>
      <div className="reg-progress__track">
        <div className="reg-progress__fill" style={{ width: `${pct}%` }} />
        <img className="reg-progress__plane" src={planeTip} alt="" width={43} height={43} />
      </div>
    </div>
  )
}

function DarkCta({ sub, title, onClick, multiline = false, disabled = false }) {
  return (
    <button type="button" className="reg-cta" onClick={onClick} disabled={disabled}>
      <span className="reg-cta__copy">
        {sub ? <span className="reg-cta__sub">{sub}</span> : null}
        <span className={`reg-cta__title${multiline ? ' reg-cta__title--multi' : ''}`}>
          {title}
        </span>
      </span>
      <img className="reg-cta__arrow" src={ctaArrow} alt="" width={50} height={50} />
    </button>
  )
}

function QrScanner({ onDetected, onError, disabled }) {
  const videoRef = useRef(null)
  const detectedRef = useRef(false)

  useEffect(() => {
    if (disabled) return undefined

    let stream
    let animationFrame
    let cancelled = false

    const stopCamera = () => {
      window.cancelAnimationFrame(animationFrame)
      stream?.getTracks().forEach((track) => track.stop())
    }

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('이 브라우저에서는 카메라를 사용할 수 없습니다.')
        }
        if (!window.BarcodeDetector) {
          throw new Error('이 브라우저에서는 QR 코드 인식을 지원하지 않습니다.')
        }

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })
        if (cancelled || !videoRef.current) {
          stopCamera()
          return
        }

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const detect = async () => {
          if (cancelled || detectedRef.current || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            const qrCode = codes.find((code) => code.rawValue?.trim())?.rawValue.trim()
            if (qrCode) {
              detectedRef.current = true
              stopCamera()
              onDetected(qrCode)
              return
            }
          } catch {
            // The video may not have a decodable frame yet; keep scanning.
          }
          animationFrame = window.requestAnimationFrame(detect)
        }

        animationFrame = window.requestAnimationFrame(detect)
      } catch (error) {
        if (!cancelled) onError(error.message || '카메라를 시작하지 못했습니다.')
      }
    }

    detectedRef.current = false
    startCamera()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [disabled, onDetected, onError])

  return (
    <div className={`reg-qr${disabled ? ' is-loading' : ''}`} aria-label="QR 코드 카메라 스캔 영역">
      <video ref={videoRef} className="reg-qr__video" muted playsInline aria-hidden />
      <span className="reg-qr__corners" aria-hidden><i /><i /><i /></span>
      <span className="reg-qr__line" aria-hidden />
      <span className="reg-qr__caption">{disabled ? '제품 정보를 확인하고 있습니다...' : 'QR 코드를 카메라 영역에 맞춰주세요'}</span>
    </div>
  )
}

function Calendar({ value, onSelect, onClose }) {
  const selectedDay = Number(String(value || '').split(/[.-]/).at(-1))
  return (
    <div className="reg-calendar" role="dialog" aria-label="구매일 선택">
      <div className="reg-calendar__head">
        <button type="button" aria-label="이전 달">‹</button>
        <strong>2026년 8월</strong>
        <button type="button" aria-label="다음 달">›</button>
      </div>
      <div className="reg-calendar__week" aria-hidden>
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="reg-calendar__grid">
        {Array.from({ length: 6 }, (_, index) => <span key={`empty-${index}`} />)}
        {calendarDays.map((day) => (
          <button
            type="button"
            key={day}
            className={selectedDay === day ? 'is-selected' : ''}
            onClick={() => {
              onSelect(`2026-08-${String(day).padStart(2, '0')}`)
              onClose()
            }}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}

function SelectField({ label, value, placeholder, options, open, disabled, onToggle, onSelect }) {
  return (
    <div className="reg-select-wrap">
      <button
        type="button"
        className={`reg-select${open ? ' is-open' : ''}`}
        disabled={disabled}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{value || placeholder}</span>
        <span className="reg-select__chevron" aria-hidden>⌄</span>
      </button>
      {open ? (
        <div className="reg-select__menu" role="listbox" aria-label={label}>
          {options.length ? options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={value === option}
              className={value === option ? 'is-selected' : ''}
              key={option}
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          )) : <p>선택 가능한 항목이 없습니다.</p>}
        </div>
      ) : null}
    </div>
  )
}

function ApiFeedback({ message, onClose }) {
  if (!message) return null
  return (
    <div className="reg-api-feedback" role="alert">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="안내 닫기">×</button>
    </div>
  )
}

export default function RegisterFlowPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [step, setStep] = useState(0)
  const [qrMode, setQrMode] = useState('scan')
  const [purchaseMode, setPurchaseMode] = useState('input')
  const [skipPurchaseOpen, setSkipPurchaseOpen] = useState(false)
  const [aliasAlertOpen, setAliasAlertOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [openSelect, setOpenSelect] = useState('')
  const [loadingAction, setLoadingAction] = useState('')
  const [apiError, setApiError] = useState('')
  const [manualError, setManualError] = useState('')
  const [scannedProduct, setScannedProduct] = useState(null)
  const [registrationResult, setRegistrationResult] = useState(null)
  const [passportData, setPassportData] = useState(null)
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [storeData, setStoreData] = useState({ countries: [], cities: [], stores: [] })
  const [form, setForm] = useState({
    serial: '',
    country: '',
    city: '',
    branch: '',
    date: '',
    alias: '',
    body: '',
    product: null,
  })

  const key = steps[step]
  const meta = stepMeta[key]
  const countryOptions = storeData.countries
  const cityOptions = storeData.cities.map((item) => item.city)
  const branchOptions = [...new Set(storeData.stores.map((item) => item.storeName))]
  const purchaseReady = Boolean(form.date && selectedStoreId)
  const storeLabel = useMemo(
    () => [form.country, form.city, form.branch].filter(Boolean).join(' · '),
    [form.country, form.city, form.branch],
  )

  const productName = passportData?.officialName || scannedProduct?.officialName || 'MCM 스타크 백팩'
  const productImage = passportData?.officialImageUrl || scannedProduct?.officialImageUrl || productBag
  const passportId = passportData?.passportId || registrationResult?.passportId || '발급 정보 확인 중'
  const generation = passportData?.currentGeneration || registrationResult?.currentGeneration || 1
  const authenticatedAt = passportData?.authenticatedAt || scannedProduct?.authenticatedAt
  const specification = passportData?.specification || {
    manufactureYear: scannedProduct?.manufactureYear || 2024,
    productLine: scannedProduct?.productLine || '비세토스',
    color: scannedProduct?.color || '코냑',
  }
  const passportPurchase = passportData?.purchase
  const passportStoreLabel = passportPurchase?.storeName
    ? [passportPurchase.country, passportPurchase.city, passportPurchase.storeName].filter(Boolean).join(' · ')
    : storeLabel
  const passportPurchaseDate = passportPurchase?.purchaseDate || form.date

  useEffect(() => {
    window.scrollTo({ top: 0 })
    document.querySelector('.phone-shell__body')?.scrollTo({ top: 0 })
  }, [step, qrMode, purchaseMode])

  const next = () => {
    if (step >= steps.length - 1) {
      navigate('/main')
      return
    }
    setStep((current) => current + 1)
  }

  const previous = () => {
    if (key === 'qr' && qrMode !== 'scan') {
      setQrMode('scan')
      setApiError('')
      return
    }
    if (step === 0) navigate(-1)
    else setStep((current) => current - 1)
  }

  const openManualRegistration = () => {
    setApiError('')
    setManualError('')
    setQrMode('manual')
  }

  const authenticateProduct = async (source, scannedQrCode = '') => {
    const serialNo = form.serial.trim()
    if (source === 'manual' && !serialNo) {
      setManualError('시리얼 넘버를 입력해 주세요.')
      return
    }

    setApiError('')
    setManualError('')
    setLoadingAction('scan')
    try {
      const result = await scanProduct(
        source === 'manual'
          ? { serialNo, qrCode: null }
          : { serialNo: null, qrCode: scannedQrCode },
      )
      if (result.isRegistered) {
        const message = '이미 디지털 여권으로 등록된 제품입니다.'
        if (source === 'manual') setManualError(message)
        else {
          setApiError(message)
          setQrMode('failed')
        }
        return
      }
      setScannedProduct(result)
      setForm((current) => ({
        ...current,
        serial: result.serialNo,
        product: result,
      }))
      next()
    } catch (error) {
      if (source === 'manual') {
        setManualError(error.message || '존재하지 않거나 유효하지 않은 시리얼 넘버입니다.')
      } else {
        setApiError(error.message || '유효하지 않은 QR 코드입니다. 다시 스캔해 주세요.')
        setQrMode('failed')
      }
    } finally {
      setLoadingAction('')
    }
  }

  const loadStoreOptions = async ({ country = '', city = '' } = {}) => {
    const result = await getStores({
      ...(country ? { country } : {}),
      ...(city ? { city } : {}),
    })
    setStoreData((current) => ({
      countries: result.countries?.length ? result.countries : current.countries,
      cities: country ? result.cities ?? [] : current.cities,
      stores: city ? result.stores ?? [] : [],
    }))
    return result
  }

  const beginPurchaseEdit = async ({ clear = false } = {}) => {
    setApiError('')
    setLoadingAction('stores')
    try {
      const base = await getStores()
      let cities = []
      let stores = []
      if (!clear && form.country) {
        const countryResult = await getStores({ country: form.country })
        cities = countryResult.cities ?? []
        if (form.city) {
          const cityResult = await getStores({ country: form.country, city: form.city })
          stores = cityResult.stores ?? []
        }
      }
      setStoreData({ countries: base.countries ?? [], cities, stores })
      if (clear) {
        setSelectedStoreId(null)
        setForm((current) => ({ ...current, date: '', country: '', city: '', branch: '' }))
      }
      setPurchaseMode('input')
      return true
    } catch (error) {
      setApiError(error.message)
      return false
    } finally {
      setLoadingAction('')
    }
  }

  const completeAuthentication = async () => {
    const storeOptionsReady = await beginPurchaseEdit({ clear: true })
    if (!storeOptionsReady) return
    next()
  }

  const selectCountry = async (country) => {
    setForm((current) => ({ ...current, country, city: '', branch: '' }))
    setSelectedStoreId(null)
    setOpenSelect('')
    setApiError('')
    setLoadingAction('stores')
    try {
      await loadStoreOptions({ country })
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoadingAction('')
    }
  }

  const selectCity = async (city) => {
    setForm((current) => ({ ...current, city, branch: '' }))
    setSelectedStoreId(null)
    setOpenSelect('')
    setApiError('')
    setLoadingAction('stores')
    try {
      await loadStoreOptions({ country: form.country, city })
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoadingAction('')
    }
  }

  const selectBranch = (branch) => {
    const store = storeData.stores.find((item) => item.storeName === branch)
    setSelectedStoreId(store?.storeId ?? null)
    setForm((current) => ({ ...current, branch }))
    setOpenSelect('')
  }

  const issueDigitalPassport = async () => {
    setAliasAlertOpen(false)
    if (registrationResult) {
      next()
      return
    }

    setApiError('')
    setLoadingAction('register')
    const body = {
      serialNo: form.serial,
      nickname: form.alias.trim(),
      ownerId: profile.id,
      ...(form.date ? { purchaseDate: form.date } : {}),
      ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
    }

    try {
      const created = await registerProduct(body)
      if (!created?.productId) {
        throw new Error('제품 등록 결과에서 디지털 여권 정보를 확인할 수 없습니다.')
      }
      setRegistrationResult(created)
      try {
        const passport = await getDigitalPassport(created.productId)
        setPassportData(passport)
      } catch (error) {
        setApiError(`여권은 발급됐지만 상세 정보를 불러오지 못했습니다. ${error.message}`)
      }
      next()
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoadingAction('')
    }
  }

  const finishRegistration = async () => {
    const memo = form.body.trim()
    if (!memo || !registrationResult?.firstJourneyId) {
      navigate('/main')
      return
    }

    setApiError('')
    setLoadingAction('journey')
    try {
      await updateFirstJourneyMemo(registrationResult.firstJourneyId, {
        userId: profile.id,
        userMemo: memo,
      })
      navigate('/main')
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoadingAction('')
    }
  }

  return (
    <AppShell showNav={false} showBack onBack={previous}>
      <div className="page page--register-top"><Progress n={meta.n} label={meta.label} /></div>
      {qrMode !== 'failed' ? <ApiFeedback message={apiError} onClose={() => setApiError('')} /> : null}

      {key === 'qr' && qrMode === 'scan' ? (
        <div className="page page--register">
          <h1 className="reg-title">제품의 QR을 스캔해주세요</h1>
          <QrScanner
            onDetected={(qrCode) => authenticateProduct('qr', qrCode)}
            onError={(message) => {
              setApiError(message)
              setQrMode('failed')
            }}
            disabled={loadingAction === 'scan'}
          />
          <p className="reg-help">제품 안쪽 라벨의 QR 코드를<br />카메라 영역에 맞춰주세요.</p>
          <button type="button" className="link-quiet reg-failure-link" onClick={() => setQrMode('failed')}>
            QR이 인식되지 않나요?
          </button>
          <DarkCta sub="인식이 잘 안되시나요?" title="직접 등록하기" onClick={openManualRegistration} />
        </div>
      ) : null}

      {key === 'qr' && qrMode === 'failed' ? (
        <div className="page page--register page--register-state">
          <div className="reg-state-card">
            <div className="reg-state-icon reg-state-icon--error" aria-hidden>×</div>
            <h1 className="reg-state-card__title">{apiError || 'QR 코드를 인식하지 못했습니다.'}</h1>
            <p className="reg-state-card__desc">제품 라벨이 화면 안에 선명하게 보이도록<br />카메라 위치를 조정해 주세요.</p>
            <button type="button" className="reg-outline-btn" onClick={() => {
              setApiError('')
              setQrMode('scan')
            }}>
              다시 스캔하기
            </button>
          </div>
          <DarkCta sub="계속 인식되지 않나요?" title="직접 등록하기" onClick={openManualRegistration} />
        </div>
      ) : null}

      {key === 'qr' && qrMode === 'manual' ? (
        <div className="page page--register page--register-state">
          <div className="reg-manual">
            <h1 className="reg-title">제품 정보를 직접 입력해 주세요.</h1>
            <p className="reg-help reg-help--left">제품 안쪽 라벨에 적힌 시리얼 넘버를 입력하면 정품 여부를 확인할 수 있어요.</p>
            <label className="reg-field-label" htmlFor="serial">시리얼 넘버</label>
            <input
              id="serial"
              className={`reg-input${manualError ? ' is-error' : ''}`}
              value={form.serial}
              placeholder="제품 시리얼 번호를 입력해 주세요."
              aria-invalid={Boolean(manualError)}
              aria-describedby={manualError ? 'serial-error' : undefined}
              onChange={(event) => {
                setManualError('')
                setForm((current) => ({ ...current, serial: event.target.value }))
              }}
            />
            {manualError ? <p id="serial-error" className="reg-field-error" role="alert">{manualError}</p> : null}
          </div>
          <DarkCta
            title={loadingAction === 'scan' ? '정품 확인 중...' : '제품 등록하러 가기'}
            disabled={loadingAction === 'scan'}
            onClick={() => authenticateProduct('manual')}
          />
        </div>
      ) : null}

      {key === 'auth' ? (
        <div className="page page--register page--register-auth">
          <div className="reg-auth">
            <p className="reg-auth__hello">MCM 제품 구매를 축하합니다!<br />여정을 시작해볼까요?</p>
            <img
              className="reg-auth__photo"
              src={productImage}
              alt={productName}
              width={200}
              height={216}
              onError={(event) => { event.currentTarget.src = productBag }}
            />
            <div className="reg-auth__meta">
              <p className="reg-auth__date">{toUiDate(scannedProduct?.authenticatedAt)}</p>
              <p className="reg-auth__ok"><span className="reg-auth__dot" aria-hidden />MCM 정품 인증 완료</p>
            </div>
            <div className="reg-auth__card">
              <p className="reg-auth__serial">{scannedProduct?.serialNo || form.serial}</p>
              <p className="reg-auth__name">{productName}</p>
            </div>
          </div>
          <DarkCta
            title={loadingAction === 'stores' ? '매장 정보 불러오는 중...' : '구매 정보 입력하기'}
            disabled={loadingAction === 'stores'}
            onClick={completeAuthentication}
          />
        </div>
      ) : null}

      {key === 'purchase' ? (
        <div className="page page--register">
          <h1 className="reg-title">{purchaseMode === 'confirmed' ? '구매 정보를 확인해 주세요.' : '아래 정보를 입력해 주세요.'}</h1>
          <div className="reg-purchase">
            <p className="reg-field-label">구매일</p>
            {purchaseMode === 'confirmed' ? (
              <div className="reg-date reg-date--static">{toUiDate(form.date)}</div>
            ) : (
              <div className="reg-field-popover">
                <button
                  type="button"
                  className={`reg-date reg-date--button${calendarOpen ? ' is-open' : ''}`}
                  onClick={() => {
                    setCalendarOpen((open) => !open)
                    setOpenSelect('')
                  }}
                >
                  <span>{toUiDate(form.date) || 'YYYY.MM.DD'}</span><span aria-hidden>⌄</span>
                </button>
                {calendarOpen ? (
                  <Calendar
                    value={form.date}
                    onSelect={(date) => setForm((current) => ({ ...current, date }))}
                    onClose={() => setCalendarOpen(false)}
                  />
                ) : null}
              </div>
            )}
            <p className="reg-field-label">구매 매장</p>
            {purchaseMode === 'confirmed' ? (
              <div className="reg-store-row">
                {[form.country, form.city, form.branch].map((value) => <span className="reg-store-chip" key={value}>{value}</span>)}
              </div>
            ) : (
              <div className="reg-store-row reg-store-row--select">
                <SelectField
                  label="국가"
                  value={form.country}
                  placeholder="국가"
                  options={countryOptions}
                  disabled={loadingAction === 'stores'}
                  open={openSelect === 'country'}
                  onToggle={() => setOpenSelect(openSelect === 'country' ? '' : 'country')}
                  onSelect={selectCountry}
                />
                <SelectField
                  label="도시"
                  value={form.city}
                  placeholder="도시"
                  options={cityOptions}
                  disabled={!form.country || loadingAction === 'stores'}
                  open={openSelect === 'city'}
                  onToggle={() => setOpenSelect(openSelect === 'city' ? '' : 'city')}
                  onSelect={selectCity}
                />
                <SelectField
                  label="매장"
                  value={form.branch}
                  placeholder="매장"
                  options={branchOptions}
                  disabled={!form.city || loadingAction === 'stores'}
                  open={openSelect === 'branch'}
                  onToggle={() => setOpenSelect(openSelect === 'branch' ? '' : 'branch')}
                  onSelect={selectBranch}
                />
              </div>
            )}
          </div>
          {purchaseMode === 'confirmed' ? (
            <button type="button" className="link-quiet" disabled={loadingAction === 'stores'} onClick={() => beginPurchaseEdit()}>
              {loadingAction === 'stores' ? '매장 정보 불러오는 중...' : '구매 정보 수정하기'}
            </button>
          ) : null}
          <button type="button" className="link-quiet" onClick={() => setSkipPurchaseOpen(true)}>
            구매 정보가 기억나지 않는다면
          </button>
          <DarkCta title="입력 완료" disabled={purchaseMode === 'input' && !purchaseReady} onClick={next} />
        </div>
      ) : null}

      {key === 'alias' ? (
        <div className="page page--register">
          <h1 className="reg-title">별칭을 등록해 주세요.</h1>
          <p className="reg-help reg-help--left">제품에 나만의 이름을 지어주세요. 디지털 패스포트에 기록됩니다.</p>
          <label className="reg-field-label" htmlFor="alias">별칭</label>
          <input
            id="alias"
            className="reg-input"
            value={form.alias}
            placeholder="별칭을 입력해주세요."
            onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))}
          />
          <p className="hint-text">별칭은 리셀 시장에서 제품의 고유한 가치가 되며, 다음 주인에게도 그대로 계승됩니다.</p>
          <DarkCta
            title={loadingAction === 'register' ? '디지털 여권 발급 중...' : '디지털 여권 발급하러 가기'}
            disabled={!form.alias.trim() || loadingAction === 'register'}
            onClick={() => setAliasAlertOpen(true)}
          />
          <Modal
            open={aliasAlertOpen}
            title="이 별칭으로 등록할까요?"
            primaryLabel="등록하기"
            secondaryLabel="다시 입력"
            onPrimary={issueDigitalPassport}
            onSecondary={() => setAliasAlertOpen(false)}
            onClose={() => setAliasAlertOpen(false)}
          >
            <p>등록과 동시에 1대 Keeper 소유 이력과 첫 여정이 자동으로 생성됩니다.</p>
          </Modal>
        </div>
      ) : null}

      {key === 'passport' ? (
        <div className="page page--register">
          <h1 className="reg-title">디지털 여권이 발급되었어요.</h1>
          <article className="passport-card">
            <img className="passport-card__stamp" src={stampImg} alt="" width={190} height={190} />
            <p className="passport-card__eyebrow">DIGITAL PRODUCT PASSPORT</p>
            <p className="passport-card__serial">{form.serial} / {passportId}</p>
            <div className="passport-card__photo-wrap">
              <img
                className="passport-card__photo"
                src={productImage}
                alt={productName}
                width={175}
                height={190}
                onError={(event) => { event.currentTarget.src = productBag }}
              />
            </div>
            <div className="passport-card__names">
              <span className="passport-card__alias">{passportData?.nickname || form.alias}</span>
              <span className="passport-card__product">{productName}</span>
            </div>
            <p className="passport-card__role">{keeperLabel(generation)}</p>
            <div className="passport-card__info">
              <div className="passport-card__info-row">
                <span>MCM 정품 인증 완료</span><span className="muted">{toUiDate(authenticatedAt)}</span>
              </div>
              <span>{specification.productLine} · {specification.color} · {specification.manufactureYear}</span>
              <span>{passportStoreLabel || '구매 매장 미입력'} · {toUiDate(passportPurchaseDate) || '구매일 미입력'}</span>
            </div>
          </article>
          <DarkCta sub="구매 순간이 첫 여정으로 기록되었어요" title="첫 여정 확인하기" onClick={next} />
        </div>
      ) : null}

      {key === 'first-journey' ? (
        <div className="page page--register">
          <h1 className="reg-title">자동 생성된 첫 여정을<br />확인하고 메모를 더해보세요.</h1>
          <div className="reg-first">
            <img
              className="reg-first__photo"
              src={productImage}
              alt={productName}
              width={180}
              height={194}
              onError={(event) => { event.currentTarget.src = productBag }}
            />
            <p className="reg-first__quote">“{productName}과 처음 만난 순간”</p>
            <p className="reg-field-label">메모</p>
            <div className="reg-first__chips">
              <span className="reg-first__chip is-active">{form.branch || '구매 매장 미입력'}</span>
              <span className="reg-first__chip">{toUiDate(form.date) || '구매일 미입력'}</span>
            </div>
            <textarea
              className="reg-first__memo"
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              placeholder="이 제품을 처음 만난 순간을 기록해 보세요. (선택)"
            />
          </div>
          <DarkCta
            title={loadingAction === 'journey' ? '저장 중...' : '저장하고 메인으로'}
            disabled={loadingAction === 'journey'}
            onClick={finishRegistration}
          />
        </div>
      ) : null}

      <Modal
        open={skipPurchaseOpen}
        title="나중에 입력하시겠어요?"
        primaryLabel="확인"
        secondaryLabel="취소"
        onPrimary={() => {
          setSkipPurchaseOpen(false)
          setSelectedStoreId(null)
          setForm((current) => ({ ...current, date: '', country: '', city: '', branch: '' }))
          next()
        }}
        onSecondary={() => setSkipPurchaseOpen(false)}
        onClose={() => setSkipPurchaseOpen(false)}
      >
        <p>구매 정보는 마이페이지의 내 제품 리스트에서 언제든지 수정할 수 있어요.</p>
      </Modal>
    </AppShell>
  )
}
