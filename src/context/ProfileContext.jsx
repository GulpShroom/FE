import { createContext, useContext, useMemo, useState } from 'react'
import { currentUser as seedUser } from '../data/mock'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({
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

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
