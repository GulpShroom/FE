import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../../components/AppShell'
import { getLocalDiagnoses, getProductDiagnoses } from '../../api/my'
import {
  getDigitalPassport,
  getProductLineage,
  mapDigitalPassport,
  mapLineageGeneration,
} from '../../api/products'
import chevronsRight from '../../assets/final/chevrons-right.svg'
import diamondIcon from '../../assets/final/diamond.svg'
import bagFallback from '../../assets/final/bag-1.png'

function HistoryRow({ item, onOpen }) {
  const grade = Number(item.conditionGrade)
  const gradeClass = Number.isFinite(grade) ? ` care-row--grade-${Math.max(1, Math.min(5, grade))}` : ''
  return (
    <button type="button" className={`care-row${gradeClass}`} onClick={() => onOpen(item)}>
      <img className="care-row__diamond" src={diamondIcon} alt="" width={15} height={15} />
      <span className="care-row__title">{item.short ?? item.title}</span>
      <span className="care-row__date">{item.date}</span>
      {Number.isFinite(grade) ? <span className="care-row__grade" aria-label={`상태 등급 ${grade}점`}><i style={{ width: `${grade * 20}%` }} /></span> : null}
      <span className="care-row__chevron" aria-hidden>
        ›
      </span>
    </button>
  )
}

function GenDropdown({ options, value, onChange, menuId }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) ?? options[0]

  return (
    <div className="care-gen">
      <button
        type="button"
        className="care-gen-chip"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.label ?? '전체'}
        <span aria-hidden>▾</span>
      </button>
      {open ? (
        <ul id={menuId} className="care-gen__menu" role="listbox">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={opt.value === value ? 'is-selected' : undefined}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function matchesGeneration(itemGen, filter) {
  if (filter === 'all') return true
  return String(itemGen ?? '') === String(filter)
}

function mapDiagnosis(item, index) {
  const generation = Number(item.generation) || 1
  const result = item.resultText || item.result_text || ''
  return {
    ...item,
    id: item.diagnosisId ?? `diagnosis-${generation}-${item.diagnosedAt ?? index}`,
    generation,
    keeper: `${generation}${generation === 1 ? 'st' : generation === 2 ? 'nd' : generation === 3 ? 'rd' : 'th'} Keeper`,
    date: String(item.diagnosedAt || item.diagnosed_at || '').replace(/-/g, '. '),
    short: result,
    title: result,
    result,
    solution: item.solutionText || item.solution_text || '',
    conditionGrade: item.conditionGrade,
  }
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [lineage, setLineage] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)
  const [detail, setDetail] = useState(null)
  const [diagnoses, setDiagnoses] = useState(() => getLocalDiagnoses(id))
  const [diagGen, setDiagGen] = useState('all')

  const fetchKey = `care:${id}`
  const loading = loadedKey !== fetchKey

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getDigitalPassport(id),
      getProductLineage(id),
      getProductDiagnoses(id).catch(() => []),
    ])
      .then(([passportData, lineageData, diagnosisData]) => {
        if (cancelled) return
        setProduct(mapDigitalPassport(passportData))
        setLineage((lineageData?.generations ?? []).map(mapLineageGeneration))
        setDiagnoses((diagnosisData ?? []).map(mapDiagnosis).sort((a, b) => (
          a.generation - b.generation || String(a.date).localeCompare(String(b.date))
        )))
        setLoadError(null)
        setLoadedKey(fetchKey)
      })
      .catch((err) => {
        if (cancelled) return
        setProduct(null)
        setLineage([])
        setLoadError(err.message || '제품 정보를 불러오지 못했습니다')
        setLoadedKey(fetchKey)
      })
    return () => {
      cancelled = true
    }
  }, [id, fetchKey])

  useEffect(() => {
    const refresh = () => {
      setDiagnoses(getLocalDiagnoses(id))
    }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [id])

  const genOptions = useMemo(() => {
    const gens = lineage.map((g) => ({
      value: String(g.generation),
      label: g.label,
    }))
    return [{ value: 'all', label: '전체' }, ...gens]
  }, [lineage])

  const filteredDiagnoses = diagnoses.filter((d) => matchesGeneration(d.generation, diagGen))
  const currentGeneration = lineage.reduce((max, item) => Math.max(max, Number(item.generation) || 0), 0)
  const hasCurrentDiagnosis = currentGeneration > 0
    ? diagnoses.some((item) => Number(item.generation) === currentGeneration)
    : diagnoses.length > 0

  return (
    <AppShell showBack onBack={() => navigate('/my/products')}>
      <div className="page page--care">
        {loading ? <p className="journeys-status">제품 정보를 불러오는 중...</p> : null}
        {loadError ? <p className="journeys-status journeys-status--error">{loadError}</p> : null}

        {product ? (
          <Link to={`/my/products/${product.id}/ai`} className="product-row product-row--owned">
            <div className="product-row__thumb">
              <img
                src={product.image || bagFallback}
                alt=""
                width={70}
                height={70}
                onError={(e) => {
                  e.currentTarget.src = bagFallback
                }}
              />
            </div>
            <div className="product-row__copy">
              <p className="product-row__alias">{product.alias}</p>
              <p className="product-row__name">{product.name}</p>
            </div>
            <span className="badge">소유중</span>
            <img className="product-row__go" src={chevronsRight} alt="" width={24} height={24} />
          </Link>
        ) : null}

        <section className="care-section">
          <div className="care-section__head">
            <h2 className="care-section__title">AI 상태 진단 이력</h2>
            <GenDropdown
              menuId="diag-gen-menu"
              options={genOptions}
              value={diagGen}
              onChange={setDiagGen}
            />
            {!hasCurrentDiagnosis ? (
              <Link to={`/my/products/${id}/ai`} className="care-section__cta">
                AI 상태 진단 하러 가기
              </Link>
            ) : null}
          </div>

          <div className="care-rows">
            {filteredDiagnoses.length === 0 ? (
              <p className="hint-text">아직 진단 기록이 없습니다.</p>
            ) : (
              filteredDiagnoses.map((d) => (
                <HistoryRow key={d.id} item={d} onOpen={setDetail} />
              ))
            )}
          </div>
        </section>
      </div>

      {detail ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetail(null)}
        >
          <div className="modal-card modal-card--care" onClick={(e) => e.stopPropagation()}>
            <p className="care-modal__keeper">{detail.keeper ?? '1st keeper'}</p>
            <div className="care-modal__date-row">
              <span>진단 날짜</span>
              <strong>{String(detail.date || '').replace(/\./g, '. ')}</strong>
            </div>
            <div className="care-modal__block">
              <p className="care-modal__label">진단 결과</p>
              <p className="care-modal__result">{detail.result ?? detail.title}</p>
            </div>
            <div className="care-modal__block">
              <p className="care-modal__label">솔루션</p>
              <p className="care-modal__solution">
                {(detail.solution ?? '').split('\n').map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
