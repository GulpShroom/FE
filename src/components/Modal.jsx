export function Modal({
  open,
  title,
  children,
  onClose,
  primaryLabel = '확인',
  secondaryLabel = '취소',
  onPrimary,
  onSecondary,
  danger = false,
  hideSecondary = false,
  variant,
  logoSrc,
}) {
  if (!open) return null

  return (
    <div
      className={`modal-backdrop${variant ? ` modal-backdrop--${variant}` : ''}`}
      role="dialog"
      aria-modal="true"
    >
      <div className={`modal-card${variant ? ` modal-card--${variant}` : ''}`}>
        {logoSrc ? (
          <div className="modal-card__logo">
            <img src={logoSrc} alt="M·Carry" width={90} height={27} />
          </div>
        ) : null}
        {title ? <p className="modal-card__title">{title}</p> : null}
        {children ? <div className="modal-card__body">{children}</div> : null}
        <div className="modal-actions">
          {hideSecondary ? null : (
            <button
              type="button"
              onClick={() => {
                onSecondary?.()
                onClose?.()
              }}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            className={danger ? 'danger' : 'primary'}
            onClick={async () => {
              const result = await onPrimary?.()
              if (result === false) return
              onClose?.()
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
