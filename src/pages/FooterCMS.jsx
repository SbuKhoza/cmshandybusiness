import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { db } from "../config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "./FooterCMS.css";

function FooterCMS() {
  const { currentTenantId } = useSelector((state) => state.tenant);
  const [loading, setLoading] = useState(false);

  const [footerData, setFooterData] = useState({
    // Company Section
    companyName: "Your Company",
    companyDescription: "Your business description goes here.",

    // Quick Links
    quickLinks: [
      { text: "Home", url: "/" },
      { text: "About", url: "/about" },
      { text: "Contact", url: "/contact" },
    ],

    // Contact Info
    address: "Your Address Here",
    email: "info@yourcompany.com",
    phone: "+27 00 000 0000",

    // Social Media
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",

    // Bottom Section
    copyrightText: "© 2025 Your Company. All rights reserved.",
    privacyPolicyUrl: "/privacy",
    termsOfServiceUrl: "/terms",

    // Colors
    backgroundColor: "#2b2d42",
    textColor: "#e0e0e0",
    headingColor: "#ffffff",
    linkColor: "#a0a0a0",
    linkHoverColor: "#f4b400",
    accentColor: "#4361ee",
    bottomBarBgColor: "#1a1b2e",
  });

  // Preset colors
  const presetColors = [
    { color: "#2b2d42", name: "Dark Blue" },
    { color: "#000000", name: "Black" },
    { color: "#1a1a1a", name: "Dark Gray" },
    { color: "#212529", name: "Charcoal" },
    { color: "#1e3a8a", name: "Navy" },
    { color: "#1f2937", name: "Slate" },
    { color: "#4a5568", name: "Gray" },
    { color: "#ffffff", name: "White" },
  ];

  useEffect(() => {
    if (!currentTenantId) return;

    const loadFooterData = async () => {
      try {
        const footerRef = doc(db, "tenants", currentTenantId, "data", "footer");
        const footerSnap = await getDoc(footerRef);

        if (footerSnap.exists()) {
          setFooterData({ ...footerData, ...footerSnap.data() });
        }
      } catch (err) {
        console.error("Error loading footer data:", err);
      }
    };

    loadFooterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenantId]);

  const handleSaveFooter = async () => {
    if (!currentTenantId) return alert("No tenant selected.");
    setLoading(true);

    try {
      const footerRef = doc(db, "tenants", currentTenantId, "data", "footer");
      await setDoc(footerRef, footerData, { merge: true });
      alert("Footer settings saved successfully!");
    } catch (err) {
      console.error("Error saving footer:", err);
      alert("Failed to save footer settings.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Links handlers
  const handleAddQuickLink = () => {
    setFooterData({
      ...footerData,
      quickLinks: [...footerData.quickLinks, { text: "New Link", url: "/" }],
    });
  };

  const handleRemoveQuickLink = (index) => {
    const updated = footerData.quickLinks.filter((_, i) => i !== index);
    setFooterData({ ...footerData, quickLinks: updated });
  };

  const handleUpdateQuickLink = (index, field, value) => {
    const updated = [...footerData.quickLinks];
    updated[index][field] = value;
    setFooterData({ ...footerData, quickLinks: updated });
  };

  const renderColorPicker = (label, field) => {
    return (
      <div className="ft-footer-color-picker">
        <label className="ft-footer-label">{label}:</label>
        <div className="ft-color-picker-row">
          <input
            type="color"
            value={footerData[field]}
            onChange={(e) =>
              setFooterData({ ...footerData, [field]: e.target.value })
            }
            className="ft-color-input-small"
          />
          <input
            type="text"
            value={footerData[field]}
            onChange={(e) =>
              setFooterData({ ...footerData, [field]: e.target.value })
            }
            className="ft-color-text-input-small"
          />
        </div>
        <div className="ft-preset-colors-small">
          {presetColors.map(({ color, name }) => (
            <div
              key={color}
              onClick={() =>
                setFooterData({ ...footerData, [field]: color })
              }
              className="ft-preset-color-small"
              title={name}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!currentTenantId) {
    return <div className="ft-no-tenant-message">Please select a tenant first.</div>;
  }

  return (
    <div className="ft-footer-cms-container">
      <h2>Footer Management</h2>

      {/* Company Section */}
      <div className="ft-cms-section">
        <h3>Company Information</h3>

        <label className="ft-footer-label">Company Name</label>
        <input
          type="text"
          value={footerData.companyName}
          onChange={(e) =>
            setFooterData({ ...footerData, companyName: e.target.value })
          }
          className="ft-footer-input"
        />

        <label className="ft-footer-label">Company Description</label>
        <textarea
          value={footerData.companyDescription}
          onChange={(e) =>
            setFooterData({
              ...footerData,
              companyDescription: e.target.value,
            })
          }
          className="ft-footer-textarea"
          rows="3"
        />
      </div>

      {/* Quick Links */}
      <div className="ft-cms-section">
        <h3>Quick Links</h3>
        {footerData.quickLinks.map((link, index) => (
          <div key={index} className="ft-link-item">
            <input
              type="text"
              placeholder="Link Text"
              value={link.text}
              onChange={(e) =>
                handleUpdateQuickLink(index, "text", e.target.value)
              }
              className="ft-footer-input-inline"
            />
            <input
              type="text"
              placeholder="URL"
              value={link.url}
              onChange={(e) =>
                handleUpdateQuickLink(index, "url", e.target.value)
              }
              className="ft-footer-input-inline"
            />
            <button
              className="ft-btn-danger-small"
              onClick={() => handleRemoveQuickLink(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button className="ft-btn-secondary1" onClick={handleAddQuickLink}>
          + Add Quick Link
        </button>
      </div>

      {/* Contact Information */}
      <div className="ft-cms-section">
        <h3>Contact Information</h3>

        <label className="ft-footer-label">Address</label>
        <input
          type="text"
          value={footerData.address}
          onChange={(e) =>
            setFooterData({ ...footerData, address: e.target.value })
          }
          className="ft-footer-input"
        />

        <label className="ft-footer-label">Email</label>
        <input
          type="email"
          value={footerData.email}
          onChange={(e) =>
            setFooterData({ ...footerData, email: e.target.value })
          }
          className="ft-footer-input"
        />

        <label className="ft-footer-label">Phone</label>
        <input
          type="text"
          value={footerData.phone}
          onChange={(e) =>
            setFooterData({ ...footerData, phone: e.target.value })
          }
          className="ft-footer-input"
        />
      </div>

      {/* Social Media */}
      <div className="ft-cms-section">
        <h3>Social Media Links</h3>

        <label className="ft-footer-label">Facebook URL</label>
        <input
          type="url"
          value={footerData.facebook}
          onChange={(e) =>
            setFooterData({ ...footerData, facebook: e.target.value })
          }
          className="ft-footer-input"
          placeholder="https://facebook.com/yourpage"
        />

        <label className="ft-footer-label">Twitter URL</label>
        <input
          type="url"
          value={footerData.twitter}
          onChange={(e) =>
            setFooterData({ ...footerData, twitter: e.target.value })
          }
          className="ft-footer-input"
          placeholder="https://twitter.com/yourhandle"
        />

        <label className="ft-footer-label">LinkedIn URL</label>
        <input
          type="url"
          value={footerData.linkedin}
          onChange={(e) =>
            setFooterData({ ...footerData, linkedin: e.target.value })
          }
          className="ft-footer-input"
          placeholder="https://linkedin.com/company/yourcompany"
        />

        <label className="ft-footer-label">Instagram URL</label>
        <input
          type="url"
          value={footerData.instagram}
          onChange={(e) =>
            setFooterData({ ...footerData, instagram: e.target.value })
          }
          className="ft-footer-input"
          placeholder="https://instagram.com/yourhandle"
        />
      </div>

      {/* Bottom Section */}
      <div className="ft-cms-section">
        <h3>Bottom Section</h3>

        <label className="ft-footer-label">Copyright Text</label>
        <input
          type="text"
          value={footerData.copyrightText}
          onChange={(e) =>
            setFooterData({ ...footerData, copyrightText: e.target.value })
          }
          className="ft-footer-input"
        />

        <label className="ft-footer-label">Privacy Policy URL</label>
        <input
          type="text"
          value={footerData.privacyPolicyUrl}
          onChange={(e) =>
            setFooterData({
              ...footerData,
              privacyPolicyUrl: e.target.value,
            })
          }
          className="ft-footer-input"
        />

        <label className="ft-footer-label">Terms of Service URL</label>
        <input
          type="text"
          value={footerData.termsOfServiceUrl}
          onChange={(e) =>
            setFooterData({
              ...footerData,
              termsOfServiceUrl: e.target.value,
            })
          }
          className="ft-footer-input"
        />
      </div>

      {/* Color Settings */}
      <div className="ft-cms-section">
        <h3>Footer Colors</h3>
        <div className="ft-color-grid">
          {renderColorPicker("Background Color", "backgroundColor")}
          {renderColorPicker("Text Color", "textColor")}
          {renderColorPicker("Heading Color", "headingColor")}
          {renderColorPicker("Link Color", "linkColor")}
          {renderColorPicker("Link Hover Color", "linkHoverColor")}
          {renderColorPicker("Accent Color", "accentColor")}
          {renderColorPicker("Bottom Bar Background", "bottomBarBgColor")}
        </div>
      </div>

      {/* Footer Preview */}
      <div className="ft-cms-section">
        <h3>Footer Preview</h3>
        <div
          className="ft-footer-preview"
          style={{
            backgroundColor: footerData.backgroundColor,
            color: footerData.textColor,
          }}
        >
          <div className="ft-preview-content">
            <div className="ft-preview-column">
              <h4 style={{ color: footerData.headingColor }}>
                {footerData.companyName}
              </h4>
              <p>{footerData.companyDescription}</p>
            </div>
            <div className="ft-preview-column">
              <h4 style={{ color: footerData.headingColor }}>Quick Links</h4>
              {footerData.quickLinks.slice(0, 3).map((link, i) => (
                <p key={i} style={{ color: footerData.linkColor }}>
                  {link.text}
                </p>
              ))}
            </div>
          </div>
          <div
            className="ft-preview-bottom"
            style={{ backgroundColor: footerData.bottomBarBgColor }}
          >
            <p>{footerData.copyrightText}</p>
          </div>
        </div>
      </div>

      <button
        className="ft-btn-primary1"
        onClick={handleSaveFooter}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Footer Settings"}
      </button>
    </div>
  );
}

export default FooterCMS;
