import { useState } from 'react'
import chevronIcon from '../assets/final/chevron.svg'

export function ProductSelect({
  products,
  value,
  onChange,
  variant = 'outline',
  disabled = false,
  allowEmpty = false,
}) {
  const [open, setOpen] = useState(false)
  const matchedProduct = products.find((p) => p.id === value)
  const selected = matchedProduct ?? (allowEmpty ? null : products[0])

  return (
    <div className="product-select-wrap">
      <p className="field-label">제품</p>
      <button
        type="button"
        className={`product-select product-select--${variant}`}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="product-select__text">
          {selected ? (
            <>
              <span className="product-select__alias">{selected.alias}</span>
              <span className="product-select__name">
                {selected.nameEn ?? selected.name}
              </span>
            </>
          ) : null}
        </span>
        <img
          className="product-select__chevron"
          src={chevronIcon}
          alt=""
          width={20}
          height={20}
        />
      </button>
      {open ? (
        <div className="dropdown-panel">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className={product.id === selected?.id ? 'is-active' : ''}
              onClick={() => {
                onChange(product.id)
                setOpen(false)
              }}
            >
              <span className="product-select__alias">{product.alias}</span>
              <span className="product-select__name">
                {product.nameEn ?? product.name}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
