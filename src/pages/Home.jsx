import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Home() {
  // 🔹 Logo state
  const [user, setUser] = useState(null);
  const [useImage, setUseImage] = useState(false);
  const [logoText, setLogoText] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [savedLogo, setSavedLogo] = useState(null);

  // 🔹 Homepage state
  const [homeData, setHomeData] = useState({
    bannerImage: "",
    rightImage: "",
    tagline: "",
    slogan: "",
    shortDescription: "",
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [rightFile, setRightFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Rating management state
  const [ratingUserEmail, setRatingUserEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // 🔸 Watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Load logo
        const logoRef = doc(db, "logos", currentUser.uid);
        const logoSnap = await getDoc(logoRef);
        if (logoSnap.exists()) {
          setSavedLogo(logoSnap.data());
        } else {
          setSavedLogo(null);
        }

        // Load homepage
        const homepageRef = doc(db, "homepage", currentUser.uid);
        const homepageSnap = await getDoc(homepageRef);
        if (homepageSnap.exists()) {
          setHomeData(homepageSnap.data());
        }
      } else {
        setSavedLogo(null);
        setHomeData({
          bannerImage: "",
          rightImage: "",
          tagline: "",
          slogan: "",
          shortDescription: "",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔸 Save logo
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
    } catch (error) {
      console.error("Error saving logo:", error);
      alert("❌ Failed to save logo. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔸 Save homepage content
  const handleSaveHome = async () => {
    if (!user) return alert("Please log in first.");
    setLoading(true);

    try {
      const homepageRef = doc(db, "homepage", user.uid);
      let updatedData = { ...homeData };

      // Upload banner image if selected
      if (bannerFile) {
        const bannerRef = ref(storage, `homepage/${user.uid}/banner.jpg`);
        await uploadBytes(bannerRef, bannerFile);
        const bannerURL = await getDownloadURL(bannerRef);
        updatedData.bannerImage = bannerURL;
      }

      // Upload right image if selected
      if (rightFile) {
        const rightRef = ref(storage, `homepage/${user.uid}/right.jpg`);
        await uploadBytes(rightRef, rightFile);
        const rightURL = await getDownloadURL(rightRef);
        updatedData.rightImage = rightURL;
      }

      await setDoc(homepageRef, updatedData);
      alert("✅ Homepage content saved successfully!");
    } catch (error) {
      console.error("Error saving homepage:", error);
      alert("❌ Failed to save homepage content.");
    } finally {
      setLoading(false);
    }
  };

  // 🔸 Add user to rating collection
  // 🔸 Add user to rating collection
const handleAddUserForRating = async () => {
  if (!user) return alert("Please log in first.");
  if (!ratingUserEmail.trim()) return alert("Please enter a user email.");
  setAddingUser(true);

  try {
    // Ensure 'users-rating' collection exists
    const ratingsCollection = collection(db, "users-rating");

    // Create document with adminId tied to current logged-in admin
    await addDoc(ratingsCollection, {
      email: ratingUserEmail.trim(),
      adminId: user.uid, // must match Firestore rules
      createdAt: new Date(),
    });

    alert(`✅ ${ratingUserEmail} added and can now rate your service.`);
    setRatingUserEmail("");
  } catch (error) {
    console.error("Error adding user for rating:", error);
    alert("❌ Failed to add user. Try again.");
  } finally {
    setAddingUser(false);
  }
};


  return (
    <div style={{ padding: "20px" }}>
      <h2>CMS Dashboard</h2>

      {user ? (
        <>
          {/* ==========================
              LOGO MANAGEMENT SECTION
          =========================== */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Logo Management</h3>

            <button onClick={() => setUseImage(!useImage)}>
              {useImage ? "Use Text Logo" : "Use Image Logo"}
            </button>

            {useImage ? (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="text"
                  placeholder="Enter Logo Text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                />
              </div>
            )}

            <div style={{ marginTop: "10px" }}>
              <button onClick={handleSaveLogo} disabled={loading}>
                {loading ? "Saving..." : "Save Logo"}
              </button>
            </div>

            {savedLogo && (
              <div style={{ marginTop: "20px" }}>
                <h4>Saved Logo Preview:</h4>
                {savedLogo.type === "text" ? (
                  <h2>{savedLogo.text}</h2>
                ) : (
                  <img
                    src={savedLogo.url}
                    alt="Logo"
                    style={{
                      width: "120px",
                      height: "auto",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* ==========================
              HOMEPAGE MANAGEMENT SECTION
          =========================== */}
          <div style={{ marginBottom: "40px" }}>
            <h3>Homepage Management</h3>

            <div style={{ marginTop: "10px" }}>
              <label>Tagline</label>
              <input
                type="text"
                placeholder="e.g. Reliable 24/7"
                value={homeData.tagline}
                onChange={(e) =>
                  setHomeData({ ...homeData, tagline: e.target.value })
                }
              />
            </div>

            <div style={{ marginTop: "10px" }}>
              <label>Slogan</label>
              <input
                type="text"
                placeholder="e.g. The best plumber you need"
                value={homeData.slogan}
                onChange={(e) =>
                  setHomeData({ ...homeData, slogan: e.target.value })
                }
              />
            </div>

            <div style={{ marginTop: "10px" }}>
              <label>Short Description</label>
              <textarea
                placeholder="Enter a short company description"
                value={homeData.shortDescription}
                onChange={(e) =>
                  setHomeData({
                    ...homeData,
                    shortDescription: e.target.value,
                  })
                }
              />
            </div>

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
                  }}
                />
              )}
            </div>

            <div style={{ marginTop: "20px" }}>
              <button onClick={handleSaveHome} disabled={loading}>
                {loading ? "Saving..." : "Save Homepage"}
              </button>
            </div>
          </div>

          {/* ==========================
              RATING MANAGEMENT SECTION
          =========================== */}
          <div>
            <h3>User Rating Access</h3>
            <p>Add users who are allowed to rate your service.</p>

            <div style={{ marginTop: "10px" }}>
              <input
                type="email"
                placeholder="Enter user email"
                value={ratingUserEmail}
                onChange={(e) => setRatingUserEmail(e.target.value)}
              />
            </div>

            <div style={{ marginTop: "10px" }}>
              <button onClick={handleAddUserForRating} disabled={addingUser}>
                {addingUser ? "Adding..." : "Add User to Rating List"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <p>Please log in to manage your CMS.</p>
      )}
    </div>
  );
}

export default Home;
