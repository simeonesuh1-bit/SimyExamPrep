const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function verify() {
    console.log("Checking Firestore 'questions' collection...");
    const snap = await getDocs(collection(db, 'questions'));
    console.log(`Total questions in Firestore: ${snap.size}`);
    
    if (snap.size > 0) {
        console.log("Sample of found questions:");
        snap.docs.slice(0, 5).forEach(d => {
            const data = d.data();
            console.log(`- Course: ${data.course}, ID: ${d.id}, Question: ${data.question?.substring(0, 50)}...`);
        });
    }
    process.exit(0);
}

verify().catch(console.error);
