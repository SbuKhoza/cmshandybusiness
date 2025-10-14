"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { db, auth } from "../config"
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"

function SuperAdminDashboard() {
  const { isSuperAdmin, user } = useSelector((state) => state.auth)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [superAdminEmail, setSuperAdminEmail] = useState("")

  // New tenant form
  const [newTenant, setNewTenant] = useState({
    businessName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    subdomain: "", // Added subdomain field
    customDomain: "",
  })

  useEffect(() => {
    if (!isSuperAdmin) return

    if (user?.email) {
      setSuperAdminEmail(user.email)
    }

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
          }
        })
        setTenants(tenantsList)
      } catch (error) {
        console.error("Error fetching tenants:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenants()
  }, [isSuperAdmin, user])

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
        subdomain: newTenant.subdomain || "", // Store subdomain
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
      // Initialize default data for the tenant
      await initializeTenantData(userId)

      alert("Tenant created successfully!")

      // Refresh tenant list
      const tenantsRef = collection(db, "tenants")
      const snapshot = await getDocs(tenantsRef)
      const tenantsList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        }
      })
      setTenants(tenantsList)

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
      // Initialize homepage data
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

      // Initialize navbar colors
      await setDoc(doc(db, "tenants", tenantId, "data", "navbarColors"), {
        background: "transparent",
        links: "#ffffff",
        logoText: "#ffffff",
      })

      // Initialize services header
      await setDoc(doc(db, "tenants", tenantId, "data", "servicesHeader"), {
        slogan: "Our Services",
        shortDescription: "We provide quality services to meet your needs.",
      })

      // Initialize logo
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

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDoc(doc(db, "tenants", tenantId))
      setTenants(tenants.filter((t) => t.id !== tenantId))
      alert("Tenant deleted successfully")
    } catch (error) {
      console.error("Error deleting tenant:", error)
      alert("Failed to delete tenant: " + error.message)
    }
  }

  if (!isSuperAdmin) {
    return <div>Access denied. Superadmin privileges required.</div>
  }

  if (loading) {
    return <div>Loading tenants...</div>
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Superadmin Dashboard</h2>

      {/* Create New Tenant */}
      <div style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3>Create New Tenant</h3>
        <form onSubmit={handleCreateTenant}>
          <div style={{ marginBottom: "10px" }}>
            <label>Business Name (required):</label>
            <input
              type="text"
              value={newTenant.businessName}
              onChange={(e) => setNewTenant({ ...newTenant, businessName: e.target.value })}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Email (required):</label>
            <input
              type="email"
              value={newTenant.email}
              onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Password (required):</label>
            <input
              type="password"
              value={newTenant.password}
              onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Phone:</label>
            <input
              type="tel"
              value={newTenant.phone}
              onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Address:</label>
            <textarea
              value={newTenant.address}
              onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              rows="3"
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Subdomain (optional):</label>
            <input
              type="text"
              value={newTenant.subdomain}
              onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })}
              placeholder="e.g., handybusiness"
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
            <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
              Enter a subdomain for this tenant (e.g., handybusiness.vercel.app). Only lowercase letters, numbers, and
              hyphens allowed.
            </small>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Custom Domain (optional):</label>
            <input
              type="text"
              value={newTenant.customDomain}
              onChange={(e) => setNewTenant({ ...newTenant, customDomain: e.target.value })}
              placeholder="e.g., clientbusiness.com"
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
            <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
              Enter the custom domain this tenant will use. Leave blank to use subdomain (tenantId.yourdomain.com)
            </small>
          </div>

          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Create Tenant"}
          </button>
        </form>
      </div>

      {/* Tenants List */}
      <div>
        <h3>All Tenants ({tenants.length})</h3>
        {tenants.length === 0 ? (
          <p>No tenants yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                style={{
                  padding: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h4 style={{ margin: "0 0 10px 0" }}>{tenant.businessName}</h4>
                    <p style={{ margin: "5px 0" }}>
                      <strong>Email:</strong> {tenant.email}
                    </p>
                    {tenant.phone && (
                      <p style={{ margin: "5px 0" }}>
                        <strong>Phone:</strong> {tenant.phone}
                      </p>
                    )}
                    {tenant.address && (
                      <p style={{ margin: "5px 0" }}>
                        <strong>Address:</strong> {tenant.address}
                      </p>
                    )}
                    {tenant.subdomain && (
                      <p style={{ margin: "5px 0" }}>
                        <strong>Subdomain:</strong> {tenant.subdomain}
                      </p>
                    )}
                    {tenant.customDomain && (
                      <p style={{ margin: "5px 0" }}>
                        <strong>Custom Domain:</strong> {tenant.customDomain}
                      </p>
                    )}
                    <p style={{ margin: "5px 0", fontSize: "12px", color: "#666" }}>
                      <strong>Created:</strong>{" "}
                      {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "12px", color: "#666" }}>
                      <strong>Tenant ID:</strong> {tenant.id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTenant(tenant.id)}
                    style={{
                      padding: "8px 15px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperAdminDashboard
