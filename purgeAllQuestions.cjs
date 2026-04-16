const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, writeBatch } = require('firebase/firestore');

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

async function purgeAll() {
    console.log('💥 STARTING TOTAL PURGE OF ALL QUESTIONS...');
    try {
        const snap = await getDocs(collection(db, 'questions'));
        console.log(`Found ${snap.docs.length} questions to delete.`);
        
        // Firestore batches are limited to 500 operations
        let count = 0;
        let batch = writeBatch(db);
        
        for (const doc of snap.docs) {
            batch.delete(doc.ref);
            count++;
            
            if (count % 400 === 0) {
                console.log(`  Deleting batch (${count})...`);
                await batch.commit();
                batch = writeBatch(db);
            }
        }
        
        if (count % 400 !== 0) {
            await batch.commit();
        }
        
        console.log(`✅ SUCCESS! Purged ${count} questions.`);
    } catch (e) {
        console.error('❌ Purge failed:', e.message);
    }
    process.exit(0);
}

purgeAll();
