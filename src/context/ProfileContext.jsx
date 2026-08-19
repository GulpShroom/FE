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

// Hook export — ProfileProvider와 분리하면 import 경로가 늘어나므로 refresh 규칙만 예외 처리
// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
