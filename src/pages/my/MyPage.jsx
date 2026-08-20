import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { useProfile } from '../../context/ProfileContext'
import { usePhotoPick } from '../../hooks/usePhotoPick'
import { isNotFoundError } from '../../api/client'
import { getUserProducts } from '../../api/products'
import cameraIcon from '../../assets/final/camera.svg'
import chevronIcon from '../../assets/final/chevron.svg'

export default function MyPage() {
  const { profile, setName, setAvatarUrl } = useProfile()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(profile.name)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [ownedCount, setOwnedCount] = useState(null)
  const nameInputRef = useRef(null)

  const { pickers, openGallery, openCamera } = usePhotoPick({
    onPick: ({ url }) => {
      setAvatarUrl(url)
      setSourceOpen(false)
    },
  })

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  useEffect(() => {
    let cancelled = false
    setOwnedCount(null)
    getUserProducts(profile.id, { status: 'owning' })
      .then((data) => {
        if (cancelled) return
        setOwnedCount((data?.products ?? []).length)
      })
      .catch((err) => {
        if (cancelled) return
        if (isNotFoundError(err)) {
          setOwnedCount(0)
          return
        }
        setOwnedCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [profile.id])

  const saveName = () => {
    const next = nameDraft.trim()
    if (next) setName(next)
    else setNameDraft(profile.name)
    setEditingName(false)
  }

  const displayOwnedCount = ownedCount === null ? '…' : ownedCount

  return (
    <AppShell>
      {pickers}
      <div className="page page--my">
        <div className="my-profile">
          <button
            type="button"
            className="avatar-upload"
            aria-label="프로필 사진 변경"
            onClick={() => setSourceOpen(true)}
          >
            {profile.avatarUrl ? (
              <img className="avatar-upload__photo" src={profile.avatarUrl} alt="" />
            ) : (
              <img src={cameraIcon} alt="" width={24} height={24} />
            )}
          </button>

          <div className="my-profile__identity">
            {editingName ? (
              <input
                ref={nameInputRef}
                className="profile-name-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') {
                    setNameDraft(profile.name)
                    setEditingName(false)
                  }
                }}
                aria-label="이름 수정"
              />
            ) : (
              <button
                type="button"
                className="profile-name profile-name--btn"
                onClick={() => {
                  setNameDraft(profile.name)
                  setEditingName(true)
                }}
              >
                {profile.name}
              </button>
            )}
            <p className="profile-id">{profile.handle}</p>
          </div>

          <Link to="/my/products" className="owned-box">
            <div className="owned-box__copy">
              <p className="owned-box__label">보유 제품</p>
              <p className="owned-box__count">{displayOwnedCount}</p>
            </div>
            <img className="owned-box__chevron" src={chevronIcon} alt="" width={30} height={30} />
          </Link>
        </div>
      </div>

      {sourceOpen ? (
        <div
          className="sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="사진 선택"
          onClick={() => setSourceOpen(false)}
        >
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <p className="sheet-card__title">프로필 사진</p>
            <button type="button" className="sheet-card__action" onClick={openCamera}>
              카메라
            </button>
            <button type="button" className="sheet-card__action" onClick={openGallery}>
              갤러리
            </button>
            <button
              type="button"
              className="sheet-card__action sheet-card__action--muted"
              onClick={() => setSourceOpen(false)}
            >
              취소
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
