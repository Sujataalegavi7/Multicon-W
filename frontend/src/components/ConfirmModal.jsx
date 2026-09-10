import { useState } from 'react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'btn-primary',
  showRemarks = false,
  remarksLabel = 'Remarks (optional)',
}) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(remarks);
      setRemarks('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: showRemarks ? 'var(--space-4)' : 0 }}>
            {message}
          </p>
          {showRemarks && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="modal-remarks">{remarksLabel}</label>
              <textarea
                id="modal-remarks"
                className="form-control"
                rows={3}
                placeholder="Add any notes for the contributor…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${confirmVariant}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
