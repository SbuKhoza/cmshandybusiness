"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { db } from "../config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { setCurrentTenant, setTenants, setTenantData } from "../redux/slices/tenantSlice"

function TenantSelector() {
  const dispatch = useDispatch()
  const { user, isSuperAdmin } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [availableTenants, setAvailableTenants] = useState([])

  useEffect(() => {
    const fetchTenants = async () => {
      if (!user) return

      try {
        if (isSuperAdmin) {
          // Superadmin can see all tenants
          const tenantsRef = collection(db, "tenants")
          const snapshot = await getDocs(tenantsRef)
          const tenantsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setAvailableTenants(tenantsList)
          dispatch(setTenants(tenantsList))
        } else {
          // Regular admin only sees their own tenant
          const tenantRef = doc(db, "tenants", user.uid)
          const tenantSnap = await getDoc(tenantRef)

          if (tenantSnap.exists()) {
            const tenantData = { id: tenantSnap.id, ...tenantSnap.data() }
            setAvailableTenants([tenantData])
            dispatch(setTenants([tenantData]))
          }
        }
      } catch (error) {
        console.error("Error fetching tenants:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenants()
  }, [user, isSuperAdmin, dispatch])

  const handleSelectTenant = async (tenantId) => {
    try {
      const tenantRef = doc(db, "tenants", tenantId)
      const tenantSnap = await getDoc(tenantRef)

      if (tenantSnap.exists()) {
        dispatch(setCurrentTenant(tenantId))
        dispatch(setTenantData(tenantSnap.data()))
      }
    } catch (error) {
      console.error("Error selecting tenant:", error)
    }
  }

  if (loading) {
    return <div>Loading tenants...</div>
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Select a Tenant</h2>
      {availableTenants.length === 0 ? (
        <p>No tenants available. Please contact support.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {availableTenants.map((tenant) => (
            <div
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant.id)}
              style={{
                padding: "15px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3>{tenant.businessName || "Unnamed Business"}</h3>
              <p>{tenant.email}</p>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Created: {tenant.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TenantSelector
