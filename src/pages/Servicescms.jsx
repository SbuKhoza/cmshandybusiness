import React, { useEffect, useState } from "react";
import { db, storage, auth } from "../config";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Servicescms() {
  const [user, setUser] = useState(null);
  const [header, setHeader] = useState({ slogan: "", shortDescription: "" });
  const [services, setServices] = useState([]);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editServiceId, setEditServiceId] = useState(null);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    phone: "",
    order: 0,
  });

  // ✅ Watch auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub;
  }, []);

  // ✅ Fetch Firestore data
  useEffect(() => {
    if (!user) return;

    // Header doc
    const headerRef = doc(db, "users", user.uid, "servicesData", "header");

    const unsubHeader = onSnapshot(headerRef, async (snap) => {
      if (snap.exists()) {
        setHeader(snap.data());
      } else {
        // auto-create a blank header doc if it doesn’t exist
        await setDoc(headerRef, { slogan: "", shortDescription: "" });
        setHeader({ slogan: "", shortDescription: "" });
      }
    });

    // Services list
    const q = query(
      collection(db, "users", user.uid, "services"),
      orderBy("order", "asc")
    );
    const unsubServices = onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubHeader();
      unsubServices();
    };
  }, [user]);

  // ✅ Save or create header
  const handleSaveHeader = async () => {
    if (!user) return;
    try {
      const headerRef = doc(db, "users", user.uid, "servicesData", "header");
      await setDoc(headerRef, header, { merge: true });
      setEditingHeader(false);
      alert("✅ Header saved successfully!");
    } catch (err) {
      console.error("Error saving header:", err);
      alert("❌ Failed to save header.");
    }
  };

  // ✅ Save service edits
  const handleSaveService = async (id, data) => {
    if (!user) return;
    try {
      const serviceRef = doc(db, "users", user.uid, "services", id);
      await setDoc(serviceRef, data, { merge: true });
      setEditServiceId(null);
    } catch (err) {
      console.error("Error saving service:", err);
      alert("❌ Failed to save service.");
    }
  };

  // ✅ Add new service
  const handleAddService = async () => {
    if (!user || !newService.title) return alert("Enter a title first.");
    try {
      await addDoc(collection(db, "users", user.uid, "services"), newService);
      setNewService({ title: "", description: "", phone: "", order: 0 });
      alert("✅ Service added!");
    } catch (err) {
      console.error("Error adding service:", err);
      alert("❌ Could not add service.");
    }
  };

  // ✅ Delete service
  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "services", id));
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  // ✅ Upload service image
  const handleImageUpload = async (e, serviceId) => {
    if (!user) return;
    const file = e.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `services/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const serviceRef = doc(db, "users", user.uid, "services", serviceId);
      await setDoc(serviceRef, { image: url }, { merge: true });
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("❌ Image upload failed. Check your storage rules.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧩 Services CMS</h2>

      {/* Header section */}
      <div>
        <h3>Header</h3>
        {editingHeader ? (
          <div>
            <input
              type="text"
              placeholder="Slogan"
              value={header.slogan}
              onChange={(e) =>
                setHeader({ ...header, slogan: e.target.value })
              }
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
            <p><strong>Slogan:</strong> {header.slogan}</p>
            <p><strong>Short Description:</strong> {header.shortDescription}</p>
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
                      s.id === service.id ? { ...s, title: e.target.value } : s
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
                      s.id === service.id ? { ...s, phone: e.target.value } : s
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
                        ? { ...s, order: parseInt(e.target.value) }
                        : s
                    )
                  )
                }
              />
              <input
                type="file"
                onChange={(e) => handleImageUpload(e, service.id)}
              />
              <button onClick={() => handleSaveService(service.id, service)}>
                Save
              </button>
              <button onClick={() => setEditServiceId(null)}>Cancel</button>
            </div>
          ) : (
            <div>
              <p><strong>{service.title}</strong></p>
              <p>{service.description}</p>
              {service.image ? (
                <img
                  src={service.image}
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
            order: parseInt(e.target.value),
          })
        }
      />
      <button onClick={handleAddService}>Add Service</button>
    </div>
  );
}

export default Servicescms;
