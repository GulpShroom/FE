import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { AppShell } from '../../components/AppShell'
import chevronsRight from '../../assets/final/chevrons-right.svg'
import diamondIcon from '../../assets/final/diamond.svg'
import { products } from '../../data/mock'

function HistoryRow({ item, onOpen }) {
  return (
    <button type="button" className="care-row" onClick={() => onOpen(item)}>
      <img className="care-row__diamond" src={diamondIcon} alt="" width={15} height={15} />
      <span className="care-row__title">{item.short ?? item.title}</span>
      <span className="care-row__date">{item.date}</span>
      <span className="care-row__chevron" aria-hidden>
        ›
      </span>
    </button>
  )
}

function genLabel(index) {
  const n = index + 1
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
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

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === id) ?? products[0]
  const [detail, setDetail] = useState(null)

  const genOptions = useMemo(() => {
    const gens = (product.generations ?? []).map((_, i) => {
      const label = genLabel(i)
      return { value: label, label }
    })
    return [{ value: 'all', label: '전체' }, ...gens]
  }, [product])

  const defaultGen = genOptions[1]?.value ?? 'all'
  const [diagGen, setDiagGen] = useState(defaultGen)
  const [careGen, setCareGen] = useState(defaultGen)

  const diagnoses = product.diagnoses.filter((d) =>
    diagGen === 'all' ? true : (d.generation ?? '1st') === diagGen,
  )

  const careItems = product.careHistory.filter((c) =>
    careGen === 'all' ? true : (c.generation ?? '1st') === careGen,
  )

  return (
    <AppShell showBack onBack={() => navigate('/my/products')}>
      <div className="page page--care">
        <Link to={`/my/products/${product.id}/ai`} className="product-row product-row--owned">
          <div className="product-row__thumb">
            <img src={product.thumb} alt="" width={70} height={70} />
          </div>
          <div className="product-row__copy">
            <p className="product-row__alias">{product.alias}</p>
            <p className="product-row__name">{product.shortName}</p>
          </div>
          <span className="badge">소유중</span>
          <img className="product-row__go" src={chevronsRight} alt="" width={24} height={24} />
        </Link>

        <section className="care-section">
          <div className="care-section__head">
            <h2 className="care-section__title">AI 상태 진단 이력</h2>
            <GenDropdown
              menuId="diag-gen-menu"
              options={genOptions}
              value={diagGen}
              onChange={setDiagGen}
            />
            <Link to={`/my/products/${product.id}/ai`} className="care-section__cta">
              AI 상태 진단 하러 가기
            </Link>
          </div>

          <div className="care-rows">
            {diagnoses.length === 0 ? (
              <p className="hint-text">진단 이력이 없습니다.</p>
            ) : (
              diagnoses.map((d) => (
                <HistoryRow key={d.id} item={d} onOpen={setDetail} />
              ))
            )}
          </div>
        </section>

        <section className="care-section">
          <div className="care-section__head">
            <h2 className="care-section__title">세대별 케어 이력</h2>
            <GenDropdown
              menuId="care-gen-menu"
              options={genOptions}
              value={careGen}
              onChange={setCareGen}
            />
          </div>

          <div className="care-rows">
            {careItems.length === 0 ? (
              <p className="hint-text">케어 이력이 없습니다.</p>
            ) : (
              careItems.map((c) => <HistoryRow key={c.id} item={c} onOpen={setDetail} />)
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
          <div
            className="modal-card modal-card--care"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="care-modal__keeper">{detail.keeper ?? '1st keeper'}</p>
            <div className="care-modal__date-row">
              <span>진단 날짜</span>
              <strong>{detail.date.replace(/\./g, '. ')}</strong>
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
