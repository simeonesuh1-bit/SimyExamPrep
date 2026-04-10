const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, query, where } = require('firebase/firestore');

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDCcDNNn4DxOfFZTtUB97ForZFE0EKhr6c",
    authDomain: "examprepng-f5299.firebaseapp.com",
    projectId: "examprepng-f5299",
    storageBucket: "examprepng-f5299.firebasestorage.app",
    messagingSenderId: "532316551206",
    appId: "1:532316551206:web:f444b9211af9216f394ee7",
    measurementId: "G-QPGFDJQLDW"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FOLDER_PATH = path.join(__dirname, 'cbt app questions');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCourseCode(filename) {
    // Handle PMG (313, ...) — letters, then any non-alpha chars, then 3 digits
    // Also handles: FIN 313, BUA317, EHR305, etc.
    const match = filename.match(/\b([a-zA-Z]{2,4})[^a-zA-Z0-9]*(\d{3})\b/);
    if (match) {
        let prefix = match[1].toUpperCase();
        // Handle common typos: BAU -> BUA
        if (prefix === 'BAU') prefix = 'BUA';
        return prefix + match[2];
    }
    return 'UNKNOWN';
}

async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.txt') return fs.readFileSync(filePath, 'utf-8');
    if (ext === '.docx') return (await mammoth.extractRawText({ path: filePath })).value;
    if (ext === '.js') return fs.readFileSync(filePath, 'utf-8');
    if (ext === '.pdf') {
        try {
            let mod = await import('pdf-parse');
            let fn = typeof mod === 'function' ? mod : (mod.default || mod);
            if (typeof fn !== 'function') fn = require('pdf-parse');
            return (await fn(fs.readFileSync(filePath))).text;
        } catch (e) { console.error('PDF parse error:', e.message); return ''; }
    }
    return '';
}

// ─── PARSER 1: JS Object Array Format ────────────────────────────────────────
// Handles: { id: "...", course: "...", type: "...", difficulty: "...",
//            question: "...", options: ["A. ...", "B. ..."], answer: "B", explanation: "..." }
function parseJSObjectFormat(text, courseCode) {
    const questions = [];
    // Extract each {...} object block from the array
    // Match from opening { to closing } - handle nested structure
    const objPattern = /\{\s*id:\s*["']([^"']+)["'][^}]*?question:\s*["']([\s\S]*?)["'],\s*options:\s*\[([\s\S]*?)\],\s*answer:\s*["']([A-Da-d])["'](?:,\s*explanation:\s*["']([\s\S]*?)["'])?[^}]*?\}/g;
    
    let match;
    while ((match = objPattern.exec(text)) !== null) {
        const id = match[1].trim();
        const question = match[2].replace(/\\n/g, '\n').trim();
        const optionsRaw = match[3];
        const answer = match[4].toUpperCase();
        const explanation = (match[5] || '').replace(/\\n/g, '\n').trim();

        // Parse the options array entries - each is a quoted string
        const optList = [];
        const optPattern = /["']((?:[^"'\\]|\\.)*)["']/g;
        let optMatch;
        while ((optMatch = optPattern.exec(optionsRaw)) !== null) {
            optList.push(optMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim());
        }

        if (!question || optList.length < 2) continue;

        // Detect type and difficulty from the id or surrounding context
        let difficulty = 'medium';
        if (id.includes('_0') || id.match(/_0\d\d/)) {
            const num = parseInt(id.replace(/\D/g, '').slice(-3));
            if (num <= 100) difficulty = 'easy';
            else if (num <= 200) difficulty = 'medium';
            else difficulty = 'hard';
        }

        // Try to detect type from id or text
        let type = 'objective';
        if (/fill/i.test(text.slice(Math.max(0, match.index - 200), match.index + 200))) {
            type = 'fill';
        }

        questions.push({
            id: id,
            course: courseCode,
            type: type,
            difficulty: difficulty,
            question: question,
            options: optList,
            answer: answer,
            explanation: explanation,
            topic: 'General'
        });
    }

    // If that didn't work well, try the broader approach (split on }{ boundary)
    if (questions.length < 5) {
        // Try line-by-line approach for JS array format
        return parseJSLinewise(text, courseCode);
    }

    return questions;
}

