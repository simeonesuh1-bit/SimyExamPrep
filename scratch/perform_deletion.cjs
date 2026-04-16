const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc } = require('firebase/firestore');

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

async function performDeletion(matric) {
    console.log(`🧨 DELETING all Firestore data for matric: ${matric}...`);
    
    try {
        // Delete primary user doc
        await deleteDoc(doc(db, "users", matric));
        console.log(`✅ Deleted users/${matric}`);
        
        console.log("\n✨ Cleanup Complete. The matric is now available for new registration.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Deletion failed:", err);
        process.exit(1);
    }
}

const targetMatric = "23110821115";
performDeletion(targetMatric);
