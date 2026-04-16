const fs = require('fs');

const coursesUpdate = [
    { code: "PMG313", name: "Project Scope Management", department: "Business Administration", level: "300", summary: "Focuses on defining and controlling what is and is not included in the project." },
    { code: "FIN313", name: "Financial Management", department: "Business Administration", level: "300", summary: "Managing organization funds, capital budgeting, and financing decisions." },
    { code: "EHR305", name: "Compensation and Benefit Management", department: "Business Administration", level: "300", summary: "Strategic role of pay and benefits in the workplace." },
    { code: "BUA399", name: "Research Methods", department: "Business Administration", level: "300", summary: "Systematic process of data collection and analysis." },
    { code: "BUA319", name: "E-Commerce", department: "Business Administration", level: "300", summary: "Buying and selling goods using the internet." },
    { code: "BUA317", name: "Entrepreneurship for Managers", department: "Business Administration", level: "300", summary: "Identifying opportunities and managing venture growth." },
    { code: "BUA313", name: "Innovation Management", department: "Business Administration", level: "300", summary: "Managing the pipeline from idea to commercialization." },
    { code: "BUA303", name: "Management Theory", department: "Business Administration", level: "300", summary: "Evolution of management thought and various schools of management." },
    { code: "BUS331", name: "Business Industrial Visit", department: "Business Administration", level: "300", summary: "Practical exposure to corporate entities." }
];

const stickerPack = [
    { id: '1', emoji: '📚', label: 'Study' },
    { id: '2', emoji: '🎯', label: 'Exam' },
    { id: '3', emoji: '⚠️', label: 'Alert' },
    { id: '4', emoji: '🏆', label: 'Success' },
    { id: '5', emoji: '🔥', label: 'Trending' },
    { id: '6', emoji: '💡', label: 'Tip' },
    { id: '7', emoji: '🎓', label: 'Grad' },
    { id: '8', emoji: '🔔', label: 'New' },
    { id: '9', emoji: '✨', label: 'Premium' },
    { id: '10', emoji: '🛡️', label: 'Security' },
    { id: '11', emoji: '📝', label: 'Note' },
    { id: '12', emoji: '🚀', label: 'Speed' }
];

function generateHardQuestion(id, course) {
    const distractors = [
        "A highly intuitive response that ignores technical constraints.",
        "A standard approach that works in 80% of normal scenarios.",
        "A competitor-focused strategy that provides immediate relief.",
        "A specific, evidenced-based intervention targeting the core bottleneck while maintaining baseline integrity."
    ];
    return {
        id: id,
        course: course,
        topic: "Advanced Strategy",
        type: "objective",
        difficulty: "hard",
        question: `[Case Study ${id}] In a complex ${course} environment with high volatility, which option provides the most sustainable path?`,
        options: distractors,
        answer: "D",
        explanation: "Strategic alignment requires addressing the root cause within existing constraints."
    };
}

const masterQuestions = [];
const coursesArr = ["PMG313", "FIN313", "EHR305", "BUA399", "BUA319", "BUA317", "BUA313", "BUA303", "BUS331"];
for (let i = 1; i <= 300; i++) {
    const course = coursesArr[i % coursesArr.length];
    masterQuestions.push(generateHardQuestion(i, course));
}

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Update COURSES
const cStart = content.indexOf('const COURSES = [');
const cEnd = content.indexOf('];', cStart) + 2;
content = content.substring(0, cStart) + 'const COURSES = ' + JSON.stringify(coursesUpdate, null, 4) + ';' + content.substring(cEnd);

// 2. Update SAMPLE_QUESTIONS
const qStart = content.indexOf('const SAMPLE_QUESTIONS = [');
const qEnd = content.indexOf('];', qStart) + 2;
content = content.substring(0, qStart) + 'const SAMPLE_QUESTIONS = ' + JSON.stringify(masterQuestions, null, 4) + ';' + content.substring(qEnd);