function parseJSLinewise(text, courseCode) {
    const questions = [];
    // Split text into individual object entries
    // Each entry starts with { id: and ends with },
    const chunks = text.split(/(?=\{\s*id:\s*["'])/);
    
    for (const chunk of chunks) {
        if (!chunk.includes('question:')) continue;

        // Extract fields
        const idM = chunk.match(/id:\s*["']([^"']+)["']/);
        const qM = chunk.match(/question:\s*["']([\s\S]*?)["'],\s*(?:options|type|answer|correctAnswer)/);
        const ansM = chunk.match(/(?:correctAnswer|answer):\s*["']([A-Da-d])["']/i);
        const typeM = chunk.match(/type:\s*["'](objective|fill|theory)["']/i);
        const diffM = chunk.match(/difficulty:\s*["'](easy|medium|hard)["']/i);
        const explM = chunk.match(/explanation:\s*["']([\s\S]*?)["']\s*[,}]/);
        const topicM = chunk.match(/topic:\s*["']([\s\S]*?)["']/);

        if (!qM || !ansM) continue;

        const question = qM[1].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
        if (!question) continue;

        // Extract options - handle both array [] and object {A:..., B:...} formats
        let options = [];
        const optsArrM = chunk.match(/options:\s*\[([\s\S]*?)\]/);
        const optsObjM = chunk.match(/options:\s*\{([\s\S]*?)\}/);
        if (optsArrM) {
            const optPattern = /["']((?:[^"'\\]|\\.)*)["']/g;
            let optMatch;
            while ((optMatch = optPattern.exec(optsArrM[1])) !== null) {
                const opt = optMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
                if (opt) options.push(opt);
            }
        } else if (optsObjM) {
            // Object format: { A: "...", B: "...", C: "...", D: "..." }
            const raw = optsObjM[1];
            const aM = raw.match(/A:\s*["']((?:[^"'\\]|\\.)*)["\']/i);
            const bM = raw.match(/B:\s*["']((?:[^"'\\]|\\.)*)["\']/i);
            const cM = raw.match(/C:\s*["']((?:[^"'\\]|\\.)*)["\']/i);
            const dM = raw.match(/D:\s*["']((?:[^"'\\]|\\.)*)["\']/i);
            if (aM) options.push('A) ' + aM[1].replace(/\\'/g, "'").trim());
            if (bM) options.push('B) ' + bM[1].replace(/\\'/g, "'").trim());
            if (cM) options.push('C) ' + cM[1].replace(/\\'/g, "'").trim());
            if (dM) options.push('D) ' + dM[1].replace(/\\'/g, "'").trim());
        }

        const type = (typeM && typeM[1]) || (options.length ? 'objective' : 'fill');
        const difficulty = (diffM && diffM[1]) || 'medium';
        const answer = ansM[1].toUpperCase();
        const explanation = explM ? explM[1].replace(/\\n/g, '\n').replace(/\\'/g, "'").trim() : '';

        questions.push({
            id: idM ? idM[1] : (courseCode + '_' + Math.random().toString(36).substr(2, 6)),
            course: courseCode,
            type: type,
            difficulty: difficulty,
            question: question,
            options: type === 'fill' ? [] : options,
            answer: answer,
            explanation: explanation,
            topic: (topicM && topicM[1]) || 'General'
        });
    }

    return questions;
}

// ─── PARSER 2: Numbered List Format with Bold/Checkmark Answers ───────────────
// Handles: FIN313 format:
// 1. Question text
// - \tA) OptionA
// - \t**B) AnswerOption ✓**
// - \tC) OptionC
// - \tD) OptionD
function parseNumberedListFormat(text, courseCode) {
    const questions = [];
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    
    let currentQuestion = null;
    let currentOptions = [];
    let currentAnswer = null;
    let difficulty = 'easy';
    let questionNumber = 0;

    const finishQuestion = () => {
        if (currentQuestion && currentOptions.length >= 2 && currentAnswer) {
            questions.push({
                id: courseCode + '_' + String(questionNumber).padStart(3, '0'),
                course: courseCode,
                type: 'objective',
                difficulty: difficulty,
                question: currentQuestion.trim(),
                options: currentOptions,
                answer: currentAnswer,
                explanation: '',
                topic: 'General'
            });
        }
        currentQuestion = null;
        currentOptions = [];
        currentAnswer = null;
    };

    for (const line of lines) {
        const trimmed = line.trim();

        // Section headers change difficulty
        if (/EASY\s*MODE|EASY\s*SECTION|SECTION\s*A/i.test(trimmed) && !trimmed.match(/^\d+\./)) {
            difficulty = 'easy';
            continue;
        }
        if (/MEDIUM\s*MODE|MEDIUM\s*SECTION|SECTION\s*[B-E]/i.test(trimmed) && !trimmed.match(/^\d+\./)) {
            difficulty = 'medium';
            continue;
        }
        if (/HARD\s*MODE|HARD\s*SECTION|SECTION\s*[F-Z]/i.test(trimmed) && !trimmed.match(/^\d+\./)) {
            difficulty = 'hard';
            continue;
        }

        // Detect a new numbered question: "1." or "1.\t" at start of line
        const qMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (qMatch) {
            finishQuestion();
            questionNumber = parseInt(qMatch[1]);
            currentQuestion = qMatch[2];
            // Inline continuation (sometimes question is on same line as number)
            continue;
        }

        // Detect option line: "- A) ..." or "- \tA) ..." or "\tA) ..."
        // Also handles bolded correct answer: "- **A) ... ✓**" or "-\t**B) Answer ✓**"
        const optMatch = trimmed.match(/^[-–]\s*(?:\*\*)?([A-D])\)\s*(.*?)(?:\s*✓\s*)?(?:\*\*)?$/i);
        if (optMatch && currentQuestion) {
            const letter = optMatch[1].toUpperCase();
            let optText = optMatch[2].trim().replace(/\*\*/g, '').replace(/✓/g, '').trim();
            const isAnswer = /\*\*.*✓|\*\*.*\u2713|✓|\u2713/.test(trimmed);

            // Also check if the raw line itself contains bold markers around the option
            const rawHasBold = /\*\*/.test(trimmed) || trimmed.includes('✓');
            
            currentOptions.push(letter + ') ' + optText);
            if (isAnswer || rawHasBold) {
                currentAnswer = letter;
            }
            continue;
        }

        // Alternate option format: just "A) ..." without dash at start
        const altOptMatch = trimmed.match(/^([A-D])[.)]\s+(.+)/i);
        if (altOptMatch && currentQuestion && trimmed.length < 200) {
            const letter = altOptMatch[1].toUpperCase();
            const isAnswer = /\*\*.*✓|\*\*.*\u2713|✓|\u2713/.test(trimmed);
            let optText = altOptMatch[2].replace(/\*\*/g, '').replace(/✓/g, '').trim();
            currentOptions.push(letter + ') ' + optText);
            if (isAnswer) currentAnswer = letter;
            continue;
        }

        // Continuation of previous question text
        if (currentQuestion && !optMatch && trimmed.length > 0 && currentOptions.length === 0) {
            if (!trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('**SECTION')) {
                currentQuestion += ' ' + trimmed;
            }
        }
    }

    finishQuestion(); // Flush last question
    return questions;
}

// ─── PARSER 3: Standard Answer-line Format ───────────────────────────────────
// Handles: BAU313, BUA399, BUA317 formats with "Answer: A" at end
function parseAnswerLineFormat(text, courseCode) {
    const questions = [];
    const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Pattern: numbered question followed by 4 options then "Answer: X"
    // Options may be: "A. text", "A) text", "(A) text"
    const blockRegex = /(\d+)\.\s+([\s\S]*?)\n\s*(?:[Aa][.)]\s*)(.*?)\n\s*(?:[Bb][.)]\s*)(.*?)\n\s*(?:[Cc][.)]\s*)(.*?)\n\s*(?:[Dd][.)]\s*)(.*?)\n\s*(?:Answer|ANS|Ans)[:\s]+([A-Da-d])/g;

    const diffMap = { 1: 'easy', 2: 'medium', 3: 'hard' };

    let match;
    let count = 0;
    while ((match = blockRegex.exec(cleaned)) !== null) {
        count++;
        const num = parseInt(match[1]);
        const question = match[2].trim().replace(/\n/g, ' ');
        const options = [
            'A) ' + match[3].trim(),
            'B) ' + match[4].trim(),
            'C) ' + match[5].trim(),
            'D) ' + match[6].trim()
        ];
        const answer = match[7].toUpperCase();

        // Guess difficulty from question number ranges
        const diff = num <= 100 ? 'easy' : (num <= 200 ? 'medium' : 'hard');

        questions.push({
            id: courseCode + '_' + String(num).padStart(3, '0'),
            course: courseCode,
            type: 'objective',
            difficulty: diff,
            question: question,
            options: options,
            answer: answer,
            explanation: '',
            topic: 'General'
        });
    }

    return questions;
}

// ─── PARSER 4: Theory Questions ──────────────────────────────────────────────
function parseTheoryFormat(text, courseCode) {
    const questions = [];
    const theoryRegex = /Question\s*\d+:\s*(.*?)\n\s*Answer:\s*([\s\S]*?)(?=\nQuestion\s*\d+:|$)/gis;
    let match;
    let count = 0;
    while ((match = theoryRegex.exec(text)) !== null) {
        count++;
        questions.push({
            id: courseCode + '_T' + String(count).padStart(3, '0'),
            course: courseCode,
            type: 'theory',
            difficulty: 'hard',
            question: match[1].trim(),
            options: [],
            answer: match[2].trim(),
            explanation: '',
            topic: 'General'
        });
    }
    return questions;
}

// ─── Detect best format and parse ────────────────────────────────────────────
function detectAndParse(text, courseCode, filename) {
    const isTheory = filename.toLowerCase().includes('theory');
    if (isTheory) return parseTheoryFormat(text, courseCode);

    // JS Object array format (PMG313 style)
    if (text.includes('id:') && text.includes('question:') && text.includes('options:') && (text.includes('answer:') || text.includes('correctAnswer:'))) {
        console.log('  → Detected JS Object Array format');
        const q = parseJSLinewise(text, courseCode);
        if (q.length > 0) return q;
    }

    // Numbered list with ✓ or bold answers (FIN313 style)
    if (text.includes('✓') || (text.includes('**') && /^\s*[-–]\s*\*\*/m.test(text))) {
        console.log('  → Detected Numbered List with ✓/Bold format');
        const q = parseNumberedListFormat(text, courseCode);
        if (q.length > 0) return q;
    }

    // Standard Answer: X format (BUA303, BUA317, BUA319, BAU313, BUA399, EHR305)
    if (/Answer\s*:/i.test(text) || /ANS\s*:/i.test(text)) {
        console.log('  → Detected Answer-Line format');
        const q = parseAnswerLineFormat(text, courseCode);
        if (q.length > 0) return q;
    }

    // Fallback: numbered list
    console.log('  → Trying numbered list fallback');
    const q = parseNumberedListFormat(text, courseCode);
    return q;
}

// ─── Delete existing Firestore questions for a course before re-upload ────────
async function deleteExistingForCourse(courseCode) {
    const q = query(collection(db, 'questions'), where('course', '==', courseCode));
    const snap = await getDocs(q);
    const deletes = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletes);
    console.log(`  → Deleted ${snap.docs.length} existing Firestore docs for ${courseCode}`);
}

// ─── Main Upload ──────────────────────────────────────────────────────────────
async function uploadQuestions() {
    // Set to [] to upload all courses, or specify specific ones to only re-upload those
    const TARGET_COURSES = [];

    console.log('📂 Scanning folder:', FOLDER_PATH);
    const files = fs.readdirSync(FOLDER_PATH).filter(f => !f.startsWith('debug_') && !f.endsWith('.js') && !f.endsWith('.cjs'));
    const collectionRef = collection(db, 'questions');

    let totalUploaded = 0;
    const coursesProcessed = new Set();

    for (const file of files) {
        const filePath = path.join(FOLDER_PATH, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) continue;

        const courseCode = getCourseCode(file);
        if (courseCode === 'UNKNOWN') {
            console.log(`⚠️  Skipping (no course code): ${file}`);
            continue;
        }

        // Filter to only target courses if specified
        if (TARGET_COURSES.length > 0 && !TARGET_COURSES.includes(courseCode)) {
            continue; // Skip this course
        }

        console.log(`\n📄 Processing: ${file} → Course: ${courseCode}`);
        const text = await extractText(filePath);
        if (!text.trim()) {
            console.log('  ⚠️  Empty text, skipping.');
            continue;
        }

        const parsed = detectAndParse(text, courseCode, file);
        console.log(`  ✅ Parsed ${parsed.length} questions`);

        if (parsed.length === 0) {
            const debugPath = path.join(FOLDER_PATH, `debug_${file.replace(/\s/g, '_')}.txt`);
            fs.writeFileSync(debugPath, text);
            console.log(`  ❌ No questions parsed. Debug file written.`);
            continue;
        }

        // Delete existing course questions first (only once per course)
        if (!coursesProcessed.has(courseCode)) {
            await deleteExistingForCourse(courseCode);
            coursesProcessed.add(courseCode);
        }

        // Upload in batches
        let uploadedForFile = 0;
        for (const q of parsed) {
            try {
                await addDoc(collectionRef, {
                    id: q.id,
                    course: q.course,
                    type: q.type,
                    difficulty: q.difficulty,
                    question: q.question,
                    options: q.options || [],
                    answer: q.answer,
                    explanation: q.explanation || '',
                    topic: q.topic || 'General'
                });
                uploadedForFile++;
                totalUploaded++;
                if (uploadedForFile % 50 === 0) {
                    process.stdout.write(`  ⬆️  Uploaded ${uploadedForFile}/${parsed.length}...\r`);
                }
            } catch (err) {
                console.error(`  ❌ Error uploading question "${q.question?.slice(0, 40)}":`, err.message);
            }
        }

        console.log(`  ✅ Uploaded ${uploadedForFile} questions for ${courseCode} from ${file}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ UPLOAD COMPLETE — ${totalUploaded} total questions pushed to Firestore`);
    console.log('═══════════════════════════════════════');
    process.exit(0);
}

uploadQuestions().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
