import { getMyProducts } from './dashboard'
import { getCareTips, mapCareTip, pickPassportCareTip } from './my'
import { getGenerationLetter } from './products'
import { isNotFoundError } from './client'

/**
 * 리셀 상세에는 productId가 없어, 보유 제품 officialName으로 productId를 해석합니다.
 */
export async function resolveOwnedProductId({ userId, officialName }) {
  if (userId == null || userId === '' || !officialName) return null

  try {
    const data = await getMyProducts(userId)
    const items = Array.isArray(data) ? data : data?.products ?? []
    const target = String(officialName).trim()
    const matched = items.find((item) => String(item.officialName || '').trim() === target)
    const productId = matched?.productId ?? matched?.id
    return productId != null ? productId : null
  } catch {
    return null
  }
}

/**
 * 작성자/구매자가 볼 수 있는 Letter·Care Tip 본문을 제품 API에서 조회합니다.
 * GET /resells/{id}는 hasLetter/hasCareTip 플래그만 주고 본문은 주지 않습니다.
 */
export async function loadResellSharedContents({
  productId,
  generation,
  wantLetter = true,
  wantCareTip = true,
}) {
  const result = { letter: '', careTip: '', productId: productId ?? null }
  if (productId == null) return result

  const generationKey = generation != null ? String(generation) : null

  if (wantCareTip) {
    try {
      const careData = await getCareTips(productId)
      const tips = (careData?.careTips ?? []).map(mapCareTip)
      result.careTip = pickPassportCareTip(tips, generationKey)?.content || ''
    } catch {
      // care tip 조회 실패는 화면을 막지 않음
    }
  }

  if (wantLetter) {
    const generationsToTry = [
      generation,
      generation != null ? Number(generation) - 1 : null,
      1,
    ].filter((value, index, arr) => value != null && value > 0 && arr.indexOf(value) === index)

    for (const gen of generationsToTry) {
      try {
        const letterData = await getGenerationLetter(productId, gen)
        const content = letterData?.content?.trim?.() || ''
        if (content) {
          result.letter = content
          break
        }
      } catch (error) {
        if (!isNotFoundError(error)) break
      }
    }
  }

  return result
}