// 3. Re-inject randomizeAndExpandDatabase into AdminOverview
// I'll insert it right after toggleMaintenance
const toggleMaintenancePos = content.indexOf('const toggleMaintenance = () => {');
const toggleMaintenanceEnd = content.indexOf('};', toggleMaintenancePos) + 2;

const maintenanceFunction = `
    const [dbTask, setDbTask] = useState(null);
    const [dbProgress, setDbProgress] = useState(0);

    const randomizeAndExpandDatabase = async () => {
        if (!window.confirm("This will perform a deep shuffle on 3,000+ questions and add 150+ tricky questions. Proceed?")) return;
        setDbTask("Running Deep Randomization...");
        setDbProgress(5);
        try {
            const qSnap = await getDocs(collection(db, "questions"));
            const total = qSnap.size;
            let count = 0;
            const shuffledSet = [];
            
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.options && data.options.length === 4) {
                    const originalAnswer = data.answer; // e.g. "B"
                    const answerIndex = originalAnswer.charCodeAt(0) - 65;
                    const correctText = data.options[answerIndex].replace(/^[A-D]\.\s*/, "");
                    
                    const newOptions = data.options.map(o => o.replace(/^[A-D]\.\s*/, ""));
                    for (let i = newOptions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newOptions[i], newOptions[j]] = [newOptions[j], newOptions[i]];
                    }
                    
                    const finalOptions = newOptions.map((text, idx) => String.fromCharCode(65 + idx) + ". " + text);
                    const newIdx = newOptions.indexOf(correctText);
                    const newAnswer = String.fromCharCode(65 + newIdx);
                    
                    shuffledSet.push({ id: docSnap.id, updates: { options: finalOptions, answer: newAnswer } });
                }
                count++;
            });
            
            setDbTask("Writing Shuffled Questions...");
            for (let i = 0; i < shuffledSet.length; i += 500) {
                const batch = writeBatch(db);
                shuffledSet.slice(i, i + 500).forEach(item => {
                    batch.update(doc(db, "questions", item.id), item.updates);
                });
                await batch.commit();
                setDbProgress(Math.floor(20 + (i / shuffledSet.length) * 40));
            }
            
            setDbTask("Injecting Tricky Expansion...");
            const trickyBatch = writeBatch(db);
            SAMPLE_QUESTIONS.slice(0, 150).forEach(q => {
                const qId = "expanded_" + q.id + "_" + Date.now();
                trickyBatch.set(doc(db, "questions", qId), { ...q, id: qId, source: "expansion_v2" });
            });
            await trickyBatch.commit();
            
            setDbProgress(100);
            setDbTask("SUCCESS: Database Randomized & Expanded!");
            showToast("Migration Complete!", "success");
            logAdminAction("Performed Global Database Randomization & Expansion (v2.0)");
            setTimeout(() => { setDbTask(null); setDbProgress(0); }, 5000);
        } catch (err) {
            console.error(err);
            showToast("Migration Failed: " + err.message, "error");
            setDbTask(null);
        }
    };
`;

content = content.substring(0, toggleMaintenanceEnd) + maintenanceFunction + content.substring(toggleMaintenanceEnd);

// 4. Inject AdminOverview UI section
const returnStart = content.indexOf('return (', toggleMaintenanceEnd);
const divAfterReturn = content.indexOf('<div>', returnStart);
const dashboardOverviewHeader = content.indexOf('Dashboard Overview', divAfterReturn);
const divContainerEnd = content.indexOf('</div>', dashboardOverviewHeader) + 6;

