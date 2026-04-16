const fs = require('fs');
const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Repair the safeDocId function (remove };, and the following stray brace)
// The broken part looks like line 419: };, which was meant to be the end of SAMPLE_QUESTIONS
// but got injected into the utility section.

// Restore the original utility section by clearing anything between SAMPLE_QUESTIONS end and legitimate code
const questionsEndStr = 'id: 266';
const startOfRest = content.indexOf('];', content.indexOf(questionsEndStr));

// Legitimate utility start
const utilityStartStr = '// ─── UTILITY ─────────────────────────────────────────────────────────────────';
const utilityStartIndex = content.indexOf(utilityStartStr);

if (startOfRest !== -1 && utilityStartIndex !== -1) {
    const questionsBlock = content.substring(0, startOfRest + 2);
    const restOfFile = content.substring(utilityStartIndex);
    
    // Now I want to properly append the tricky questions to the questionsBlock before the ];
    const trickyQuestions = [
        { id: 267, course: 'PMG313', topic: 'WBS vs Activity List', type: 'objective', difficulty: 'hard', question: 'Which statement best describes the relationship between the Work Breakdown Structure (WBS) and the Activity List?', options: ['A. The WBS contains activities; the Activity List contains work packages.','B. The WBS is deliverable-oriented; the Activity List is action-oriented.','C. They are identical documents used in different phases.','D. The Activity List is a subset of the WBS dictionary.'], answer: 'B', explanation: 'WBS focuses on what is being delivered (nouns), while the Activity List focuses on how it is done (verbs).' },
        // ... (I'll just add the first few to fix the build first)
    ];
    
    const trickyStr = trickyQuestions.map(q => JSON.stringify(q, null, 4)).join(',\n    ');
    const newQuestionsBlock = questionsBlock.replace('];', ',\n    ' + trickyStr + '\n];');
    
    fs.writeFileSync(appPath, newQuestionsBlock + '\n\n' + restOfFile);
    console.log('Fixed syntax and added initial tricky questions');
} else {
    console.log('Could not find markers');
}
