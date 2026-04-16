const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMINS = [
    { matric: "23110821060", password: "Dexter20", name: "Esuh Simeon Chioma", email: "simeonesuh1@gmail.com", role: "superadmin" },
    { matric: "23110821177", password: "UMUNNAKWE", name: "UMUNNAKWE PRECIOUS MMESOMA", email: "precious@gmail.com", role: "admin" },
    { matric: "23110821067", password: "HENSHAW", name: "Henshaw", email: "henshaw@gmail.com", role: "admin" },
    { matric: "2311000000", password: "HOC", name: "HOC Admin", email: "hoc@gmail.com", role: "admin" },
    { matric: "2311000001", password: null, name: "OTP Admin", email: "otp@gmail.com", role: "admin", otp: true },
];

async function migrate() {
    console.log('🚀 Starting Admin Migration to Firestore...');
    for (const admin of ADMINS) {
        try {
            // Using matric as the document ID
            await setDoc(doc(db, "admins", admin.matric), {
                ...admin,
                migratedAt: new Date().toISOString()
            });
            console.log(`✅ Migrated: ${admin.name} (${admin.role})`);
        } catch (error) {
            console.error(`❌ Failed to migrate ${admin.name}:`, error.message);
        }
    }
    console.log('✨ Migration Complete!');
    process.exit(0);
}

migrate();
