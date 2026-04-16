const fs = require('fs');
const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// The pattern to fix is the ]; closing the questions and then the utility section.
// It seems there's a ]; on line 418.
// Then a utility section.
// Then an accidental injection starting after the }; of safeDocId on line 436.

const legitimateEnd = content.indexOf('];', content.indexOf('id: 266')) + 2;
const utilityStart = content.indexOf('// ─── UTILITY', legitimateEnd);

if (legitimateEnd !== -1 && utilityStart !== -1) {
    // 1. Get the legitimate questions block
    const questionsBlock = content.substring(0, legitimateEnd);
    
    // 2. Find the utility section
    // I need to skip the messy part and find the REAL start of OTP generation etc.
    // The previous view showed safeDocId ending at 436 with extras.
    
    // Let's just find the next function or const after the mess.
    // Actually, I'll just find the start of generateOTP and safeDocId again from the ORIGINAL template.
    
    const otpIndex = content.indexOf('const generateOTP = () =>');
    const safeDocIndex = content.indexOf('const safeDocId = (raw) =>');
    
    // I'll take the code from the start of the file to legitimateEnd,
    // Then add the utility headers and the clean functions.
    
    const cleanUtility = `

// ─── UTILITY ─────────────────────────────────────────────────────────────────

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const safeDocId = (raw) => {
    const s = String(raw ?? "");
    return s
        .replaceAll("/", "-")
        .replaceAll("\\\\", "-")
        .replaceAll("#", "-")
        .replaceAll("?", "-")
        .replaceAll("[", "(")
        .replaceAll("]", ")")
        .replace(/\\s+/g, "_")
        .slice(0, 140);
};`;

    // Now I need to find where the REST of the file (after the broken injection) continues.
    // The broken injection consists of the JSON questions.
    // It should end and then the file should continue with:
    // "/** Stable key for payment docs" or "const paymentDocKey"
    
    const paymentKeyIndex = content.indexOf('const paymentDocKey = (p) =>');
    
    if (paymentKeyIndex !== -1) {
        const fileTail = content.substring(paymentKeyIndex);
        
        // I'll also inject the tricky questions properly now into questionsBlock.
        const trickyQuestions = [
            { id: 267, course: 'PMG313', topic: 'WBS vs Activity List', type: 'objective', difficulty: 'hard', question: 'Which statement best describes the relationship between the Work Breakdown Structure (WBS) and the Activity List?', options: ['A. The WBS contains activities; the Activity List contains work packages.','B. The WBS is deliverable-oriented; the Activity List is action-oriented.','C. They are identical documents used in different phases.','D. The Activity List is a subset of the WBS dictionary.'], answer: 'B', explanation: 'WBS focuses on what is being delivered (nouns), while the Activity List focuses on how it is done (verbs).' }
        ];
        const trickyStr = trickyQuestions.map(q => JSON.stringify(q, null, 4)).join(',\\n    ');
        const finalQuestionsBlock = questionsBlock.replace('];', ',\\n    ' + trickyStr + '\\n];');
        
        fs.writeFileSync(appPath, finalQuestionsBlock + cleanUtility + '\\n\\n' + fileTail);
        console.log('App.jsx fully restored and tricky questions properly added.');
    } else {
        console.log('Could not find paymentDocKey index');
    }
}
