const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDCcDNNn4DxOfFZTtUB97ForZFE0EKhr6c",
    authDomain: "examprepng-f5299.firebaseapp.com",
    projectId: "examprepng-f5299",
    storageBucket: "examprepng-f5299.firebasestorage.app",
    messagingSenderId: "532316551206",
    appId: "1:532316551206:web:f444b9211af9216f394ee7",
    measurementId: "G-QPGFDJQLDW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function purge() {
    console.log("Starting final purge of 'questions' collection...");
    const snap = await getDocs(collection(db, 'questions'));
    console.log(`Found ${snap.size} questions to delete.`);
    
    let count = 0;
    for (const d of snap.docs) {
        await deleteDoc(doc(db, 'questions', d.id));
        count++;
        if (count % 10 === 0) console.log(`Deleted ${count}/${snap.size}...`);
    }
    
    console.log("Purge complete.");
    process.exit(0);
}

purge().catch(console.error);
