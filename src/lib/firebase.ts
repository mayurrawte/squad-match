import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // These would normally come from environment variables
  // For demo purposes, using placeholder values
  apiKey: "demo-api-key",
  authDomain: "squadmatch-demo.firebaseapp.com",
  projectId: "squadmatch-demo",
  storageBucket: "squadmatch-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;