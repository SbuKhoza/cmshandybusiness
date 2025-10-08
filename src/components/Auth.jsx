// src/components/Auth.jsx
import React, { useState } from "react";
import { auth } from "../config";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Login successful!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Please enter your email to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>
        {resetMode ? "Reset Password" : "Sign In"}
      </h2>

      <form onSubmit={resetMode ? handlePasswordReset : handleLogin}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          required
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        {!resetMode && (
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
              style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {resetMode ? "Send Reset Link" : "Login"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={() => setResetMode(!resetMode)}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {resetMode ? "Back to Login" : "Forgot Password?"}
        </button>
      </div>

      {message && (
        <p style={{ marginTop: "15px", textAlign: "center", color: "#555" }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Auth;
