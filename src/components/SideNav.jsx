import { Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { auth } from "../config"
import { signOut } from "firebase/auth"
import { logout } from "../redux/slices/authSlice"
import { clearTenant } from "../redux/slices/tenantSlice"
import "./SideNav.css"

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
    <div className="sidenav-container">
      <div className="sidenav-header">
        <h2>CMS PANEL</h2>
      </div>

      {user && (
        <div className="sidenav-user-info">
          <p>
            <strong>User:</strong> {user.email}
          </p>
          {isSuperAdmin && <span className="sidenav-role">Superadmin</span>}
          {currentTenantId && tenantData && (
            <p style={{ marginTop: "12px" }}>
              <strong>Managing:</strong> {tenantData.businessName || "Tenant"}
            </p>
          )}
        </div>
      )}

      <nav className="sidenav-nav">
        <ul>
          {isSuperAdmin && (
            <li>
              <Link to="/superadmin">Superadmin Dashboard</Link>
            </li>
          )}

          {currentTenantId && (
            <>
              <li>
                <Link to="/">Homepage Manager</Link>
              </li>
              <li>
                <Link to="/servicecms">Services-page Manager</Link>
              </li>

              <li>
                <Link to="/contactcms">Contact-page Manager</Link>
              </li>

              <li>
                <Link to="/projectscms">Projects/Gallery</Link>
              </li>

              <li>
                <Link to="/aboutcms">About-page Manager</Link>
              </li>

              <li>
                <Link to="/newslettercms">News-Letter Manager</Link>
              </li>

              <li>
                <Link to="/footercms">Footer Manager</Link>
              </li>

            </>
          )}
        </ul>
      </nav>

      <div className="sidenav-actions">
        {currentTenantId && (
          <button onClick={handleSwitchTenant} className="sidenav-btn sidenav-btn-switch">
            Switch Tenant
          </button>
        )}

        <button onClick={handleLogout} className="sidenav-btn sidenav-btn-logout">
          Logout
        </button>
      </div>
    </div>
  )
}

export default SideNav
