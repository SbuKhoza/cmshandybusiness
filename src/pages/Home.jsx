// src/cms/Home.jsx
import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Home() {
  const [user, setUser] = useState(null);

  // Logo Management
  const [useImage, setUseImage] = useState(false);
  const [logoText, setLogoText] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [savedLogo, setSavedLogo] = useState(null);

  // Homepage Management
  const [homeData, setHomeData] = useState({
    bannerImage: "",
    rightImage: "",
    tagline: "",
    slogan: "",
    shortDescription: "",
    rightImageFit: "cover",
    taglineColor: "#222222",
    sloganColor: "#222222",
    shortDescriptionColor: "#444444",
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [rightFile, setRightFile] = useState(null);

  // Navbar colors
  const [navbarColors, setNavbarColors] = useState({
    background: "#rrggbb",
    name: "transparent",
    links: "#ffffff",
    logoText: "#ffffff",
  });

  const [loading, setLoading] = useState(false);

  // Rating users
  const [ratingUserEmail, setRatingUserEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // Named preset colors
  const presetColors = [
    { color: "#rrggbb", name: "Transparent" },
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

  // Auth + Load data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Load logo
        const logoRef = doc(db, "logos", currentUser.uid);
        const logoSnap = await getDoc(logoRef);
        if (logoSnap.exists()) setSavedLogo(logoSnap.data());

        // Load homepage
        const homepageRef = doc(db, "homepage", currentUser.uid);
        const homepageSnap = await getDoc(homepageRef);
        if (homepageSnap.exists()) {
          const data = homepageSnap.data();
          setHomeData({
            bannerImage: data.bannerImage || "",
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

        // Load navbar colors
        const navbarRef = doc(db, "navbarColors", currentUser.uid);
        const navbarSnap = await getDoc(navbarRef);
        if (navbarSnap.exists()) setNavbarColors(navbarSnap.data());
      } else {
        setSavedLogo(null);
        setHomeData({
          bannerImage: "",
          rightImage: "",
          tagline: "",
          slogan: "",
          shortDescription: "",
          rightImageFit: "cover",
          taglineColor: "#222222",
          sloganColor: "#222222",
          shortDescriptionColor: "#444444",
        });
        setNavbarColors({
          background: "#rrggbb",
          links: "#ffffff",
          logoText: "#ffffff",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Save logo
  const handleSaveLogo = async () => {
    if (!user) return alert("Please log in first.");
    setLoading(true);
    try {
      const logoRef = doc(db, "logos", user.uid);
      let logoData = {};
      if (useImage && logoFile) {
        const fileRef = ref(storage, `logos/${user.uid}/${logoFile.name}`);
        await uploadBytes(fileRef, logoFile);
        const imageUrl = await getDownloadURL(fileRef);
        logoData = { type: "image", url: imageUrl };
      } else if (!useImage && logoText.trim() !== "") {
        logoData = { type: "text", text: logoText };
      } else {
        alert("Please provide a logo text or image.");
        setLoading(false);
        return;
      }
      await setDoc(logoRef, logoData);
      setSavedLogo(logoData);
      alert("✅ Logo saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save logo.");
    } finally {
      setLoading(false);
    }
  };

  // Save homepage
  const handleSaveHome = async () => {
    if (!user) return alert("Please log in first.");
    setLoading(true);
    try {
      const homepageRef = doc(db, "homepage", user.uid);
      let updatedData = { ...homeData };

      if (bannerFile) {
        const bannerRef = ref(storage, `homepage/${user.uid}/banner.jpg`);
        await uploadBytes(bannerRef, bannerFile);
        updatedData.bannerImage = await getDownloadURL(bannerRef);
      }
      if (rightFile) {
        const rightRef = ref(storage, `homepage/${user.uid}/right.jpg`);
        await uploadBytes(rightRef, rightFile);
        updatedData.rightImage = await getDownloadURL(rightRef);
      }

      await setDoc(homepageRef, updatedData);
      alert("✅ Homepage content saved!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save homepage content.");
    } finally {
      setLoading(false);
    }
  };

  // Add rating user
  const handleAddUserForRating = async () => {
    if (!user) return alert("Please log in first.");
    if (!ratingUserEmail.trim()) return alert("Enter a user email.");
    setAddingUser(true);
    try {
      const ratingsCollection = collection(db, "users-rating");
      await addDoc(ratingsCollection, {
        email: ratingUserEmail.trim(),
        adminId: user.uid,
        createdAt: new Date(),
      });
      alert(`✅ ${ratingUserEmail} added to rating list.`);
      setRatingUserEmail("");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add user.");
    } finally {
      setAddingUser(false);
    }
  };

  // Color picker renderer with named colors
  const renderColorPicker = (label, field, state, setState) => (
    <div style={{ marginTop: "15px" }}>
      <label>{label}:</label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* Custom color picker */}
        <input
          type="color"
          value={state[field]}
          onChange={(e) => setState({ ...state, [field]: e.target.value })}
        />
        {/* Transparent option */}
        <div
          onClick={() => setState({ ...state, [field]: "#rrggbb" })}
          style={{
            width: "22px",
            height: "22px",
            backgroundColor: "#rrggbb",
            border: "1px solid #ccc",
            cursor: "pointer",
            borderRadius: "50%",
          }}
          title="Transparent"
        />
        {/* Preset colors with names */}
        {presetColors.map(({ color, name }) => (
          <div
            key={color}
            onClick={() => setState({ ...state, [field]: color })}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                backgroundColor: color,
                border: "1px solid #ccc",
                borderRadius: "50%",
              }}
            />
            <span style={{ fontSize: "12px" }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>CMS Dashboard</h2>

      {user ? (
        <>
          {/* Logo Management */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Logo Management</h3>
            <button onClick={() => setUseImage(!useImage)}>
              {useImage ? "Use Text Logo" : "Use Image Logo"}
            </button>
            {useImage ? (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0])}
                style={{ marginTop: "10px" }}
              />
            ) : (
              <input
                type="text"
                placeholder="Enter Logo Text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                style={{ marginTop: "10px" }}
              />
            )}
            <button onClick={handleSaveLogo} disabled={loading} style={{ marginTop: "10px" }}>
              {loading ? "Saving..." : "Save Logo"}
            </button>

            {savedLogo && (
              <div style={{ marginTop: "20px" }}>
                <h4>Saved Logo Preview:</h4>
                {savedLogo.type === "text" ? (
                  <h2>{savedLogo.text}</h2>
                ) : (
                  <img
                    src={savedLogo.url}
                    alt="Logo"
                    style={{ width: "120px", borderRadius: "8px", border: "1px solid #ccc" }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Homepage Management */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Homepage Management</h3>

            <label>Tagline</label>
            <input
              type="text"
              placeholder="e.g. Reliable 24/7"
              value={homeData.tagline}
              onChange={(e) => setHomeData({ ...homeData, tagline: e.target.value })}
            />
            {renderColorPicker("Tagline Color", "taglineColor", homeData, setHomeData)}

            <label style={{ marginTop: "10px" }}>Slogan</label>
            <input
              type="text"
              placeholder="e.g. The best plumber you need"
              value={homeData.slogan}
              onChange={(e) => setHomeData({ ...homeData, slogan: e.target.value })}
            />
            {renderColorPicker("Slogan Color", "sloganColor", homeData, setHomeData)}

            <label style={{ marginTop: "10px" }}>Short Description</label>
            <textarea
              placeholder="Enter a short description"
              value={homeData.shortDescription}
              onChange={(e) =>
                setHomeData({ ...homeData, shortDescription: e.target.value })
              }
            />
            {renderColorPicker(
              "Short Description Color",
              "shortDescriptionColor",
              homeData,
              setHomeData
            )}

            <div style={{ marginTop: "20px" }}>
              <label>Banner Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files[0])}
              />
              {homeData.bannerImage && (
                <img
                  src={homeData.bannerImage}
                  alt="Banner"
                  style={{
                    width: "200px",
                    marginTop: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              )}
            </div>

            <div style={{ marginTop: "20px" }}>
              <label>Right Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRightFile(e.target.files[0])}
              />
              {homeData.rightImage && (
                <img
                  src={homeData.rightImage}
                  alt="Right"
                  style={{
                    width: "200px",
                    marginTop: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    objectFit: homeData.rightImageFit || "cover",
                  }}
                />
              )}
              <div style={{ marginTop: "10px" }}>
                <label>Right Image Fit:</label>
                <select
                  value={homeData.rightImageFit || "cover"}
                  onChange={(e) =>
                    setHomeData({ ...homeData, rightImageFit: e.target.value })
                  }
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                  <option value="scale-down">Scale Down</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveHome}
              disabled={loading}
              style={{ marginTop: "20px" }}
            >
              {loading ? "Saving..." : "Save Homepage"}</button>
          </div>

          {/* Navbar Colors */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Navbar Colors</h3>
            {renderColorPicker("Background Color", "background", navbarColors, setNavbarColors)}
            {renderColorPicker("Link Color", "links", navbarColors, setNavbarColors)}
            {renderColorPicker("Logo Text Color", "logoText", navbarColors, setNavbarColors)}

            <button
              onClick={async () => {
                if (!user) return alert("Please log in first.");
                try {
                  const navbarRef = doc(db, "navbarColors", user.uid);
                  await setDoc(navbarRef, navbarColors);
                  alert("✅ Navbar colors saved!");
                } catch (err) {
                  console.error(err);
                  alert("❌ Failed to save navbar colors.");
                }
              }}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              Save Navbar Colors
            </button>
          </div>

          {/* User Rating Access */}
          <div>
            <h3>User Rating Access</h3>
            <p>Add users who can rate your service.</p>
            <input
              type="email"
              placeholder="Enter user email"
              value={ratingUserEmail}
              onChange={(e) => setRatingUserEmail(e.target.value)}
            />
            <button onClick={handleAddUserForRating} disabled={addingUser} style={{ marginTop: "10px" }}>
              {addingUser ? "Adding..." : "Add User to Rating List"}
            </button>
          </div>
        </>
      ) : (
        <p>Please log in to manage your CMS.</p>
      )}
    </div>
  );
}

export default Home;
