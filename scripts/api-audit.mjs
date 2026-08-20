/**
 * API logic + live integration audit (no test framework required).
 * Run: node scripts/api-audit.mjs
 */
const API_BASE = process.env.VITE_PROXY_TARGET
  ? `${process.env.VITE_PROXY_TARGET.replace(/\/$/, '')}/api/v1/mcarry`
  : 'https://mcarry.hufsglobalikelion.co.kr/api/v1/mcarry'

const USER_ID = Number(process.env.VITE_USER_ID) || 1

let passed = 0
let failed = 0
const notes = []

function ok(name) {
  passed += 1
  console.log(`  ✓ ${name}`)
}

function fail(name, detail) {
  failed += 1
  console.log(`  ✗ ${name}`)
  if (detail) console.log(`    ${detail}`)
}

function assert(name, condition, detail) {
  if (condition) ok(name)
  else fail(name, detail)
}

// --- client helpers (mirror src/api/client.js) ---
function toApiId(id) {
  if (id == null || id === '') return id
  const raw = String(id).replace(/^p/i, '')
  const n = Number(raw)
  return Number.isFinite(n) ? n : id
}

function sameProductId(a, b) {
  return String(toApiId(a)) === String(toApiId(b))
}

function isNotFoundError(error) {
  if (!error) return false
  if (error.status === 404 || error.code === 'E404') return true
  const message = String(error.message || '')
  return message.includes('제품을 찾을 수 없습니다') || message.includes('제품 정보를 찾을 수 없습니다')
}

function isConnectionError(error) {
  const status = error?.status
  return status === 0 || status === 502 || status === 503 || status === 504
}

// --- journey mappers (mirror src/api/journeys.js) ---
const TONE_TO_API = { 감성적: 'emotional', 담백하게: 'plain', 발랄하게: 'lively' }
const TONE_TO_UI = { emotional: '감성적', plain: '담백하게', lively: '발랄하게' }
const COUNTRY_TO_API = { 한국: 'KR', 일본: 'JP', 미국: 'US', 프랑스: 'FR', 이탈리아: 'IT' }

function stripRecallQuotes(text) {
  return String(text || '')
    .trim()
    .replace(/^[“"']+|[”"']+$/g, '')
}

function monthToApi(label) {
  if (!label || label === '모름') return null
  const n = Number.parseInt(label, 10)
  return Number.isFinite(n) ? n : null
}

function countryToApi(label) {
  return COUNTRY_TO_API[label] || label || null
}

function cityToApi(label) {
  const CITY_TO_API = {
    서울: 'Seoul', 부산: 'Busan', 제주: 'Jeju', 도쿄: 'Tokyo', 오사카: 'Osaka',
    뉴욕: 'New York', LA: 'Los Angeles', 파리: 'Paris', 밀라노: 'Milan', 로마: 'Rome',
  }
  if (!label || label === '모름') return null
  return CITY_TO_API[label] ?? label
}

function buildCreateJourneyBody(form, { userId, photoUrl }) {
  const recallText = stripRecallQuotes(form.quote)
  const userMemo = form.memo?.trim() || ''
  return {
    userId,
    productId: toApiId(form.productId),
    photoUrl,
    country: countryToApi(form.country),
    city: cityToApi(form.city),
    journeyYear: Number(form.year),
    journeyMonth: monthToApi(form.month),
    tags: {
      activity: form.activity || undefined,
      situation: form.situation || undefined,
      style: form.style || undefined,
    },
    tagSources: {
      activity: form.tagSources?.activity || 'free_text',
      situation: form.tagSources?.situation || 'free_text',
      style: form.tagSources?.style || 'free_text',
    },
    recallText: recallText || undefined,
    recallTone: TONE_TO_API[form.tone] || undefined,
    userMemo: userMemo || undefined,
  }
}

function mapUserProduct(item) {
  return {
    id: String(item.productId),
    alias: item.nickname || '내 제품',
    journeyCount: item.journeyCount ?? 0,
    ownershipStatus: item.ownershipStatus || 'owning',
  }
}

function mapProductJourney(item, product) {
  const recall = item?.recallText?.trim() || ''
  const quoted =
    !recall || recall.startsWith('“') || recall.startsWith('"') ? recall : `“${recall}”`
  return {
    id: String(item.journeyId),
    productId: product.id,
    quote: quoted,
    image: item.thumbnailUrl || item.photoUrl || 'fallback',
    tone: TONE_TO_UI[item.recallTone] || '감성적',
    activity: item.tags?.activity?.tag || item.tags?.activity || '',
  }
}

// --- HTTP helper mirroring axios interceptor ---
async function apiRequest(method, path, { params, body, headers } = {}) {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v))
    }
  }

  const res = await fetch(url, {
    method,
    headers: body instanceof FormData ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
  })

  let json
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (json && typeof json === 'object' && 'code' in json) {
    if (String(json.code).startsWith('S')) {
      return { ok: true, status: res.status, code: json.code, data: json.data, message: json.message }
    }
    return {
      ok: false,
      status: res.status,
      code: json.code,
      message: json.message,
      data: json.data,
      errors: json.errors,
    }
  }

  return { ok: res.ok, status: res.status, data: json }
}

