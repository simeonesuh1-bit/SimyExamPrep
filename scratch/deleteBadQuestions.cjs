const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function deleteBadQuestions() {
  console.log("Starting deletion of invalid questions (missing options)...");
  const snap = await getDocs(collection(db, "questions"));
  let count = 0;
  
  const promises = [];
  snap.forEach(d => {
    const q = d.data();
    if (!q.options || q.options.length === 0 || q.options.every(o => !o || String(o).trim() === "")) {
      console.log(`Deleting ID: ${d.id}`);
      promises.push(deleteDoc(doc(db, "questions", d.id)));
      count++;
    }
  });
  
  await Promise.all(promises);
  console.log(`Success! Deleted ${count} problematic questions.`);
}

deleteBadQuestions().catch(console.error);
