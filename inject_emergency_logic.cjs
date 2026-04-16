const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add Import
if (!content.includes('./emergencyData')) {
    content = 'import { EMERGENCY_MODE, REAL_QUESTIONS } from "./emergencyData";\n' + content;
}

// 2. Modify useEffect for fetching questions
// Target: const unsubQuestions = onSnapshot(collection(db, "questions"), async (snap) => {
const targetStart = 'const unsubQuestions = onSnapshot(collection(db, "questions"), async (snap) => {';
const replacement = `
        // 🚨 EMERGENCY BYPASS: Use hardcoded questions instead of Firestore during quota outage
        if (EMERGENCY_MODE) {
            console.log("⚠️ EMERGENCY MODE: Using hardcoded questions.");
            setQuestions(REAL_QUESTIONS);
            return () => {};
        }

        const unsubQuestions = onSnapshot(collection(db, "questions"), async (snap) => {`;

if (content.includes(targetStart) && !content.includes('EMERGENCY_MODE')) {
    content = content.replace(targetStart, replacement);
}

// 3. Add fallback for errors in the listener
const errorTarget = 'if (qList.length > 0) setQuestions(qList);\n        });';
const errorReplacement = `if (qList.length > 0) setQuestions(qList);\n        }, (err) => {\n            console.error("Firestore Error:", err);\n            if (err.code === "resource-exhausted") {\n                console.log("🚨 Quota Exceeded! Falling back to REAL_QUESTIONS.");\n                setQuestions(REAL_QUESTIONS);\n            }\n        });`;

if (content.includes(errorTarget) && !content.includes('resource-exhausted')) {
    content = content.replace(errorTarget, errorReplacement);
}

// 4. Disable "Add Question" button in AdminQuestions
const adminAddBtn = '<button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>➕ Add Question</button>';
const adminAddBtnDisabled = `{EMERGENCY_MODE ? <span className="badge badge-red">⚠️ Database Offline (Read Only)</span> : <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>➕ Add Question</button>}`;

if (content.includes(adminAddBtn)) {
    content = content.replace(adminAddBtn, adminAddBtnDisabled);
}

fs.writeFileSync(appPath, content);
console.log('Successfully injected emergency logic into App.jsx');