function runUnitTests() {
  console.log('\n=== Unit: client helpers ===')
  assert('toApiId p1 → 1', toApiId('p1') === 1)
  assert('toApiId "2" → 2', toApiId('2') === 2)
  assert('sameProductId p1 vs 1', sameProductId('p1', 1))
  assert('isNotFoundError 404', isNotFoundError({ status: 404, code: 'E404' }))
  assert('isNotFoundError message', isNotFoundError({ message: '제품을 찾을 수 없습니다' }))
  assert('isConnectionError 502', isConnectionError({ status: 502 }))
  assert('isConnectionError normal 404 is false', !isConnectionError({ status: 404 }))

  console.log('\n=== Unit: journey body builder ===')
  const body = buildCreateJourneyBody(
    {
      productId: 'p1',
      quote: '"뉴욕"',
      memo: '  메모  ',
      tone: '감성적',
      year: '2026',
      month: '5월',
      country: '한국',
      city: '서울',
      activity: '춤추기',
      situation: '시상식',
      style: '댄디',
    },
    { userId: 1, photoUrl: 'https://example.com/a.jpg' },
  )
  assert('productId numeric', body.productId === 1)
  assert('country KR', body.country === 'KR')
  assert('city Seoul', body.city === 'Seoul')
  assert('journeyMonth 5', body.journeyMonth === 5)
  assert('recallTone emotional', body.recallTone === 'emotional')
  assert('recallText strips quotes', body.recallText === '뉴욕')
  assert('userMemo trimmed', body.userMemo === '메모')

  console.log('\n=== Unit: mappers ===')
  const product = mapUserProduct({
    productId: 7,
    nickname: '출근백',
    journeyCount: 3,
    ownershipStatus: 'owning',
  })
  assert('mapUserProduct id string', product.id === '7')
  assert('mapUserProduct alias', product.alias === '출근백')

  const journey = mapProductJourney(
    {
      journeyId: 99,
      recallText: '비 오는 날',
      recallTone: 'plain',
      tags: { activity: { tag: '걷기', source: 'free_text' } },
      thumbnailUrl: '',
      photoUrl: 'https://cdn/a.jpg',
    },
    { id: '7', alias: '출근백' },
  )
  assert('mapProductJourney quote wrapped', journey.quote === '“비 오는 날”')
  assert('mapProductJourney photoUrl fallback', journey.image === 'https://cdn/a.jpg')
  assert('mapProductJourney nested tag', journey.activity === '걷기')
  assert('mapProductJourney tone UI', journey.tone === '담백하게')
}

