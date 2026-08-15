import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/final/logo.png'
import backIcon from '../assets/final/back.png'
import navDoc from '../assets/final/nav-doc.svg'
import navScan from '../assets/final/nav-scan5.svg'
import navHome from '../assets/final/nav-home5.svg'
import navShop from '../assets/final/nav-shop5.svg'
import navMy from '../assets/final/nav-my5.svg'

export function McHeader({
  showBack = false,
  showTagline = false,
  onBack,
}) {
  const navigate = useNavigate()

  return (
    <header className="mc-header">
      <div className="mc-header__side">
        {showBack ? (
          <button
            type="button"
            className="mc-header__back"
            aria-label="뒤로"
            onClick={() => (onBack ? onBack() : navigate(-1))}
          >
            <img src={backIcon} alt="" width={30} height={30} />
          </button>
        ) : null}
      </div>
      <div className="mc-header__brand">
        <img className="mc-header__logo" src={logo} alt="M·Carry" width={133} height={40} />
        {showTagline ? (
          <p className="mc-header__tagline">Carry the Moment, Share the Value</p>
        ) : null}
      </div>
      <div className="mc-header__side" />
    </header>
  )
}

const navItems = [
  { to: '/journey', icon: navDoc, label: '여정' },
  { to: '/register', icon: navScan, label: '등록' },
  { to: '/', icon: navHome, label: '홈', end: true },
  { to: '/resell', icon: navShop, label: '리셀' },
  { to: '/my', icon: navMy, label: '마이' },
]

export function McNav() {
  return (
    <nav className="mc-nav" aria-label="하단 내비게이션">
      <div className="mc-nav__inner mc-nav__inner--5">
        {navItems.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mc-nav__item${isActive ? ' is-active' : ''}`
            }
            aria-label={label}
          >
            <img className="mc-nav__img" src={icon} alt="" width={30} height={30} />
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function AppShell({
  children,
  showNav = true,
  showBack = false,
  showTagline = false,
  hideHeader = false,
  onBack,
}) {
  return (
    <div className="phone-shell">
      <div className={showNav ? 'phone-shell__body' : 'phone-shell__body phone-shell__body--plain'}>
        {hideHeader ? null : (
          <McHeader showBack={showBack} showTagline={showTagline} onBack={onBack} />
        )}
        {children}
      </div>
      {showNav ? <McNav /> : null}
    </div>
  )
}
