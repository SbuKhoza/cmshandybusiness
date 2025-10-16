import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { db, storage, auth } from "../config"
import { doc, collection, query, orderBy, onSnapshot, setDoc, addDoc, deleteDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import "./AboutCMS.css"

function AboutCMS() {
  const { currentTenantId } = useSelector((state) => state.tenant)

  const [aboutHeader, setAboutHeader] = useState({
    title: "",
    subtitle: "",
    bannerImage: "",
  })
  const [sections, setSections] = useState([])
  const [editingHeader, setEditingHeader] = useState(false)
  const [editSectionId, setEditSectionId] = useState(null)
  const [newSection, setNewSection] = useState({
    title: "",
    content: "",
    order: 0,
  })
  const [uploadProgress, setUploadProgress] = useState({})

  useEffect(() => {
    if (!currentTenantId) return

    // Header doc
    const headerRef = doc(db, "tenants", currentTenantId, "data", "aboutHeader")
    const unsubHeader = onSnapshot(headerRef, async (snap) => {
      if (snap.exists()) {
        setAboutHeader(snap.data())
      } else {
        await setDoc(headerRef, { title: "", subtitle: "", bannerImage: "" })
        setAboutHeader({ title: "", subtitle: "", bannerImage: "" })
      }
    })

    // Sections list
    const sectionsRef = collection(db, "tenants", currentTenantId, "aboutSections")
    const q = query(sectionsRef, orderBy("order", "asc"))
    const unsubSections = onSnapshot(q, (snap) => {
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubHeader()
      unsubSections()
    }
  }, [currentTenantId])

  const handleSaveHeader = async () => {
    if (!currentTenantId) return
    try {
      const headerRef = doc(db, "tenants", currentTenantId, "data", "aboutHeader")
      await setDoc(headerRef, aboutHeader, { merge: true })
      setEditingHeader(false)
      alert("Header saved successfully!")
    } catch (err) {
      console.error("Error saving header:", err)
      alert("Failed to save header.")
    }
  }

  const handleSaveSection = async (id, data) => {
    if (!currentTenantId) return
    try {
      const sectionRef = doc(db, "tenants", currentTenantId, "aboutSections", id)
      await setDoc(sectionRef, data, { merge: true })
      setEditSectionId(null)
      alert("Section saved successfully!")
    } catch (err) {
      console.error("Error saving section:", err)
      alert("Failed to save section.")
    }
  }

  const handleAddSection = async () => {
    if (!currentTenantId || !newSection.title) return alert("Enter a title first.")
    try {
      await addDoc(collection(db, "tenants", currentTenantId, "aboutSections"), newSection)
      setNewSection({ title: "", content: "", order: 0 })
      alert("Section added!")
    } catch (err) {
      console.error("Error adding section:", err)
      alert("Could not add section.")
    }
  }

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return
    if (!currentTenantId) return
    try {
      const section = sections.find((s) => s.id === id)
      if (section?.image) {
        const imageRef = ref(storage, section.image)
        await deleteObject(imageRef).catch(() => {})
      }
      await deleteDoc(doc(db, "tenants", currentTenantId, "aboutSections", id))
      alert("Section deleted!")
    } catch (err) {
      console.error("Error deleting section:", err)
      alert("Failed to delete section.")
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
      if (aboutHeader.bannerImage) {
        const oldBannerRef = ref(storage, aboutHeader.bannerImage)
        await deleteObject(oldBannerRef).catch(() => {})
      }

      const fileName = `banner_${Date.now()}_${file.name}`
      const storageRef = ref(storage, `about/${currentTenantId}/${fileName}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress((prev) => ({
            ...prev,
            banner: progress.toFixed(0),
          }))
        },
        (error) => {
          console.error("Upload error:", error)
          alert("Banner upload failed.")
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          const headerRef = doc(db, "tenants", currentTenantId, "data", "aboutHeader")
          await setDoc(headerRef, { bannerImage: url }, { merge: true })
          setUploadProgress((prev) => ({ ...prev, banner: 100 }))
          alert("✅ Banner uploaded successfully!")
        },
      )
    } catch (err) {
      console.error("Banner upload failed:", err)
      alert("Banner upload failed.")
    }
  }

  const handleDeleteBanner = async () => {
    if (!window.confirm("Delete banner image?")) return
    try {
      if (aboutHeader.bannerImage) {
        const bannerRef = ref(storage, aboutHeader.bannerImage)
        await deleteObject(bannerRef).catch(() => {})
      }

      const headerRef = doc(db, "tenants", currentTenantId, "data", "aboutHeader")
      await setDoc(headerRef, { bannerImage: "" }, { merge: true })
      alert("Banner deleted!")
    } catch (err) {
      console.error("Error deleting banner:", err)
      alert("Failed to delete banner.")
    }
  }

  const handleImageUpload = async (e, sectionId) => {
    if (!currentTenantId) return
    const file = e.target.files[0]
    if (!file) return

    const user = auth?.currentUser
    if (!user) {
      alert("You must be signed in to upload images.")
      return
    }

    try {
      const fileName = `${Date.now()}_${file.name}`
      const storageRef = ref(storage, `about/${currentTenantId}/${fileName}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress((prev) => ({
            ...prev,
            [sectionId]: progress.toFixed(0),
          }))
        },
        (error) => {
          console.error("Upload error:", error)
          alert("Image upload failed.")
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          const sectionRef = doc(db, "tenants", currentTenantId, "aboutSections", sectionId)
          await setDoc(sectionRef, { image: url }, { merge: true })
          setUploadProgress((prev) => ({ ...prev, [sectionId]: 100 }))
          alert("✅ Image uploaded successfully!")
        },
      )
    } catch (err) {
      console.error("Image upload failed:", err)
      alert("Image upload failed.")
    }
  }

  const handleDeleteImage = async (sectionId, imageUrl) => {
    if (!window.confirm("Delete this image?")) return
    try {
      const imageRef = ref(storage, imageUrl)
      await deleteObject(imageRef).catch(() => {})

      const sectionRef = doc(db, "tenants", currentTenantId, "aboutSections", sectionId)
      await setDoc(sectionRef, { image: "" }, { merge: true })
      alert("Image deleted!")
    } catch (err) {
      console.error("Error deleting image:", err)
      alert("Failed to delete image.")
    }
  }

  const handleEditImage = (sectionId) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      const user = auth?.currentUser
      if (!user) {
        alert("You must be signed in to upload images.")
        return
      }

      try {
        const section = sections.find((s) => s.id === sectionId)

        // Delete old image if exists
        if (section?.image) {
          const oldImageRef = ref(storage, section.image)
          await deleteObject(oldImageRef).catch(() => {})
        }

        const fileName = `${Date.now()}_${file.name}`
        const storageRef = ref(storage, `about/${currentTenantId}/${fileName}`)
        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress((prev) => ({
              ...prev,
              [sectionId]: progress.toFixed(0),
            }))
          },
          (error) => {
            console.error("Upload error:", error)
            alert("Image upload failed.")
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            const sectionRef = doc(db, "tenants", currentTenantId, "aboutSections", sectionId)
            await setDoc(sectionRef, { image: url }, { merge: true })
            setUploadProgress((prev) => ({ ...prev, [sectionId]: 100 }))
            alert("✅ Image updated successfully!")
          },
        )
      } catch (err) {
        console.error("Image update failed:", err)
        alert("Failed to update image.")
      }
    }
    fileInput.click()
  }

  if (!currentTenantId) {
    return <div className="no-tenant-message">Please select a tenant first.</div>
  }

  return (
    <div className="about-cms-container">
      <h2>About Page CMS</h2>

      {/* Header Section */}
      <div className="header-section">
        <h3>Page Header</h3>
        {editingHeader ? (
          <div className="header-edit-form">
            <input
              type="text"
              placeholder="Page Title"
              value={aboutHeader.title}
              onChange={(e) => setAboutHeader({ ...aboutHeader, title: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Subtitle"
              value={aboutHeader.subtitle}
              onChange={(e) => setAboutHeader({ ...aboutHeader, subtitle: e.target.value })}
              className="textarea-field"
            />
            <div className="banner-upload-section">
              <label>Banner Image:</label>
              <input type="file" accept="image/*" onChange={handleBannerUpload} />
              {uploadProgress.banner && <div className="upload-progress">Uploading: {uploadProgress.banner}%</div>}
              {aboutHeader.bannerImage && (
                <div className="banner-preview">
                  <img src={aboutHeader.bannerImage} alt="Banner" className="banner-image" />
                  <button className="btn-about-danger" onClick={handleDeleteBanner}>
                    Delete Banner
                  </button>
                </div>
              )}
            </div>
            <div>
              <button className="btn-about-primary" onClick={handleSaveHeader}>
                Save
              </button>
              <button className="btn-about-secondary" onClick={() => setEditingHeader(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="header-display">
            <p>
              <strong>Title:</strong> {aboutHeader.title || "Not set"}
            </p>
            <p>
              <strong>Subtitle:</strong> {aboutHeader.subtitle || "Not set"}
            </p>
            {aboutHeader.bannerImage && (
              <div className="banner-preview">
                <img src={aboutHeader.bannerImage} alt="Banner" className="banner-image" />
              </div>
            )}
            <button className="btn-about-primary" onClick={() => setEditingHeader(true)}>
              Edit Header
            </button>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Content Sections */}
      <div>
        <h3>Content Sections</h3>
        <div className="sections-grid">
          {sections.map((section) => (
            <div key={section.id} className="section-card">
              {editSectionId === section.id ? (
                <div className="section-edit-form">
                  <input
                    type="text"
                    placeholder="Section Title"
                    value={section.title}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s)),
                      )
                    }
                    className="input-field"
                  />
                  <textarea
                    placeholder="Content"
                    value={section.content}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s) => (s.id === section.id ? { ...s, content: e.target.value } : s)),
                      )
                    }
                    className="textarea-field"
                    rows="6"
                  />
                  <input
                    type="number"
                    placeholder="Display Order"
                    value={section.order || 0}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s) => (s.id === section.id ? { ...s, order: Number.parseInt(e.target.value) } : s)),
                      )
                    }
                    className="number-input"
                  />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, section.id)} />
                  {uploadProgress[section.id] && (
                    <div className="upload-progress">Uploading: {uploadProgress[section.id]}%</div>
                  )}
                  <div className="section-actions">
                    <button className="btn-about-primary" onClick={() => handleSaveSection(section.id, section)}>
                      Save Changes
                    </button>
                    <button className="btn-about-secondary" onClick={() => setEditSectionId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="section-card-display">
                  <h4 className="section-title">{section.title}</h4>
                  <p className="section-content">{section.content}</p>

                  {section.image ? (
                    <div className="section-image-container">
                      <img src={section.image} alt={section.title} className="section-image" />
                      <div className="section-image-actions">
                        <button
                          className="section-image-btn edit"
                          onClick={() => handleEditImage(section.id)}
                          title="Edit Image"
                        >
                          ✎
                        </button>
                        <button
                          className="section-image-btn delete"
                          onClick={() => handleDeleteImage(section.id, section.image)}
                          title="Delete Image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="no-image-text">No image uploaded</p>
                  )}

                  <p className="section-meta">
                    <strong>Display Order:</strong> {section.order || 0}
                  </p>

                  <div className="section-actions">
                    <button className="btn-about-primary" onClick={() => setEditSectionId(section.id)}>
                      Edit
                    </button>
                    <button className="btn-about-danger" onClick={() => handleDeleteSection(section.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* Add New Section */}
      <div className="add-section-section">
        <h3>Add New Section</h3>
        <div className="add-section-form">
          <input
            type="text"
            placeholder="Section title"
            value={newSection.title}
            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
            className="input-field"
          />
          <textarea
            placeholder="Content"
            value={newSection.content}
            onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
            className="textarea-field"
            rows="4"
          />
          <input
            type="number"
            placeholder="Display order"
            value={newSection.order}
            onChange={(e) =>
              setNewSection({
                ...newSection,
                order: Number.parseInt(e.target.value),
              })
            }
            className="number-input"
          />
          <button className="btn-about-primary" onClick={handleAddSection}>
            Add Section
          </button>
        </div>
      </div>
    </div>
  )
}

export default AboutCMS