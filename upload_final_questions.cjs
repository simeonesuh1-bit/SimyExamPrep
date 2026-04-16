const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, query, where } = require('firebase/firestore');

// --- Firebase Configuration ---
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

const FOLDER_PATH = path.join(__dirname, 'new cbt app questions');

/**
 * Universal Parser for the various .txt formats discovered
 */
function parseQuestionsUniversal(text, courseCode) {
    const questions = [];
    const lines = text.split(/\r?\n/);
    
    let currentMode = 'easy';
    let currentQText = '';
    let currentOptions = [];
    let currentAnswer = '';
    
    function saveQuestion() {
        if (currentQText && currentOptions.length >= 2 && currentAnswer) {
            questions.push({
                id: `${courseCode}_${currentMode}_${String(questions.length + 1).padStart(3, '0')}`,
                course: courseCode,
                type: 'objective',
                difficulty: currentMode,
                question: currentQText.trim(),
                options: currentOptions,
                answer: currentAnswer.toUpperCase(),
                topic: 'General',
                explanation: ''
            });
        }
        currentQText = '';
        currentOptions = [];
        currentAnswer = '';
    }

    const modeKeywords = ['easy', 'medium', 'hard', 'tricky', 'expert'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 1. Detect Mode Change
        if (/(?:MODE|SECTION|BANK|QUESTIONS)/i.test(line)) {
            let found = false;
            for (const mk of modeKeywords) {
                if (new RegExp(mk, 'i').test(line)) {
                    currentMode = mk === 'expert' ? 'tricky' : mk;
                    console.log(`  → Detected mode: ${currentMode} from header line`);
                    found = true;
                    break;
                }
            }
            if (!found && /(?:101-200|76-150)/.test(line)) { currentMode = 'medium'; }
            if (!found && /(?:201-300|151-225)/.test(line)) { currentMode = 'hard'; }
            if (!found && /(?:226-300|251-300)/.test(line)) { currentMode = 'tricky'; }
            
            // If it was just a header line, skip to next line
            if (found || line.length < 50) continue; 
        }

        // 2. Detect Question Start
        // Matches: "1. ", "Q1.", "QUESTION 1", "[1]", "Q: "
        const qStartMatch = line.match(/^(?:QUESTION\s+\d+|\[\d+\]|Q\d+\.|Q:|\d+\.)\s*(.*)/i);
        if (qStartMatch) {
            saveQuestion();
            currentQText = qStartMatch[1].trim();
            
            // Handle pattern where next line is the text
            if (!currentQText || currentQText.length < 2) {
                const nextLine = lines[i+1]?.trim() || '';
                if (nextLine && !nextLine.match(/^[A-D][.)\s]/i) && !nextLine.match(/(?:Answer|ANSWER)/i)) {
                    currentQText = nextLine.replace(/^Q:\s*/i, '');
                    i++;
                }
            }
            continue;
        }

        // 3. Detect Options
        // Matches: "A. ", "A) ", "[A] ", "A "
        const optMatch = line.match(/^([A-D])[.)\s]\s*(.*)/i);
        if (optMatch && currentQText) {
            currentOptions.push(`${optMatch[1].toUpperCase()}) ${optMatch[2].trim()}`);
            continue;
        }

        // 4. Detect Answer
        // Matches: "Answer: B", "Correct Answer: B", "ANSWER: B"
        const ansMatch = line.match(/(?:Correct Answer|Answer|ANSWER)[:\s*]+([A-D])/i);
        if (ansMatch && currentQText) {
            currentAnswer = ansMatch[1];
            continue;
        }

        // 5. Append to question text if it's multiline
        if (currentQText && currentOptions.length === 0 && !currentAnswer) {
            // Ensure we aren't appending a mode header or something
            if (line.length < 100 && !line.match(/[.?!]$/)) {
                // possibly ignore
            } else {
                currentQText += ' ' + line;
            }
        }
    }
    
    saveQuestion();
    return questions;
}

async function deleteExistingForCourse(courseCode) {
    console.log(`  → Deleting existing questions for ${courseCode}...`);
    const q = query(collection(db, 'questions'), where('course', '==', courseCode));
    const snap = await getDocs(q);
    const deletes = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletes);
    console.log(`  → Deleted ${snap.docs.length} questions.`);
}

async function run() {
    const files = [
        { file: 'EHR_305_300_Questions_Final.txt', code: 'EHR305' },
        { file: 'PMG_313_300_Questions_Final.txt', code: 'PMG313' },
        { file: 'BUA313_300_Questions_Final.txt', code: 'BUA313' },
        { file: 'BUA319_300_Questions.txt', code: 'BUA319' },
        { file: 'BUA_303_Management_Theory_300_Questions.txt', code: 'BUA303' },
        { file: 'BuA317_Entrepreneurship_300Questions.txt', code: 'BUA317' },
        { file: 'FIN313_300_Questions_Final.txt', code: 'FIN313' }
    ];

    for (const item of files) {
        console.log(`\nProcessing ${item.file}...`);
        const filePath = path.join(FOLDER_PATH, item.file);
        if (!fs.existsSync(filePath)) {
            console.error(`  ❌ File not found: ${filePath}`);
            continue;
        }

        const text = fs.readFileSync(filePath, 'utf-8');
        const questions = parseQuestionsUniversal(text, item.code);
        console.log(`  ✅ Parsed ${questions.length} questions for ${item.code}`);

        if (questions.length > 0) {
            await deleteExistingForCourse(item.code);
            
            const collectionRef = collection(db, 'questions');
            let count = 0;
            const BATCH_SIZE = 50;
            
            for (let i = 0; i < questions.length; i += BATCH_SIZE) {
                const batch = questions.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(q => addDoc(collectionRef, q)));
                count += batch.length;
                process.stdout.write(`  ⬆️  Uploaded ${count}/${questions.length}...\r`);
            }
            console.log(`\n  ✅ Successfully uploaded ${count} questions for ${item.code}`);
        }
    }

    console.log('\nAll requested uploads complete!');
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
