import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { ProductSelect } from '../../components/ProductSelect'
import { journeys, products } from '../../data/mock'
import addPhotoIcon from '../../assets/final/form-add-photo.svg'
import replayIcon from '../../assets/final/form-replay.svg'
import chevronIcon from '../../assets/final/form-chevron.png'
import logo from '../../assets/final/logo.png'

const TONES = ['감성적', '담백하게', '발랄하게']
const YEARS = ['2024', '2025', '2026']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const COUNTRIES = ['한국', '일본', '미국', '프랑스', '이탈리아']
const CITIES = {
  한국: ['서울', '부산', '제주'],
  일본: ['도쿄', '오사카'],
  미국: ['뉴욕', 'LA'],
  프랑스: ['파리'],
  이탈리아: ['밀라노', '로마'],
}
const ACTIVITIES = ['춤추기', '걷기', '식사', '여행']
const SITUATIONS = ['시상식', '출근', '데이트', '일상']
const STYLES = ['댄디', '캐주얼', '럭셔리', '스포티']

const QUOTE_SAMPLES = {
  감성적: '“뉴욕의 밤, 그래미 시상식을 함께한 날”',
  담백하게: '“비 오는 출근길, 가방이 우산이 되어준 날”',
  발랄하게: '“금요일 밤, 퇴근 후 쏘삼을 함께 한 날”',
}

function MiniSelect({ value, options, onChange, width, showChevron = true }) {
  return (
    <label
      className={`mini-select${showChevron ? '' : ' mini-select--plain'}`}
      style={width ? { width } : undefined}
    >
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {showChevron ? <img src={chevronIcon} alt="" width={15} height={15} /> : null}
    </label>
  )
}

export default function JourneyFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = useMemo(
    () => (isEdit ? journeys.find((j) => j.id === id) : null),
    [id, isEdit],
  )

  const [successOpen, setSuccessOpen] = useState(false)
  const [tone, setTone] = useState('감성적')
  const [form, setForm] = useState(() => ({
    productId: existing?.productId ?? products[0]?.id ?? '',
    quote: existing?.quote ?? QUOTE_SAMPLES['감성적'],
    memo: existing?.memo ?? '',
    year: '2026',
    month: '5월',
    country: '한국',
    city: '서울',
    activity: '춤추기',
    situation: '시상식',
    style: '댄디',
    photoName: '',
  }))

  const product = products.find((p) => p.id === form.productId) ?? products[0]
  const cityOptions = CITIES[form.country] ?? CITIES['한국']

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const onTone = (next) => {
    setTone(next)
    setField('quote', QUOTE_SAMPLES[next] ?? form.quote)
  }

  const onReplay = () => {
    setField('quote', QUOTE_SAMPLES[tone] ?? form.quote)
  }

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) setField('photoName', file.name)
  }

  const goBack = () => {
    if (isEdit && existing) {
      navigate(`/journey/entry/${existing.id}`)
      return
    }
    navigate(`/journey/records/${form.productId || products[0]?.id}`)
  }

  return (
    <AppShell showBack showNav={false} onBack={goBack}>
      <div className="page page--journey-form">
        <ProductSelect
          products={products}
          value={form.productId}
          onChange={(pid) => setField('productId', pid)}
          variant="outline"
        />

        <label className="photo-upload">
          <input type="file" accept="image/*" onChange={onPhoto} />
          {form.photoName ? (
            <p className="photo-upload__name">{form.photoName}</p>
          ) : (
            <>
              <img src={addPhotoIcon} alt="" width={30} height={30} />
              <span>사진 업로드 하기</span>
            </>
          )}
        </label>

        <div className="quote-block">
          <div className="tone-row">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                className={`tone-chip${tone === t ? ' is-active' : ''}`}
                onClick={() => onTone(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="quote-field">
            <input
              type="text"
              value={form.quote}
              onChange={(e) => setField('quote', e.target.value)}
              aria-label="한 줄 기록"
            />
            <button type="button" className="quote-field__replay" onClick={onReplay} aria-label="다시 생성">
              <img src={replayIcon} alt="" width={15} height={15} />
            </button>
          </div>
        </div>

        <div className="form-duo">
          <div className="form-duo__col">
            <p className="form-duo__label">시점</p>
            <div className="form-duo__row">
              <MiniSelect
                value={form.year}
                options={YEARS}
                onChange={(v) => setField('year', v)}
                width={75}
              />
              <MiniSelect
                value={form.month}
                options={MONTHS}
                onChange={(v) => setField('month', v)}
                width={75}
              />
            </div>
          </div>
          <div className="form-duo__col">
            <p className="form-duo__label">지역</p>
            <div className="form-duo__row">
              <MiniSelect
                value={form.country}
                options={COUNTRIES}
                onChange={(v) => {
                  setForm((f) => ({
                    ...f,
                    country: v,
                    city: (CITIES[v] ?? CITIES['한국'])[0],
                  }))
                }}
                width={75}
              />
              <MiniSelect
                value={form.city}
                options={cityOptions}
                onChange={(v) => setField('city', v)}
                width={75}
              />
            </div>
          </div>
        </div>

        <div className="form-trio">
          <div className="form-trio__col">
            <p className="form-duo__label form-duo__label--solid">활동</p>
            <MiniSelect
              value={form.activity}
              options={ACTIVITIES}
              onChange={(v) => setField('activity', v)}
              showChevron={false}
            />
          </div>
          <div className="form-trio__col">
            <p className="form-duo__label form-duo__label--solid">상황</p>
            <MiniSelect
              value={form.situation}
              options={SITUATIONS}
              onChange={(v) => setField('situation', v)}
              showChevron={false}
            />
          </div>
          <div className="form-trio__col">
            <p className="form-duo__label form-duo__label--solid">스타일</p>
            <MiniSelect
              value={form.style}
              options={STYLES}
              onChange={(v) => setField('style', v)}
              showChevron={false}
            />
          </div>
        </div>

        <div className="memo-field">
          <p className="form-duo__label">메모</p>
          <textarea
            value={form.memo}
            onChange={(e) => setField('memo', e.target.value)}
            placeholder="이 날의 기억을 남겨보세요."
          />
        </div>

        <button type="button" className="btn-form-save" onClick={() => setSuccessOpen(true)}>
          저장하기
        </button>
      </div>

      {successOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--form-success">
            <div className="modal-card--form-success__head">
              <img src={logo} alt="M·Carry" width={90} height={27} />
            </div>
            <p className="modal-card--form-success__msg">
              {isEdit
                ? '여정 기록이 수정되었습니다.'
                : `“${product?.alias}”의 새로운 여정이 기록되었습니다.`}
            </p>
            <button
              type="button"
              className="btn-modal-pill"
              onClick={() => navigate(`/journey/records/${form.productId || products[0]?.id}`)}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
