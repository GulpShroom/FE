import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import stampImg from '../../assets/final/stamp.png'
import productBag from '../../assets/final/product-bag.png'
import ctaArrow from '../../assets/final/cta-arrow.svg'
import planeTip from '../../assets/final/plane-tip-clear.png'

const steps = [
  'profile',
  'qr',
  'auth',
  'purchase',
  'alias',
  'passport',
  'first-journey',
]

const stepMeta = {
  qr: { n: 1, label: '제품 스캔' },
  auth: { n: 2, label: '정품 확인' },
  purchase: { n: 3, label: '구매 정보 확인' },
  alias: { n: 4, label: '별칭 등록' },
  passport: { n: 5, label: '별칭 등록' },
  'first-journey': { n: 6, label: '첫 여정' },
}

function Progress({ n, label }) {
  const pct = Math.min(100, (n / 6) * 100)
  return (
    <div className="reg-progress">
      <p className="reg-progress__label">
        Step {n} of 6 {label}
      </p>
      <div className="reg-progress__track">
        <div className="reg-progress__fill" style={{ width: `${pct}%` }} />
        <img className="reg-progress__plane" src={planeTip} alt="" width={43} height={43} />
      </div>
    </div>
  )
}

function DarkCta({ sub, title, onClick, multiline }) {
  return (
    <button type="button" className="reg-cta" onClick={onClick}>
      <span className="reg-cta__copy">
        {sub ? <span className="reg-cta__sub">{sub}</span> : null}
        {multiline ? (
          <span className="reg-cta__title reg-cta__title--multi">{title}</span>
        ) : (
          <span className="reg-cta__title">{title}</span>
        )}
      </span>
      <img className="reg-cta__arrow" src={ctaArrow} alt="" width={50} height={50} />
    </button>
  )
}

