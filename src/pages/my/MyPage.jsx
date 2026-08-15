import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import cameraIcon from '../../assets/final/camera.svg'
import chevronIcon from '../../assets/final/chevron.svg'
import { currentUser } from '../../data/mock'

export default function MyPage() {
  return (
    <AppShell>
      <div className="page page--my">
        <div className="my-profile">
          <button type="button" className="avatar-upload" aria-label="프로필 사진 업로드">
            <img src={cameraIcon} alt="" width={24} height={24} />
          </button>

          <div className="my-profile__identity">
            <h2 className="profile-name">{currentUser.name}</h2>
            <p className="profile-id">{currentUser.handle}</p>
          </div>

          <Link to="/my/products" className="owned-box">
            <div className="owned-box__copy">
              <p className="owned-box__label">보유 제품</p>
              <p className="owned-box__count">{currentUser.ownedCount}</p>
            </div>
            <img className="owned-box__chevron" src={chevronIcon} alt="" width={30} height={30} />
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
