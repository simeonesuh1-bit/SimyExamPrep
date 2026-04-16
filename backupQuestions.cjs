const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function backup() {
    console.log('📦 Starting backup of all questions...');
    try {
        const snap = await getDocs(collection(db, 'questions'));
        const questions = [];
        snap.forEach(doc => {
            questions.push({ ...doc.data(), _firestore_id: doc.id });
        });
        
        fs.writeFileSync('backup_questions.json', JSON.stringify(questions, null, 2));
        console.log(`✅ Backup complete! Exported ${questions.length} questions to backup_questions.json`);
    } catch (e) {
        console.error('❌ Backup failed:', e.message);
    }
    process.exit(0);
}

backup();