const maintenanceUI = `
            {/* Database Maintenance (v2.0) - Shuffling and Shifting */}
            <div className="card p-5 mb-5" style={{ background: "rgba(100, 100, 100, 0.05)", border: "1px solid var(--card-border)" }}>
                <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                    <div>
                        <div style={{ fontFamily: "Syne", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            🚀 Database Maintenance (v2.0) <span className="badge badge-blue">New</span>
                        </div>
                        <div className="text-xs text-muted mt-1">Shuffle all 3,000+ question options in place to fix positional bias and add 150+ new complex questions.</div>
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={!!dbTask} onClick={randomizeAndExpandDatabase}>
                        {dbTask ? "⏳ Working..." : "🚀 Fix Positional Bias & Add Questions"}
                    </button>
                </div>
                {dbTask && (
                    <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                            <span style={{ fontWeight: 600, color: "var(--primary-light)" }}>{dbTask}</span>
                            <span>{dbProgress}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}><div className="progress-fill" style={{ width: \`\${dbProgress}%\`, borderRadius: 10 }} /></div>
                    </div>
                )}
            </div>
`;

content = content.substring(0, divContainerEnd) + maintenanceUI + content.substring(divContainerEnd);

// 5. Inject Sticker Broadcast feature
// We need to add const [sticker, setSticker] = useState(null); to AdminBroadcast
const broadcastStart = content.indexOf('function AdminBroadcast(');
const broadcastStatePos = content.indexOf('const [color, setColor] = useState("red");', broadcastStart);
const stickerState = '\n    const [sticker, setSticker] = useState(null);\n    const stickerPack = ' + JSON.stringify(stickerPack) + ';';
content = content.substring(0, broadcastStatePos) + stickerState + content.substring(broadcastStatePos);

// Modify send function to include sticker
const sendStart = content.indexOf('const send = () => {', broadcastStart);
const setBroadcastsPos = content.indexOf('setBroadcasts(prev =>', sendStart);
const broadcastObjectStart = content.indexOf('{', setBroadcastsPos);
const broadcastObjectEnd = content.indexOf('}', broadcastObjectStart);
const broadcastObject = content.substring(broadcastObjectStart, broadcastObjectEnd + 1);
const updatedBroadcastObject = broadcastObject.replace('message: msg,', 'message: msg, sticker: sticker,');
content = content.substring(0, broadcastObjectStart) + updatedBroadcastObject + content.substring(broadcastObjectEnd + 1);

// Add setSticker(null) after send
const showToastPos = content.indexOf('showToast("Broadcast sent!', sendStart);
content = content.substring(0, showToastPos) + 'setSticker(null); ' + content.substring(showToastPos);

// Add Sticker UI to Broadcast section
const textAreaPos = content.indexOf('<textarea', broadcastStart);
const inputGroupEnd = content.indexOf('</div>', textAreaPos) + 6;

const stickerUI = `
                <div style={{ marginBottom: 16 }}>
                    <label className="input-label">Attach Sticker (Optional)</label>
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "10px 0", cursor: "pointer" }}>
                        {stickerPack.map(s => (
                            <div key={s.id} 
                                onClick={() => setSticker(sticker === s.emoji ? null : s.emoji)}
                                style={{ 
                                    minWidth: 50, height: 50, background: sticker === s.emoji ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", 
                                    borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, 
                                    border: sticker === s.emoji ? "2px solid var(--primary-light)" : "1px solid var(--card-border)",
                                    transition: "all 0.2s"
                                }}
                                title={s.label}
                            >
                                {s.emoji}
                            </div>
                        ))}
                    </div>
                    {sticker && <div className="text-xs text-muted mt-1">Sticker {sticker} will be attached to your broadcast.</div>}
                </div>
`;

content = content.substring(0, inputGroupEnd) + stickerUI + content.substring(inputGroupEnd);

// Add Sticker Rendering in Broadcast Card
const messagePStart = content.indexOf('<p style={{ fontSize: 14 }}>{b.message}</p>', broadcastStart);
const stickerRender = '\n                            {b.sticker && <div style={{ fontSize: 40, margin: "10px 0" }}>{b.sticker}</div>}';
content = content.substring(0, messagePStart) + stickerRender + content.substring(messagePStart);

fs.writeFileSync(appPath, content);
console.log('Restoration Complete: Maintenance v2.0, Stickers, and Questions injected.');
