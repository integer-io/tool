import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjo9Vf0I5eikpVfzm3tjP4qL8AGfXqZS0",
  authDomain: "int-io.firebaseapp.com",
  projectId: "int-io",
  storageBucket: "int-io.firebasestorage.app",
  messagingSenderId: "597364737379",
  appId: "1:597364737379:web:b3c445d761c80d93faff56",
  measurementId: "G-M31R8MHQBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;