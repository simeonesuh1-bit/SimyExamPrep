const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function inspectUsers() {
    console.log('🔍 Inspecting User Base...');
    const userSnap = await getDocs(collection(db, "users"));
    const users = [];
    
    userSnap.forEach(d => {
        const data = d.data();
        users.push({
            id: d.id,
            name: data.fullName || data.name || "N/A",
            email: data.email || "N/A",
            matric: data.matric || "N/A",
            registeredAt: data.registeredAt || "N/A",
            attempts: data.questionsAttempted || 0,
            status: data.isDeleted ? "Deactivated" : data.banned ? "Banned" : "Active"
        });
    });
    
    // Sort by registration date
    users.sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));
    
    console.table(users);
    console.log(`\nTotal Users: ${users.length}`);
    process.exit(0);
}

inspectUsers().catch(err => {
    console.error('❌ Failed to inspect users:', err);
    process.exit(1);
});