export default function RegisterFlowPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('first')
  const [skipPurchaseOpen, setSkipPurchaseOpen] = useState(false)
  const [aliasAlertOpen, setAliasAlertOpen] = useState(true)
  const [form, setForm] = useState({
    serial: 'MCM-2026-001',
    store: '신세계 본점',
    country: '영국',
    city: '런던',
    branch: '런던점',
    date: '2002.05.02',
    alias: '출근백',
    body: '',
  })

  const key = steps[step]
  const meta = stepMeta[key]
  const next = () => {
    if (step >= steps.length - 1) {
      navigate('/')
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <AppShell
      showNav={false}
      showBack
      onBack={() => {
        if (step === 0) navigate(-1)
        else setStep((s) => s - 1)
      }}
    >
      {meta ? (
        <div className="page page--register-top">
          <Progress n={meta.n} label={meta.label} />
        </div>
      ) : null}

      {key === 'profile' ? (
        <div className="landing-hero">
          <div>
            <p className="landing-question">누구의 시점으로 볼까요?</p>
          </div>
          <div style={{ width: '100%' }}>
            <p className="landing-sub">MCM과 함께한 삶을, 각자의 눈으로</p>
            <div className="role-stack">
              <button
                type="button"
                className="role-card"
                onClick={() => {
                  setRole('first')
                  next()
                }}
              >
                <p className="role-card__title">First Keeper</p>
                <p className="role-card__desc">MCM과의 첫 여정을 시작합니다</p>
              </button>
              <button
                type="button"
                className="role-card"
                onClick={() => {
                  setRole('next')
                  next()
                }}
              >
                <p className="role-card__title">Next Keeper</p>
                <p className="role-card__desc">MCM과의 이야기를 이어갑니다</p>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {key === 'qr' ? (
        <div className="page page--register">
          <h1 className="reg-title">제품의 QR을 스캔해주세요</h1>
          <button type="button" className="reg-qr" onClick={next} aria-label="QR 스캔 (목업)">
            <span>QR</span>
          </button>
          <p className="reg-help">
            제품 안쪽 라벨의 QR 코드를
            <br />
            카메라 영역에 맞춰주세요.
          </p>
          <DarkCta sub="인식이 잘 안되시나요?" title="직접 등록하기" onClick={next} />
        </div>
      ) : null}

      {key === 'auth' ? (
        <div className="page page--register page--register-auth">
          <div className="reg-auth">
            <p className="reg-auth__hello">
              MCM 제품 구매를 축하합니다!
              <br />
              여정을 시작해볼까요?
            </p>
            <img className="reg-auth__photo" src={productBag} alt="" width={200} height={216} />
            <div className="reg-auth__meta">
              <p className="reg-auth__date">2026.07.24</p>
              <p className="reg-auth__ok">
                <span className="reg-auth__dot" aria-hidden />
                MCM 정품 인증 완료
              </p>
            </div>
            <div className="reg-auth__card">
              <p className="reg-auth__serial">{form.serial}</p>
              <p className="reg-auth__name">MCM 스타크 백팩</p>
            </div>
          </div>
          <DarkCta title="구매 정보 입력하기" onClick={next} />
        </div>
      ) : null}

      {key === 'purchase' ? (
        <div className="page page--register">
          <h1 className="reg-title">구매 정보를 확인해 주세요.</h1>
          <div className="reg-purchase">
            <p className="reg-field-label">구매일</p>
            <input
              className="reg-date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <p className="reg-field-label">구매 매장</p>
            <div className="reg-store-row">
              <span className="reg-store-chip">{form.country}</span>
              <span className="reg-store-chip">{form.city}</span>
              <span className="reg-store-chip">{form.branch}</span>
            </div>
          </div>
          <button type="button" className="link-quiet" onClick={() => setSkipPurchaseOpen(true)}>
            구매 정보가 기억나지 않는다면
          </button>
          <DarkCta title="다음" onClick={next} />
        </div>
      ) : null}

      {key === 'alias' ? (
        <div className="page page--register">
          <h1 className="reg-title">별칭을 등록해 주세요.</h1>
          <p className="reg-help reg-help--left">
            제품에 나만의 이름을 지어주세요. 디지털 패스포트에 기록됩니다.
          </p>
          <label className="reg-field-label" htmlFor="alias">
            별칭
          </label>
          <input
            id="alias"
            className="reg-date"
            value={form.alias}
            placeholder="별칭을 입력해주세요."
            onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
          />
          <p className="hint-text">
            별칭은 리셀 시장에서 제품의 고유한 가치가 되며, 다음 주인에게도 그대로 계승됩니다.
          </p>
          <DarkCta title="디지털 여권 발급하러 가기" onClick={next} />
          <Modal
            open={aliasAlertOpen}
            title="안내"
            primaryLabel="확인하였습니다."
            hideSecondary
            onPrimary={() => setAliasAlertOpen(false)}
            onClose={() => setAliasAlertOpen(false)}
          >
            <p>해당 알럿을 닫으면 디지털 패스포트가 노출되며, 제품의 별칭을 변경할 수 있습니다.</p>
          </Modal>
        </div>
      ) : null}

      {key === 'passport' ? (
        <div className="page page--register">
          <h1 className="reg-title">디지털 여권이 발급되었어요.</h1>
          <article className="passport-card">
            <img className="passport-card__stamp" src={stampImg} alt="" width={190} height={190} />
            <p className="passport-card__eyebrow">DIGITAL PRODUCT PASSPORT</p>
            <p className="passport-card__serial">
              {form.serial} / DP-20260823
            </p>
            <div className="passport-card__photo-wrap">
              <img className="passport-card__photo" src={productBag} alt="" width={175} height={190} />
            </div>
            <div className="passport-card__names">
              <span className="passport-card__alias">{form.alias}</span>
              <span className="passport-card__product">MCM 스타크 백팩</span>
            </div>
            <p className="passport-card__role">
              {role === 'first' ? '1st Keeper' : 'Next Keeper'}
            </p>
            <div className="passport-card__info">
              <div className="passport-card__info-row">
                <span>MCM 정품 인증 완료</span>
                <span className="muted">2026.07.24</span>
              </div>
              <span>비세토스 · 코냑 · 2024</span>
              <span>
                {form.store} · {form.date}
              </span>
            </div>
          </article>
          <DarkCta sub="MCM과 처음 만난 순간을 남겨보세요" title="첫 여정 기록하기" onClick={next} />
        </div>
      ) : null}

      {key === 'first-journey' ? (
        <div className="page page--register">
          <h1 className="reg-title">
            자동 생성된 첫 여정을
            <br />
            확인하고 메모를 더해보세요.
          </h1>
          <div className="reg-first">
            <img className="reg-first__photo" src={productBag} alt="" width={180} height={194} />
            <p className="reg-first__quote">“MCM 스타크 백팩과 처음 만난 순간”</p>
            <p className="reg-field-label">메모</p>
            <div className="reg-first__chips">
              <span className="reg-first__chip is-active">{form.store}</span>
              <span className="reg-first__chip">2026.08.24</span>
            </div>
            <textarea
              className="reg-first__memo"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="이 제품을 처음 만난 순간을 기록해 보세요. (선택)"
            />
          </div>
          <DarkCta
            title={
              <>
                첫 여정 등록하고
                <br />
                메인으로
              </>
            }
            multiline
            onClick={next}
          />
        </div>
      ) : null}

      <Modal
        open={skipPurchaseOpen}
        title="나중에 입력하시겠어요?"
        primaryLabel="나중에 입력"
        secondaryLabel="계속 입력"
        onPrimary={() => {
          setSkipPurchaseOpen(false)
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
