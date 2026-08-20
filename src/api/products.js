import { api, toApiId } from './client'

/**
 * GET /users/{userId}/products
 * status: owning | transferred | all
 */
export function getUserProducts(userId, { status = 'owning' } = {}) {
  return api.get(`/users/${toApiId(userId)}/products`, {
    params: { status },
  })
}

/** GET /products/{productId} — 디지털 여권 */
export function getDigitalPassport(productId) {
  return api.get(`/products/${toApiId(productId)}`)
}

/** GET /products/{productId}/summary — 제품 요약바 */
export function getProductSummary(productId) {
  return api.get(`/products/${toApiId(productId)}/summary`)
}

/** GET /products/{productId}/lineage — 계보 타임라인 */
export function getProductLineage(productId) {
  return api.get(`/products/${toApiId(productId)}/lineage`)
}

/** GET /products/{productId}/lineage/{generation}/letter — 세대별 편지 */
export function getGenerationLetter(productId, generation) {
  return api.get(`/products/${toApiId(productId)}/lineage/${generation}/letter`)
}

function shortName(name, max = 12) {
  const text = String(name || '').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

export function mapUserProduct(item) {
  return {
    id: String(item.productId),
    alias: item.nickname || '내 제품',
    name: item.officialName || '',
    nameEn: item.officialName || '',
    shortName: shortName(item.officialName || item.nickname || ''),
    serial: item.passportId || '',
    passportId: item.passportId || '',
    generation: item.generation ?? 1,
    journeyCount: item.journeyCount ?? 0,
    image: item.officialImageUrl || '',
    thumb: item.officialImageUrl || '',
    ownershipStatus: item.ownershipStatus || 'owning',
    inheritanceLetter: item.inheritanceLetter ?? null,
    registeredAt: item.registeredAt || null,
  }
}

export function mapDigitalPassport(item) {
  const spec = item?.specification ?? {}
  const purchase = item?.purchase ?? {}
  const material = [spec.productLine, spec.color, spec.manufactureYear]
    .filter((v) => v != null && v !== '')
    .join(' · ')
  const purchaseLine = [
    purchase.storeName,
    purchase.purchaseDate ? String(purchase.purchaseDate).replace(/-/g, '. ') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    id: String(item.productId),
    passportId: item.passportId || '',
    serial: item.serialNo || item.passportId || '',
    alias: item.nickname || '내 제품',
    name: item.officialName || '',
    image: item.officialImageUrl || '',
    isAuthenticated: Boolean(item.isAuthenticated),
    authenticatedAt: item.authenticatedAt || null,
    currentGeneration: item.currentGeneration ?? 1,
    material: material || '',
    purchase: purchaseLine || '',
    specification: spec,
    purchaseInfo: purchase,
  }
}

export function mapProductSummary(item) {
  const rawScore = item?.provenanceScore
  const score =
    rawScore == null || rawScore === ''
      ? null
      : Number.isFinite(Number(rawScore))
        ? Number(rawScore)
        : null

  return {
    id: String(item.productId),
    alias: item.nickname || '',
    name: item.officialName || '',
    isAuthenticated: Boolean(item.isAuthenticated),
    journeyCount: item.journeyCount ?? 0,
    provenanceScore: score,
    provenanceStatus: item.provenanceStatus || 'insufficient',
    keeperCount: item.keeperCount ?? 1,
  }
}

export function mapLineageGeneration(item) {
  return {
    id: `g${item.generation}`,
    ownershipId: item.ownershipId,
    generation: item.generation,
    label: item.keeperLabel || `${item.generation} Keeper`,
    period: item.durationText || '',
    active: Boolean(item.isCurrentOwner),
    ownedFrom: item.ownedFrom || null,
    ownedTo: item.ownedTo || null,
    hasOpenedLetter: Boolean(item.hasOpenedLetter),
  }
}

export function mapGenerationLetter(item) {
  return {
    productId: String(item.productId),
    generation: item.generation,
    transferId: item.transferId,
    letterId: item.letterId,
    content: item.content || '',
    openedAt: item.openedAt || null,
    fromKeeperLabel: item.fromKeeperLabel || null,
  }
}

export function buildKeeperGenerations(keeperCount, activeGeneration) {
  const count = Math.max(Number(keeperCount) || 1, 1)
  const active = Number(activeGeneration) || count
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
    return {
      id: `g${n}`,
      generation: n,
      label: `${n}${suffix} Keeper`,
      period: n === active ? '현재' : '',
      active: n === active,
      hasOpenedLetter: false,
    }
  })
}

export function ownershipBadge(status) {
  if (status === 'transferred') return '양도됨'
  if (status === 'linked') return '이어짐'
  return '소유중'
}

/** PATCH /products/{productId}/nickname — 별칭(닉네임) 수정 */
export function updateProductNickname(productId, { userId, nickname }) {
  return api.patch(`/products/${toApiId(productId)}/nickname`, {
    userId: toApiId(userId),
    nickname,
  })
}
