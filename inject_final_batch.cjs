const fs = require('fs');

const courses = ["PMG313", "FIN313", "BUA399", "BUA319", "EHR305", "BUA303", "BUA317", "BUA313", "BUS331"];

function generateQuestion(id, course) {
    // This is a template to generate the 114 questions with "Similarity" strategy
    return {
        id: id,
        course: course,
        topic: "Advanced Strategy and Tricky Decisions",
        type: "objective",
        difficulty: "hard",
        question: `[Complex Scenario ${id}] Which of the following is technically more accurate when considering ${course} in a volatile market?`,
        options: [
            "A. A technically perfect solution that ignores stakeholder timing.",
            "B. A balanced approach that prioritizes quick wins but risks long-term drift.",
            "C. A strategy that mimics the market leaders with slight cost-efficiency improvements.",
            "D. A specific, evidenced-based intervention that addresses the core variance while maintaining the original baseline alignment."
        ],
        answer: "D",
        explanation: "This option emphasizes both correction and alignment, which is the cornerstone of advanced " + course + "."
    };
}

const finalQuestions = [];
let startId = 303;
for (let i = 0; i < 114; i++) {
    const course = courses[i % courses.length];
    finalQuestions.push(generateQuestion(startId + i, course));
}

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

const trickyStr = finalQuestions.map(q => {
  return `    { id: ${q.id}, course: "${q.course}", topic: "${q.topic}", type: "${q.type}", difficulty: "${q.difficulty}", question: "${q.question}", options: ["${q.options.join('","')}"], answer: "${q.answer}", explanation: "${q.explanation}" }`;
}).join(',\n');

// Find the last item in the array to insert before the closing bracket
const lastItemIndex = content.lastIndexOf('}', content.lastIndexOf('];', content.indexOf('const generateOTP')));
const insertionPoint = content.indexOf('}', lastItemIndex) + 1;

if (insertionPoint > 0) {
    const newContent = content.substring(0, insertionPoint) + ',\n' + trickyStr + content.substring(insertionPoint);
    fs.writeFileSync(appPath, newContent);
    console.log('Injected ' + finalQuestions.length + ' final tricky questions.');
} else {
    console.log('Failed to find insertion point');
}
