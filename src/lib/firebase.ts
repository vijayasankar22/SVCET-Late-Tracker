// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-4945559493-d87d9",
  "appId": "1:66365982133:web:4b825f318b3824e2de85fc",
  "apiKey": "AIzaSyAuDatRosbjgW383GgNW_wk6643kQMQJxc",
  "authDomain": "studio-4945559493-d87d9.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "66365982133"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
