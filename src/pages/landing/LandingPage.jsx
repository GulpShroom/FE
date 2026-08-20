import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { selectDemoProfile } from '../../api/auth'
import { useProfile } from '../../context/ProfileContext'
import logo from '../../assets/final/logo-mark.png'
import stamp from '../../assets/final/stamp.png'
import leather from '../../assets/final/leather-1.png'
import diamond from '../../assets/final/diamond.svg'

const keeperOptions = [
  {
    number: '01',
    type: 'first_keeper',
    title: 'FIRST KEEPER',
    description: 'MCM과 함께 첫 여정을 시작합니다',
  },
  {
    number: '02',
    type: 'next_keeper',
    title: 'NEXT KEEPER',
    description: 'MCM과 함께 이어지는 여정을 기록합니다',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { selectProfile } = useProfile()
  const [loadingType, setLoadingType] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const chooseKeeper = async (profileType) => {
    setLoadingType(profileType)
    setErrorMessage('')

    try {
      const selected = await selectDemoProfile(profileType)
      selectProfile(selected)
      navigate('/main')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoadingType('')
    }
  }

  return (
    <AppShell showNav={false} hideHeader>
      <main className="passport-landing" aria-labelledby="landing-title">
        <div className="passport-landing__paper" aria-hidden="true" />

        <header className="passport-landing__header">
          <img src={logo} alt="M·Carry" className="passport-landing__brand" />
          <button type="button" className="passport-landing__menu" aria-label="메뉴 열기">
            <span />
            <span />
            <span />
          </button>
        </header>

        <section className="passport-landing__hero">
          <div className="passport-landing__monogram" aria-hidden="true">
            <span className="passport-landing__m">M</span>
            <span className="passport-landing__c">C</span>
            <span className="passport-landing__star">✦</span>
          </div>
          <img src={stamp} alt="" className="passport-landing__seal" />
          <span className="passport-landing__divider" aria-hidden="true" />
          <h1 id="landing-title" className="passport-landing__tagline">
            Carry the Moment,
            <br />
            Share the Value
          </h1>
          <span className="passport-landing__continue" aria-hidden="true">↓</span>
        </section>

        <section className="keeper-options" aria-label="프로필 선택">
          {keeperOptions.map((option) => {
            const isLoading = loadingType === option.type
            return (
              <button
                key={option.type}
                type="button"
                className="keeper-ticket"
                disabled={Boolean(loadingType)}
                onClick={() => chooseKeeper(option.type)}
              >
                <span className="keeper-ticket__number">{option.number}</span>
                <span className="keeper-ticket__copy">
                  <strong>{option.title}</strong>
                  <small>{isLoading ? '프로필을 불러오는 중...' : option.description}</small>
                </span>
                <span className="keeper-ticket__arrow" aria-hidden="true">→</span>
              </button>
            )
          })}
          {errorMessage ? <p className="passport-landing__error" role="alert">{errorMessage}</p> : null}
        </section>

        <section
          className="passport-landing__pocket"
          style={{ '--landing-leather': `url(${leather})` }}
          aria-label="MCM 디지털 패스포트"
        >
          <div className="passport-landing__stitch passport-landing__stitch--left" />
          <div className="passport-landing__stitch passport-landing__stitch--right" />
          <div className="passport-landing__pocket-mark">
            <img src={diamond} alt="" />
            <p>MCM DIGITAL PASSPORT</p>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
