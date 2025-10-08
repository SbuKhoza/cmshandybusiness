// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAvrTy7m6OYqTkFD2ezu-gHXSCmrRNWqoI",
  authDomain: "business001-d42d8.firebaseapp.com",
  projectId: "business001-d42d8",
  storageBucket: "business001-d42d8.firebasestorage.app",
  messagingSenderId: "801149423209",
  appId: "1:801149423209:web:332a93c004c1585be55cf8",
  measurementId: "G-DP5N7TBDPF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);