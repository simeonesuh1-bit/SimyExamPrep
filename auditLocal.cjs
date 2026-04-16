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

async function audit() {
    console.log('🔍 Auditing all questions in Firestore...');
    const snap = await getDocs(collection(db, 'questions'));
    let faultyCount = 0;
    
    const faultyExamples = [];

    snap.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        let isFaulty = false;
        
        // Check Question for leaked options
        if (data.question.includes(' - A)') || data.question.includes(' A)')) {
            isFaulty = true;
        }

        // Check Options for leaked options
        if (data.options && data.options.length > 0) {
            data.options.forEach(opt => {
                if (opt.includes(' - B)') || opt.includes(' - C)') || opt.includes(' - D)') ||
                    opt.includes(' B)') || opt.includes(' C)') || opt.includes(' D)')) {
                    isFaulty = true;
                }
            });
        }

        if (isFaulty) {
            faultyCount++;
            if (faultyExamples.length < 10) {
                faultyExamples.push({
                    id,
                    course: data.course,
                    question: data.question,
                    options: data.options
                });
            }
        }
    });

    console.log(`\n❌ Found ${faultyCount} faulty questions out of ${snap.size}.`);
    console.log('\n--- Faulty Examples ---');
    console.log(JSON.stringify(faultyExamples, null, 2));
    
    process.exit(0);
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
