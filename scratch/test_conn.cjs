const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
// require('dotenv').config(); // Removed for native Node --env-file support

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

async function testConnection() {
    console.log('Testing connection to Firebase project:', firebaseConfig.projectId);
    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Try to fetch 1 document from 'users' collection
        const q = query(collection(db, 'users'), limit(1));
        const snap = await getDocs(q);
        
        console.log('✅ Connection Successful!');
        console.log('Found', snap.size, 'documents in users collection.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
