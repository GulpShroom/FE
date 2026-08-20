import { createContext, useContext, useMemo, useState } from 'react'
import { currentUser as seedUser } from '../data/mock'

const ProfileContext = createContext(null)

const defaultProfile = {
  id: seedUser.id,
  userId: seedUser.id,
  name: seedUser.name,
  handle: seedUser.handle,
  ownedCount: seedUser.ownedCount,
  avatarUrl: null,
  profileType: null,
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    const saved = window.sessionStorage.getItem('mcarry-profile')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const userId = parsed.userId ?? parsed.id ?? defaultProfile.userId
          // ownedCount는 API로만 갱신 — 세션에 남은 mock(12) 값이 깜빡이지 않게 무시
          const { ownedCount: _staleOwnedCount, ...rest } = parsed
          return { ...defaultProfile, ...rest, id: userId, userId, ownedCount: 0 }
        }
        window.sessionStorage.removeItem('mcarry-profile')
      } catch {
        window.sessionStorage.removeItem('mcarry-profile')
      }
    }

    return defaultProfile

  })

  const updateProfile = (updater) => {
    setProfile((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      window.sessionStorage.setItem('mcarry-profile', JSON.stringify(next))
      return next
    })
  }

  const value = useMemo(
    () => ({
      profile,
      setName: (name) => updateProfile((p) => ({ ...p, name })),
      setAvatarUrl: (avatarUrl) => updateProfile((p) => ({ ...p, avatarUrl })),
      selectProfile: (selected = {}) => {
        const userId = selected.userId ?? selected.id
        if (userId == null || userId === '') {
          throw new Error('프로필 응답에 사용자 ID가 없습니다.')
        }

        const next = {
          ...profile,
          id: userId,
          userId,
          name: selected.nickname || profile.name,
          profileType: selected.profileType,
          ownedCount: selected.ownedCount ?? 0,
        }

        window.sessionStorage.setItem('mcarry-profile', JSON.stringify(next))
        setProfile(next)
        return next
      },
    }),
    [profile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// Hook export — ProfileProvider와 분리하면 import 경로가 늘어나므로 refresh 규칙만 예외 처리
// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
