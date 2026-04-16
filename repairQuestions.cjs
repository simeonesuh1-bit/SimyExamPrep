const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');

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

function parseAllText(data) {
    const qText = data.question || "";
    const opts = data.options || [];
    const all = qText + " " + opts.join(" ");
    
    // Find the first option identifier (A, B, C, or D)
    const aMatch = all.match(/(.*?)\s*([A-D]\)\s+.*)/i);
    if (!aMatch) return null;

    const stem = aMatch[1].trim();
    const optionsText = aMatch[2];

    const results = { A: "", B: "", C: "", D: "" };
    // Refined regex to capture option content until the next identifier
    const regex = /([A-D])\)\s+([\s\S]*?)(?=\s+[A-D]\)\s+|\s+[-–]\s*[A-D]\)\s+|$)/gi;
    
    let match;
    while ((match = regex.exec(optionsText)) !== null) {
        const letter = match[1].toUpperCase();
        results[letter] = letter + ') ' + match[2].trim();
    }

    return {
        question: stem,
        options: [results.A, results.B, results.C, results.D]
    };
}

async function startRepair() {
    console.log('🛠️ [RETRY 4] Aggressive Repair (Standard getDocs)...');
    
    let snap;
    try {
        snap = await getDocs(collection(db, 'questions'));
    } catch (e) {
        console.error('❌ Failed to fetch documents:', e.message);
        process.exit(1);
    }

    let total = snap.size;
    let repairedCount = 0;
    let batch = writeBatch(db);
    let batchSize = 0;

    console.log(`🔍 Total documents in local/server view: ${total}`);

    for (const d of snap.docs) {
        const data = d.data();
        if (data.type !== 'objective') continue;

        const result = parseAllText(data);
        if (!result) continue;

        const isChanged = 
            result.question !== data.question || 
            JSON.stringify(result.options) !== JSON.stringify(data.options);

        if (isChanged) {
            batch.update(doc(db, 'questions', d.id), {
                question: result.question,
                options: result.options,
                repairedAtV4: new Date().toISOString()
            });
            repairedCount++;
            batchSize++;
        }

        if (batchSize >= 20) {
            try {
                await batch.commit();
                process.stdout.write(`  ✅ Repaired: ${repairedCount}\r`);
                batch = writeBatch(db);
                batchSize = 0;
            } catch (err) {
                console.error(`\n❌ Batch commit error (skipping batch):`, err.message);
                batch = writeBatch(db);
                batchSize = 0;
            }
        }
    }

    if (batchSize > 0) {
        await batch.commit().catch(e => console.error('\n❌ Final batch error:', e.message));
    }

    console.log(`\n\n✅ AGGRESSIVE REPAIR V4 COMPLETE!`);
    console.log(`📊 Total Repaired: ${repairedCount}`);
    process.exit(0);
}

startRepair().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
