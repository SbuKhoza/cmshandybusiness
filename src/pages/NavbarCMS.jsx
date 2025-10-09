// src/components/cms/NavbarCMS.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../config";
import { doc, getDoc, setDoc } from "firebase/firestore";

function NavbarCMS() {
  const [form, setForm] = useState({
    backgroundColor: "#ffffff",
    linkColor: "#000000",
    logoTextColor: "#000000",
  });

  useEffect(() => {
    const loadNavbarStyle = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid, "navbarData", "style");
      const snap = await getDoc(ref);
      if (snap.exists()) setForm(snap.data());
    };
    loadNavbarStyle();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid, "navbarData", "style");
    await setDoc(ref, form, { merge: true });
    alert("Navbar style updated!");
  };

  return (
    <div className="navbar-cms">
      <h2>Navbar Settings</h2>
      <label>Background Color:</label>
      <input type="color" name="backgroundColor" value={form.backgroundColor} onChange={handleChange} />

      <label>Link Color:</label>
      <input type="color" name="linkColor" value={form.linkColor} onChange={handleChange} />

      <label>Logo Text Color:</label>
      <input type="color" name="logoTextColor" value={form.logoTextColor} onChange={handleChange} />

      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export default NavbarCMS;
