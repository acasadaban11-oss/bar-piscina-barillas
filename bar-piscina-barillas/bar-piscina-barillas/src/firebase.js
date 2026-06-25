import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyb_xcPryOz0XszsElg8NHqbqr8TIVBY4",
  authDomain: "bar-piscina-barillas.firebaseapp.com",
  projectId: "bar-piscina-barillas",
  storageBucket: "bar-piscina-barillas.firebasestorage.app",
  messagingSenderId: "235514156915",
  appId: "1:235514156915:web:041de9d27c48aa27ee1706"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(() => {});
