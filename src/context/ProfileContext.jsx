import { createContext, useContext, useMemo, useState } from 'react'
import { currentUser as seedUser } from '../data/mock'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    const saved = window.sessionStorage.getItem('mcarry-profile')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        window.sessionStorage.removeItem('mcarry-profile')
      }
    }

    return {
      id: seedUser.id,
      name: seedUser.name,
      handle: seedUser.handle,
      ownedCount: seedUser.ownedCount,
      avatarUrl: null,
      profileType: null,
    }
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
      selectProfile: ({ userId, nickname, profileType, ownedCount }) => updateProfile((p) => ({
        ...p,
        id: userId,
        name: nickname || p.name,
        profileType,
        ownedCount: ownedCount ?? p.ownedCount,
      })),
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
