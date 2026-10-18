//business app
import { isTenantActive } from "../lib/tenantStatus"
import "./SuspendTenant.css"

function TenantStatusBadge({ tenant }) {
  const active = isTenantActive(tenant)
  return (
    <span className={`tenant-status-badge ${active ? "is-active" : "is-suspended"}`}>
      {active ? "Active" : "Suspended"}
    </span>
  )
}

export default TenantStatusBadge