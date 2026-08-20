import worldCountries from 'world-countries'

const COUNTRY_CODE_ALIASES = {
  북한: 'KP',
  튀르키예: 'TR',
  콩고공화국: 'CG',
  도미니카연방: 'DM',
}

const normalizeCountryName = (name) => String(name || '').replace(/\s/g, '')
const countryMetadataByName = new Map()

worldCountries.forEach((country) => {
  const koreanNames = [
    country.translations?.kor?.common,
    country.translations?.kor?.official,
  ]
  koreanNames.filter(Boolean).forEach((name) => {
    countryMetadataByName.set(normalizeCountryName(name), country)
  })
})

const countryNamesByContinent = {
  아시아: [
    '아프가니스탄', '아르메니아', '아제르바이잔', '바레인', '방글라데시', '부탄', '브루나이', '캄보디아',
    '중국', '키프로스', '조지아', '인도', '인도네시아', '이란', '이라크', '이스라엘', '일본', '요르단',
    '카자흐스탄', '쿠웨이트', '키르기스스탄', '라오스', '레바논', '말레이시아', '몰디브', '몽골', '미얀마',
    '네팔', '북한', '오만', '파키스탄', '팔레스타인', '필리핀', '카타르', '사우디아라비아', '싱가포르',
    '대한민국', '스리랑카', '시리아', '타지키스탄', '태국', '동티모르', '튀르키예', '투르크메니스탄',
    '아랍에미리트', '우즈베키스탄', '베트남', '예멘',
  ],
  유럽: [
    '알바니아', '안도라', '오스트리아', '벨라루스', '벨기에', '보스니아 헤르체고비나', '불가리아', '크로아티아',
    '체코', '덴마크', '에스토니아', '핀란드', '프랑스', '독일', '그리스', '헝가리', '아이슬란드', '아일랜드',
    '이탈리아', '라트비아', '리히텐슈타인', '리투아니아', '룩셈부르크', '몰타', '몰도바', '모나코',
    '몬테네그로', '네덜란드', '북마케도니아', '노르웨이', '폴란드', '포르투갈', '루마니아', '러시아',
    '산마리노', '세르비아', '슬로바키아', '슬로베니아', '스페인', '스웨덴', '스위스', '우크라이나',
    '영국', '바티칸 시국',
  ],
  아프리카: [
    '알제리', '앙골라', '베냉', '보츠와나', '부르키나파소', '부룬디', '카보베르데', '카메룬',
    '중앙아프리카공화국', '차드', '코모로', '콩고공화국', '콩고민주공화국', '코트디부아르', '지부티',
    '이집트', '적도기니', '에리트레아', '에스와티니', '에티오피아', '가봉', '감비아', '가나', '기니',
    '기니비사우', '케냐', '레소토', '라이베리아', '리비아', '마다가스카르', '말라위', '말리', '모리타니',
    '모리셔스', '모로코', '모잠비크', '나미비아', '니제르', '나이지리아', '르완다', '상투메 프린시페',
    '세네갈', '세이셸', '시에라리온', '소말리아', '남아프리카공화국', '남수단', '수단', '탄자니아',
    '토고', '튀니지', '우간다', '잠비아', '짐바브웨',
  ],
  북아메리카: [
    '앤티가 바부다', '바하마', '바베이도스', '벨리즈', '캐나다', '코스타리카', '쿠바', '도미니카연방',
    '도미니카공화국', '엘살바도르', '그레나다', '과테말라', '아이티', '온두라스', '자메이카', '멕시코',
    '니카라과', '파나마', '세인트키츠 네비스', '세인트루시아', '세인트빈센트 그레나딘',
    '트리니다드 토바고', '미국',
  ],
  남아메리카: [
    '아르헨티나', '볼리비아', '브라질', '칠레', '콜롬비아', '에콰도르', '가이아나', '파라과이',
    '페루', '수리남', '우루과이', '베네수엘라',
  ],
  오세아니아: [
    '호주', '피지', '키리바시', '마셜제도', '미크로네시아 연방', '나우루', '뉴질랜드', '팔라우',
    '파푸아뉴기니', '사모아', '솔로몬제도', '통가', '투발루', '바누아투',
  ],
}

export const countryGroups = Object.entries(countryNamesByContinent).map(([continent, names]) => ({
  continent,
  countries: names.map((label) => {
    const aliasCode = COUNTRY_CODE_ALIASES[label]
    const metadata = aliasCode
      ? worldCountries.find((country) => country.cca2 === aliasCode)
      : countryMetadataByName.get(normalizeCountryName(label))

    return {
      id: metadata.cca2.toLowerCase(),
      label,
      isoCode: metadata.cca2,
      numericCode: metadata.ccn3,
      center: metadata.latlng,
    }
  }),
}))

export const searchableCountries = countryGroups.flatMap((group) => group.countries)
export const allCountriesOption = { id: 'all', label: '전체 국가' }
