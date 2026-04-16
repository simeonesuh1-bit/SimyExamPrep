const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getCountFromServer } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDCcDNNn4DxOfFZTtUB97ForZFE0EKhr6c",
    authDomain: "examprepng-f5299.firebaseapp.com",
    projectId: "examprepng-f5299",
    storageBucket: "examprepng-f5299.firebasestorage.app",
    messagingSenderId: "532316551206",
    appId: "1:532316551206:web:f444b9211af9216f394ee7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function count() {
    try {
        const coll = collection(db, 'questions');
        const snapshot = await getCountFromServer(coll);
        console.log(`Total Questions: ${snapshot.data().count}`);
        
        const sessions = await getCountFromServer(collection(db, 'exam_sessions'));
        console.log(`Total Exam Sessions: ${sessions.data().count}`);

        const results = await getCountFromServer(collection(db, 'results'));
        console.log(`Total Results: ${results.data().count}`);
    } catch (e) {
        console.error('Error counting:', e.message);
    }
    process.exit(0);
}

count();
