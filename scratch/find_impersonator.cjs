const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

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

async function findUser(matric) {
    console.log(`🔍 Searching for matric: ${matric}...`);
    
    // 1. Check users collection
    const userDoc = await getDoc(doc(db, "users", matric));
    if (userDoc.exists()) {
        console.log("✅ User found in 'users' collection:");
        console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
        console.log("❌ User NOT found in 'users' collection (doc ID check).");
        // Check by field
        const q = query(collection(db, "users"), where("matric", "==", matric));
        const snap = await getDocs(q);
        if (!snap.empty) {
            console.log("✅ User found in 'users' collection (field query):");
            console.log(JSON.stringify(snap.docs[0].data(), null, 2));
        }
    }

    // 2. Check payments
    const qPay = query(collection(db, "payments"), where("matric", "==", matric));
    const snapPay = await getDocs(qPay);
    console.log(`💰 Payments found: ${snapPay.size}`);

    // 3. Check messages
    const qMsgTo = query(collection(db, "messages"), where("to", "==", matric));
    const snapMsgTo = await getDocs(qMsgTo);
    const qMsgFrom = query(collection(db, "messages"), where("from", "==", matric));
    const snapMsgFrom = await getDocs(qMsgFrom);
    console.log(`💬 Messages: ${snapMsgTo.size} to, ${snapMsgFrom.size} from`);

    process.exit(0);
}

const targetMatric = "23110821115";
findUser(targetMatric).catch(err => {
    console.error('❌ Search failed:', err);
    process.exit(1);
});
