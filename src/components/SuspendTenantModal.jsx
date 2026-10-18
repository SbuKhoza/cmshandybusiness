//business app
import { useState } from "react"
import "./SuspendTenant.css"

function SuspendTenantModal({ tenant, busy, onConfirm, onCancel }) {
  const [reason, setReason] = useState("")

  if (!tenant) return null

  const domains = [tenant.customDomain, tenant.subdomain].filter(Boolean).join(", ")

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Suspend site</h3>
          <button className="modal-close" onClick={onCancel} disabled={busy}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="suspend-warning">
            <strong>{tenant.businessName}</strong>
            {domains ? ` (${domains})` : ""} will immediately show a "temporarily unavailable" page to all visitors.
            You can reactivate it at any time.
          </p>

          <div className="form-field">
            <label>Reason (optional, shown to visitors):</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              maxLength={300}
              placeholder="e.g., Subscription payment overdue"
              disabled={busy}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="delete-button" onClick={() => onConfirm(reason)} disabled={busy}>
            {busy ? "Suspending..." : "Suspend site"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuspendTenantModal