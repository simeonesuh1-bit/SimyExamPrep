const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDCcDNNn4DxOfFZTtUB97ForZFE0EKhr6c",
    authDomain: "examprepng-f5299.firebaseapp.com",
    projectId: "examprepng-f5299",
    storageBucket: "examprepng-f5299.firebasestorage.app",
    messagingSenderId: "532316551206",
    appId: "1:532316551206:web:f444b9211af9216f394ee7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findMore(matric) {
    console.log(`🔍 Checking additional collections for matric: ${matric}...`);
    
    // 1. Check notifications
    const qNotif = query(collection(db, "notifications"), where("to", "==", matric));
    const snapNotif = await getDocs(qNotif);
    console.log(`🔔 Notifications found: ${snapNotif.size}`);
    
    // 2. Check feedback
    const qFeed = query(collection(db, "feedback"), where("matric", "==", matric));
    const snapFeed = await getDocs(qFeed);
    console.log(`💬 Feedback found: ${snapFeed.size}`);

    process.exit(0);
}

const targetMatric = "23110821115";
findMore(targetMatric).catch(err => {
    console.error('❌ Search failed:', err);
    process.exit(1);
});
