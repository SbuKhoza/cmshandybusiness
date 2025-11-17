"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Provider, useDispatch, useSelector } from "react-redux"
import { store } from "./redux/store/store"
import { auth, db } from "./config"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { setUser, setIsSuperAdmin, logout } from "./redux/slices/authSlice"
import { setCurrentTenant } from "./redux/slices/tenantSlice"

import SideNav from "./components/SideNav"
import Home from "./pages/Home"
import Auth from "./components/Auth"
import Servicescms from "./pages/Servicescms"
import TenantSelector from "./components/TenantSelector"
import SuperAdminDashboard from "./pages/SuperAdminDashboard"
import FooterCMS from "./pages/FooterCMS"
import AboutCMS from "./pages/AboutCMS"
import ContactCMS from "./pages/ContactCMS"
import NewsLetterCMS from "./pages/NewsLetterCMS"
import ProjectsCMS from "./pages/ProjectsCMS"

function AppContent() {
  const dispatch = useDispatch()
  const { user, loading, isSuperAdmin } = useSelector((state) => state.auth)
  const { currentTenantId } = useSelector((state) => state.tenant)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        dispatch(setUser(currentUser))

        const superAdminRef = doc(db, "super-admin", currentUser.uid)
        const superAdminSnap = await getDoc(superAdminRef)

        if (superAdminSnap.exists()) {
          dispatch(setIsSuperAdmin(true))
        } else {
          // Regular admin - set their tenant ID to their own UID
          dispatch(setIsSuperAdmin(false))
          dispatch(setCurrentTenant(currentUser.uid))
        }
      } else {
        dispatch(logout())
      }
    })

    return () => unsubscribe()
  }, [dispatch])

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>
  }

  if (!user) {
    return <Auth />
  }

  if (isSuperAdmin && !currentTenantId) {
    return (
      <Router>
        <div style={{ display: "flex" }}>
          <SideNav />
          <div style={{ flex: 1, padding: "20px" }}>
            <Routes>
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="*" element={<Navigate to="/superadmin" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    )
  }

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <SideNav />
        <div style={{ flex: 1, padding: "20px" }}>
          {!currentTenantId ? (
            <TenantSelector />
          ) : (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projectscms" element={<ProjectsCMS />} />
              <Route path="/aboutcms" element={<AboutCMS />} />
              <Route path="/servicecms" element={<Servicescms />} />
              <Route path="/contactcms" element={<ContactCMS />} />
              <Route path="/newslettercms" element={<NewsLetterCMS />} />
              <Route path="/footercms" element={<FooterCMS />} />
              {isSuperAdmin && <Route path="/superadmin" element={<SuperAdminDashboard />} />}
              <Route path="/auth" element={<Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
