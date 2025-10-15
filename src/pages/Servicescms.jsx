"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { db, storage, auth } from "../config"
import { doc, collection, query, orderBy, onSnapshot, setDoc, addDoc, deleteDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import "./Servicescms.css"

function Servicescms() {
  const { currentTenantId } = useSelector((state) => state.tenant)

  const [header, setHeader] = useState({ slogan: "", shortDescription: "" })
  const [services, setServices] = useState([])
  const [editingHeader, setEditingHeader] = useState(false)
  const [editServiceId, setEditServiceId] = useState(null)
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    phone: "",
    order: 0,
  })
  const [uploadProgress, setUploadProgress] = useState({})

  useEffect(() => {
    if (!currentTenantId) return

    // Header doc
    const headerRef = doc(db, "tenants", currentTenantId, "data", "servicesHeader")
    const unsubHeader = onSnapshot(headerRef, async (snap) => {
      if (snap.exists()) {
        setHeader(snap.data())
      } else {
        await setDoc(headerRef, { slogan: "", shortDescription: "" })
        setHeader({ slogan: "", shortDescription: "" })
      }
    })

    // Services list
    const servicesRef = collection(db, "tenants", currentTenantId, "services")
    const q = query(servicesRef, orderBy("order", "asc"))
    const unsubServices = onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubHeader()
      unsubServices()
    }
  }, [currentTenantId])

  const handleSaveHeader = async () => {
    if (!currentTenantId) return
    try {
      const headerRef = doc(db, "tenants", currentTenantId, "data", "servicesHeader")
      await setDoc(headerRef, header, { merge: true })
      setEditingHeader(false)
      alert("Header saved successfully!")
    } catch (err) {
      console.error("Error saving header:", err)
      alert("Failed to save header.")
    }
  }

  const handleSaveService = async (id, data) => {
    if (!currentTenantId) return
    try {
      const serviceRef = doc(db, "tenants", currentTenantId, "services", id)
      await setDoc(serviceRef, data, { merge: true })
      setEditServiceId(null)
      alert("Service saved successfully!")
    } catch (err) {
      console.error("Error saving service:", err)
      alert("Failed to save service.")
    }
  }

  const handleAddService = async () => {
    if (!currentTenantId || !newService.title) return alert("Enter a title first.")
    try {
      await addDoc(collection(db, "tenants", currentTenantId, "services"), newService)
      setNewService({ title: "", description: "", phone: "", order: 0 })
      alert("Service added!")
    } catch (err) {
      console.error("Error adding service:", err)
      alert("Could not add service.")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return
    if (!currentTenantId) return
    try {
      const service = services.find((s) => s.id === id)
      if (service?.image) {
        const imageRef = ref(storage, service.image)
        await deleteObject(imageRef).catch(() => {})
      }
      await deleteDoc(doc(db, "tenants", currentTenantId, "services", id))
      alert("Service deleted!")
    } catch (err) {
      console.error("Error deleting service:", err)
      alert("Failed to delete service.")
    }
  }

  const handleImageUpload = async (e, serviceId) => {
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
      const storageRef = ref(storage, `services/${currentTenantId}/${fileName}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress((prev) => ({
            ...prev,
            [serviceId]: progress.toFixed(0),
          }))
        },
        (error) => {
          console.error("Upload error:", error)
          alert("Image upload failed. Please check permissions.")
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          const serviceRef = doc(db, "tenants", currentTenantId, "services", serviceId)
          await setDoc(serviceRef, { image: url }, { merge: true })
          setUploadProgress((prev) => ({ ...prev, [serviceId]: 100 }))
          alert("✅ Image uploaded successfully!")
        },
      )
    } catch (err) {
      console.error("Image upload failed:", err)
      alert("Image upload failed. Check your storage rules.")
    }
  }

  const handleDeleteImage = async (serviceId, imageUrl) => {
    if (!window.confirm("Delete this image?")) return
    try {
      const imageRef = ref(storage, imageUrl)
      await deleteObject(imageRef).catch(() => {})

      const serviceRef = doc(db, "tenants", currentTenantId, "services", serviceId)
      await setDoc(serviceRef, { image: "" }, { merge: true })
      alert("Image deleted!")
    } catch (err) {
      console.error("Error deleting image:", err)
      alert("Failed to delete image.")
    }
  }

  const handleEditImage = (serviceId) => {
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
        const service = services.find((s) => s.id === serviceId)

        // Delete old image if exists
        if (service?.image) {
          const oldImageRef = ref(storage, service.image)
          await deleteObject(oldImageRef).catch(() => {})
        }

        const fileName = `${Date.now()}_${file.name}`
        const storageRef = ref(storage, `services/${currentTenantId}/${fileName}`)
        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress((prev) => ({
              ...prev,
              [serviceId]: progress.toFixed(0),
            }))
          },
          (error) => {
            console.error("Upload error:", error)
            alert("Image upload failed.")
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            const serviceRef = doc(db, "tenants", currentTenantId, "services", serviceId)
            await setDoc(serviceRef, { image: url }, { merge: true })
            setUploadProgress((prev) => ({ ...prev, [serviceId]: 100 }))
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
    <div className="services-container">
      <h2>Services CMS</h2>

      {/* Header section */}
      <div className="header-section">
        <h3>Header</h3>
        {editingHeader ? (
          <div className="header-edit-form">
            <input
              type="text"
              placeholder="Slogan"
              value={header.slogan}
              onChange={(e) => setHeader({ ...header, slogan: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Short description"
              value={header.shortDescription}
              onChange={(e) => setHeader({ ...header, shortDescription: e.target.value })}
              className="textarea-field"
            />
            <div>
              <button className="btn-services-primary" onClick={handleSaveHeader}>
                Save
              </button>
              <button className="btn-services-secondary" onClick={() => setEditingHeader(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="header-display">
            <p>
              <strong>Slogan:</strong> {header.slogan || "Not set"}
            </p>
            <p>
              <strong>Short Description:</strong> {header.shortDescription || "Not set"}
            </p>
            <button className="btn-services-primary" onClick={() => setEditingHeader(true)}>
              Edit Header
            </button>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Services list */}
      <div>
        <h3>Services</h3>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              {editServiceId === service.id ? (
                <div className="service-edit-form">
                  <input
                    type="text"
                    placeholder="Service Title"
                    value={service.title}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) => (s.id === service.id ? { ...s, title: e.target.value } : s)),
                      )
                    }
                    className="input-field"
                  />
                  <textarea
                    placeholder="Service Description"
                    value={service.description}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) => (s.id === service.id ? { ...s, description: e.target.value } : s)),
                      )
                    }
                    className="textarea-field"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={service.phone || ""}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) => (s.id === service.id ? { ...s, phone: e.target.value } : s)),
                      )
                    }
                    className="input-field"
                  />
                  <input
                    type="number"
                    placeholder="Display Order"
                    value={service.order || 0}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) => (s.id === service.id ? { ...s, order: Number.parseInt(e.target.value) } : s)),
                      )
                    }
                    className="number-input"
                  />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, service.id)} />
                  {uploadProgress[service.id] && (
                    <div className="upload-progress">Uploading: {uploadProgress[service.id]}%</div>
                  )}
                  <div className="service-actions">
                    <button className="btn-services-primary" onClick={() => handleSaveService(service.id, service)}>
                      Save Changes
                    </button>
                    <button className="btn-services-secondary" onClick={() => setEditServiceId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="service-card-display">
                  <h4 className="service-title">{service.title}</h4>
                  <p className="service-description">{service.description}</p>

                  {service.image ? (
                    <div className="service-image-container">
                      <img src={service.image || "/placeholder.svg"} alt={service.title} className="service-image" />
                      <div className="service-image-actions">
                        <button
                          className="service-image-btn edit"
                          onClick={() => handleEditImage(service.id)}
                          title="Edit Image"
                        >
                          ✎
                        </button>
                        <button
                          className="service-image-btn delete"
                          onClick={() => handleDeleteImage(service.id, service.image)}
                          title="Delete Image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="no-image-text">No image uploaded</p>
                  )}

                  <p className="service-meta">
                    <strong>Phone:</strong> {service.phone || "N/A"}
                  </p>
                  <p className="service-meta">
                    <strong>Display Order:</strong> {service.order || 0}
                  </p>

                  <div className="service-actions">
                    <button className="btn-services-primary" onClick={() => setEditServiceId(service.id)}>
                      Edit
                    </button>
                    <button className="btn-services-danger" onClick={() => handleDelete(service.id)}>
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

      {/* Add new service */}
      <div className="add-service-section">
        <h3>Add New Service</h3>
        <div className="add-service-form">
          <input
            type="text"
            placeholder="Service title"
            value={newService.title}
            onChange={(e) => setNewService({ ...newService, title: e.target.value })}
            className="input-field"
          />
          <textarea
            placeholder="Service description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            className="textarea-field"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={newService.phone}
            onChange={(e) => setNewService({ ...newService, phone: e.target.value })}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Display order"
            value={newService.order}
            onChange={(e) =>
              setNewService({
                ...newService,
                order: Number.parseInt(e.target.value),
              })
            }
            className="number-input"
          />
          <button className="btn-services-primary" onClick={handleAddService}>
            Add Service
          </button>
        </div>
      </div>
    </div>
  )
}

export default Servicescms
