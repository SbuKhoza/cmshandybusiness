"use client"

import { Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { auth } from "../config"
import { signOut } from "firebase/auth"
import { logout } from "../redux/slices/authSlice"
import { clearTenant } from "../redux/slices/tenantSlice"

function SideNav() {
  const dispatch = useDispatch()
  const { user, isSuperAdmin } = useSelector((state) => state.auth)
  const { currentTenantId, tenantData } = useSelector((state) => state.tenant)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      dispatch(logout())
      dispatch(clearTenant())
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleSwitchTenant = () => {
    dispatch(clearTenant())
  }

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#2c3e50",
        color: "white",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>CMS Panel</h2>

      {user && (
        <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #34495e" }}>
          <p style={{ fontSize: "14px", marginBottom: "5px" }}>
            <strong>User:</strong> {user.email}
          </p>
          {isSuperAdmin && (
            <p style={{ fontSize: "12px", color: "#3498db" }}>
              <strong>Role:</strong> Superadmin
            </p>
          )}
          {currentTenantId && tenantData && (
            <p style={{ fontSize: "12px", marginTop: "10px" }}>
              <strong>Managing:</strong> {tenantData.businessName || "Tenant"}
            </p>
          )}
        </div>
      )}

      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {isSuperAdmin && (
            <li style={{ marginBottom: "15px" }}>
              <Link to="/superadmin" style={{ color: "white", textDecoration: "none", display: "block" }}>
                Superadmin Dashboard
              </Link>
            </li>
          )}

          {currentTenantId && (
            <>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/" style={{ color: "white", textDecoration: "none", display: "block" }}>
                  Home CMS
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/servicecms" style={{ color: "white", textDecoration: "none", display: "block" }}>
                  Services CMS
                </Link>
              </li>
              <li style={{ marginBottom: "15px" }}>
              
              </li>
              <li style={{ marginBottom: "15px" }}>
                <Link to="/projects" style={{ color: "white", textDecoration: "none", display: "block" }}>
                  Projects/Gallery
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {currentTenantId && (
        <button
          onClick={handleSwitchTenant}
          style={{
            marginTop: "20px",
            padding: "10px",
            width: "100%",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Switch Tenant
        </button>
      )}

      <button
        onClick={handleLogout}
        style={{
          marginTop: "10px",
          padding: "10px",
          width: "100%",
          backgroundColor: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  )
}

export default SideNav
