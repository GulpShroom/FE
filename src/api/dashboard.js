import { api, toApiId } from './client'

export async function getMyProducts(userId) {
  return api.get(`/users/${toApiId(userId)}/products`, {
    params: { status: 'owning' },
  })
}

export function getProductSummary(productId) {
  return api.get(`/products/${toApiId(productId)}/summary`)
}

export function getProductLineage(productId) {
  return api.get(`/products/${toApiId(productId)}/lineage`)
}

export function getProductJourneyMap(productId, userId) {
  return api.get(`/products/${toApiId(productId)}/map`, {
    params: { userId, zoom: 'district' },
  })
}
