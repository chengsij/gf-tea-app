import { X } from 'lucide-react';

interface ConsumptionModalProps {
  teaName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ConsumptionModal({
  teaName,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null
}: ConsumptionModalProps) {
  return (
    <div className="consumption-modal-overlay">
      <div className="consumption-modal">
        <button className="close-btn" onClick={onCancel} aria-label="Close">
          <X size={20} />
        </button>
        <div className="consumption-modal-content">
          <h3>Tea Session Complete</h3>
          <p>Mark <strong>{teaName}</strong> as done drinking?</p>
          {error && <p className="consumption-modal-error">{error}</p>}
          <div className="consumption-modal-actions">
            <button
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              No
            </button>
            <button
              className="btn-primary"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Yes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
