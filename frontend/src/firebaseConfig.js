// ✅ src/firebaseConfig.js

// Import the Firebase SDK modules you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyB5koj8scMrv1v_hyl3wPLKouuZI3dWA6g",
  authDomain: "network-intrusion-detect-ce914.firebaseapp.com",
  projectId: "network-intrusion-detect-ce914",
  storageBucket: "network-intrusion-detect-ce914.firebasestorage.app",
  messagingSenderId: "1078562682443",
  appId: "1:1078562682443:web:80869f04cbdce16616bfce",
};

// ✅ Initialize the Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth & Firestore
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence); // keeps login after refresh

const db = getFirestore(app);

// ✅ Export them
export { app, auth, db };


