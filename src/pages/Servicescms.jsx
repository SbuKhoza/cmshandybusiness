import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { db, storage, auth } from "../config"
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore"
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage"

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
    } catch (err) {
      console.error("Error saving service:", err)
      alert("Failed to save service.")
    }
  }

  const handleAddService = async () => {
    if (!currentTenantId || !newService.title)
      return alert("Enter a title first.")
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
    if (!currentTenantId) return
    try {
      await deleteDoc(doc(db, "tenants", currentTenantId, "services", id))
    } catch (err) {
      console.error("Error deleting service:", err)
    }
  }

  // ✅ FIXED: matches Firebase Storage rules
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
        }
      )
    } catch (err) {
      console.error("Image upload failed:", err)
      alert("Image upload failed. Check your storage rules.")
    }
  }

  if (!currentTenantId) {
    return <div>Please select a tenant first.</div>
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Services CMS</h2>

      {/* Header section */}
      <div>
        <h3>Header</h3>
        {editingHeader ? (
          <div>
            <input
              type="text"
              placeholder="Slogan"
              value={header.slogan}
              onChange={(e) => setHeader({ ...header, slogan: e.target.value })}
            />
            <textarea
              placeholder="Short description"
              value={header.shortDescription}
              onChange={(e) =>
                setHeader({ ...header, shortDescription: e.target.value })
              }
            />
            <button onClick={handleSaveHeader}>Save</button>
            <button onClick={() => setEditingHeader(false)}>Cancel</button>
          </div>
        ) : (
          <div>
            <p>
              <strong>Slogan:</strong> {header.slogan}
            </p>
            <p>
              <strong>Short Description:</strong> {header.shortDescription}
            </p>
            <button onClick={() => setEditingHeader(true)}>Edit</button>
          </div>
        )}
      </div>

      <hr />

      {/* Services list */}
      <h3>Services</h3>
      {services.map((service) => (
        <div
          key={service.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          {editServiceId === service.id ? (
            <div>
              <input
                type="text"
                value={service.title}
                onChange={(e) =>
                  setServices((prev) =>
                    prev.map((s) =>
                      s.id === service.id
                        ? { ...s, title: e.target.value }
                        : s
                    )
                  )
                }
              />
              <textarea
                value={service.description}
                onChange={(e) =>
                  setServices((prev) =>
                    prev.map((s) =>
                      s.id === service.id
                        ? { ...s, description: e.target.value }
                        : s
                    )
                  )
                }
              />
              <input
                type="text"
                placeholder="Phone"
                value={service.phone || ""}
                onChange={(e) =>
                  setServices((prev) =>
                    prev.map((s) =>
                      s.id === service.id
                        ? { ...s, phone: e.target.value }
                        : s
                    )
                  )
                }
              />
              <input
                type="number"
                placeholder="Order"
                value={service.order || 0}
                onChange={(e) =>
                  setServices((prev) =>
                    prev.map((s) =>
                      s.id === service.id
                        ? { ...s, order: Number.parseInt(e.target.value) }
                        : s
                    )
                  )
                }
              />
              <input
                type="file"
                onChange={(e) => handleImageUpload(e, service.id)}
              />
              {uploadProgress[service.id] && (
                <p>Uploading: {uploadProgress[service.id]}%</p>
              )}
              <button onClick={() => handleSaveService(service.id, service)}>
                Save
              </button>
              <button onClick={() => setEditServiceId(null)}>Cancel</button>
            </div>
          ) : (
            <div>
              <p>
                <strong>{service.title}</strong>
              </p>
              <p>{service.description}</p>
              {service.image ? (
                <img
                  src={service.image || "/placeholder.svg"}
                  alt="service"
                  style={{
                    width: "120px",
                    height: "auto",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <p>No image</p>
              )}
              <p>Phone: {service.phone || "N/A"}</p>
              <p>Order: {service.order || 0}</p>
              <button onClick={() => setEditServiceId(service.id)}>Edit</button>
              <button onClick={() => handleDelete(service.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}

      <hr />

      {/* Add new service */}
      <h3>Add New Service</h3>
      <input
        type="text"
        placeholder="Service title"
        value={newService.title}
        onChange={(e) =>
          setNewService({ ...newService, title: e.target.value })
        }
      />
      <textarea
        placeholder="Service description"
        value={newService.description}
        onChange={(e) =>
          setNewService({ ...newService, description: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Phone number"
        value={newService.phone}
        onChange={(e) =>
          setNewService({ ...newService, phone: e.target.value })
        }
      />
      <input
        type="number"
        placeholder="Order"
        value={newService.order}
        onChange={(e) =>
          setNewService({
            ...newService,
            order: Number.parseInt(e.target.value),
          })
        }
      />
      <button onClick={handleAddService}>Add Service</button>
    </div>
  )
}

export default Servicescms
