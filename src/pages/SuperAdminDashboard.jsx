//business app
import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { db, auth } from "../config"
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { suspendTenant, reactivateTenant, isTenantActive } from "../lib/tenantStatus"
import TenantStatusBadge from "../components/TenantStatusBadge"
import SuspendTenantModal from "../components/SuspendTenantModal"
import "./SuperAdmin.css"

function SuperAdminDashboard() {
  const { isSuperAdmin, user } = useSelector((state) => state.auth)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [viewingTenant, setViewingTenant] = useState(null)
  const [suspendingTenant, setSuspendingTenant] = useState(null)
  const [statusBusy, setStatusBusy] = useState(false)

  const [superAdminEmail, setSuperAdminEmail] = useState("")

  // New tenant form
  const [newTenant, setNewTenant] = useState({
    businessName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    subdomain: "",
    customDomain: "",
  })

  // Edit tenant form
  const [editForm, setEditForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    subdomain: "",
    customDomain: "",
  })

  useEffect(() => {
    if (!isSuperAdmin) return

    if (user?.email) {
      setSuperAdminEmail(user.email)
    }

    fetchTenants()
  }, [isSuperAdmin, user])

  const fetchTenants = async () => {
    try {
      const tenantsRef = collection(db, "tenants")
      const snapshot = await getDocs(tenantsRef)
      const tenantsList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          suspendedAt: data.suspendedAt?.toDate?.()?.toISOString() || null,
        }
      })
      setTenants(tenantsList)
    } catch (error) {
      console.error("Error fetching tenants:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e) => {
    e.preventDefault()

    if (!newTenant.businessName || !newTenant.email || !newTenant.password) {
      alert("Please fill in all required fields")
      return
    }

    if (newTenant.subdomain) {
      const subdomainRegex = /^[a-z0-9-]+$/
      if (!subdomainRegex.test(newTenant.subdomain)) {
        alert("Subdomain can only contain lowercase letters, numbers, and hyphens")
        return
      }
    }

    const superAdminPassword = window.prompt("Please enter your super-admin password to continue creating the tenant:")

    if (!superAdminPassword) {
      alert("Super-admin password is required to create tenants")
      return
    }

    setCreating(true)

    try {
      console.log("[v0] Creating new tenant user...")

      const userCredential = await createUserWithEmailAndPassword(auth, newTenant.email, newTenant.password)
      const userId = userCredential.user.uid

      console.log("[v0] New tenant user created with ID:", userId)
      console.log("[v0] Signing out new tenant user...")

      await signOut(auth)

      console.log("[v0] Re-authenticating as super-admin...")

      await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword)

      console.log("[v0] Super-admin re-authenticated, creating tenant document...")

      const tenantRef = doc(db, "tenants", userId)
      await setDoc(tenantRef, {
        businessName: newTenant.businessName,
        email: newTenant.email,
        phone: newTenant.phone || "",
        address: newTenant.address || "",
        subdomain: newTenant.subdomain || "",
        customDomain: newTenant.customDomain || "",
        createdAt: serverTimestamp(),
        isActive: true,
      })

      console.log("[v0] Tenant document created")

      if (newTenant.subdomain) {
        console.log("[v0] Creating subdomain mapping...")
        await setDoc(doc(db, "subdomains", newTenant.subdomain), {
          tenantId: userId,
          subdomain: newTenant.subdomain,
          createdAt: serverTimestamp(),
        })
      }

      if (newTenant.customDomain) {
        console.log("[v0] Creating domain mapping...")
        await setDoc(doc(db, "domains", newTenant.customDomain), {
          tenantId: userId,
          domain: newTenant.customDomain,
          createdAt: serverTimestamp(),
        })
      }

      console.log("[v0] Initializing tenant data...")
      await initializeTenantData(userId)

      alert("Tenant created successfully!")

      // Refresh tenant list
      await fetchTenants()

      // Reset form
      setNewTenant({
        businessName: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        subdomain: "",
        customDomain: "",
      })
    } catch (error) {
      console.error("[v0] Error creating tenant:", error)
      alert("Failed to create tenant: " + error.message)

      try {
        await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword)
      } catch (reAuthError) {
        console.error("[v0] Failed to re-authenticate as super-admin:", reAuthError)
        alert("Please log in again as super-admin")
      }
    } finally {
      setCreating(false)
    }
  }

  const initializeTenantData = async (tenantId) => {
    try {
      await setDoc(doc(db, "tenants", tenantId, "data", "homepage"), {
        bannerImages: [],
        rightImage: "",
        tagline: "Reliable 24/7",
        slogan: "The best service you need",
        shortDescription: "Professional services for your business needs.",
        rightImageFit: "cover",
        taglineColor: "#222222",
        sloganColor: "#222222",
        shortDescriptionColor: "#444444",
      })

      await setDoc(doc(db, "tenants", tenantId, "data", "navbarColors"), {
        background: "transparent",
        links: "#ffffff",
        logoText: "#ffffff",
      })

      await setDoc(doc(db, "tenants", tenantId, "data", "servicesHeader"), {
        slogan: "Our Services",
        shortDescription: "We provide quality services to meet your needs.",
      })

      await setDoc(doc(db, "tenants", tenantId, "data", "logo"), {
        type: "text",
        text: "Business Logo",
      })

      console.log("[v0] Tenant data initialized successfully")
    } catch (error) {
      console.error("[v0] Error initializing tenant data:", error)
      throw error
    }
  }

  const handleConfirmSuspend = async (reason) => {
    if (!suspendingTenant) return
    setStatusBusy(true)
    try {
      await suspendTenant(suspendingTenant.id, reason, user?.uid)
      setSuspendingTenant(null)
      await fetchTenants()
    } catch (error) {
      console.error("Error suspending tenant:", error)
      alert("Failed to suspend site: " + error.message)
    } finally {
      setStatusBusy(false)
    }
  }

  const handleReactivateTenant = async (tenant) => {
    if (!window.confirm(`Reactivate ${tenant.businessName}? Its site will go back online immediately.`)) return
    setStatusBusy(true)
    try {
      await reactivateTenant(tenant.id, user?.uid)
      await fetchTenants()
    } catch (error) {
      console.error("Error reactivating tenant:", error)
      alert("Failed to reactivate site: " + error.message)
    } finally {
      setStatusBusy(false)
    }
  }

  const handleViewTenant = (tenant) => {
    setViewingTenant(tenant)
  }

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant.id)
    setEditForm({
      businessName: tenant.businessName,
      email: tenant.email,
      phone: tenant.phone || "",
      address: tenant.address || "",
      subdomain: tenant.subdomain || "",
      customDomain: tenant.customDomain || "",
    })
    setViewingTenant(null)
  }

  const handleUpdateTenant = async (tenantId) => {
    if (!editForm.businessName || !editForm.email) {
      alert("Business name and email are required")
      return
    }

    if (editForm.subdomain) {
      const subdomainRegex = /^[a-z0-9-]+$/
      if (!subdomainRegex.test(editForm.subdomain)) {
        alert("Subdomain can only contain lowercase letters, numbers, and hyphens")
        return
      }
    }

    try {
      const tenantRef = doc(db, "tenants", tenantId)
      const oldTenant = tenants.find((t) => t.id === tenantId)

      await updateDoc(tenantRef, {
        businessName: editForm.businessName,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        subdomain: editForm.subdomain,
        customDomain: editForm.customDomain,
      })

      // Update subdomain mapping if changed
      if (oldTenant.subdomain !== editForm.subdomain) {
        if (oldTenant.subdomain) {
          await deleteDoc(doc(db, "subdomains", oldTenant.subdomain))
        }
        if (editForm.subdomain) {
          await setDoc(doc(db, "subdomains", editForm.subdomain), {
            tenantId: tenantId,
            subdomain: editForm.subdomain,
            createdAt: serverTimestamp(),
          })
        }
      }

      // Update domain mapping if changed
      if (oldTenant.customDomain !== editForm.customDomain) {
        if (oldTenant.customDomain) {
          await deleteDoc(doc(db, "domains", oldTenant.customDomain))
        }
        if (editForm.customDomain) {
          await setDoc(doc(db, "domains", editForm.customDomain), {
            tenantId: tenantId,
            domain: editForm.customDomain,
            createdAt: serverTimestamp(),
          })
        }
      }

      alert("Tenant updated successfully!")
      setEditingTenant(null)
      await fetchTenants()
    } catch (error) {
      console.error("Error updating tenant:", error)
      alert("Failed to update tenant: " + error.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingTenant(null)
    setEditForm({
      businessName: "",
      email: "",
      phone: "",
      address: "",
      subdomain: "",
      customDomain: "",
    })
  }

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return
    }

    try {
      const tenant = tenants.find((t) => t.id === tenantId)

      // Delete subdomain mapping if exists
      if (tenant.subdomain) {
        await deleteDoc(doc(db, "subdomains", tenant.subdomain))
      }

      // Delete domain mapping if exists
      if (tenant.customDomain) {
        await deleteDoc(doc(db, "domains", tenant.customDomain))
      }

      // Delete tenant document
      await deleteDoc(doc(db, "tenants", tenantId))

      alert("Tenant deleted successfully")
      await fetchTenants()
    } catch (error) {
      console.error("Error deleting tenant:", error)
      alert("Failed to delete tenant: " + error.message)
    }
  }

  if (!isSuperAdmin) {
    return <div className="access-denied">Access denied. Superadmin privileges required.</div>
  }

  if (loading) {
    return <div className="loading-state">Loading tenants...</div>
  }

  return (
    <div className="super-admin-dashboard">
      <h2>Superadmin Dashboard</h2>

      {/* Create New Tenant */}
      <div className="create-tenant-section">
        <h3>Create New Tenant</h3>
        <form onSubmit={handleCreateTenant} className="tenant-form">
          <div className="form-field">
            <label>Business Name (required):</label>
            <input
              type="text"
              value={newTenant.businessName}
              onChange={(e) => setNewTenant({ ...newTenant, businessName: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Email (required):</label>
            <input
              type="email"
              value={newTenant.email}
              onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Password (required):</label>
            <input
              type="password"
              value={newTenant.password}
              onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Phone:</label>
            <input
              type="tel"
              value={newTenant.phone}
              onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Address:</label>
            <textarea
              value={newTenant.address}
              onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-field">
            <label>Subdomain (optional):</label>
            <input
              type="text"
              value={newTenant.subdomain}
              onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })}
              placeholder="e.g., handybusiness"
            />
            <small>
              Enter a subdomain for this tenant (e.g., handybusiness.vercel.app). Only lowercase letters, numbers, and
              hyphens allowed.
            </small>
          </div>

          <div className="form-field">
            <label>Custom Domain (optional):</label>
            <input
              type="text"
              value={newTenant.customDomain}
              onChange={(e) => setNewTenant({ ...newTenant, customDomain: e.target.value })}
              placeholder="e.g., clientbusiness.com"
            />
            <small>
              Enter the custom domain this tenant will use. Leave blank to use subdomain (tenantId.yourdomain.com)
            </small>
          </div>

          <button type="submit" disabled={creating} className="submit-button">
            {creating ? (
              <>
                <span className="loading-spinner"></span>
                Creating...
              </>
            ) : (
              "Create Tenant"
            )}
          </button>
        </form>
      </div>

      {/* Tenants List */}
      <div className="tenants-list-section">
        <h3>All Tenants ({tenants.length})</h3>
        {tenants.length === 0 ? (
          <p className="empty-state">No tenants yet.</p>
        ) : (
          <div className="tenants-table-wrapper">
            <table className="tenants-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Contact Info</th>
                  <th>Domain Info</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Tenant ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="tenant-name-cell">{tenant.businessName}</td>
                    <td>
                      <div>{tenant.email}</div>
                      {tenant.phone && <div className="tenant-meta-cell">{tenant.phone}</div>}
                      {tenant.address && <div className="tenant-meta-cell">{tenant.address}</div>}
                    </td>
                    <td>
                      {tenant.subdomain && (
                        <div>
                          <strong>Subdomain:</strong> {tenant.subdomain}
                        </div>
                      )}
                      {tenant.customDomain && (
                        <div>
                          <strong>Custom:</strong> {tenant.customDomain}
                        </div>
                      )}
                      {!tenant.subdomain && !tenant.customDomain && (
                        <span className="tenant-meta-cell">No domain set</span>
                      )}
                    </td>
                    <td>
                      <TenantStatusBadge tenant={tenant} />
                      {!isTenantActive(tenant) && tenant.suspensionReason && (
                        <div className="suspension-reason">{tenant.suspensionReason}</div>
                      )}
                    </td>
                    <td className="tenant-meta-cell">
                      {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="tenant-meta-cell">{tenant.id}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleViewTenant(tenant)} className="btn-secondary">
                          View
                        </button>
                        <button onClick={() => handleEditTenant(tenant)} className="btn-primary">
                          Edit
                        </button>
                        {isTenantActive(tenant) ? (
                          <button
                            onClick={() => setSuspendingTenant(tenant)}
                            className="btn-warning"
                            disabled={statusBusy}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateTenant(tenant)}
                            className="btn-success"
                            disabled={statusBusy}
                          >
                            Reactivate
                          </button>
                        )}
                        <button onClick={() => handleDeleteTenant(tenant.id)} className="delete-button">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendingTenant && (
        <SuspendTenantModal
          tenant={suspendingTenant}
          busy={statusBusy}
          onConfirm={handleConfirmSuspend}
          onCancel={() => setSuspendingTenant(null)}
        />
      )}

      {/* View Modal */}
      {viewingTenant && (
        <div className="modal-overlay" onClick={() => setViewingTenant(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tenant Details</h3>
              <button className="modal-close" onClick={() => setViewingTenant(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Business Name:</strong>
                <span>{viewingTenant.businessName}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{viewingTenant.email}</span>
              </div>
              {viewingTenant.phone && (
                <div className="detail-row">
                  <strong>Phone:</strong>
                  <span>{viewingTenant.phone}</span>
                </div>
              )}
              {viewingTenant.address && (
                <div className="detail-row">
                  <strong>Address:</strong>
                  <span>{viewingTenant.address}</span>
                </div>
              )}
              {viewingTenant.subdomain && (
                <div className="detail-row">
                  <strong>Subdomain:</strong>
                  <span>{viewingTenant.subdomain}</span>
                </div>
              )}
              {viewingTenant.customDomain && (
                <div className="detail-row">
                  <strong>Custom Domain:</strong>
                  <span>{viewingTenant.customDomain}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Created:</strong>
                <span>
                  {viewingTenant.createdAt ? new Date(viewingTenant.createdAt).toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <strong>Tenant ID:</strong>
                <span>{viewingTenant.id}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span>{isTenantActive(viewingTenant) ? "Active" : "Suspended"}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingTenant(null)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => handleEditTenant(viewingTenant)}>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Tenant</h3>
              <button className="modal-close" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="tenant-form">
                <div className="form-field">
                  <label>Business Name (required):</label>
                  <input
                    type="text"
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Email (required):</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Phone:</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Address:</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-field">
                  <label>Subdomain (optional):</label>
                  <input
                    type="text"
                    value={editForm.subdomain}
                    onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value.toLowerCase() })}
                    placeholder="e.g., handybusiness"
                  />
                </div>

                <div className="form-field">
                  <label>Custom Domain (optional):</label>
                  <input
                    type="text"
                    value={editForm.customDomain}
                    onChange={(e) => setEditForm({ ...editForm, customDomain: e.target.value })}
                    placeholder="e.g., clientbusiness.com"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => handleUpdateTenant(editingTenant)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminDashboard