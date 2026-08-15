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
}) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
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
            onClick={() => {
              onPrimary?.()
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
