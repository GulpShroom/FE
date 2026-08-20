import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { selectDemoProfile } from '../../api/auth'
import { useProfile } from '../../context/ProfileContext'
import heroStar from '../../assets/landing/hero-star.svg'
import heroContinue from '../../assets/landing/hero-continue.svg'
import ticketBorder from '../../assets/landing/ticket-border.svg'
import ticketArrow from '../../assets/landing/ticket-arrow.svg'
import pocketSurface from '../../assets/landing/pocket-surface.svg'
import pocketEdge from '../../assets/landing/pocket-edge.svg'
import pocketEdgeHighlight from '../../assets/landing/pocket-edge-highlight.svg'
import pocketStitchOuter from '../../assets/landing/pocket-stitch-outer.svg'
import pocketStitchInner from '../../assets/landing/pocket-stitch-inner.svg'
import pocketBottom from '../../assets/landing/pocket-bottom.svg'
import pocketEmblem from '../../assets/landing/pocket-emblem.svg'

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
        <header className="passport-landing__header" aria-hidden="true" />

        <section className="passport-landing__hero">
          <div className="passport-landing__monogram" aria-hidden="true">
            <span className="passport-landing__m">M</span>
            <span className="passport-landing__c">C</span>
            <img src={heroStar} alt="" className="passport-landing__star" />
          </div>
          <span className="passport-landing__divider" aria-hidden="true" />
          <h1 id="landing-title" className="passport-landing__tagline">
            Carry the Moment,
            <br />
            Share the Value
          </h1>
          <img src={heroContinue} alt="" className="passport-landing__continue" />
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
                <img src={ticketBorder} alt="" className="keeper-ticket__border" />
                <span className="keeper-ticket__content">
                  <span className="keeper-ticket__number-slot">
                    <span className="keeper-ticket__number">{option.number}</span>
                  </span>
                  <span className="keeper-ticket__copy">
                    <strong>{option.title}</strong>
                    <small>{isLoading ? '프로필을 불러오는 중...' : option.description}</small>
                  </span>
                  <span className="keeper-ticket__arrow" aria-hidden="true">
                    <img src={ticketArrow} alt="" />
                  </span>
                </span>
              </button>
            )
          })}
          {errorMessage ? (
            <p className="passport-landing__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>

        <section className="passport-landing__pocket" aria-label="MCM 디지털 패스포트">
          <img src={pocketSurface} alt="" className="passport-landing__pocket-surface" />
          <img src={pocketEdge} alt="" className="passport-landing__pocket-edge" />
          <img
            src={pocketEdgeHighlight}
            alt=""
            className="passport-landing__pocket-edge-highlight"
          />
          <img
            src={pocketStitchOuter}
            alt=""
            className="passport-landing__pocket-stitch-outer"
          />
          <img
            src={pocketStitchInner}
            alt=""
            className="passport-landing__pocket-stitch-inner"
          />
          <img src={pocketBottom} alt="" className="passport-landing__pocket-bottom" />
          <img src={pocketEmblem} alt="" className="passport-landing__pocket-emblem" />
          <p className="passport-landing__pocket-caption">MCM DIGITAL PASSPORT</p>
        </section>
      </main>
    </AppShell>
  )
}
