"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { db, storage, auth } from "../config"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import "./ContactCMS.css"

function ContactCMS() {
  const { currentTenantId } = useSelector((state) => state.tenant)

  const [contactData, setContactData] = useState({
    title: "",
    subtitle: "",
    bannerImage: "",
    headerBgColor: "#667eea",
    titleColor: "#ffffff",
    email: "",
    phone: "",
    address: "",
    workingHours: "",
    mapEmbedUrl: "",
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  })
  const [editing, setEditing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!currentTenantId) return

    const contactRef = doc(db, "tenants", currentTenantId, "data", "contactPage")
    const unsubContact = onSnapshot(contactRef, async (snap) => {
      if (snap.exists()) {
        setContactData(snap.data())
      } else {
        const defaultData = {
          title: "",
          subtitle: "",
          bannerImage: "",
          headerBgColor: "#667eea",
          titleColor: "#ffffff",
          email: "",
          phone: "",
          address: "",
          workingHours: "",
          mapEmbedUrl: "",
          facebook: "",
          twitter: "",
          instagram: "",
          linkedin: "",
        }
        await setDoc(contactRef, defaultData)
        setContactData(defaultData)
      }
    })

    return () => {
      unsubContact()
    }
  }, [currentTenantId])

  const handleSave = async () => {
    if (!currentTenantId) return
    try {
      const contactRef = doc(db, "tenants", currentTenantId, "data", "contactPage")
      await setDoc(contactRef, contactData, { merge: true })
      setEditing(false)
      alert("Contact page saved successfully!")
    } catch (err) {
      console.error("Error saving contact page:", err)
      alert("Failed to save contact page.")
    }
  }

  const handleBannerUpload = async (e) => {
    if (!currentTenantId) return
    const file = e.target.files[0]
    if (!file) return

    const user = auth?.currentUser
    if (!user) {
      alert("You must be signed in to upload images.")
      return
    }

    try {
      // Delete old banner if exists
      if (contactData.bannerImage) {
        const oldBannerRef = ref(storage, contactData.bannerImage)
        await deleteObject(oldBannerRef).catch(() => {})
      }

      const fileName = `contact_banner_${Date.now()}_${file.name}`
      const storageRef = ref(storage, `contact/${currentTenantId}/${fileName}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress.toFixed(0))
        },
        (error) => {
          console.error("Upload error:", error)
          alert("Banner upload failed.")
          setUploadProgress(0)
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          const contactRef = doc(db, "tenants", currentTenantId, "data", "contactPage")
          await setDoc(contactRef, { bannerImage: url }, { merge: true })
          setUploadProgress(0)
          alert("✅ Banner uploaded successfully!")
        },
      )
    } catch (err) {
      console.error("Banner upload failed:", err)
      alert("Banner upload failed.")
      setUploadProgress(0)
    }
  }

  const handleDeleteBanner = async () => {
    if (!window.confirm("Delete banner image?")) return
    try {
      if (contactData.bannerImage) {
        const bannerRef = ref(storage, contactData.bannerImage)
        await deleteObject(bannerRef).catch(() => {})
      }

      const contactRef = doc(db, "tenants", currentTenantId, "data", "contactPage")
      await setDoc(contactRef, { bannerImage: "" }, { merge: true })
      alert("Banner deleted!")
    } catch (err) {
      console.error("Error deleting banner:", err)
      alert("Failed to delete banner.")
    }
  }

  if (!currentTenantId) {
    return <div className="no-tenant-message">Please select a tenant first.</div>
  }

  return (
    <div className="contact-cms-container">
      <h2>Contact Page CMS</h2>

      <div className="cms-section">
        {editing ? (
          <div className="edit-form">
            <h3>Page Header</h3>
            <input
              type="text"
              placeholder="Page Title"
              value={contactData.title}
              onChange={(e) => setContactData({ ...contactData, title: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Subtitle"
              value={contactData.subtitle}
              onChange={(e) => setContactData({ ...contactData, subtitle: e.target.value })}
              className="textarea-field"
              rows="2"
            />

            <div className="color-controls">
              <div className="color-control-group">
                <label>Header Background Color:</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={contactData.headerBgColor || "#667eea"}
                    onChange={(e) => setContactData({ ...contactData, headerBgColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={contactData.headerBgColor || "#667eea"}
                    onChange={(e) => setContactData({ ...contactData, headerBgColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#667eea"
                  />
                </div>
                <small className="color-note">Used when no banner image is set</small>
              </div>

              <div className="color-control-group">
                <label>Title Text Color:</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={contactData.titleColor || "#ffffff"}
                    onChange={(e) => setContactData({ ...contactData, titleColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={contactData.titleColor || "#ffffff"}
                    onChange={(e) => setContactData({ ...contactData, titleColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="banner-upload-section">
              <label>Banner Image (optional):</label>
              <input type="file" accept="image/*" onChange={handleBannerUpload} />
              {uploadProgress > 0 && <div className="upload-progress">Uploading: {uploadProgress}%</div>}
              {contactData.bannerImage && (
                <div className="banner-preview">
                  <img src={contactData.bannerImage} alt="Banner" className="banner-image" />
                  <button className="btn-contact-danger" onClick={handleDeleteBanner}>
                    Delete Banner
                  </button>
                </div>
              )}
            </div>

            <hr className="divider" />

            <h3>Contact Information</h3>
            <input
              type="email"
              placeholder="Email Address"
              value={contactData.email}
              onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
              className="input-field"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={contactData.phone}
              onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Physical Address"
              value={contactData.address}
              onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
              className="textarea-field"
              rows="3"
            />
            <textarea
              placeholder="Working Hours (e.g., Mon-Fri: 9AM-5PM)"
              value={contactData.workingHours}
              onChange={(e) => setContactData({ ...contactData, workingHours: e.target.value })}
              className="textarea-field"
              rows="3"
            />

            <hr className="divider" />

            <h3>Google Maps Embed</h3>
            <input
              type="url"
              placeholder="Google Maps Embed URL (iframe src)"
              value={contactData.mapEmbedUrl}
              onChange={(e) => setContactData({ ...contactData, mapEmbedUrl: e.target.value })}
              className="input-field"
            />
            <small className="help-text">
              Get embed URL: Google Maps → Share → Embed a map → Copy the URL from the iframe src
            </small>

            <hr className="divider" />

            <h3>Social Media Links</h3>
            <input
              type="url"
              placeholder="Facebook URL"
              value={contactData.facebook}
              onChange={(e) => setContactData({ ...contactData, facebook: e.target.value })}
              className="input-field"
            />
            <input
              type="url"
              placeholder="Twitter URL"
              value={contactData.twitter}
              onChange={(e) => setContactData({ ...contactData, twitter: e.target.value })}
              className="input-field"
            />
            <input
              type="url"
              placeholder="Instagram URL"
              value={contactData.instagram}
              onChange={(e) => setContactData({ ...contactData, instagram: e.target.value })}
              className="input-field"
            />
            <input
              type="url"
              placeholder="LinkedIn URL"
              value={contactData.linkedin}
              onChange={(e) => setContactData({ ...contactData, linkedin: e.target.value })}
              className="input-field"
            />

            <div className="form-actions">
              <button className="btn-contact-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button className="btn-contact-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="display-view">
            <h3>Page Header</h3>
            <p>
              <strong>Title:</strong> {contactData.title || "Not set"}
            </p>
            <p>
              <strong>Subtitle:</strong> {contactData.subtitle || "Not set"}
            </p>
            <p>
              <strong>Header Background:</strong>
              <span className="color-preview" style={{ backgroundColor: contactData.headerBgColor || "#667eea" }}>
                {contactData.headerBgColor || "#667eea"}
              </span>
            </p>
            <p>
              <strong>Title Color:</strong>
              <span className="color-preview" style={{ backgroundColor: contactData.titleColor || "#ffffff" }}>
                {contactData.titleColor || "#ffffff"}
              </span>
            </p>
            {contactData.bannerImage && (
              <div className="banner-preview">
                <img src={contactData.bannerImage} alt="Banner" className="banner-image" />
              </div>
            )}

            <hr className="divider" />

            <h3>Contact Information</h3>
            <p>
              <strong>Email:</strong> {contactData.email || "Not set"}
            </p>
            <p>
              <strong>Phone:</strong> {contactData.phone || "Not set"}
            </p>
            <p>
              <strong>Address:</strong> {contactData.address || "Not set"}
            </p>
            <p>
              <strong>Working Hours:</strong> {contactData.workingHours || "Not set"}
            </p>

            <hr className="divider" />

            <h3>Google Maps</h3>
            <p>
              <strong>Map:</strong> {contactData.mapEmbedUrl ? "Configured ✓" : "Not set"}
            </p>

            <hr className="divider" />

            <h3>Social Media</h3>
            <p>
              <strong>Facebook:</strong> {contactData.facebook || "Not set"}
            </p>
            <p>
              <strong>Twitter:</strong> {contactData.twitter || "Not set"}
            </p>
            <p>
              <strong>Instagram:</strong> {contactData.instagram || "Not set"}
            </p>
            <p>
              <strong>LinkedIn:</strong> {contactData.linkedin || "Not set"}
            </p>

            <button className="btn-contact-primary" onClick={() => setEditing(true)}>
              Edit Contact Page
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactCMS