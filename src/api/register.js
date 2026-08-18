import { api, toApiId } from './client'

const REGISTER_API_MODE = import.meta.env.VITE_REGISTER_API_MODE
  || (import.meta.env.DEV ? 'mock' : 'live')

export const isRegisterMockMode = REGISTER_API_MODE === 'mock'

const mockStores = [
  { storeId: 1, country: '대한민국', city: '서울', storeName: 'MCM 신세계 본점' },
  { storeId: 2, country: '대한민국', city: '서울', storeName: 'MCM 롯데 본점' },
  { storeId: 3, country: '대한민국', city: '부산', storeName: 'MCM 신세계 센텀시티점' },
  { storeId: 4, country: '일본', city: '도쿄', storeName: 'MCM 긴자점' },
  { storeId: 5, country: '일본', city: '오사카', storeName: 'MCM 우메다점' },
  { storeId: 6, country: '독일', city: '뮌헨', storeName: 'MCM 뮌헨점' },
]

let lastMockProduct = null

function delay(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 180)
  })
}

function mockScanProduct({ serialNo, qrCode }) {
  return delay({
    isRegistered: false,
    serialNo: serialNo || (qrCode ? 'MCM-2026-001' : ''),
    officialName: 'MCM 스타크 백팩',
    officialImageUrl: null,
    manufactureYear: 2024,
    productLine: '비세토스',
    color: '코냑',
    authenticatedAt: '2026-08-11',
  })
}

function mockGetStores({ country, city } = {}) {
  const countryStores = country
    ? mockStores.filter((store) => store.country === country)
    : []
  const cityStores = city
    ? countryStores.filter((store) => store.city === city)
    : countryStores

  return delay({
    countries: [...new Set(mockStores.map((store) => store.country))],
    cities: country
      ? [...new Set(countryStores.map((store) => store.city))].map((name) => ({ city: name }))
      : [],
    stores: city ? cityStores.map(({ storeId, storeName }) => ({ storeId, storeName })) : [],
  })
}

function mockRegisterProduct(body) {
  const store = mockStores.find((item) => item.storeId === body.storeId) ?? null
  lastMockProduct = {
    ...body,
    productId: 1,
    passportId: 'DP-20260823',
    firstJourneyId: 100,
    store,
  }

  return delay({
    productId: 1,
    passportId: 'DP-20260823',
    serialNo: body.serialNo,
    nickname: body.nickname,
    officialName: 'MCM 스타크 백팩',
    currentGeneration: 1,
    purchaseInfoStatus: body.purchaseDate && body.storeId ? 'completed' : 'pending',
    firstJourneyId: 100,
    createdAt: '2026-08-11T07:50:00+09:00',
  })
}

function mockGetDigitalPassport(productId) {
  const product = lastMockProduct ?? {
    serialNo: 'MCM-2026-001',
    nickname: '출근백',
    purchaseDate: '2026-08-24',
    store: mockStores[0],
    passportId: 'DP-20260823',
  }

  return delay({
    productId: toApiId(productId),
    passportId: product.passportId || 'DP-20260823',
    serialNo: product.serialNo,
    nickname: product.nickname,
    officialName: 'MCM 스타크 백팩',
    officialImageUrl: null,
    isAuthenticated: true,
    authenticatedAt: '2026-08-11',
    currentGeneration: 1,
    specification: {
      manufactureYear: 2024,
      productLine: '비세토스',
      color: '코냑',
    },
    purchase: {
      purchaseDate: product.purchaseDate || null,
      storeId: product.store?.storeId ?? null,
      storeName: product.store?.storeName ?? null,
      city: product.store?.city ?? null,
      country: product.store?.country ?? null,
    },
  })
}

export function scanProduct(body) {
  if (isRegisterMockMode) return mockScanProduct(body)
  return api.post('/products/scan', body)
}

export function getStores(params = {}) {
  if (isRegisterMockMode) return mockGetStores(params)
  return api.get('/stores', { params })
}

export function registerProduct(body) {
  if (isRegisterMockMode) return mockRegisterProduct(body)
  return api.post('/products', body)
}

export function getDigitalPassport(productId) {
  if (isRegisterMockMode) return mockGetDigitalPassport(productId)
  return api.get(`/products/${toApiId(productId)}`)
}

export function updateFirstJourneyMemo(journeyId, { userId, userMemo }) {
  if (isRegisterMockMode) return delay({ journeyId, userMemo })
  return api.patch(`/journeys/${toApiId(journeyId)}`, { userId, userMemo })
}
