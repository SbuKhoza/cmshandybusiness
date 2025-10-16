"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { db } from "../config"
import { doc, collection, query, orderBy, onSnapshot, setDoc, deleteDoc } from "firebase/firestore"
import "./NewsLetterCMS.css"

function NewsLetterCMS() {
  const { currentTenantId } = useSelector((state) => state.tenant)

  const [settings, setSettings] = useState({
    title: "",
    description: "",
    buttonText: "",
    bgColor: "#667eea",
    textColor: "#ffffff",
    buttonBgColor: "#ffffff",
    buttonTextColor: "#667eea",
    enabled: true,
  })
  const [subscribers, setSubscribers] = useState([])
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!currentTenantId) return

    // Newsletter settings
    const settingsRef = doc(db, "tenants", currentTenantId, "data", "newsletterSettings")
    const unsubSettings = onSnapshot(settingsRef, async (snap) => {
      if (snap.exists()) {
        setSettings(snap.data())
      } else {
        const defaultSettings = {
          title: "Subscribe to Our Newsletter",
          description: "Get the latest updates and news delivered to your inbox.",
          buttonText: "Subscribe",
          bgColor: "#667eea",
          textColor: "#ffffff",
          buttonBgColor: "#ffffff",
          buttonTextColor: "#667eea",
          enabled: true,
        }
        await setDoc(settingsRef, defaultSettings)
        setSettings(defaultSettings)
      }
    })

    // Subscribers list
    const subscribersRef = collection(db, "tenants", currentTenantId, "newsletterSubscribers")
    const q = query(subscribersRef, orderBy("subscribedAt", "desc"))
    const unsubSubscribers = onSnapshot(q, (snap) => {
      setSubscribers(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      )
    })

    return () => {
      unsubSettings()
      unsubSubscribers()
    }
  }, [currentTenantId])

  const handleSaveSettings = async () => {
    if (!currentTenantId) return
    try {
      const settingsRef = doc(db, "tenants", currentTenantId, "data", "newsletterSettings")
      await setDoc(settingsRef, settings, { merge: true })
      setEditing(false)
      alert("Newsletter settings saved successfully!")
    } catch (err) {
      console.error("Error saving settings:", err)
      alert("Failed to save settings.")
    }
  }

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm("Delete this subscriber?")) return
    if (!currentTenantId) return
    try {
      await deleteDoc(doc(db, "tenants", currentTenantId, "newsletterSubscribers", id))
      alert("Subscriber deleted!")
    } catch (err) {
      console.error("Error deleting subscriber:", err)
      alert("Failed to delete subscriber.")
    }
  }

  const exportSubscribers = () => {
    const csv = [
      ["Email", "Subscribed At"],
      ...subscribers.map((sub) => [
        sub.email,
        sub.subscribedAt ? new Date(sub.subscribedAt.toDate()).toLocaleString() : "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!currentTenantId) {
    return <div className="no-tenant-message">Please select a tenant first.</div>
  }

  return (
    <div className="newsletter-cms-container">
      <h2>Newsletter CMS</h2>

      {/* Settings Section */}
      <div className="cms-section">
        <h3>Newsletter Settings</h3>
        {editing ? (
          <div className="edit-form">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="toggle-checkbox"
              />
              <span>Enable Newsletter Subscription</span>
            </label>

            <input
              type="text"
              placeholder="Title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="textarea-field"
              rows="3"
            />
            <input
              type="text"
              placeholder="Button Text"
              value={settings.buttonText}
              onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
              className="input-field"
            />

            <div className="color-controls">
              <div className="color-control-group">
                <label>Background Color:</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.bgColor || "#667eea"}
                    onChange={(e) => setSettings({ ...settings, bgColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.bgColor || "#667eea"}
                    onChange={(e) => setSettings({ ...settings, bgColor: e.target.value })}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-control-group">
                <label>Text Color:</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.textColor || "#ffffff"}
                    onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.textColor || "#ffffff"}
                    onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-control-group">
                <label>Button Background Color:</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.buttonBgColor || "#ffffff"}
                    onChange={(e) => setSettings({ ...settings, buttonBgColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.buttonBgColor || "#ffffff"}
                    onChange={(e) => setSettings({ ...settings, buttonBgColor: e.target.value })}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-control-group">
                <label>Button Text Color:</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.buttonTextColor || "#667eea"}
                    onChange={(e) => setSettings({ ...settings, buttonTextColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.buttonTextColor || "#667eea"}
                    onChange={(e) => setSettings({ ...settings, buttonTextColor: e.target.value })}
                    className="color-text-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-newsletter-primary" onClick={handleSaveSettings}>
                Save Settings
              </button>
              <button className="btn-newsletter-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="display-view">
            <p>
              <strong>Status:</strong>{" "}
              <span className={settings.enabled ? "status-enabled" : "status-disabled"}>
                {settings.enabled ? "Enabled ✓" : "Disabled ✗"}
              </span>
            </p>
            <p>
              <strong>Title:</strong> {settings.title || "Not set"}
            </p>
            <p>
              <strong>Description:</strong> {settings.description || "Not set"}
            </p>
            <p>
              <strong>Button Text:</strong> {settings.buttonText || "Not set"}
            </p>

            <div className="preview-section">
              <h4>Preview:</h4>
              <div
                className="newsletter-preview"
                style={{
                  backgroundColor: settings.bgColor,
                  color: settings.textColor,
                }}
              >
                <h3>{settings.title}</h3>
                <p>{settings.description}</p>
                <button
                  style={{
                    backgroundColor: settings.buttonBgColor,
                    color: settings.buttonTextColor,
                  }}
                >
                  {settings.buttonText}
                </button>
              </div>
            </div>

            <button className="btn-newsletter-primary" onClick={() => setEditing(true)}>
              Edit Settings
            </button>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Subscribers Section */}
      <div className="subscribers-section">
        <div className="subscribers-header">
          <h3>Subscribers ({subscribers.length})</h3>
          {subscribers.length > 0 && (
            <button className="btn-newsletter-export" onClick={exportSubscribers}>
              Export CSV
            </button>
          )}
        </div>

        {subscribers.length > 0 ? (
          <div className="subscribers-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>{subscriber.email}</td>
                    <td>
                      {subscriber.subscribedAt
                        ? new Date(subscriber.subscribedAt.toDate()).toLocaleString()
                        : "N/A"}
                    </td>
                    <td>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleDeleteSubscriber(subscriber.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-subscribers">No subscribers yet.</p>
        )}
      </div>
    </div>
  )
}

export default NewsLetterCMS