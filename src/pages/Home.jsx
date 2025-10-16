//Home.jsx
import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { db, storage } from "../config"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore"
import "./Home.css"

function Home() {
  const { currentTenantId } = useSelector((state) => state.tenant)
  const [activeTab, setActiveTab] = useState("logo")

  // Logo Management
  const [useImage, setUseImage] = useState(false)
  const [logoText, setLogoText] = useState("")
  const [logoFile, setLogoFile] = useState(null)
  const [savedLogo, setSavedLogo] = useState(null)

  // Homepage Management
  const [homeData, setHomeData] = useState({
    bannerImages: [],
    rightImage: "",
    tagline: "",
    slogan: "",
    shortDescription: "",
    rightImageFit: "cover",
    taglineColor: "#222222",
    sloganColor: "#222222",
    shortDescriptionColor: "#444444",
    primaryButtonText: "Book for a service",
    primaryButtonBgColor: "#f4b400",
    primaryButtonTextColor: "#000000",
    secondaryButtonText: "Call: 0123456789",
    secondaryButtonBgColor: "transparent",
    secondaryButtonTextColor: "#ffffff",
    secondaryButtonBorderColor: "#ffffff",
  })
  const [bannerFiles, setBannerFiles] = useState([])
  const [rightFile, setRightFile] = useState(null)

  // Navbar Colors
  const [navbarColors, setNavbarColors] = useState({
    background: "transparent",
    links: "#ffffff",
    logoText: "#ffffff",
    scrolledBackground: "rgb(5, 4, 4)",
    scrolledLinks: "#ffffff",
    scrolledLogoText: "#ffffff",
    otherPagesBackground: "#ffffff",
    otherPagesLinks: "#000000",
    otherPagesLogoText: "#000000",
  })

  // Loading state
  const [loading, setLoading] = useState(false)

  // Preset colors
  const presetColors = [
    { color: "transparent", name: "Transparent" },
    { color: "#000000", name: "Black" },
    { color: "#FFFFFF", name: "White" },
    { color: "#FF0000", name: "Red" },
    { color: "#00FF00", name: "Lime" },
    { color: "#0000FF", name: "Blue" },
    { color: "#FFA500", name: "Orange" },
    { color: "#800080", name: "Purple" },
    { color: "#008080", name: "Teal" },
    { color: "#808000", name: "Olive" },
    { color: "#A52A2A", name: "Brown" },
    { color: "#808080", name: "Gray" },
    { color: "#FFD700", name: "Gold" },
  ]

  // Allowed Reviewers
  const [reviewerEmail, setReviewerEmail] = useState("")
  const [allowedUsers, setAllowedUsers] = useState([])

  useEffect(() => {
    if (!currentTenantId) return
    const usersRef = collection(db, "tenants", currentTenantId, "users-rating")
    const q = query(usersRef, orderBy("email"))
    const unsub = onSnapshot(q, (snap) => {
      setAllowedUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [currentTenantId])

  const handleAddAllowedEmail = async () => {
    if (!reviewerEmail.trim()) return alert("Enter an email.")
    try {
      const usersRef = collection(db, "tenants", currentTenantId, "users-rating")
      const q = query(usersRef, where("email", "==", reviewerEmail.trim()))
      const snap = await getDocs(q)
      if (!snap.empty) {
        alert("Email already exists.")
        return
      }
      await addDoc(usersRef, { email: reviewerEmail.trim(), addedAt: new Date() })
      setReviewerEmail("")
    } catch (err) {
      console.error(err)
      alert("Error adding email.")
    }
  }

  const handleRemoveEmail = async (id) => {
    if (!window.confirm("Remove this email?")) return
    try {
      await deleteDoc(doc(db, "tenants", currentTenantId, "users-rating", id))
    } catch (err) {
      console.error(err)
      alert("Error removing email.")
    }
  }

  // Load Tenant Data
  useEffect(() => {
    if (!currentTenantId) return

    const loadData = async () => {
      try {
        // Logo
        const logoRef = doc(db, "tenants", currentTenantId, "data", "logo")
        const logoSnap = await getDoc(logoRef)
        if (logoSnap.exists()) {
          setSavedLogo(logoSnap.data())
          if (logoSnap.data().type === "text") {
            setLogoText(logoSnap.data().text || "")
            setUseImage(false)
          } else {
            setUseImage(true)
          }
        }

        // Homepage
        const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage")
        const homepageSnap = await getDoc(homepageRef)
        if (homepageSnap.exists()) {
          const data = homepageSnap.data()
          setHomeData({
            bannerImages: Array.isArray(data.bannerImages)
              ? data.bannerImages
              : data.bannerImage
                ? [data.bannerImage]
                : [],
            rightImage: data.rightImage || "",
            tagline: data.tagline || "",
            slogan: data.slogan || "",
            shortDescription: data.shortDescription || "",
            rightImageFit: data.rightImageFit || "cover",
            taglineColor: data.taglineColor || "#222222",
            sloganColor: data.sloganColor || "#222222",
            shortDescriptionColor: data.shortDescriptionColor || "#444444",
            primaryButtonText: data.primaryButtonText || "Book for a service",
            primaryButtonBgColor: data.primaryButtonBgColor || "#f4b400",
            primaryButtonTextColor: data.primaryButtonTextColor || "#000000",
            secondaryButtonText: data.secondaryButtonText || "Call: 0123456789",
            secondaryButtonBgColor: data.secondaryButtonBgColor || "transparent",
            secondaryButtonTextColor: data.secondaryButtonTextColor || "#ffffff",
            secondaryButtonBorderColor: data.secondaryButtonBorderColor || "#ffffff",
          })
        }

        // Navbar colors
        const navbarRef = doc(db, "tenants", currentTenantId, "data", "navbarColors")
        const navbarSnap = await getDoc(navbarRef)
        if (navbarSnap.exists()) {
          setNavbarColors({
            background: navbarSnap.data().background || "transparent",
            links: navbarSnap.data().links || "#ffffff",
            logoText: navbarSnap.data().logoText || "#ffffff",
            scrolledBackground: navbarSnap.data().scrolledBackground || "rgb(5, 4, 4)",
            scrolledLinks: navbarSnap.data().scrolledLinks || "#ffffff",
            scrolledLogoText: navbarSnap.data().scrolledLogoText || "#ffffff",
            otherPagesBackground: navbarSnap.data().otherPagesBackground || "#ffffff",
            otherPagesLinks: navbarSnap.data().otherPagesLinks || "#000000",
            otherPagesLogoText: navbarSnap.data().otherPagesLogoText || "#000000",
          })
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadData()
  }, [currentTenantId])

  // Helpers for Colors
  const hexToRgba = (hex, alpha = 1) => {
    if (hex === "transparent") return "transparent"
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const getAlphaFromColor = (color) => {
    if (!color || color === "transparent") return 0
    const match = color.match(/rgba?$$[\d\s,]+,\s*([\d.]+)$$/)
    return match ? Number.parseFloat(match[1]) : 1
  }

  const getHexFromColor = (color) => {
    if (!color || color === "transparent") return "#000000"
    if (color.startsWith("#")) return color
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = Number.parseInt(match[1]).toString(16).padStart(2, "0")
      const g = Number.parseInt(match[2]).toString(16).padStart(2, "0")
      const b = Number.parseInt(match[3]).toString(16).padStart(2, "0")
      return `#${r}${g}${b}`
    }
    return "#000000"
  }

  // Logo handlers
  const handleSaveLogo = async () => {
    if (!currentTenantId) return alert("No tenant selected.")
    setLoading(true)
    try {
      const logoRef = doc(db, "tenants", currentTenantId, "data", "logo")
      let logoData = {}
      if (useImage && logoFile) {
        const fileRef = ref(storage, `logos/${currentTenantId}/${logoFile.name}`)
        await uploadBytes(fileRef, logoFile)
        const imageUrl = await getDownloadURL(fileRef)
        logoData = { type: "image", url: imageUrl }
      } else if (!useImage && logoText.trim() !== "") {
        logoData = { type: "text", text: logoText }
      } else {
        alert("Provide a logo.")
        setLoading(false)
        return
      }
      await setDoc(logoRef, logoData, { merge: true })
      setSavedLogo(logoData)
      alert("Logo saved!")
    } catch (err) {
      console.error(err)
      alert("Failed to save logo.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!window.confirm("Delete the current logo?")) return
    setLoading(true)
    try {
      if (savedLogo?.type === "image" && savedLogo?.url) {
        const logoRef = ref(storage, savedLogo.url)
        await deleteObject(logoRef).catch(() => {})
      }
      const logoDocRef = doc(db, "tenants", currentTenantId, "data", "logo")
      await deleteDoc(logoDocRef)
      setSavedLogo(null)
      setLogoText("")
      setLogoFile(null)
      alert("Logo deleted!")
    } catch (err) {
      console.error(err)
      alert("Failed to delete logo.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditLogo = () => {
    if (savedLogo?.type === "text") {
      setLogoText(savedLogo.text)
      setUseImage(false)
    } else {
      setUseImage(true)
    }
  }

  // Homepage handlers
  const handleSaveHome = async () => {
    if (!currentTenantId) return alert("No tenant selected.")
    setLoading(true)
    try {
      const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage")
      const homepageSnap = await getDoc(homepageRef)
      const existingData = homepageSnap.exists() ? homepageSnap.data() : {}

      const updatedData = { ...existingData, ...homeData }

      // Upload banner images
      if (bannerFiles.length > 0) {
        const uploadedUrls = []
        for (let i = 0; i < bannerFiles.length; i++) {
          const file = bannerFiles[i]
          const bannerRef = ref(storage, `homepage/${currentTenantId}/banner_${Date.now()}_${i}.jpg`)
          await uploadBytes(bannerRef, file)
          const url = await getDownloadURL(bannerRef)
          uploadedUrls.push(url)
        }
        updatedData.bannerImages = [...(existingData.bannerImages || []), ...uploadedUrls]
      }

      // Upload right image
      if (rightFile) {
        const rightRef = ref(storage, `homepage/${currentTenantId}/right.jpg`)
        await uploadBytes(rightRef, rightFile)
        updatedData.rightImage = await getDownloadURL(rightRef)
      }

      await setDoc(homepageRef, updatedData, { merge: true })
      alert("Homepage saved!")
      setBannerFiles([])
      setRightFile(null)
      setHomeData(updatedData)
    } catch (err) {
      console.error(err)
      alert("Failed to save homepage.")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBannerImage = async (index) => {
    if (!window.confirm("Delete this banner image?")) return
    try {
      const imageUrl = homeData.bannerImages[index]
      const imageRef = ref(storage, imageUrl)
      await deleteObject(imageRef).catch(() => {})

      const updatedBanners = homeData.bannerImages.filter((_, i) => i !== index)
      setHomeData({ ...homeData, bannerImages: updatedBanners })

      const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage")
      await setDoc(homepageRef, { bannerImages: updatedBanners }, { merge: true })
      alert("Banner image deleted!")
    } catch (err) {
      console.error(err)
      alert("Failed to delete banner image.")
    }
  }

  const handleEditBannerImage = (index) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        setLoading(true)
        const bannerRef = ref(storage, `homepage/${currentTenantId}/banner_${Date.now()}.jpg`)
        await uploadBytes(bannerRef, file)
        const url = await getDownloadURL(bannerRef)

        // Delete old image
        const oldImageUrl = homeData.bannerImages[index]
        const oldImageRef = ref(storage, oldImageUrl)
        await deleteObject(oldImageRef).catch(() => {})

        const updatedBanners = [...homeData.bannerImages]
        updatedBanners[index] = url
        setHomeData({ ...homeData, bannerImages: updatedBanners })

        const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage")
        await setDoc(homepageRef, { bannerImages: updatedBanners }, { merge: true })
        alert("Banner image updated!")
      } catch (err) {
        console.error(err)
        alert("Failed to update banner image.")
      } finally {
        setLoading(false)
      }
    }
    fileInput.click()
  }

  const handleDeleteRightImage = async () => {
    if (!window.confirm("Delete the right image?")) return
    try {
      setLoading(true)
      if (homeData.rightImage) {
        const imageRef = ref(storage, homeData.rightImage)
        await deleteObject(imageRef).catch(() => {})
      }

      setHomeData({ ...homeData, rightImage: "" })
      const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage")
      await setDoc(homepageRef, { rightImage: "" }, { merge: true })
      alert("Right image deleted!")
    } catch (err) {
      console.error(err)
      alert("Failed to delete right image.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditRightImage = () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        setLoading(true)
        const rightRef = ref(storage, `homepage/${currentTenantId}/right.jpg`)
        await uploadBytes(rightRef, file)
        const url = await getDownloadURL(rightRef)

        setHomeData({ ...homeData, rightImage: url })
        const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage")
        await setDoc(homepageRef, { rightImage: url }, { merge: true })
        alert("Right image updated!")
      } catch (err) {
        console.error(err)
        alert("Failed to update right image.")
      } finally {
        setLoading(false)
      }
    }
    fileInput.click()
  }

  const handleSaveNavbarColors = async () => {
    if (!currentTenantId) return alert("No tenant selected.")
    try {
      const navbarRef = doc(db, "tenants", currentTenantId, "data", "navbarColors")
      await setDoc(navbarRef, navbarColors, { merge: true })
      alert("Navbar colors saved!")
    } catch (err) {
      console.error(err)
      alert("Failed to save navbar colors.")
    }
  }

  const renderColorPicker = (label, field, state, setState) => {
    const currentColor = state[field] || "#000000"
    const hexColor = getHexFromColor(currentColor)
    const alphaValue = getAlphaFromColor(currentColor)
    const updateColor = (hex, alpha) => {
      const newColor = alpha < 1 ? hexToRgba(hex, alpha) : hex
      setState({ ...state, [field]: newColor })
    }

    return (
      <div className="color-picker-section">
        <label className="input-label">{label}:</label>
        <div className="color-picker-controls">
          <input
            type="color"
            value={hexColor}
            onChange={(e) => updateColor(e.target.value, alphaValue)}
            className="color-input"
          />
          <input
            type="text"
            placeholder="#000000"
            value={currentColor}
            onChange={(e) => {
              const val = e.target.value
              if (val.startsWith("#") || val.startsWith("rgb") || val === "transparent")
                setState({ ...state, [field]: val })
            }}
            className="color-text-input"
          />
          <div className="opacity-control">
            <label className="opacity-label">Opacity: {Math.round(alphaValue * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(alphaValue * 100)}
              onChange={(e) => updateColor(hexColor, Number.parseInt(e.target.value) / 100)}
              className="opacity-slider"
            />
          </div>
        </div>

        <div className="preset-colors">
          {presetColors.map(({ color, name }) => (
            <div key={color} onClick={() => setState({ ...state, [field]: color })} className="preset-color-item">
              <div className="preset-color-swatch" style={{ backgroundColor: color }} />
              <span className="preset-color-name">{name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!currentTenantId) {
    return (
      <div className="home-main-content">
        <div className="no-tenant-message">Please select a tenant first.</div>
      </div>
    )
  }

  return (
    <div className="home-main-content">
      <div className="home-container">
        <div className="home-header">
          <h2>CMS DASHBOARD</h2>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button className={`tab-button ${activeTab === "logo" ? "active" : ""}`} onClick={() => setActiveTab("logo")}>
            Logo Management
          </button>
          <button
            className={`tab-button ${activeTab === "homepage" ? "active" : ""}`}
            onClick={() => setActiveTab("homepage")}
          >
            Homepage Content
          </button>
          <button
            className={`tab-button ${activeTab === "navbar" ? "active" : ""}`}
            onClick={() => setActiveTab("navbar")}
          >
            Navbar Colors
          </button>
          <button
            className={`tab-button ${activeTab === "reviewers" ? "active" : ""}`}
            onClick={() => setActiveTab("reviewers")}
          >
            Allowed Reviewers
          </button>
        </div>

        {/* Logo Tab */}
        <div className={`tab-content ${activeTab === "logo" ? "active" : ""}`}>
          <div className="cms-section">
            <h3>Logo Management</h3>
            <div className="logo-toggle">
              <button className="btn-secondary" onClick={() => setUseImage(!useImage)}>
                {useImage ? "Use Text Logo" : "Use Image Logo"}
              </button>
            </div>
            {useImage ? (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0])}
                className="file-input"
              />
            ) : (
              <input
                type="text"
                placeholder="Enter Logo Text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="input-field"
              />
            )}
            <button className="btn-primary" onClick={handleSaveLogo} disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>Saving...
                </>
              ) : (
                "Save Logo"
              )}
            </button>

            {savedLogo && (
              <div className="logo-preview">
                <h4>Saved Logo Preview:</h4>
                {savedLogo.type === "text" ? (
                  <h2>{savedLogo.text}</h2>
                ) : (
                  <div className="image-card">
                    <img src={savedLogo.url || "/placeholder.svg"} alt="Logo" />
                    <div className="image-actions">
                      <button className="image-action-btn edit" onClick={handleEditLogo} title="Edit">
                        ✎
                      </button>
                      <button className="image-action-btn delete" onClick={handleDeleteLogo} title="Delete">
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Homepage Tab */}
        <div className={`tab-content ${activeTab === "homepage" ? "active" : ""}`}>
          <div className="cms-section">
            <h3>Homepage Management</h3>

            <label className="input-label">Tagline</label>
            <input
              type="text"
              value={homeData.tagline}
              onChange={(e) => setHomeData({ ...homeData, tagline: e.target.value })}
              className="input-field"
            />
            {renderColorPicker("Tagline Color", "taglineColor", homeData, setHomeData)}

            <label className="input-label">Slogan</label>
            <input
              type="text"
              value={homeData.slogan}
              onChange={(e) => setHomeData({ ...homeData, slogan: e.target.value })}
              className="input-field"
            />
            {renderColorPicker("Slogan Color", "sloganColor", homeData, setHomeData)}

            <label className="input-label">Short Description</label>
            <textarea
              value={homeData.shortDescription}
              onChange={(e) => setHomeData({ ...homeData, shortDescription: e.target.value })}
              className="textarea-field"
            />
            {renderColorPicker("Short Description Color", "shortDescriptionColor", homeData, setHomeData)}

            {/* Banner Images */}
            <div>
              <label className="input-label">Banner Images:</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setBannerFiles(Array.from(e.target.files))}
                className="file-input"
              />
              {homeData.bannerImages.length > 0 && (
                <div className="image-grid">
                  {homeData.bannerImages.map((img, index) => (
                    <div key={index} className="image-card">
                      <img src={img || "/placeholder.svg"} alt={`Banner ${index}`} />
                      <div className="image-actions">
                        <button
                          className="image-action-btn edit"
                          onClick={() => handleEditBannerImage(index)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="image-action-btn delete"
                          onClick={() => handleRemoveBannerImage(index)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Image */}
            <div>
              <label className="input-label">Right Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRightFile(e.target.files[0])}
                className="file-input"
              />
              {homeData.rightImage && (
                <div className="right-image-container">
                  <img
                    src={homeData.rightImage || "/placeholder.svg"}
                    alt="Right"
                    className="right-image-preview"
                    style={{ objectFit: homeData.rightImageFit || "cover" }}
                  />
                  <div className="right-image-actions">
                    <button className="image-action-btn edit" onClick={handleEditRightImage} title="Edit">
                      ✎
                    </button>
                    <button className="image-action-btn delete" onClick={handleDeleteRightImage} title="Delete">
                      ×
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="input-label">Right Image Fit:</label>
                <select
                  value={homeData.rightImageFit || "cover"}
                  onChange={(e) => setHomeData({ ...homeData, rightImageFit: e.target.value })}
                  className="select-field"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                  <option value="scale-down">Scale Down</option>
                </select>
              </div>
            </div>

            {/* Button Management */}
            <div className="cms-section" style={{ marginTop: "30px" }}>
              <h4>Call-to-Action Buttons</h4>

              {/* Primary Button */}
              <div style={{ marginBottom: "30px" }}>
                <h5>Primary Button</h5>
                <label className="input-label">Button Text</label>
                <input
                  type="text"
                  value={homeData.primaryButtonText}
                  onChange={(e) => setHomeData({ ...homeData, primaryButtonText: e.target.value })}
                  className="input-field"
                  placeholder="Book for a service"
                />
                {renderColorPicker("Background Color", "primaryButtonBgColor", homeData, setHomeData)}
                {renderColorPicker("Text Color", "primaryButtonTextColor", homeData, setHomeData)}
              </div>

              {/* Secondary Button */}
              <div>
                <h5>Secondary Button</h5>
                <label className="input-label">Button Text</label>
                <input
                  type="text"
                  value={homeData.secondaryButtonText}
                  onChange={(e) => setHomeData({ ...homeData, secondaryButtonText: e.target.value })}
                  className="input-field"
                  placeholder="Call: 0123456789"
                />
                {renderColorPicker("Background Color", "secondaryButtonBgColor", homeData, setHomeData)}
                {renderColorPicker("Text Color", "secondaryButtonTextColor", homeData, setHomeData)}
                {renderColorPicker("Border Color", "secondaryButtonBorderColor", homeData, setHomeData)}
              </div>

              {/* Button Preview */}
              <div className="button-preview-container">
                <h5>Button Preview:</h5>
                <div className="button-preview-buttons">
                  <button
                    style={{
                      backgroundColor: homeData.primaryButtonBgColor,
                      color: homeData.primaryButtonTextColor,
                      padding: "12px 24px",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {homeData.primaryButtonText}
                  </button>
                  <button
                    style={{
                      backgroundColor: homeData.secondaryButtonBgColor,
                      color: homeData.secondaryButtonTextColor,
                      border: `2px solid ${homeData.secondaryButtonBorderColor}`,
                      padding: "12px 24px",
                      borderRadius: "5px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {homeData.secondaryButtonText}
                  </button>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleSaveHome} disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>Saving...
                </>
              ) : (
                "Save Homepage"
              )}
            </button>
          </div>
        </div>

        {/* Navbar Tab */}
        <div className={`tab-content ${activeTab === "navbar" ? "active" : ""}`}>
          <div className="cms-section">
            <h3>Navbar Colors</h3>

            <h4>Homepage Navbar (Initial)</h4>
            {renderColorPicker("Background Color", "background", navbarColors, setNavbarColors)}
            {renderColorPicker("Link Color", "links", navbarColors, setNavbarColors)}
            {renderColorPicker("Logo Text Color", "logoText", navbarColors, setNavbarColors)}

            <h4>Homepage Navbar (Scrolled)</h4>
            {renderColorPicker("Scrolled Background Color", "scrolledBackground", navbarColors, setNavbarColors)}
            {renderColorPicker("Scrolled Link Color", "scrolledLinks", navbarColors, setNavbarColors)}
            {renderColorPicker("Scrolled Logo Text Color", "scrolledLogoText", navbarColors, setNavbarColors)}

            <h4>Other Pages Navbar</h4>
            {renderColorPicker("Other Pages Background Color", "otherPagesBackground", navbarColors, setNavbarColors)}
            {renderColorPicker("Other Pages Link Color", "otherPagesLinks", navbarColors, setNavbarColors)}
            {renderColorPicker("Other Pages Logo Text Color", "otherPagesLogoText", navbarColors, setNavbarColors)}

            <button className="btn-primary" onClick={handleSaveNavbarColors} disabled={loading}>
              Save Navbar Colors
            </button>
          </div>
        </div>

        {/* Reviewers Tab */}
        <div className={`tab-content ${activeTab === "reviewers" ? "active" : ""}`}>
          <div className="cms-section">
            <h3>Allowed Reviewers</h3>
            <p>Manage who can post testimonials for your business.</p>

            <div className="reviewer-controls">
              <input
                type="email"
                placeholder="Enter email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                className="input-field"
              />
              <button className="btn-primary" onClick={handleAddAllowedEmail}>
                Add Email
              </button>
            </div>

            {allowedUsers.length > 0 ? (
              <table className="reviewer-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Date Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allowedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        {user.addedAt?.toDate ? user.addedAt.toDate().toLocaleString() : user.addedAt?.toString()}
                      </td>
                      <td>
                        <button className="btn-danger" onClick={() => handleRemoveEmail(user.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data-message">No allowed reviewers yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
