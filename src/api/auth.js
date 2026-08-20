import { api } from './client'

const AUTH_API_MODE = import.meta.env.VITE_AUTH_API_MODE
  || (import.meta.env.DEV ? 'mock' : 'live')

export const isAuthMockMode = AUTH_API_MODE === 'mock'

const mockProfiles = {
  first_keeper: {
    userId: 1,
    nickname: '민지',
    profileType: 'first_keeper',
    ownedCount: 12,
  },
  next_keeper: {
    userId: 2,
    nickname: '서준',
    profileType: 'next_keeper',
    ownedCount: 0,
  },
}

function mockSelectProfile(profileType) {
  const profile = mockProfiles[profileType]
  if (!profile) return Promise.reject(new Error('지원하지 않는 프로필 타입입니다.'))

  return new Promise((resolve) => {
    window.setTimeout(() => resolve(profile), 220)
  })
}

export function selectDemoProfile(profileType) {
  if (isAuthMockMode) return mockSelectProfile(profileType)
  return api.post('/auth/profile', { profileType })
}
