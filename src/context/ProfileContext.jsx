import { createContext, useContext, useMemo, useState } from 'react'
import { currentUser as seedUser } from '../data/mock'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({
    id: seedUser.id,
    name: seedUser.name,
    handle: seedUser.handle,
    ownedCount: seedUser.ownedCount,
    avatarUrl: null,
  })

  const value = useMemo(
    () => ({
      profile,
      setName: (name) => setProfile((p) => ({ ...p, name })),
      setAvatarUrl: (avatarUrl) => setProfile((p) => ({ ...p, avatarUrl })),
    }),
    [profile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// Provider와 훅을 한 파일에서 관리하므로 Fast Refresh 규칙만 예외 처리한다.
// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
