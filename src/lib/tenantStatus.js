//business app
import { doc, updateDoc, serverTimestamp, deleteField } from "firebase/firestore"
import { db } from "../config"

/** A tenant is active unless isActive is explicitly false (older docs without the flag count as active). */
export const isTenantActive = (tenant) => tenant?.isActive !== false

/**
 * Suspends a tenant's public site.
 * The user site listens to this document live, so the site goes offline within seconds.
 * Domain/subdomain mappings are intentionally kept, so visitors see the
 * "suspended" page instead of "site not found".
 */
export async function suspendTenant(tenantId, reason, actorUid) {
  if (!tenantId) throw new Error("tenantId is required")
  await updateDoc(doc(db, "tenants", tenantId), {
    isActive: false,
    suspendedAt: serverTimestamp(),
    suspendedBy: actorUid || null,
    suspensionReason: (reason || "").trim(),
  })
}

/** Brings a suspended tenant's public site back online. */
export async function reactivateTenant(tenantId, actorUid) {
  if (!tenantId) throw new Error("tenantId is required")
  await updateDoc(doc(db, "tenants", tenantId), {
    isActive: true,
    reactivatedAt: serverTimestamp(),
    reactivatedBy: actorUid || null,
    suspendedAt: deleteField(),
    suspendedBy: deleteField(),
    suspensionReason: deleteField(),
  })
}