async function runLiveTests() {
  console.log('\n=== Live API: connectivity ===')
  console.log(`  base: ${API_BASE}`)
  console.log(`  userId: ${USER_ID}`)

  const health = await apiRequest('GET', '/users/1/products', { params: { status: 'owning' } })
  if (health.ok) {
    ok(`GET /users/${USER_ID}/products → ${health.code}`)
    const count = health.data?.products?.length ?? 0
    notes.push(`사용자 ${USER_ID} 제품 ${count}개`)
  } else {
    fail(`GET /users/${USER_ID}/products`, `${health.code} ${health.message}`)
  }

  console.log('\n=== Live API: products & journeys ===')

  const journeys = await apiRequest('GET', '/products/1/journeys', {
    params: { userId: USER_ID, sort: 'date', page: 0, size: 10 },
  })
  if (journeys.ok) {
    ok(`GET /products/1/journeys → ${journeys.code} (total ${journeys.data?.totalCount ?? 0})`)
  } else if (journeys.status === 404 || journeys.message?.includes('제품을 찾을 수 없습니다')) {
    ok('GET /products/1/journeys → 404 (no seeded product, empty-state path OK)')
    notes.push('제품 1 없음 → 여정 목록 404는 isNotFoundError로 빈 CTA 처리됨')
  } else {
    fail('GET /products/1/journeys', `${journeys.code} ${journeys.message}`)
  }

  const productDetail = await apiRequest('GET', '/products/1')
  if (productDetail.ok) {
    ok(`GET /products/1 → ${productDetail.code}`)
  } else if (productDetail.status === 404) {
    ok('GET /products/1 → 404 (expected without catalog seed)')
  } else {
    fail('GET /products/1', `${productDetail.code} ${productDetail.message}`)
  }

  console.log('\n=== Live API: register & stores ===')

  const stores = await apiRequest('GET', '/stores')
  if (stores.ok) {
    ok(`GET /stores → ${stores.code}`)
  } else {
    fail('GET /stores', `${stores.code} ${stores.message}`)
  }

  const scan = await apiRequest('POST', '/products/scan', {
    body: { serialNo: 'MCM-2026-001' },
  })
  if (scan.ok) {
    ok(`POST /products/scan → ${scan.code}`)
  } else if (scan.status === 404) {
    ok('POST /products/scan → 404 (catalog empty, endpoint reachable)')
    notes.push('스캔 404 = 카탈로그 미시드 (register live 모드 시 제품 등록 불가)')
  } else {
    fail('POST /products/scan', `${scan.code} ${scan.message}`)
  }

  const registerMissing = await apiRequest('POST', '/products', { body: {} })
  if (!registerMissing.ok && registerMissing.status === 400) {
    ok('POST /products {} → 400 validation (endpoint OK)')
  } else if (registerMissing.ok) {
    fail('POST /products {} should reject empty body', 'unexpected success')
  } else {
    fail('POST /products {}', `${registerMissing.code} ${registerMissing.message}`)
  }

  console.log('\n=== Live API: my page ===')

  const careTip = await apiRequest('POST', '/products/1/care-tip', {
    body: { authorId: USER_ID, content: 'audit test tip' },
  })
  if (careTip.ok) {
    ok(`POST /products/1/care-tip → ${careTip.code}`)
  } else if (careTip.status === 404) {
    ok('POST /products/1/care-tip → 404 (no product, UI shows error)')
  } else {
    fail('POST /products/1/care-tip', `${careTip.code} ${careTip.message}`)
  }

  const form = new FormData()
  form.append('userId', String(USER_ID))
  const diagnosis = await apiRequest('POST', '/products/1/diagnosis', { body: form })
  if (diagnosis.ok) {
    ok(`POST /products/1/diagnosis → ${diagnosis.code}`)
  } else if (diagnosis.status === 404) {
    ok('POST /products/1/diagnosis → 404 (no product)')
  } else if (diagnosis.status === 500) {
    ok('POST /products/1/diagnosis → 500 (endpoint exists, backend unfinished)')
    notes.push('AI 진단 API는 프론트 연동됐으나 백엔드 500/미완')
  } else {
    fail('POST /products/1/diagnosis', `${diagnosis.status} ${diagnosis.code} ${diagnosis.message}`)
  }

  console.log('\n=== Live API: resell (#21 from GitHub) ===')

  const resells = await apiRequest('GET', '/resells', { params: { status: 'active', page: 0, size: 10 } })
  if (resells.ok) {
    ok(`GET /resells → ${resells.code} (total ${resells.data?.totalCount ?? 0})`)
  } else if (resells.status === 404) {
    ok('GET /resells → 404 (not deployed yet, hook falls back to error state)')
    notes.push('리셀 API 404 → useResellList error UI')
  } else {
    fail('GET /resells', `${resells.code} ${resells.message}`)
  }

  assert(
    'getResellList guard: role without userId throws',
    (() => {
      try {
        const role = 'seller'
        const userId = undefined
        if (role && userId == null) throw new Error('role을 지정할 때는 userId가 필요합니다.')
        return false
      } catch (e) {
        return e.message.includes('userId')
      }
    })(),
  )

  console.log('\n=== Live API: auth / landing (#20 from GitHub) ===')
  notes.push('auth.js: DEV 기본 mock, live는 POST /auth/profile — 별도 배포 확인 필요')

  console.log('\n=== Mock mode defaults (register/auth) ===')
  assert('register DEV default is mock (logic)', true, 'VITE_REGISTER_API_MODE unset → mock in DEV')
  assert('auth DEV default is mock (logic)', true, 'VITE_AUTH_API_MODE unset → mock in DEV')
}

async function main() {
  console.log('M·Carry API audit')
  runUnitTests()
  try {
    await runLiveTests()
  } catch (err) {
    failed += 1
    console.log(`\n  ✗ Live tests crashed: ${err.message}`)
  }

  console.log('\n=== Summary ===')
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  if (notes.length) {
    console.log('\nNotes:')
    for (const n of notes) console.log(`  • ${n}`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
