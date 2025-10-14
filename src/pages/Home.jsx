import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { db, storage } from "../config";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
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
  deleteDoc
} from "firebase/firestore";

function Home() {
  const { currentTenantId } = useSelector((state) => state.tenant);

  // ==========================
  // Logo Management
  // ==========================
  const [useImage, setUseImage] = useState(false);
  const [logoText, setLogoText] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [savedLogo, setSavedLogo] = useState(null);

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
  });
  const [bannerFiles, setBannerFiles] = useState([]);
  const [rightFile, setRightFile] = useState(null);

  // Navbar Colors
  const [navbarColors, setNavbarColors] = useState({
    background: "transparent",
    links: "#ffffff",
    logoText: "#ffffff",
  });

  // Loading state
  const [loading, setLoading] = useState(false);

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
  ];

  // ==========================
  // Allowed Reviewers
  // ==========================
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [allowedUsers, setAllowedUsers] = useState([]);

  useEffect(() => {
    if (!currentTenantId) return;
    const usersRef = collection(db, "tenants", currentTenantId, "users-rating");
    const q = query(usersRef, orderBy("email"));
    const unsub = onSnapshot(q, (snap) => {
      setAllowedUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentTenantId]);

  const handleAddAllowedEmail = async () => {
    if (!reviewerEmail.trim()) return alert("Enter an email.");
    try {
      const usersRef = collection(db, "tenants", currentTenantId, "users-rating");
      const q = query(usersRef, where("email", "==", reviewerEmail.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("Email already exists.");
        return;
      }
      await addDoc(usersRef, { email: reviewerEmail.trim(), addedAt: new Date() });
      setReviewerEmail("");
    } catch (err) {
      console.error(err);
      alert("Error adding email.");
    }
  };

  const handleRemoveEmail = async (id) => {
    if (!window.confirm("Remove this email?")) return;
    try {
      await deleteDoc(doc(db, "tenants", currentTenantId, "users-rating", id));
    } catch (err) {
      console.error(err);
      alert("Error removing email.");
    }
  };

  // ==========================
  // Load Tenant Data
  // ==========================
  useEffect(() => {
    if (!currentTenantId) return;

    const loadData = async () => {
      try {
        // Logo
        const logoRef = doc(db, "tenants", currentTenantId, "data", "logo");
        const logoSnap = await getDoc(logoRef);
        if (logoSnap.exists()) {
          setSavedLogo(logoSnap.data());
          if (logoSnap.data().type === "text") {
            setLogoText(logoSnap.data().text || "");
            setUseImage(false);
          } else {
            setUseImage(true);
          }
        }

        // Homepage
        const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage");
        const homepageSnap = await getDoc(homepageRef);
        if (homepageSnap.exists()) {
          const data = homepageSnap.data();
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
          });
        }

        // Navbar colors
        const navbarRef = doc(db, "tenants", currentTenantId, "data", "navbarColors");
        const navbarSnap = await getDoc(navbarRef);
        if (navbarSnap.exists()) setNavbarColors(navbarSnap.data());
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [currentTenantId]);

  // ==========================
  // Helpers for Colors
  // ==========================
  const hexToRgba = (hex, alpha = 1) => {
    if (hex === "transparent") return "transparent";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getAlphaFromColor = (color) => {
    if (!color || color === "transparent") return 0;
    const match = color.match(/rgba?\([\d\s,]+,\s*([\d.]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  };

  const getHexFromColor = (color) => {
    if (!color || color === "transparent") return "#000000";
    if (color.startsWith("#")) return color;
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, "0");
      const g = parseInt(match[2]).toString(16).padStart(2, "0");
      const b = parseInt(match[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
    return "#000000";
  };

  // ==========================
  // Save Handlers
  // ==========================
  const handleSaveLogo = async () => {
    if (!currentTenantId) return alert("No tenant selected.");
    setLoading(true);
    try {
      const logoRef = doc(db, "tenants", currentTenantId, "data", "logo");
      let logoData = {};
      if (useImage && logoFile) {
        const fileRef = ref(storage, `logos/${currentTenantId}/${logoFile.name}`);
        await uploadBytes(fileRef, logoFile);
        const imageUrl = await getDownloadURL(fileRef);
        logoData = { type: "image", url: imageUrl };
      } else if (!useImage && logoText.trim() !== "") {
        logoData = { type: "text", text: logoText };
      } else {
        alert("Provide a logo.");
        setLoading(false);
        return;
      }
      await setDoc(logoRef, logoData, { merge: true });
      setSavedLogo(logoData);
      alert("Logo saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save logo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHome = async () => {
    if (!currentTenantId) return alert("No tenant selected.");
    setLoading(true);
    try {
      const homepageRef = doc(db, "tenants", currentTenantId, "data", "homepage");
      const homepageSnap = await getDoc(homepageRef);
      const existingData = homepageSnap.exists() ? homepageSnap.data() : {};

      let updatedData = { ...existingData, ...homeData };

      // Upload banner images
      if (bannerFiles.length > 0) {
        const uploadedUrls = [];
        for (let i = 0; i < bannerFiles.length; i++) {
          const file = bannerFiles[i];
          const bannerRef = ref(storage, `homepage/${currentTenantId}/banner_${Date.now()}_${i}.jpg`);
          await uploadBytes(bannerRef, file);
          const url = await getDownloadURL(bannerRef);
          uploadedUrls.push(url);
        }
        updatedData.bannerImages = [...(existingData.bannerImages || []), ...uploadedUrls];
      }

      // Upload right image
      if (rightFile) {
        const rightRef = ref(storage, `homepage/${currentTenantId}/right.jpg`);
        await uploadBytes(rightRef, rightFile);
        updatedData.rightImage = await getDownloadURL(rightRef);
      }

      await setDoc(homepageRef, updatedData, { merge: true });
      alert("Homepage saved!");
      setBannerFiles([]);
      setRightFile(null);
      setHomeData(updatedData);
    } catch (err) {
      console.error(err);
      alert("Failed to save homepage.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNavbarColors = async () => {
    if (!currentTenantId) return alert("No tenant selected.");
    try {
      const navbarRef = doc(db, "tenants", currentTenantId, "data", "navbarColors");
      await setDoc(navbarRef, navbarColors, { merge: true });
      alert("Navbar colors saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save navbar colors.");
    }
  };

  const handleRemoveBannerImage = (index) => {
    setHomeData({
      ...homeData,
      bannerImages: homeData.bannerImages.filter((_, i) => i !== index),
    });
  };

  const renderColorPicker = (label, field, state, setState) => {
    const currentColor = state[field] || "#000000";
    const hexColor = getHexFromColor(currentColor);
    const alphaValue = getAlphaFromColor(currentColor);
    const updateColor = (hex, alpha) => {
      const newColor = alpha < 1 ? hexToRgba(hex, alpha) : hex;
      setState({ ...state, [field]: newColor });
    };

    return (
      <div style={{ marginTop: "15px" }}>
        <label>{label}:</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px", marginBottom: "8px" }}>
          <input type="color" value={hexColor} onChange={(e) => updateColor(e.target.value, alphaValue)} style={{ width: "50px", height: "35px", cursor: "pointer" }} />
          <input type="text" placeholder="#000000" value={currentColor} onChange={(e) => {
            const val = e.target.value;
            if (val.startsWith("#") || val.startsWith("rgb") || val === "transparent") setState({ ...state, [field]: val });
          }} style={{ padding: "6px 10px", width: "150px", border: "1px solid #ccc", borderRadius: "4px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "11px", margin: 0 }}>Opacity: {Math.round(alphaValue * 100)}%</label>
            <input type="range" min="0" max="100" value={Math.round(alphaValue * 100)} onChange={(e) => updateColor(hexColor, parseInt(e.target.value) / 100)} style={{ width: "120px", cursor: "pointer" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {presetColors.map(({ color, name }) => (
            <div key={color} onClick={() => setState({ ...state, [field]: color })} style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "4px" }}>
              <div style={{ width: "22px", height: "22px", backgroundColor: color, border: "1px solid #ccc", borderRadius: "50%" }} />
              <span style={{ fontSize: "12px" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentTenantId) return <div>Please select a tenant first.</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>CMS Dashboard</h2>

      {/* Logo Section */}
      <div style={{ marginBottom: "40px" }}>
        <h3>Logo Management</h3>
        <button onClick={() => setUseImage(!useImage)}>{useImage ? "Use Text Logo" : "Use Image Logo"}</button>
        {useImage ? (
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} style={{ marginTop: "10px" }} />
        ) : (
          <input type="text" placeholder="Enter Logo Text" value={logoText} onChange={(e) => setLogoText(e.target.value)} style={{ marginTop: "10px" }} />
        )}
        <button onClick={handleSaveLogo} disabled={loading} style={{ marginTop: "10px" }}>{loading ? "Saving..." : "Save Logo"}</button>

        {savedLogo && (
          <div style={{ marginTop: "20px" }}>
            <h4>Saved Logo Preview:</h4>
            {savedLogo.type === "text" ? <h2>{savedLogo.text}</h2> : <img src={savedLogo.url || "/placeholder.svg"} alt="Logo" style={{ width: "120px", borderRadius: "8px", border: "1px solid #ccc" }} />}
          </div>
        )}
      </div>

      {/* Homepage Section */}
      <div style={{ marginBottom: "40px" }}>
        <h3>Homepage Management</h3>

        <label>Tagline</label>
        <input type="text" value={homeData.tagline} onChange={(e) => setHomeData({ ...homeData, tagline: e.target.value })} />
        {renderColorPicker("Tagline Color", "taglineColor", homeData, setHomeData)}

        <label style={{ marginTop: "10px" }}>Slogan</label>
        <input type="text" value={homeData.slogan} onChange={(e) => setHomeData({ ...homeData, slogan: e.target.value })} />
        {renderColorPicker("Slogan Color", "sloganColor", homeData, setHomeData)}

        <label style={{ marginTop: "10px" }}>Short Description</label>
        <textarea value={homeData.shortDescription} onChange={(e) => setHomeData({ ...homeData, shortDescription: e.target.value })} />
        {renderColorPicker("Short Description Color", "shortDescriptionColor", homeData, setHomeData)}

        {/* Banner Images */}
        <div style={{ marginTop: "20px" }}>
          <label>Banner Images:</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setBannerFiles(Array.from(e.target.files))} />
          {homeData.bannerImages.length > 0 && (
            <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {homeData.bannerImages.map((img, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img src={img} alt={`Banner ${index}`} style={{ width: "150px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ccc" }} />
                  <button onClick={() => handleRemoveBannerImage(index)} style={{ position: "absolute", top: "5px", right: "5px", backgroundColor: "red", color: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer" }}>X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Image */}
        <div style={{ marginTop: "20px" }}>
          <label>Right Image:</label>
          <input type="file" accept="image/*" onChange={(e) => setRightFile(e.target.files[0])} />
          {homeData.rightImage && <img src={homeData.rightImage} alt="Right" style={{ width: "200px", marginTop: "10px", borderRadius: "8px", border: "1px solid #ccc", objectFit: homeData.rightImageFit || "cover" }} />}
          <div style={{ marginTop: "10px" }}>
            <label>Right Image Fit:</label>
            <select value={homeData.rightImageFit || "cover"} onChange={(e) => setHomeData({ ...homeData, rightImageFit: e.target.value })}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>
        </div>

        <button onClick={handleSaveHome} disabled={loading} style={{ marginTop: "20px" }}>{loading ? "Saving..." : "Save Homepage"}</button>
      </div>

      {/* Navbar Colors */}
      <div style={{ marginBottom: "40px" }}>
        <h3>Navbar Colors</h3>
        {renderColorPicker("Background Color", "background", navbarColors, setNavbarColors)}
        {renderColorPicker("Link Color", "links", navbarColors, setNavbarColors)}
        {renderColorPicker("Logo Text Color", "logoText", navbarColors, setNavbarColors)}
        <button onClick={handleSaveNavbarColors} disabled={loading} style={{ marginTop: "10px" }}>Save Navbar Colors</button>
      </div>

      {/* Allowed Reviewers Section */}
      <div style={{ marginBottom: "40px" }}>
        <h3>Allowed Reviewers</h3>
        <p>Manage who can post testimonials for your business.</p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input type="email" placeholder="Enter email" value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} />
          <button onClick={handleAddAllowedEmail}>Add Email</button>
        </div>

        {allowedUsers.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  <td>{user.addedAt?.toDate ? user.addedAt.toDate().toLocaleString() : user.addedAt?.toString()}</td>
                  <td>
                    <button onClick={() => handleRemoveEmail(user.id)} style={{ backgroundColor: "red", color: "white", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer" }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No allowed reviewers yet.</p>
        )}
      </div>
    </div>
  );
}

export default Home;
