/**
 * Figma source of truth: UI 디자인 → 최종 디자인 !! (71:31)
 * Viewport: 375 × 812 (taller screens scroll)
 * Content width: 335, horizontal padding: 20
 *
 * Pink arrows / yellow notes in Figma = requirements only (never render)
 */

export const FIGMA = {
  fileKey: 'l05lWpDKY8QyYPCWzHIpe6',
  sectionId: '71:31',
  viewport: { w: 375, h: 812, pad: 20, content: 335 },
  colors: {
    green: '#366861',
    gold: '#ffd788',
    ink: '#262626',
    ink60: 'rgba(38,38,38,0.6)',
    ink50: 'rgba(38,38,38,0.5)',
    white: '#ffffff',
  },
  nav: {
    // White reference component (1126:281) — 5 icons
    // Order: 여정(doc) · 등록(scan) · 홈(home) · 리셀(shop) · 마이(person)
    // Active = #ffd788 only on current route
    nodeId: '1126:281',
    bar: { w: 335, h: 69, radius: 32, bottom: 18, left: 20 },
    icon: 30,
    inner: 250,
  },
}

/** Canonical screen nodes to implement (prefer ✅ / latest polished copies) */
export const SCREENS = {
  landing: '1398:267', // 랜딩 페이지 / Keeper 선택 / Brand Color

  // —— Main (재일) ——
  mainSelected: '1044:8366', // ✅ 메인페이지 - 제품 선택 완료
  mainBeforeSelect: '978:331', // ✅ 메인페이지 - 제품 선택 전
  mainEmptyProduct: '1118:2278', // ✅ 등록된 제품이 없는 경우
  mainMapCountry: '1044:8790', // ✅ 지도 국가 카테고리
  mainMapCountryDone: '1044:9230', // ✅ 국가 선택 완료
  mainMapExpand: '1044:9316', // ✅ 지도 펼친 후 사용자 확대

  // —— Journey (정환) ——
  passports: '1043:2747', // 제품 조회 / MY PASSPORTS (vertical snap)
  journeyList: '1119:278', // 여정 목록 조회 (empty CTA)
  journeyListFilled: '808:1935', // 여정 목록 조회 (행 + 국가필터)
  journeyListFilledAlt: '1043:2612', // 여정 목록 CTA 변형
  journeyEmpty: '1118:2446', // ✅ 등록된 여정이 없을때 (제품 드롭다운 열림)
  journeyDetailOwned: '927:1927', // ✅ 본인이 작성한 여정 상세
  journeyDetailOther: '1118:2682', // 타인이 작성한 여정 상세
  journeyForm: '1043:3231', // 여정 글 작성하기/수정하기
  journeyFormSuccess: '1043:2858', // 여정 저장 성공 모달
  journeyLinked: '1044:4568', // 이어짐 상세 기록 조회

  // —— My (정환) ——
  myProfile: '1041:636', // 마이페이지 - 사용자 정보 조회 5
  myProducts: '1041:664', // 내 제품 리스트 조회
  myCare: '1041:1215', // 진단 및 케어 이력
  myAiOnboard: '1041:978', // 온보딩

  // —— Register (재일) ——
  registerQr: '1044:7756',
  registerAuth: '1044:7758',
  registerPurchase: '1044:7798',
  registerPassport: '1044:8210',
  registerFirstJourney: '1044:8245',

  // —— Resell (시연) ——
  resellList: '1044:10308', // Resell 목록
  resellSelect: '751:1746', // 리셀 물품 선택 Step 1
  resellGuide: '786:3740', // 리셀 서비스 가이드
  resellInfo: '751:1796', // 일반 리셀 정보 Step 2
  resellShare: '824:4710', // 여정 기록 공유 Step 3
  resellOptional: '786:3839', // 선택 공개 설정 Step 3
  resellLetter: '751:1877', // 편지 Step 4
  resellCare: '768:3508', // 케어팁 Step 4
  resellConfirm: '751:1919', // 최종 확인 및 등록 Step 5
  resellDone: '751:1962', // 등록 완료 Step 6
  resellManage: '845:502', // 내 리셀글 관리 (빈)
  resellManageFilled: '845:406', // 내 리셀글 관리 (카드)
  resellDetailBuy: '901:10601', // 서사 프리뷰 · 구매/계승
  resellDetailMine: '901:10482', // 서사 프리뷰 · 삭제/수정
}

/**
 * Route map (service IA)
 * Nav tabs: /journey | /register | / | /resell | /my
 */
export const ROUTES = {
  home: '/',
  journeyPassports: '/journey', // MY PASSPORTS vertical cards
  journeyRecords: '/journey/records/:productId', // MY JOURNEYS list
  journeyEntry: '/journey/entry/:id',
  journeyEntryEdit: '/journey/entry/:id/edit',
  journeyNew: '/journey/new',
  register: '/register',
  resell: '/resell',
  resellNew: '/resell/new',
  resellDetail: '/resell/:id',
  my: '/my',
  myProducts: '/my/products',
  myProductDetail: '/my/products/:id',
  myAi: '/my/products/:id/ai',
}
