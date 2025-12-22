
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAE8l9WWXVBZbGr4pzP_5hugjAEBLQa-Y8",
  authDomain: "my-chat-app-e0692.firebaseapp.com",
  projectId: "my-chat-app-e0692",
  storageBucket: "my-chat-app-e0692.firebasestorage.app",
  messagingSenderId: "924810199092",
  appId: "1:924810199092:web:7a68cf1f07be75fcc28a61",
  measurementId: "G-S91MSGQ3KJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);