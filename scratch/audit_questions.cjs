const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function auditQuestions() {
  console.log("Checking for questions with missing options...");
  const snap = await getDocs(collection(db, "questions"));
  let badCount = 0;
  snap.forEach(d => {
    const q = d.data();
    if (!q.options || q.options.length === 0 || q.options.every(o => !o || o.trim() === "")) {
      console.log(`Bad Question [${d.id}]: ${q.question?.slice(0, 50)}...`);
      badCount++;
    }
  });
  console.log(`Audit complete. Found ${badCount} problematic questions out of ${snap.size}.`);
}

auditQuestions();
