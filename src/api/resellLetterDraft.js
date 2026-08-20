const STORAGE_KEY = 'mcarry-resell-letters'

function readAll() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

/** 리셀 등록/수정 시 판매자 편지 본문 보관 (구매 시 transfer letter API로 전달) */
export function saveResellLetterDraft(resellId, content) {
  if (resellId == null || resellId === '') return
  const key = String(resellId)
  const text = String(content || '').trim()
  const all = readAll()
  if (!text) {
    delete all[key]
  } else {
    all[key] = text
  }
  writeAll(all)
}

export function getResellLetterDraft(resellId) {
  if (resellId == null || resellId === '') return ''
  return String(readAll()[String(resellId)] || '')
}

export function clearResellLetterDraft(resellId) {
  if (resellId == null || resellId === '') return
  const all = readAll()
  delete all[String(resellId)]
  writeAll(all)
}
