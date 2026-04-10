import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, updateEmail, reauthenticateWithCredential, EmailAuthProvider, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc, getDoc, collection, onSnapshot, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SUPER_ADMIN = { matric: "23110821060", password: "Dexter20" };

const ADMINS = [
    { matric: "23110821060", password: "Dexter20", name: "Esuh Simeon Chioma", role: "superadmin" },
    { matric: "23110821177", password: "UMUNNAKWE", name: "UMUNNAKWE PRECIOUS MMESOMA", role: "admin" },
    { matric: "23110821067", password: "HENSHAW", name: "Henshaw", role: "admin" },
    { matric: "2311000000", password: "HOC", name: "HOC Admin", role: "admin" },
    { matric: "2311000001", password: null, name: "OTP Admin", role: "admin", otp: true },
];

const FACULTIES = [
    { name: "Faculty of Management Sciences", departments: ["Business Administration", "Accounting", "Marketing", "Finance", "Insurance", "Banking & Finance", "Office Technology & Management"] },
    { name: "Faculty of Engineering", departments: ["Civil Engineering", "Electrical/Electronic Engineering", "Mechanical Engineering", "Chemical Engineering", "Computer Engineering", "Agricultural Engineering"] },
    { name: "Faculty of Science", departments: ["Biology", "Chemistry", "Computer Science", "Mathematics", "Physics", "Statistics", "Biochemistry", "Microbiology", "Industrial Chemistry"] },
    { name: "Faculty of Arts", departments: ["English", "History & International Studies", "Linguistics", "Philosophy", "Theatre Arts", "Creative Arts"] },
    { name: "Faculty of Social Sciences", departments: ["Economics", "Geography", "Political Science", "Psychology", "Sociology"] },
    { name: "Faculty of Law", departments: ["Law"] },
    { name: "Faculty of Education", departments: ["Educational Management", "Physical & Health Education", "Guidance & Counselling", "Adult Education", "Science Education", "Arts & Social Science Education"] },
    { name: "Faculty of Agriculture", departments: ["Agricultural Economics", "Animal Husbandry", "Crop Production", "Food Science & Technology", "Fisheries"] },
    { name: "Faculty of Communication & Media Studies", departments: ["Mass Communication", "Library & Information Science"] },
    { name: "Faculty of Environmental Sciences", departments: ["Architecture", "Urban & Regional Planning", "Estate Management", "Surveying & Geoinformatics", "Building Technology", "Quantity Surveying"] },
    { name: "Faculty of Basic Medical Sciences", departments: ["Anatomy", "Physiology", "Pharmacology"] },
    { name: "Faculty of Clinical Sciences", departments: ["Medicine & Surgery", "Dentistry", "Nursing Science"] },
];

const DEFAULT_PLANS = [
    { id: "single", name: "Single Course", price: "₦500", amount: 500, duration: "1 Month", durationDays: 30, description: "One specific course" },
    { id: "dept_monthly", name: "Department Full", price: "₦3,000", amount: 3000, duration: "1 Month", durationDays: 30, description: "All courses in department" },
    { id: "dept_extended", name: "Department Extended", price: "₦5,000", amount: 5000, duration: "3 Months", durationDays: 90, description: "All courses in department" },
    { id: "premium", name: "Premium All Access", price: "₦10,000", amount: 10000, duration: "3 Months", durationDays: 90, description: "All courses in ALL faculties" },
    { id: "busadmin_special", name: "🎓 BusAdmin Special Offer", price: "₦2,000", amount: 2000, duration: "Exam Period", durationDays: 30, description: "All 8 courses — Part-Time Business Admin, OJO Campus 2025/2026", special: true },
];

const COURSES = [
    { code: "PMG313", name: "Project Scope Management", department: "Business Administration", level: "300" },
    { code: "FIN313", name: "Financial Management", department: "Business Administration", level: "300" },
    { code: "EHR305", name: "Compensation and Benefit Management", department: "Business Administration", level: "300" },
    { code: "BUA399", name: "Research Methods", department: "Business Administration", level: "300" },
    { code: "BUA319", name: "E-Commerce", department: "Business Administration", level: "300" },
    { code: "BUA317", name: "Entrepreneurship for Managers", department: "Business Administration", level: "300" },
    { code: "BUA313", name: "Innovation Management", department: "Business Administration", level: "300" },
    { code: "BUA303", name: "Management Theory", department: "Business Administration", level: "300" },
];

const TERMS = `TERMS AND CONDITIONS — SIMYC EXAM PREP NG

1. ACCEPTANCE OF TERMS
By registering on Simyc Exam Prep NG, you agree to be bound by these Terms and Conditions.

2. ELIGIBILITY
This platform is intended exclusively for students of Lagos State University (LASU).

3. USER ACCOUNT
You are responsible for maintaining the confidentiality of your login credentials. Sharing your account is strictly prohibited.

4. PAYMENT POLICY
All payments are non-refundable once access has been granted. Subscriptions expire at the end of the stated period.

5. CONTENT USE
All questions and resources are proprietary. You may not copy or distribute any content without written permission.

6. PROHIBITED CONDUCT
Users must not attempt to hack the platform, share credentials, or use automated tools to access content.

7. PRIVACY
Your personal data is collected for account management only. We do not sell or share your data.

8. DISCLAIMER
Questions are for practice purposes only. We do not guarantee questions will appear in actual exams.

9. TERMINATION
We reserve the right to suspend accounts that violate these terms.

10. CONTACT
simycesuh@gmail.com | WhatsApp: +234 815 399 6360`;

const SAMPLE_QUESTIONS = [
    // PMG313 - Easy
    { id: 1, course: "PMG313", topic: "Project Scope Management", type: "objective", difficulty: "easy", question: "Which process involves defining and documenting stakeholders' needs to meet project objectives?", options: ["A. Collect Requirements", "B. Define Scope", "C. Create WBS", "D. Control Scope"], answer: "A", explanation: "Collect Requirements determines, documents, and manages stakeholder needs." },
    { id: 2, course: "PMG313", topic: "Project Scope Management", type: "objective", difficulty: "easy", question: "WBS stands for:", options: ["A. Work Budget Summary", "B. Work Breakdown Structure", "C. Work Benefit Schedule", "D. Work Balance Sheet"], answer: "B", explanation: "WBS = Work Breakdown Structure — a hierarchical decomposition of project scope." },
    { id: 3, course: "PMG313", topic: "Project Scope Management", type: "objective", difficulty: "medium", question: "Scope creep refers to:", options: ["A. Planned scope changes", "B. Unauthorized scope changes", "C. Scope reduction", "D. Budget increase"], answer: "B", explanation: "Scope creep is the uncontrolled expansion of project scope without approval." },
    { id: 4, course: "PMG313", topic: "Project Scope Management", type: "fill", difficulty: "medium", question: "The ________ defines the project boundaries and deliverables.", answer: "Project Scope Statement", explanation: "The Project Scope Statement documents what is and is not included in the project." },
    { id: 5, course: "PMG313", topic: "Project Scope Management", type: "objective", difficulty: "hard", question: "Which document formally authorizes a project?", options: ["A. Project Scope Statement", "B. Project Charter", "C. WBS Dictionary", "D. Stakeholder Register"], answer: "B", explanation: "The Project Charter formally authorizes the project." },
    { id: 6, course: "PMG313", topic: "Project Scope Management", type: "objective", difficulty: "hard", question: "Validated deliverables are an output of which process?", options: ["A. Define Scope", "B. Control Scope", "C. Validate Scope", "D. Create WBS"], answer: "C", explanation: "Validate Scope formalizes acceptance of completed deliverables." },
    { id: 7, course: "PMG313", topic: "Project Scope Management", type: "theory", difficulty: "hard", question: "Explain the difference between product scope and project scope.", answer: "Product scope = features of the product. Project scope = work needed to deliver it.", explanation: "Both must align for successful delivery." },
    // FIN313 - Various difficulty
    { id: 8, course: "FIN313", topic: "Financial Management", type: "objective", difficulty: "easy", question: "Working capital is defined as:", options: ["A. Total assets minus total liabilities", "B. Current assets minus current liabilities", "C. Fixed assets minus long-term liabilities", "D. Total revenue minus total expenses"], answer: "B", explanation: "Working capital = Current Assets - Current Liabilities." },
    { id: 9, course: "FIN313", topic: "Financial Management", type: "objective", difficulty: "easy", question: "Which ratio measures a company's ability to pay short-term obligations?", options: ["A. Debt ratio", "B. Return on equity", "C. Current ratio", "D. Gross margin"], answer: "C", explanation: "Current ratio = Current Assets / Current Liabilities." },
    { id: 10, course: "FIN313", topic: "Financial Management", type: "fill", difficulty: "medium", question: "NPV discounts future cash flows at the ________ rate.", answer: "discount", explanation: "NPV uses the discount rate to bring future values to present value." },
    { id: 11, course: "FIN313", topic: "Financial Management", type: "objective", difficulty: "medium", question: "Depreciation is best described as:", options: ["A. Cash outflow", "B. Non-cash expense", "C. Revenue reduction", "D. Tax payment"], answer: "B", explanation: "Depreciation is a non-cash expense allocating asset cost over its useful life." },
    { id: 12, course: "FIN313", topic: "Financial Management", type: "objective", difficulty: "hard", question: "Which of these is NOT a source of long-term finance?", options: ["A. Debentures", "B. Retained earnings", "C. Bank overdraft", "D. Ordinary shares"], answer: "C", explanation: "Bank overdraft is a short-term finance source." },
    // BUA303 - Various difficulty
    { id: 13, course: "BUA303", topic: "Management Theory", type: "objective", difficulty: "easy", question: "Frederick Taylor is known for:", options: ["A. Human Relations Theory", "B. Scientific Management", "C. Systems Theory", "D. Contingency Theory"], answer: "B", explanation: "Taylor developed Scientific Management, focusing on efficiency." },
    { id: 14, course: "BUA303", topic: "Management Theory", type: "objective", difficulty: "easy", question: "Maslow's Hierarchy places ________ at the highest level.", options: ["A. Safety needs", "B. Social needs", "C. Esteem needs", "D. Self-actualization"], answer: "D", explanation: "Self-actualization represents full personal potential." },
    { id: 15, course: "BUA303", topic: "Management Theory", type: "objective", difficulty: "medium", question: "Henri Fayol's 14 principles include:", options: ["A. Unity of command", "B. Theory X and Y", "C. Scientific method", "D. Systems approach"], answer: "A", explanation: "Unity of command: each employee receives orders from one superior." },
    { id: 16, course: "BUA303", topic: "Management Theory", type: "objective", difficulty: "hard", question: "The Hawthorne studies led to:", options: ["A. Scientific Management", "B. Human Relations Movement", "C. Bureaucratic Theory", "D. Contingency Theory"], answer: "B", explanation: "Hawthorne studies showed human factors affect productivity." },
    // BUA317
    { id: 17, course: "BUA317", topic: "Entrepreneurship", type: "objective", difficulty: "easy", question: "An entrepreneur is best defined as:", options: ["A. A government employee", "B. Someone who creates and manages a business", "C. A bank manager", "D. A stock trader"], answer: "B", explanation: "Entrepreneurs create and manage businesses, taking on financial risks." },
    { id: 18, course: "BUA317", topic: "Entrepreneurship", type: "objective", difficulty: "medium", question: "Which of the following is NOT a characteristic of an entrepreneur?", options: ["A. Risk-taking", "B. Innovation", "C. Risk aversion", "D. Leadership"], answer: "C", explanation: "Entrepreneurs are risk-takers, not risk-averse." },
    // BUA313
    { id: 19, course: "BUA313", topic: "Innovation Management", type: "objective", difficulty: "easy", question: "Innovation management refers to:", options: ["A. Managing employee conflicts", "B. Managing the process of innovation in organizations", "C. Managing financial assets", "D. Managing supply chains"], answer: "B", explanation: "Innovation management handles the process of bringing new ideas to market." },
    { id: 20, course: "BUA313", topic: "Innovation Management", type: "objective", difficulty: "medium", question: "Disruptive innovation typically:", options: ["A. Improves existing products", "B. Creates new markets or displaces existing ones", "C. Reduces employee count", "D. Increases regulatory compliance"], answer: "B", explanation: "Disruptive innovation creates new markets or displaces established ones." },
    // BUA319
    { id: 21, course: "BUA319", topic: "E-Commerce", type: "objective", difficulty: "easy", question: "E-Commerce stands for:", options: ["A. Electronic Communication", "B. Electronic Commerce", "C. Extended Commerce", "D. Enhanced Commerce"], answer: "B", explanation: "E-Commerce = Electronic Commerce — buying/selling via the internet." },
    { id: 22, course: "BUA319", topic: "E-Commerce", type: "objective", difficulty: "medium", question: "B2B e-commerce refers to:", options: ["A. Business to Browser", "B. Business to Business", "C. Buyer to Business", "D. Business to Buyer"], answer: "B", explanation: "B2B = Business to Business transactions online." },
    // BUA399
    { id: 23, course: "BUA399", topic: "Research Methods", type: "objective", difficulty: "easy", question: "A hypothesis is:", options: ["A. A proven fact", "B. A testable prediction or statement", "C. A research conclusion", "D. A data collection tool"], answer: "B", explanation: "A hypothesis is a testable statement made before research." },
    { id: 24, course: "BUA399", topic: "Research Methods", type: "objective", difficulty: "medium", question: "Quantitative research uses:", options: ["A. Interviews only", "B. Numerical data and statistics", "C. Observations only", "D. Case studies"], answer: "B", explanation: "Quantitative research collects numerical data for statistical analysis." },
    // EHR305
    { id: 25, course: "EHR305", topic: "Compensation & Benefits", type: "objective", difficulty: "easy", question: "Compensation management refers to:", options: ["A. Managing employee grievances", "B. Managing pay and benefits for employees", "C. Managing company assets", "D. Managing customer relations"], answer: "B", explanation: "Compensation management covers all aspects of employee pay and benefits." },
    { id: 26, course: "EHR305", topic: "Compensation & Benefits", type: "objective", difficulty: "medium", question: "Which is NOT a type of employee benefit?", options: ["A. Health insurance", "B. Pension plan", "C. Stock options", "D. Office furniture"], answer: "D", explanation: "Office furniture is a workplace resource, not an employee benefit." },
    // BUS331
    { id: 27, course: "BUS331", topic: "Business Industrial Visit", type: "objective", difficulty: "easy", question: "The primary purpose of an industrial visit is:", options: ["A. Tourism", "B. Practical exposure to business operations", "C. Entertainment", "D. Sports activities"], answer: "B", explanation: "Industrial visits expose students to real-world business operations." },
    { id: 28, course: "BUS331", topic: "Business Industrial Visit", type: "objective", difficulty: "medium", question: "A report after an industrial visit should include:", options: ["A. Only photographs", "B. Observations, findings and recommendations", "C. A list of employees", "D. Company financial statements"], answer: "B", explanation: "A good industrial visit report covers observations, findings and recommendations." },
];

// ─── UTILITY ─────────────────────────────────────────────────────────────────

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Firestore doc IDs cannot contain "/" and are easier to debug when stable.
const safeDocId = (raw) => {
    const s = String(raw ?? "");
    return s
        .replaceAll("/", "-")
        .replaceAll("\\", "-")
        .replaceAll("#", "-")
        .replaceAll("?", "-")
        .replaceAll("[", "(")
        .replaceAll("]", ")")
        .replace(/\s+/g, "_")
        .slice(0, 140);
};

const genId = (prefix = "id") => safeDocId(`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

/** Stable key for payment docs — must match Firestore document id (see snapshot merge). */
const paymentDocKey = (p) => {
    if (p?.id != null && String(p.id).trim() !== "") return String(p.id);
    return safeDocId(`${p?.matric || ""}_${p?.time || ""}`) || genId("pay");
};

/** Stable key for notification docs — must match Firestore document id (see snapshot merge). */
const notificationDocKey = (n) => {
    if (n?.id != null && String(n.id).trim() !== "") return String(n.id);
    return safeDocId(`${n?.time || ""}_${n?.subject || ""}`) || genId("notif");
};

const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }
        catch { return defaultValue; }
    });
    useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { } }, [key, value]);
    return [value, setValue];
};

const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
};

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB") : "—";

const compressImage = (file, maxWidth = 600, quality = 0.5) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --primary: #2563eb; --primary-dark: #1e3a8a; --primary-light: #60a5fa;
    --bg: #020617; --card: #0f172a; --card-border: #1e293b;
    --text: #f1f5f9; --text-muted: #94a3b8;
    --success: #16a34a; --warning: #f59e0b; --danger: #dc2626;
    --gradient: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
    --card-glass: rgba(15,23,42,0.75);
  }
  body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden; user-select:none; -webkit-user-select:none; }
  h1,h2,h3,h4 { font-family:'Syne',sans-serif; }
  .app-wrapper { min-height:100vh; background:var(--bg); position:relative; }
  .bg-blobs { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .blob { position:absolute; border-radius:50%; filter:blur(90px); opacity:0.10; animation:blobMove 14s ease-in-out infinite alternate; }
  .blob1 { width:600px; height:600px; background:#2563eb; top:-150px; left:-150px; }
  .blob2 { width:450px; height:450px; background:#60a5fa; bottom:-100px; right:-100px; animation-delay:4s; }
  .blob3 { width:350px; height:350px; background:#1e3a8a; top:40%; left:40%; animation-delay:8s; }
  @keyframes blobMove { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(50px,-50px) scale(1.15)} }
  .page { position:relative; z-index:1; min-height:100vh; animation:fadeUp 0.5s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .card { background:var(--card-glass); border:1px solid var(--card-border); border-radius:18px; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); transition:border-color 0.3s,box-shadow 0.3s,transform 0.2s; }
  .card:hover { border-color:rgba(96,165,250,0.3); box-shadow:0 8px 32px rgba(37,99,235,0.12); }
  .card-lifted:hover { transform:translateY(-3px); }
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 24px; border-radius:12px; border:none; cursor:pointer; font-family:'Syne',sans-serif; font-weight:600; font-size:14px; transition:all 0.2s; text-decoration:none; }
  .btn:active { transform:scale(0.96); }
  .btn-primary { background:var(--gradient); color:#fff; box-shadow:0 4px 20px rgba(37,99,235,0.35); }
  .btn-primary:hover { box-shadow:0 6px 28px rgba(37,99,235,0.55); transform:translateY(-1px); }
  .btn-outline { background:transparent; color:var(--primary-light); border:1px solid var(--primary); }
  .btn-outline:hover { background:rgba(37,99,235,0.12); }
  .btn-danger { background:var(--danger); color:#fff; }
  .btn-danger:hover { background:#b91c1c; }
  .btn-success { background:var(--success); color:#fff; }
  .btn-success:hover { background:#15803d; }
  .btn-ghost { background:transparent; color:var(--text-muted); }
  .btn-ghost:hover { color:var(--text); background:var(--card); }
  .btn-sm { padding:8px 16px; font-size:12px; border-radius:9px; }
  .btn-full { width:100%; }
  .btn:disabled { opacity:0.45; cursor:not-allowed; transform:none !important; }
  .btn-logout { background:rgba(220,38,38,0.1); color:#f87171; border:1px solid rgba(220,38,38,0.25); padding:8px 14px; border-radius:10px; font-size:13px; font-family:'Syne',sans-serif; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s; }
  .btn-logout:hover { background:rgba(220,38,38,0.2); }
  .input-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .input-label { font-size:12px; font-weight:600; color:var(--text-muted); letter-spacing:0.6px; text-transform:uppercase; }
  .input-field { background:rgba(15,23,42,0.85); border:1px solid var(--card-border); border-radius:11px; padding:12px 16px; color:var(--text); font-family:'Outfit',sans-serif; font-size:15px; transition:border-color 0.2s,box-shadow 0.2s; outline:none; width:100%; }
  .input-field:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
  .input-field::placeholder { color:var(--text-muted); opacity:0.55; }
  select.input-field { cursor:pointer; }
  select.input-field option { background:#0f172a; }
  .topnav { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:rgba(2,6,23,0.85); border-bottom:1px solid var(--card-border); backdrop-filter:blur(14px); position:sticky; top:0; z-index:100; }
  .topnav-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:17px; }
  .topnav-logo span { background:var(--gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .topnav-actions { display:flex; align-items:center; gap:10px; }
  .avatar-btn { width:42px; height:42px; border-radius:50%; background:var(--gradient); border:2px solid rgba(96,165,250,0.4); cursor:pointer; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:18px; transition:all 0.2s; position:relative; }
  .avatar-btn:hover { border-color:var(--primary-light); box-shadow:0 0 0 3px rgba(37,99,235,0.2); }
  .avatar-btn img { width:100%; height:100%; object-fit:cover; }
  .badge { display:inline-flex; align-items:center; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .badge-blue { background:rgba(37,99,235,0.18); color:var(--primary-light); border:1px solid rgba(37,99,235,0.3); }
  .badge-green { background:rgba(22,163,74,0.18); color:#4ade80; border:1px solid rgba(22,163,74,0.3); }
  .badge-red { background:rgba(220,38,38,0.18); color:#f87171; border:1px solid rgba(220,38,38,0.3); }
  .badge-yellow { background:rgba(245,158,11,0.18); color:#fbbf24; border:1px solid rgba(245,158,11,0.3); }
  .notif-bell { position:relative; cursor:pointer; padding:8px; border-radius:10px; transition:background 0.2s; }
  .notif-bell:hover { background:var(--card); }
  .notif-count { position:absolute; top:2px; right:2px; background:var(--danger); color:#fff; font-size:9px; font-weight:800; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .divider { height:1px; background:var(--card-border); margin:18px 0; }
  .text-gradient { background:var(--gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .text-muted { color:var(--text-muted); }
  .text-sm { font-size:13px; } .text-xs { font-size:11px; } .text-center { text-align:center; }
  .mt-4{margin-top:16px} .mt-6{margin-top:24px} .mb-4{margin-bottom:16px} .mb-6{margin-bottom:24px}
  .flex{display:flex} .flex-col{flex-direction:column} .items-center{align-items:center}
  .justify-between{justify-content:space-between} .justify-center{justify-content:center}
  .gap-2{gap:8px} .gap-3{gap:12px} .gap-4{gap:16px}
  .w-full{width:100%} .p-4{padding:16px} .p-6{padding:24px} .p-8{padding:32px}
  .pointer{cursor:pointer} .flex-wrap{flex-wrap:wrap}
  .timer-blue{color:var(--primary-light)} .timer-yellow{color:var(--warning)} .timer-red{color:var(--danger);animation:pulse 1s ease infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  .progress-bar{height:5px;background:var(--card-border);border-radius:99px;overflow:hidden}
  .progress-fill{height:100%;background:var(--gradient);border-radius:99px;transition:width 0.4s ease}
  .modal-overlay{position:fixed;inset:0;background:rgba(2,6,23,0.88);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px);animation:fadeIn 0.2s ease}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{max-width:500px;width:100%;max-height:88vh;overflow-y:auto;padding:28px}
  .modal-wide{max-width:660px}
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--card-border);border-radius:3px}
  .option-btn{display:flex;align-items:center;gap:12px;width:100%;padding:13px 16px;background:rgba(15,23,42,0.65);border:1px solid var(--card-border);border-radius:11px;color:var(--text);font-size:14px;cursor:pointer;transition:all 0.2s;text-align:left;font-family:'Outfit',sans-serif;margin-bottom:9px}
  .option-btn:hover{border-color:var(--primary);background:rgba(37,99,235,0.1)}
  .option-btn.selected{border-color:var(--primary);background:rgba(37,99,235,0.18)}
  .option-btn.correct{border-color:var(--success);background:rgba(22,163,74,0.18)}
  .option-btn.wrong{border-color:var(--danger);background:rgba(220,38,38,0.12)}
  .option-key{width:30px;height:30px;border-radius:7px;background:var(--card-border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;font-family:'Syne',sans-serif}
  .stat-card{padding:20px}
  .stat-value{font-size:26px;font-weight:800;font-family:'Syne',sans-serif}
  .stat-label{font-size:11px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
  .stat-card-clickable{cursor:pointer;transition:all 0.2s}
  .stat-card-clickable:hover{border-color:var(--primary-light);transform:translateY(-3px);box-shadow:0 8px 24px rgba(37,99,235,0.2)}
  .floating{animation:float 3s ease-in-out infinite alternate;display:inline-block}
  .floating-delay{animation:float 3s ease-in-out 1.5s infinite alternate;display:inline-block}
  @keyframes float{from{transform:translateY(0)}to{transform:translateY(-12px)}}
  .welcome-hero{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 24px;text-align:center}
  .welcome-icon-wrap{width:70px;height:70px;border-radius:20px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.25);display:flex;align-items:center;justify-content:center;font-size:30px}
  .checkbox-group{display:flex;align-items:flex-start;gap:12px;padding:14px;background:var(--card);border:1px solid var(--card-border);border-radius:12px;cursor:pointer;margin-bottom:10px}
  .checkbox-group input[type="checkbox"]{width:18px;height:18px;accent-color:var(--primary);cursor:pointer;flex-shrink:0;margin-top:2px}
  .admin-layout{display:flex;min-height:100vh}
  .admin-sidebar{width:230px;background:rgba(10,18,42,0.95);border-right:1px solid var(--card-border);padding:20px 0;position:fixed;top:0;left:0;height:100vh;overflow-y:auto;z-index:50}
  .admin-main{margin-left:230px;flex:1;padding:24px}
  .sidebar-item{display:flex;align-items:center;gap:10px;padding:11px 18px;cursor:pointer;transition:all 0.2s;font-size:13px;color:var(--text-muted);font-family:'Syne',sans-serif;font-weight:500}
  .sidebar-item:hover{background:rgba(37,99,235,0.1);color:var(--text)}
  .sidebar-item.active{background:rgba(37,99,235,0.14);color:var(--primary-light);border-right:2px solid var(--primary)}
  .broadcast{padding:10px 20px;font-weight:700;font-size:13px;text-align:center;font-family:'Syne',sans-serif}
  .broadcast-red{background:rgba(220,38,38,0.18);border-bottom:1px solid rgba(220,38,38,0.35);color:#f87171}
  .broadcast-yellow{background:rgba(245,158,11,0.18);border-bottom:1px solid rgba(245,158,11,0.35);color:#fbbf24}
  .broadcast-green{background:rgba(22,163,74,0.18);border-bottom:1px solid rgba(22,163,74,0.35);color:#4ade80}
  .profile-avatar-large{width:90px;height:90px;border-radius:50%;background:var(--gradient);border:3px solid rgba(96,165,250,0.4);display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden;cursor:pointer;position:relative;margin:0 auto 12px}
  .profile-avatar-large img{width:100%;height:100%;object-fit:cover}
  .profile-avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;border-radius:50%;font-size:20px}
  .profile-avatar-large:hover .profile-avatar-overlay{opacity:1}
  /* Special plan glow */
  .plan-special{border:2px solid #f59e0b !important;background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(22,163,74,0.08)) !important;position:relative;overflow:hidden}
  .plan-special::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(22,163,74,0.06));animation:shimmer 2s ease infinite alternate}
  @keyframes shimmer{from{opacity:0.5}to{opacity:1}}
  /* Calculator */
  .calc-fab{position:fixed;bottom:80px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--gradient);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 20px rgba(37,99,235,0.4);z-index:500;transition:all 0.2s}
  .calc-fab:hover{transform:scale(1.1)}
  .calc-popup{position:fixed;bottom:148px;right:20px;width:240px;background:rgba(10,18,42,0.97);border:1px solid var(--card-border);border-radius:18px;padding:16px;z-index:501;backdrop-filter:blur(20px);animation:fadeUp 0.2s ease}
  .calc-display{background:rgba(0,0,0,0.4);border-radius:10px;padding:12px 16px;text-align:right;font-family:'Syne',sans-serif;font-size:22px;font-weight:700;margin-bottom:12px;min-height:52px;color:#fff;border:1px solid var(--card-border);word-break:break-all}
  .calc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  .calc-btn{padding:12px 4px;border:none;border-radius:9px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:600;font-size:14px;transition:all 0.15s}
  .calc-btn:active{transform:scale(0.93)}
  .calc-num{background:rgba(37,99,235,0.15);color:var(--text);border:1px solid rgba(37,99,235,0.2)}
  .calc-num:hover{background:rgba(37,99,235,0.28)}
  .calc-op{background:rgba(96,165,250,0.2);color:var(--primary-light);border:1px solid rgba(96,165,250,0.3)}
  .calc-op:hover{background:rgba(96,165,250,0.35)}
  .calc-eq{background:var(--gradient);color:#fff}
  .calc-clear{background:rgba(220,38,38,0.2);color:#f87171;border:1px solid rgba(220,38,38,0.3)}
  /* Maintenance screen */
  .maintenance-screen{position:fixed;inset:0;background:var(--bg);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center}
  /* Draggable calculator */
  .calc-fab{width:52px;height:52px;border-radius:50%;background:var(--gradient);border:none;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 20px rgba(37,99,235,0.4);z-index:500;transition:box-shadow 0.2s;position:fixed;touch-action:none;user-select:none}
  .calc-fab:active{cursor:grabbing;box-shadow:0 8px 32px rgba(37,99,235,0.6)}
  .calc-popup{width:240px;background:rgba(10,18,42,0.97);border:1px solid var(--card-border);border-radius:18px;padding:16px;z-index:501;backdrop-filter:blur(20px);animation:fadeUp 0.2s ease;position:fixed;touch-action:none}
  /* Difficulty badges */
  .diff-easy{background:rgba(22,163,74,0.18);color:#4ade80;border:1px solid rgba(22,163,74,0.3)}
  .diff-medium{background:rgba(245,158,11,0.18);color:#fbbf24;border:1px solid rgba(245,158,11,0.3)}
  .diff-hard{background:rgba(220,38,38,0.18);color:#f87171;border:1px solid rgba(220,38,38,0.3)}
  /* Penalty countdown */
  .penalty-banner{padding:20px;background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.3);border-radius:14px;text-align:center;margin-bottom:12px}
  @media(max-width:768px){
    .grid-2{grid-template-columns:1fr}
    .grid-3{grid-template-columns:1fr}
    .grid-4{grid-template-columns:1fr 1fr}
    .admin-sidebar{width:100%;height:auto;position:relative}
    .admin-layout{flex-direction:column}
    .admin-main{margin-left:0}
  }

  .lightbox-modal { position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(8px); animation:fadeIn 0.3s ease; }
  .lightbox-content { position:relative; max-width:90vmin; max-height:90vmin; border-radius:12px; overflow:hidden; box-shadow:0 0 50px rgba(0,0,0,0.8); }
  .lightbox-content img { width:100%; height:100%; object-fit:contain; display:block; }
  .lightbox-close { position:absolute; top:20px; right:20px; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.1); border:none; color:#fff; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; z-index:2001; }
  .lightbox-close:hover { background:rgba(255,255,255,0.2); }

  @media print {
    body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .topnav, .admin-sidebar, .btn, .notif-bell, .badge, .divider, .topnav-actions, .bg-blobs, .no-print, .sidebar-item, .admin-sidebar, button, .modal-overlay, .tab-bar { display: none !important; }
    .page, .admin-main, .app-wrapper { margin: 0 !important; padding: 0 !important; background: white !important; display: block !important; position: static !important; }
    .card { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; color: black !important; margin: 0 0 20px 0 !important; page-break-inside: avoid; }
    .text-gradient { background: none !important; -webkit-text-fill-color: black !important; color: black !important; }
    table { border-collapse: collapse !important; width: 100% !important; margin-bottom: 20px !important; }
    th, td { border: 1px solid #ddd !important; padding: 10px !important; color: black !important; text-align: left !important; }
    .print-title { display: block !important; font-size: 24px !important; font-weight: 800 !important; margin-bottom: 10px !important; color: black !important; }
    .print-meta { font-size: 14px !important; color: #666 !important; margin-bottom: 20px !important; }
  }
`;

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
    const [users, setLocalUsers] = useState([]);
    const [currentUser, setLocalCurrentUser] = useState(null);
    const [authEmailState, setAuthEmailState] = useState(null);
    const [emailAuthModalOpen, setEmailAuthModalOpen] = useState(false);
    const [emailAuthBusy, setEmailAuthBusy] = useState(false);

    useEffect(() => {
        let authEmail = null;
        let currentUsers = [];

        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            const arr = [];
            snap.forEach(d => {
                const data = d.data();
                if (!data) return;
                // Doc id is the canonical matric for user documents
                arr.push({ ...data, matric: data.matric || d.id });
            });
            setLocalUsers(arr);

            // Keep currentUser in perfect sync with Firestore data
            setLocalCurrentUser(prev => {
                if (prev && prev.matric) {
                    const me = arr.find(u => u.matric === prev.matric);
                    // Only update if there's actually a change to prevent unnecessary re-renders
                    if (me && JSON.stringify(me) !== JSON.stringify(prev)) return me;
                } else if (prev && !prev.matric && authEmail) {
                    const me = arr.find(u => u.email?.toLowerCase() === authEmail.toLowerCase());
                    if (me) return me;
                }
                return prev;
            });
        }, (err) => console.error("[Firestore users]", err?.code, err?.message));

        const unsubAuth = onAuthStateChanged(auth, async (fireUser) => {
            if (fireUser) {
                const lowerEmail = fireUser.email.toLowerCase();
                authEmail = lowerEmail;
                setAuthEmailState(lowerEmail);
                // Immediate fetch with case-insensitive query
                const q = query(collection(db, "users"), where("email", "==", lowerEmail));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const me = snap.docs[0].data();
                    if (me.banned || me.isDeleted) {
                        await signOut(auth);
                        setLocalCurrentUser(null);
                        authEmail = null;
                        return;
                    }
                    setLocalCurrentUser(me);
                } else {
                    // Fallback to local search if query is slow or doc ID is matric
                    setLocalCurrentUser({ email: lowerEmail, role: "student" });
                }
            } else {
                authEmail = null;
                setAuthEmailState(null);
                setLocalCurrentUser(null);
            }
        });

        return () => { unsubUsers(); unsubAuth(); };
    }, []);

    // If admin approves an email change, we can only update Firebase Auth email on the student's own device.
    // This modal prompts the student to re-authenticate and updates auth email to match Firestore.
    useEffect(() => {
        const needsAuthUpdate =
            !!currentUser?.matric &&
            !!currentUser?.authEmailNeedsUpdate &&
            !!currentUser?.email &&
            !!authEmailState &&
            authEmailState.toLowerCase() !== currentUser.email.toLowerCase();

        if (needsAuthUpdate) setEmailAuthModalOpen(true);
    }, [currentUser?.matric, currentUser?.authEmailNeedsUpdate, currentUser?.email, authEmailState]);

    const setUsers = useCallback((updateFn) => {
        setLocalUsers(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            // Diffing logic to only write changes to Firestore
            next.forEach(u => {
                if (!u.matric) return;
                const old = prev.find(o => o.matric === u.matric);
                if (!old || JSON.stringify(old) !== JSON.stringify(u)) {
                    setDoc(doc(db, "users", u.matric), u).catch(err => console.error("Firestore Error (users):", err));
                }
            });
            // Handle deletions
            prev.forEach(u => {
                if (!next.find(n => n.matric === u.matric)) {
                    deleteDoc(doc(db, "users", u.matric)).catch(err => console.error("Firestore Delete Error (users):", err));
                }
            });
            return next;
        });
    }, []);

    const setCurrentUser = useCallback((updateFn) => {
        setLocalCurrentUser(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            if (next && next.role !== "superadmin" && next.matric) {
                // Update Firestore and then rely on onSnapshot to keep it perfect
                setDoc(doc(db, "users", next.matric), next, { merge: true }).catch(err => console.error("Firestore Error (currentUser):", err));
            }
            return next;
        });
    }, []);
    const [notifications, setLocalNotifications] = useState([]);
    const [payments, setLocalPayments] = useState([]);
    const [broadcasts, setLocalBroadcasts] = useState([]);
    const setBroadcasts = useCallback((updateFn) => {
        setLocalBroadcasts(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            setTimeout(() => {
                next.forEach(b => {
                    setDoc(doc(db, "broadcasts", b.id || "main"), b).catch(console.error);
                });
                prev.forEach(b => {
                    if (!next.find(n => n.id === b.id)) {
                        deleteDoc(doc(db, "broadcasts", b.id || "main")).catch(console.error);
                    }
                });
            }, 0);
            return next;
        });
    }, []);
    const [adminLogs, setLocalAdminLogs] = useState([]);
    const setAdminLogs = useCallback((updateFn) => {
        setLocalAdminLogs(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            setTimeout(() => {
                next.forEach((l, i) => {
                    const baseId = l.id || `log_${l.time || ""}_${i}`;
                    const lId = safeDocId(baseId) || genId("log");
                    setDoc(doc(db, "admin_logs", lId), { ...l, id: lId }).catch(console.error);
                });
            }, 0);
            return next;
        });
    }, []);
    const [messages, setLocalMessages] = useState([]);

    useEffect(() => {
        const unsubNotifs = onSnapshot(collection(db, "notifications"), snap => {
            const arr = [];
            snap.forEach(d => {
                const data = d.data();
                if (!data) return;
                arr.push({ ...data, id: data.id ?? d.id });
            });
            setLocalNotifications(arr);
        }, err => console.error("[Firestore notifications]", err?.code, err?.message));
        const unsubPayments = onSnapshot(collection(db, "payments"), snap => {
            const arr = [];
            snap.forEach(d => {
                const data = d.data();
                if (!data) return;
                arr.push({ ...data, id: data.id ?? d.id });
            });
            setLocalPayments(arr);
        }, err => console.error("[Firestore payments]", err?.code, err?.message));
        const unsubMessages = onSnapshot(collection(db, "messages"), snap => {
            const arr = [];
            snap.forEach(d => {
                const data = d.data();
                if (!data) return;
                arr.push({ ...data, id: data.id ?? d.id });
            });
            setLocalMessages(arr);
        }, err => console.error("[Firestore messages]", err?.code, err?.message));
        const unsubBroadcasts = onSnapshot(collection(db, "broadcasts"), (snap) => {
            const arr = [];
            snap.forEach(d => {
                const data = d.data();
                if (!data) return;
                arr.push({ ...data, id: data.id ?? d.id });
            });
            setLocalBroadcasts(arr);
        }, err => console.error("[Firestore broadcasts]", err?.code, err?.message));
        const unsubLogs = onSnapshot(collection(db, "admin_logs"), (snap) => {
            const arr = [];
            snap.forEach(d => {
                const data = d.data();
                if (!data) return;
                arr.push({ ...data, id: data.id ?? d.id });
            });
            setLocalAdminLogs(arr);
        }, err => console.error("[Firestore admin_logs]", err?.code, err?.message));
        const unsubPlans = onSnapshot(collection(db, "plans"), (snap) => {
            if (!snap.empty) {
                const arr = [];
                snap.forEach(d => {
                    const data = d.data();
                    if (!data) return;
                    arr.push({ ...data, id: data.id ?? d.id });
                });
                setLocalPlans(arr);
            }
        }, err => console.error("[Firestore plans]", err?.code, err?.message));
        return () => { unsubNotifs(); unsubPayments(); unsubMessages(); unsubPlans(); unsubBroadcasts(); unsubLogs(); };
    }, []);

    const setNotifications = useCallback((updateFn) => {
        setLocalNotifications(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            setTimeout(() => {
                next.forEach(n => {
                    const nId = notificationDocKey(n);
                    const actualN = { ...n, id: nId };
                    const old = prev.find(o => notificationDocKey(o) === nId);
                    if (!old || JSON.stringify(old) !== JSON.stringify(actualN)) {
                        setDoc(doc(db, "notifications", nId), actualN).catch(console.error);
                    }
                });
                prev.forEach(n => {
                    const nId = notificationDocKey(n);
                    if (nId && !next.find(o => notificationDocKey(o) === nId)) {
                        deleteDoc(doc(db, "notifications", nId)).catch(console.error);
                    }
                });
            }, 0);
            return next;
        });
    }, []);

    const setPayments = useCallback((updateFn) => {
        setLocalPayments(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            setTimeout(() => {
                next.forEach(p => {
                    const pId = paymentDocKey(p);
                    const actualP = { ...p, id: pId };
                    const old = prev.find(o => paymentDocKey(o) === pId);
                    if (!old || JSON.stringify(old) !== JSON.stringify(actualP)) {
                        setDoc(doc(db, "payments", pId), actualP).catch(console.error);
                    }
                });
                prev.forEach(p => {
                    const pId = paymentDocKey(p);
                    if (pId && !next.find(o => paymentDocKey(o) === pId)) {
                        deleteDoc(doc(db, "payments", pId)).catch(console.error);
                    }
                });
            }, 0);
            return next;
        });
    }, []);

    const setMessages = useCallback((updateFn) => {
        setLocalMessages(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            // Only write the newly added or changed messages to Firestore
            next.forEach(m => {
                const mId = m.id?.toString() || Math.random().toString(36).substr(2, 9);
                const actualM = { ...m, id: mId };
                const old = prev.find(o => o.id?.toString() === mId);
                if (!old || JSON.stringify(old) !== JSON.stringify(actualM)) {
                    setDoc(doc(db, "messages", mId), actualM).catch(err => console.error("Firestore Error (messages):", err));
                }
            });
            // Handle deletions (for clearing histories)
            if (next.length < prev.length) {
                prev.forEach(m => {
                    if (!next.find(nm => nm.id === m.id)) {
                        deleteDoc(doc(db, "messages", m.id)).catch(err => console.error("Firestore Delete Error (messages):", err));
                    }
                });
            }
            return next;
        });
    }, []);
    const [activeSessions, setActiveSessions] = useLocalStorage("simyc_sessions", {});
    const [penaltyData, setPenaltyData] = useLocalStorage("simyc_penalty", {});
    const [maintenanceMode, setMaintenanceMode] = useLocalStorage("simyc_maintenance", { active: false, message: "" });
    const [plans, setLocalPlans] = useState(DEFAULT_PLANS);
    const setPlans = useCallback((updateFn) => {
        setLocalPlans(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            setTimeout(() => {
                next.forEach(p => {
                    setDoc(doc(db, "plans", p.id), p).catch(console.error);
                });
                prev.forEach(p => {
                    if (!next.find(n => n.id === p.id)) {
                        deleteDoc(doc(db, "plans", p.id)).catch(console.error);
                    }
                });
            }, 0);
            return next;
        });
    }, []);
    const [questions, setLocalQuestions] = useState([]);
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    useEffect(() => {
        const unsubQuestions = onSnapshot(collection(db, "questions"), async (snap) => {
            if (snap.empty) {
                // If firestore is completely empty, seed it with SAMPLE_QUESTIONS
                for (const q of SAMPLE_QUESTIONS) {
                    const qId = q.id ? q.id.toString() : Math.random().toString(36).substr(2, 9);
                    await setDoc(doc(db, "questions", qId), { ...q, id: qId });
                }
            } else {
                const arr = [];
                snap.forEach(d => {
                    const data = d.data();
                    if (!data) return;
                    arr.push({ ...data, _docId: d.id, id: data.id ?? d.id });
                });
                setLocalQuestions(arr);
            }
        }, err => console.error("[Firestore questions]", err?.code, err?.message));
        return () => unsubQuestions();
    }, []);

    // setQuestions: only writes NEW questions to Firestore (added via admin panel).
    // It does NOT delete existing Firestore questions to avoid wiping batch-uploaded data.
    const setQuestions = useCallback((updateFn) => {
        setLocalQuestions(prev => {
            const next = typeof updateFn === "function" ? updateFn(prev) : updateFn;
            setTimeout(() => {
                next.forEach(q => {
                    const qId = q._docId || q.id?.toString() || Math.random().toString(36).substr(2, 9);
                    const actualQ = { ...q, id: q.id || qId, _docId: qId };
                    const old = prev.find(o => (o._docId || o.id?.toString()) === qId);
                    if (!old || JSON.stringify(old) !== JSON.stringify(actualQ)) {
                        setDoc(doc(db, "questions", qId), actualQ).catch(console.error);
                    }
                });
                // Only delete if intentionally removed
                if (next.length < prev.length) {
                    prev.forEach(q => {
                        const qId = q._docId || q.id?.toString();
                        if (qId && !next.find(n => (n._docId || n.id?.toString()) === qId)) {
                            deleteDoc(doc(db, "questions", qId)).catch(console.error);
                        }
                    });
                }
            }, 0);
            return next;
        });
    }, []);
    const [readNotifs, setReadNotifs] = useLocalStorage("simyc_read_notifs", []);
    const [readMessages, setReadMessages] = useLocalStorage("simyc_read_msgs", []);
    const [readAdminMsgs, setReadAdminMsgs] = useLocalStorage("simyc_read_admin_msgs", []);

    const [screen, setScreen] = useState("welcome");
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCalc, setShowCalc] = useState(false);

    const showToast = useCallback((msg, type = "info") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const logAdminAction = useCallback((adminName, action) => {
        setAdminLogs(prev => [{ admin: adminName, action, time: new Date().toLocaleString() }, ...prev.slice(0, 299)]);
    }, [setAdminLogs]);

    useEffect(() => {
        if (currentUser) {
            const isAdmin = ADMINS.some(a => a.matric === currentUser.matric);
            setScreen(isAdmin ? "admin" : "dashboard");
        }
    }, [currentUser]);

    const [confirmLogout, setConfirmLogout] = useState(false);

    const handleLogout = () => {
        if (!confirmLogout) {
            setConfirmLogout(true);
            showToast("Tap Sign Out again to confirm", "warning");
            setTimeout(() => setConfirmLogout(false), 4000);
            return;
        }
        setConfirmLogout(false);
        if (currentUser) {
            setActiveSessions(prev => { const u = { ...prev }; delete u[currentUser.matric]; return u; });
        }
        setCurrentUser(null);
        setScreen("welcome");
        showToast("Logged out successfully");
    };

    const handleLogin = (u) => {
        const isSuperAdmin = u.matric === SUPER_ADMIN.matric;
        if (!isSuperAdmin) {
            if (activeSessions[u.matric]) {
                setNotifications(prev => [...prev, { to: SUPER_ADMIN.matric, subject: "🚨 Duplicate Login Attempt", body: `${u.name} (${u.matric}) tried to log in on a second device.`, time: new Date().toLocaleString(), type: "security" }]);
                showToast("This account is already active on another device.", "error");
                return;
            }
            setActiveSessions(prev => ({ ...prev, [u.matric]: Date.now().toString() }));
        }
        setCurrentUser(u);
        const isAdmin = ADMINS.some(a => a.matric === u.matric);
        setScreen(isAdmin ? "admin" : "dashboard");
    };

    const activeBroadcast = broadcasts.find(b => b.active);
    const isAdmin = currentUser && ADMINS.some(a => a.matric === currentUser.matric);

    // Maintenance mode — block non-admins
    if (maintenanceMode.active && screen !== "admin" && (!currentUser || !isAdmin)) {
        return (
            <>
                <style>{css}</style>
                <MaintenanceScreen
                    message={maintenanceMode.message}
                    users={users}
                    admins={ADMINS}
                    onAdminLogin={handleLogin}
                    showToast={showToast}
                />
            </>
        );
    }

    return (
        <>
            <style>{css}</style>
            <div className="app-wrapper">
                <div className="bg-blobs">
                    <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
                </div>

                {activeBroadcast && (
                    <div className={`broadcast broadcast-${activeBroadcast.color}`}>
                        📢 {activeBroadcast.message}
                    </div>
                )}

                {screen === "welcome" && <WelcomeScreen onNext={() => setScreen("login")} />}
                {screen === "login" && <LoginScreen users={users} admins={ADMINS} onRegister={() => setScreen("register")} onLogin={handleLogin} showToast={showToast} />}
                {screen === "register" && <RegisterScreen users={users} setUsers={setUsers} onSuccess={() => { showToast("Account created! Please log in."); setScreen("login"); }} onBack={() => setScreen("login")} showToast={showToast} />}

                {screen === "dashboard" && currentUser && (
                    <DashboardScreen
                        user={currentUser} setCurrentUser={setCurrentUser}
                        users={users} setUsers={setUsers}
                        notifications={notifications} setNotifications={setNotifications}
                        readNotifs={readNotifs} setReadNotifs={setReadNotifs}
                        readMessages={readMessages} setReadMessages={setReadMessages}
                        payments={payments} broadcasts={broadcasts}
                        messages={messages} setMessages={setMessages}
                        readAdminMsgs={readAdminMsgs} setReadAdminMsgs={setReadAdminMsgs}
                        penaltyData={penaltyData} setPenaltyData={setPenaltyData}
                        plans={plans}
                        onLogout={handleLogout}
                        onStartQuiz={(opts) => setModal({ type: "quiz", opts })}
                        onUpgrade={() => setModal({ type: "payment" })}
                        showToast={showToast}
                        setLightboxPhoto={setLightboxPhoto}
                    />
                )}

                {screen === "admin" && currentUser && (
                    <AdminScreen
                        user={currentUser} users={users} setUsers={setUsers}
                        payments={payments} setPayments={setPayments}
                        notifications={notifications} setNotifications={setNotifications}
                        broadcasts={broadcasts} setBroadcasts={setBroadcasts}
                        adminLogs={adminLogs} setAdminLogs={setAdminLogs}
                        logAdminAction={logAdminAction}
                        messages={messages} setMessages={setMessages}
                        readAdminMsgs={readAdminMsgs} setReadAdminMsgs={setReadAdminMsgs}
                        onLogout={handleLogout} showToast={showToast}
                        isSuperAdmin={currentUser?.matric === SUPER_ADMIN.matric}
                        maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode}
                        plans={plans} setPlans={setPlans}
                        questions={questions} setQuestions={setQuestions}
                        setLightboxPhoto={setLightboxPhoto}
                    />
                )}

                {modal?.type === "quiz" && (
                    <QuizModal opts={modal.opts} user={currentUser} users={users} setUsers={setUsers} penaltyData={penaltyData} setPenaltyData={setPenaltyData} payments={payments} plans={plans} globalQuestions={questions} onClose={() => setModal(null)} onUpgrade={() => { setModal(null); setTimeout(() => setModal({ type: "payment" }), 100); }} showToast={showToast} />
                )}
                {modal?.type === "payment" && (
                    <PaymentModal onClose={() => setModal(null)} payments={payments} setPayments={setPayments} user={currentUser} plans={plans} showToast={showToast} />
                )}

                {emailAuthModalOpen && currentUser && (
                    <EmailAuthUpdateModal
                        oldEmail={authEmailState}
                        newEmail={currentUser.email}
                        busy={emailAuthBusy}
                        onClose={() => setEmailAuthModalOpen(false)}
                        onConfirm={async (password) => {
                            if (!auth.currentUser) { showToast("Please log in again.", "error"); return; }
                            setEmailAuthBusy(true);
                            try {
                                const cred = EmailAuthProvider.credential(authEmailState, password);
                                await reauthenticateWithCredential(auth.currentUser, cred);
                                await updateEmail(auth.currentUser, currentUser.email);
                                setCurrentUser(prev => ({ ...prev, authEmailNeedsUpdate: false, authEmailOld: null, authEmailUpdatedAt: new Date().toISOString() }));
                                showToast("Email updated successfully. Your login email is now synced.", "success");
                                setEmailAuthModalOpen(false);
                            } catch (err) {
                                showToast(err?.message || "Failed to update email.", "error");
                            } finally {
                                setEmailAuthBusy(false);
                            }
                        }}
                    />
                )}

                {toast && <ToastNotif msg={toast.msg} type={toast.type} />}

                {lightboxPhoto && (
                    <div className="lightbox-modal" onClick={() => setLightboxPhoto(null)}>
                        <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>✕</button>
                        <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                            <img src={lightboxPhoto} alt="Large View" />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── MAINTENANCE SCREEN ───────────────────────────────────────────────────────

function MaintenanceScreen({ message, users, admins, onAdminLogin, showToast }) {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [matric, setMatric] = useState("");
    const [password, setPassword] = useState("");
    const [tapCount, setTapCount] = useState(0);

    // Secret: tap the wrench icon 5 times to reveal admin login
    const handleIconTap = () => {
        const next = tapCount + 1;
        setTapCount(next);
        if (next >= 5) { setShowAdminLogin(true); setTapCount(0); }
    };

    const handleAdminLogin = () => {
        const admin = admins.find(a => a.matric === matric && a.password === password);
        if (!admin) { showToast("Invalid admin credentials", "error"); return; }
        onAdminLogin({ matric: admin.matric, name: admin.name, role: admin.role });
    };

    return (
        <div className="maintenance-screen">
            <div className="bg-blobs"><div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" /></div>
            <div style={{ position: "relative", zIndex: 1, maxWidth: 440, width: "100%" }}>
                <div style={{ fontSize: 72, marginBottom: 20, cursor: "default" }} onClick={handleIconTap}>🔧</div>
                <h2 style={{ fontFamily: "Syne", fontSize: 28, marginBottom: 12 }} className="text-gradient">System Maintenance</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
                    {message || "We're currently undergoing maintenance. Please check back shortly."}
                </p>
                <div style={{ padding: "12px 24px", background: "rgba(37,99,235,0.1)", borderRadius: 12, border: "1px solid rgba(37,99,235,0.2)", fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
                    📧 simycesuh@gmail.com &nbsp;|&nbsp; 💬 +234 815 399 6360
                </div>

                {/* Admin login — always visible but subtle */}
                <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 24 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, fontFamily: "Syne" }}>
                        🛡️ Admin Access
                    </div>
                    {!showAdminLogin ? (
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAdminLogin(true)}>
                            Admin Login
                        </button>
                    ) : (
                        <div className="card p-5" style={{ textAlign: "left" }}>
                            <div className="input-group"><label className="input-label">Admin Matric Number</label><input className="input-field" value={matric} onChange={e => setMatric(e.target.value)} placeholder="Enter matric number" /></div>
                            <div className="input-group"><label className="input-label">Password</label><input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && handleAdminLogin()} /></div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="btn btn-primary btn-full" onClick={handleAdminLogin}>🔒 Admin Login</button>
                                <button className="btn btn-ghost" onClick={() => setShowAdminLogin(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── DRAGGABLE CALCULATOR ─────────────────────────────────────────────────────

function DraggableCalculator({ onClose }) {
    const [display, setDisplay] = useState("0");
    const [prev, setPrev] = useState(null);
    const [op, setOp] = useState(null);
    const [fresh, setFresh] = useState(false);
    const [pos, setPos] = useState({ x: window.innerWidth - 280, y: window.innerHeight - 420 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef(null);
    const posRef = useRef(pos);
    posRef.current = pos;

    const onMouseDown = (e) => {
        if (e.target.classList.contains("calc-btn") || e.target.closest(".calc-btn")) return;
        setDragging(true);
        dragStart.current = { mx: e.clientX, my: e.clientY, px: posRef.current.x, py: posRef.current.y };
    };

    const onTouchStart = (e) => {
        if (e.target.classList.contains("calc-btn") || e.target.closest(".calc-btn")) return;
        const t = e.touches[0];
        setDragging(true);
        dragStart.current = { mx: t.clientX, my: t.clientY, px: posRef.current.x, py: posRef.current.y };
    };

    useEffect(() => {
        const onMove = (e) => {
            if (!dragging || !dragStart.current) return;
            const cx = e.clientX ?? e.touches?.[0]?.clientX;
            const cy = e.clientY ?? e.touches?.[0]?.clientY;
            if (cx == null) return;
            const nx = dragStart.current.px + (cx - dragStart.current.mx);
            const ny = dragStart.current.py + (cy - dragStart.current.my);
            setPos({ x: Math.max(0, Math.min(window.innerWidth - 250, nx)), y: Math.max(0, Math.min(window.innerHeight - 380, ny)) });
        };
        const onUp = () => setDragging(false);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
    }, [dragging]);

    const press = (val) => {
        if (val === "C") { setDisplay("0"); setPrev(null); setOp(null); setFresh(false); return; }
        if (val === "⌫") { setDisplay(d => d.length > 1 ? d.slice(0, -1) : "0"); return; }
        if (["+", "-", "×", "÷"].includes(val)) { setPrev(parseFloat(display)); setOp(val); setFresh(true); return; }
        if (val === "=") {
            if (prev === null || !op) return;
            const cur = parseFloat(display);
            let res = prev;
            if (op === "+") res = prev + cur;
            if (op === "-") res = prev - cur;
            if (op === "×") res = prev * cur;
            if (op === "÷") res = cur !== 0 ? prev / cur : 0;
            setDisplay(String(parseFloat(res.toFixed(8))));
            setPrev(null); setOp(null); setFresh(false); return;
        }
        if (val === ".") { if (fresh) { setDisplay("0."); setFresh(false); return; } if (!display.includes(".")) setDisplay(d => d + "."); return; }
        if (fresh) { setDisplay(val); setFresh(false); }
        else setDisplay(d => d === "0" ? val : d + val);
    };

    const buttons = ["C", "⌫", "÷", "×", "7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "=", "0", "."];

    return (
        <div
            className="calc-popup"
            style={{ left: pos.x, top: pos.y, cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            <div className="flex justify-between items-center mb-3" style={{ cursor: "grab" }}>
                <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13 }}>🧮 Calculator</span>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", cursor: "pointer" }} onMouseDown={e => e.stopPropagation()} onClick={onClose}>✕</button>
            </div>
            <div className="calc-display">{display}</div>
            <div className="calc-grid">
                {buttons.map((b, i) => (
                    <button key={i}
                        className={`calc-btn ${b === "C" ? "calc-clear" : b === "=" ? "calc-eq" : ["+", "-", "×", "÷", "⌫"].includes(b) ? "calc-op" : "calc-num"}`}
                        style={b === "=" ? { gridRow: "span 2" } : b === "0" ? { gridColumn: "span 2" } : {}}
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        onClick={() => press(b)}>{b}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function ToastNotif({ msg, type }) {
    const colors = { info: "#2563eb", success: "#16a34a", error: "#dc2626", warning: "#f59e0b" };
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 5000, background: colors[type] || colors.info, color: "#fff", padding: "14px 20px", borderRadius: 14, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "fadeUp 0.3s ease", maxWidth: 320, fontFamily: "Syne, sans-serif" }}>
            {msg}
        </div>
    );
}

function EmailAuthUpdateModal({ oldEmail, newEmail, busy, onClose, onConfirm }) {
    const [password, setPassword] = useState("");
    return (
        <div className="modal-overlay">
            <div className="card modal p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gradient">🔁 Update Login Email</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Admin approved an email change on your profile. To keep login working, you need to sync your Firebase login email.
                </div>
                <div className="divider" />
                <div className="card p-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-xs text-muted">Current login email</div>
                    <div style={{ fontWeight: 700, marginTop: 4 }}>{oldEmail || "—"}</div>
                    <div className="text-xs text-muted mt-3">New approved email</div>
                    <div style={{ fontWeight: 700, marginTop: 4, color: "var(--primary-light)" }}>{newEmail || "—"}</div>
                </div>
                <div className="input-group mt-4">
                    <label className="input-label">Enter your password to confirm</label>
                    <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />
                </div>
                <div className="flex gap-2 mt-3">
                    <button className="btn btn-primary btn-full" disabled={busy || !password} onClick={() => onConfirm(password)}>
                        {busy ? "Updating..." : "✅ Update Email"}
                    </button>
                    <button className="btn btn-outline btn-full" disabled={busy} onClick={onClose}>Later</button>
                </div>
                <div className="text-xs text-muted mt-3" style={{ lineHeight: 1.6 }}>
                    If you tap “Later”, you can keep using the app for now, but you may still need this step before you can log in with the new email.
                </div>
            </div>
        </div>
    );
}

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────

function WelcomeScreen({ onNext }) {
    return (
        <div className="page">
            <div className="welcome-hero">
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 32 }}>
                    <div className="welcome-icon-wrap floating">📚</div>
                    <div className="welcome-icon-wrap floating-delay">🎯</div>
                    <div className="welcome-icon-wrap floating">🏆</div>
                </div>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "clamp(36px,8vw,56px)", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 6, textAlign: "center" }}>
                    <span className="text-gradient">Simyc</span><br />
                    <span style={{ color: "var(--text)", fontSize: "0.6em", fontWeight: 700 }}>Exam Prep</span><br />
                    <span className="text-gradient" style={{ fontSize: "0.65em" }}>NG</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", marginBottom: 18 }}>LASU</div>
                <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 370, margin: "0 auto 32px", lineHeight: 1.7 }}>
                    The ultimate CBT exam preparation platform for Lagos State University students. Practice smarter, score higher.
                </p>
                <button className="btn btn-primary" onClick={onNext} style={{ fontSize: 16, padding: "15px 48px", borderRadius: 14 }}>Get Started →</button>
                <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
                    {["✓ 9 Courses", "✓ JAMB Timer", "✓ Analytics", "✓ Free Trial"].map((f, i) => (
                        <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", padding: "6px 12px", borderRadius: 20 }}>{f}</div>
                    ))}
                </div>
                <div style={{ marginTop: 44, padding: "22px 28px", background: "var(--card-glass)", border: "1px solid var(--card-border)", borderRadius: 20, maxWidth: 350, textAlign: "center", backdropFilter: "blur(12px)" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>About the Founder</div>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👨💻</div>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>Esuh Simeon Chioma</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>Business Administration, LASU</div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.7 }}>Visionary tech entrepreneur building tools to empower every LASU student with quality exam preparation.</p>
                </div>
            </div>
        </div>
    );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ users, admins, onRegister, onLogin, showToast }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [needOtp, setNeedOtp] = useState(false);
    const [forgotFlow, setForgotFlow] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [showPass, setShowPass] = useState(false);

    const handleResetPassword = async () => {
        if (!resetEmail) { showToast("Enter your email address", "error"); return; }
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetSent(true);
            showToast("Reset link sent!", "success");
        } catch (error) {
            showToast("Error: " + error.message, "error");
        }
    };

    const handleLogin = async () => {
        if (attempts >= 5) { showToast("Too many attempts. Try again later.", "error"); return; }

        const fId = identifier.trim().toLowerCase();

        // 1. Admin hardcoded checks
        const admin = admins.find(a => a.matric?.toLowerCase() === fId || a.name?.toLowerCase() === fId);
        if (admin) {
            if (admin.otp) {
                if (!needOtp) { const code = generateOTP(); setGeneratedOtp(code); setNeedOtp(true); showToast(`OTP: ${code}`, "info"); return; }
                if (otp !== generatedOtp) { showToast("Invalid OTP", "error"); setAttempts(a => a + 1); return; }
                onLogin({ matric: admin.matric, name: admin.name, role: admin.role }); return;
            }
            if (admin.password && password === admin.password) { onLogin({ matric: admin.matric, name: admin.name, role: admin.role }); return; }
            showToast("Invalid admin credentials", "error"); setAttempts(a => a + 1); return;
        }

        try {
            let targetEmail = fId;
            let targetUser = null;

            // 2. Matric-to-Email Resolution for Students
            const isEmail = fId.includes("@");
            if (!isEmail) {
                const rawId = identifier.trim();
                // Try local state first (case-insensitive matric)
                targetUser = users.find(x => x.matric?.toLowerCase() === fId);
                
                // If not in local state, query Firestore case-insensitively
                if (!targetUser) {
                    const q = query(collection(db, "users"), where("matric", "in", [rawId, rawId.toUpperCase(), rawId.toLowerCase()]));
                    const snap = await getDocs(q);
                    if (!snap.empty) targetUser = snap.docs[0].data();
                }

                if (targetUser && targetUser.email) {
                    targetEmail = targetUser.email.toLowerCase();
                } else {
                    showToast("Account with this Matric Number not found.", "error");
                    return;
                }
            }

            // 3. Firebase Auth login
            const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);

            // 4. Force refresh from firestore to get user details and check status
            const q = query(collection(db, "users"), where("email", "==", targetEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const fullUser = querySnapshot.docs[0].data();

                // Security Guard: Check if deactivated
                if (fullUser.isDeleted) {
                    await signOut(auth);
                    showToast("Your account has been deactivated. Contact admin.", "error");
                    return;
                }
                if (fullUser.banned) {
                    await signOut(auth);
                    showToast("This account is currently banned.", "warning");
                    return;
                }

                onLogin({ ...fullUser, uid: userCredential.user.uid });
            } else {
                onLogin({ email: targetEmail, role: "student", uid: userCredential.user.uid });
            }

            showToast("Login successful!", "success");

        } catch (error) {
            let msg = "Invalid email or password";
            if (error.code === "auth/user-not-found") msg = "No account found with this email";
            if (error.code === "auth/wrong-password") msg = "Incorrect password";
            if (error.code === "auth/user-disabled") msg = "Account suspended";
            if (error.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
            showToast(msg, "error");
            setAttempts(a => a + 1);
        }
    };

    if (forgotFlow) return (
        <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div className="card p-8" style={{ maxWidth: 420, width: "100%" }}>
                <h2 className="text-gradient mb-4">Password Recovery</h2>
                {!resetSent ? (<>
                    <p className="text-muted text-sm mb-4">Enter your registered email address.</p>
                    <div className="input-group"><label className="input-label">Email Address</label><input className="input-field" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="your@email.com" /></div>
                    <div style={{ padding: 12, background: "rgba(245,158,11,0.1)", borderRadius: 10, fontSize: 13, color: "#fbbf24", marginBottom: 14 }}>
                        ⚠️ Email service requires backend SMTP setup. For now, contact admin directly on WhatsApp: +234 815 399 6360
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleResetPassword}>Send Reset Link</button>
                    <button className="btn btn-ghost btn-full mt-4" onClick={() => setForgotFlow(false)}>← Back to Login</button>
                </>) : (<>
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ fontSize: 52 }}>📧</div>
                        <p style={{ marginTop: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>If this email is registered, instructions will be sent to <strong style={{ color: "var(--text)" }}>{resetEmail}</strong>.<br /><br />Meanwhile, contact support on <a href="https://wa.me/2348153996360" style={{ color: "#25D366" }}>WhatsApp</a> for immediate help.</p>
                    </div>
                    <button className="btn btn-outline btn-full mt-4" onClick={() => { setForgotFlow(false); setResetSent(false); setResetEmail(""); }}>← Back to Login</button>
                </>)}
            </div>
        </div>
    );

    return (
        <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div className="card p-8" style={{ maxWidth: 420, width: "100%" }}>
                <div className="text-center mb-6">
                    <div style={{ fontSize: 40 }}>🎓</div>
                    <h2 className="text-gradient" style={{ fontSize: 24, marginTop: 10 }}>Welcome Back</h2>
                    <p className="text-muted text-sm mt-2">Simyc Exam Prep NG · LASU</p>
                </div>
                <div className="input-group"><label className="input-label">Email Address</label><input className="input-field" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Enter your email" /></div>
                {!needOtp && (
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: "relative" }}>
                            <input className="input-field" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
                            <span
                                onClick={() => setShowPass(!showPass)}
                                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 18, opacity: 0.6 }}
                            >
                                {showPass ? "👁️" : "👁️‍🗨️"}
                            </span>
                        </div>
                    </div>
                )}
                {needOtp && <div className="input-group"><label className="input-label">Enter OTP</label><input className="input-field" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" /></div>}
                {!needOtp && <div className="text-right mb-4"><span className="text-sm" style={{ color: "var(--primary-light)", cursor: "pointer" }} onClick={() => setForgotFlow(true)}>Forgot Password?</span></div>}
                <button className="btn btn-primary btn-full" onClick={handleLogin}>🔒 {needOtp ? "Verify OTP" : "Login"}</button>
                <div className="divider" />
                <div className="text-center text-sm text-muted">New student? <span style={{ color: "var(--primary-light)", cursor: "pointer", fontWeight: 600 }} onClick={onRegister}>Create Account</span></div>
                <div className="text-center mt-4 text-xs text-muted">Need help? <a href="https://wa.me/2348153996360" target="_blank" rel="noreferrer" style={{ color: "#25D366" }}>💬 WhatsApp Support</a></div>
            </div>
        </div>
    );
}

// ─── REGISTER SCREEN ──────────────────────────────────────────────────────────

function RegisterScreen({ users, setUsers, onSuccess, onBack, showToast }) {
    const [form, setForm] = useState({ fullName: "", matric: "", email: "", phone: "", dob: "", password: "", confirm: "", faculty: "", department: "", level: "100" });
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const [showTermsText, setShowTermsText] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const faculties = FACULTIES.map(f => f.name);
    const depts = FACULTIES.find(f => f.name === form.faculty)?.departments || [];

    const handleRegister = async () => {
        if (!form.fullName || !form.matric || !form.email || !form.phone || !form.dob || !form.password || !form.faculty || !form.department) { showToast("Please fill all required fields", "error"); return; }
        if (form.password !== form.confirm) { showToast("Passwords do not match", "error"); return; }
        if (form.password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
        if (ADMINS.find(a => a.matric === form.matric)) { showToast("This matric number is reserved", "error"); return; }
        if (!termsChecked || !privacyChecked) { showToast("You must accept the Terms & Conditions", "error"); return; }
        const age = new Date().getFullYear() - new Date(form.dob).getFullYear();
        if (age < 16) { showToast("You must be at least 16 years old to register.", "error"); return; }

        const cleanEmail = form.email.trim().toLowerCase();

        try {
            // Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, form.password);
            const userRef = doc(db, "users", form.matric.trim());

            // Remove confirm from the form data so it isn't saved in Firestore
            const { confirm, ...firestoreData } = form;

            const newUser = {
                uid: userCredential.user.uid,
                ...firestoreData,
                email: cleanEmail,
                matric: form.matric.trim(),
                password: form.password, // keeping it for backwards compat internally if needed
                role: "student",
                registeredAt: new Date().toISOString(),
                questionsAttempted: 0,
                loginStreak: 0,
                practiceTime: 0,
                trialUsed: {},
                termsAcceptedAt: new Date().toISOString()
            };

            await setDoc(userRef, newUser);

            // Still update local state for the dashboard fallback
            setUsers(prev => [...prev, newUser]);
            showToast("Account created successfully in Firebase!", "success");
            onSuccess();
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') showToast("Email already registered", "error");
            else showToast(error.message, "error");
        }
    };

    return (
        <div className="page" style={{ padding: 24, maxWidth: 580, margin: "0 auto" }}>
            <div style={{ paddingTop: 32 }}>
                <div className="flex items-center gap-3 mb-6">
                    <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
                    <h2 className="text-gradient" style={{ fontSize: 22 }}>Create Account</h2>
                </div>
                <div className="card p-6">
                    <div className="grid-2">
                        <div className="input-group"><label className="input-label">Full Name *</label><input className="input-field" value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Your full name" /></div>
                        <div className="input-group"><label className="input-label">Matric Number *</label><input className="input-field" value={form.matric} onChange={e => set("matric", e.target.value)} placeholder="Enter your matric number" /></div>
                        <div className="input-group"><label className="input-label">Email Address *</label><input className="input-field" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" /></div>
                        <div className="input-group"><label className="input-label">Phone Number *</label><input className="input-field" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+234..." /></div>
                        <div className="input-group"><label className="input-label">Date of Birth *</label><input className="input-field" type="date" value={form.dob} onChange={e => set("dob", e.target.value)} /></div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Faculty *</label>
                        <select className="input-field" value={form.faculty} onChange={e => { set("faculty", e.target.value); set("department", ""); }}>
                            <option value="">Select Faculty</option>
                            {faculties.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Department *</label>
                        <select className="input-field" value={form.department} onChange={e => set("department", e.target.value)} disabled={!form.faculty}>
                            <option value="">Select Department</option>
                            {depts.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Level</label>
                        <select className="input-field" value={form.level} onChange={e => set("level", e.target.value)}>
                            {["100", "200", "300", "400", "500", "600"].map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">Password *</label>
                            <div style={{ position: "relative" }}>
                                <input className="input-field" type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 chars" />
                                <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6 }}>{showPass ? "👁️" : "👁️‍🗨️"}</span>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Confirm Password *</label>
                            <div style={{ position: "relative" }}>
                                <input className="input-field" type={showConfirm ? "text" : "password"} value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Repeat password" />
                                <span onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6 }}>{showConfirm ? "👁️" : "👁️‍🗨️"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="divider" />
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📜 Terms & Agreement</div>
                        {showTermsText && (
                            <div style={{ maxHeight: 200, overflowY: "auto", background: "rgba(0,0,0,0.3)", border: "1px solid var(--card-border)", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}>
                                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Outfit, sans-serif" }}>{TERMS}</pre>
                            </div>
                        )}
                        <div style={{ color: "var(--primary-light)", fontSize: 12, cursor: "pointer", marginBottom: 12 }} onClick={() => setShowTermsText(!showTermsText)}>
                            {showTermsText ? "▲ Hide Terms" : "▼ View Full Terms & Conditions"}
                        </div>
                        <label className="checkbox-group">
                            <input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)} />
                            <span style={{ fontSize: 13 }}>I have read and agree to the <strong style={{ color: "var(--primary-light)" }}>Terms & Conditions</strong></span>
                        </label>
                        <label className="checkbox-group">
                            <input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)} />
                            <span style={{ fontSize: 13 }}>I agree to the <strong style={{ color: "var(--primary-light)" }}>Privacy Policy</strong> and will use this platform responsibly</span>
                        </label>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={!termsChecked || !privacyChecked}>✅ Create My Account</button>
                </div>
            </div>
        </div>
    );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardScreen({ user, setCurrentUser, users, setUsers, notifications, setNotifications, readNotifs, setReadNotifs, readMessages, setReadMessages, payments, broadcasts, messages, setMessages, penaltyData, setPenaltyData, plans, onLogout, onStartQuiz, onUpgrade, showToast, setLightboxPhoto }) {
    const [tab, setTab] = useState("home");
    const [showNotifs, setShowNotifs] = useState(false);
    const [courseSearch, setCourseSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");
    const profilePic = user.profilePic;
    const setProfilePic = (pic) => setCurrentUser(prev => ({ ...prev, profilePic: pic }));

    const userNotifs = notifications.filter(n => n.to === user.matric || n.to === "all");
    const unreadNotifs = userNotifs.filter(n => !readNotifs.includes(n.time + n.subject)).length;

    const myMessages = messages.filter(m => m.to === user.matric || m.from === user.matric);
    const unreadMsgs = myMessages.filter(m => m.to === user.matric && !readMessages.includes(m.id)).length;

    const activePayments = payments.filter(p => p.matric === user.matric && p.status === "approved" && p.expiresAt && new Date(p.expiresAt) > new Date());
    const hasGlobalAccess = activePayments.some(p => !p.targetCourseCode);
    const checkCourseAccess = (code) => hasGlobalAccess || activePayments.some(p => p.targetCourseCode === code);

    const userPayment = activePayments.length > 0 ? activePayments[0] : null;
    const hasAnyAccess = activePayments.length > 0;
    const userName = (user.fullName || user.name || (ADMINS.find(a => a.matric === user.matric)?.name))?.split(" ")[0] || "Student";

    const penaltyUntil = user?.trialPenaltyUntil || penaltyData?.[user.matric]?.until;
    const penalty = penaltyUntil ? { until: penaltyUntil } : null;
    const inPenalty = !!(penaltyUntil && Date.now() < penaltyUntil);

    const filteredCourses = COURSES.filter(c => {
        const matchesSearch = c.code.toLowerCase().includes(courseSearch.toLowerCase()) || c.name.toLowerCase().includes(courseSearch.toLowerCase());
        const matchesFilter = courseFilter === "all" || (c.department === user.department && c.level === user.level);
        return matchesSearch && matchesFilter;
    });

    useEffect(() => {
        if (penaltyUntil && Date.now() >= penaltyUntil) {
            setUsers(prev => prev.map(u => u.matric === user.matric ? { ...u, trialAttempts: 0, trialPenaltyUntil: null } : u));
            setPenaltyData(prev => {
                const next = { ...prev };
                delete next[user.matric];
                return next;
            });
            showToast("Free trial attempts reset! You can now practice again.", "success");
        }
    }, [penaltyUntil, user.matric, setUsers, setPenaltyData, showToast]);

    const handleProfilePicUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) { showToast("Image must be under 1MB", "error"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => { 
            setProfilePic(ev.target.result); 
            showToast("Profile picture updated and synced!", "success"); 
        };
        reader.readAsDataURL(file);
    };

    const removeProfilePic = () => {
        setProfilePic(null);
        showToast("Profile picture removed", "info");
    };

    const markNotifsRead = () => {
        const ids = userNotifs.map(n => n.time + n.subject);
        setReadNotifs(prev => [...new Set([...prev, ...ids])]);
        setShowNotifs(true);
    };

    return (
        <div className="page">
            <div className="topnav">
                <div className="topnav-logo"><span>Simyc</span> <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 14 }}>| LASU</span></div>
                <div className="topnav-actions">
                    <div className="notif-bell" onClick={markNotifsRead}>
                        <span style={{ fontSize: 20 }}>🔔</span>
                        {unreadNotifs > 0 && <div className="notif-count">{unreadNotifs}</div>}
                    </div>
                    <label style={{ cursor: "pointer" }}>
                        <div className="avatar-btn">
                            {profilePic ? <img src={profilePic} alt="Profile" /> : <span>👤</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={handleProfilePicUpload} style={{ display: "none" }} />
                    </label>
                    <button className="btn-logout" onClick={onLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Tab Nav */}
            <div style={{ display: "flex", background: "rgba(15,23,42,0.6)", borderBottom: "1px solid var(--card-border)", padding: "0 20px", overflowX: "auto" }}>
                {[
                    { id: "home", label: "🏠 Home" },
                    { id: "profile", label: "👤 Profile" },
                    { id: "messages", label: <span>💬 Messages {unreadMsgs > 0 && <span className="badge badge-red" style={{ fontSize: 10, padding: "2px 6px", verticalAlign: "middle" }}>{unreadMsgs}</span>}</span> },
                ].map(t => (
                    <div key={t.id} onClick={() => { setTab(t.id); if (t.id === "messages") { const ids = myMessages.filter(m => m.to === user.matric).map(m => m.id); setReadMessages(prev => [...new Set([...prev, ...ids])]); } }} style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Syne, sans-serif", color: tab === t.id ? "var(--primary-light)" : "var(--text-muted)", borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                        {t.label}
                    </div>
                ))}
            </div>

            {/* Notification panel */}
            {showNotifs && (
                <div className="modal-overlay" onClick={() => setShowNotifs(false)}>
                    <div className="card modal p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-gradient">Notifications</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifs(false)}>✕</button>
                        </div>
                        {userNotifs.length === 0 ? <p className="text-muted text-sm">No notifications yet</p> : userNotifs.map((n, i) => (
                            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--card-border)" }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.subject}</div>
                                <div className="text-muted text-sm mt-1">{n.body}</div>
                                <div className="text-xs text-muted mt-1">{n.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>

                {tab === "home" && (
                    <>
                        {/* Welcome */}
                        <div className="card p-6 mb-5" style={{ background: "linear-gradient(135deg,rgba(30,58,138,0.45),rgba(37,99,235,0.22))" }}>
                            <div className="flex justify-between items-center flex-wrap gap-3">
                                <div>
                                    <h2 style={{ fontSize: 20, fontFamily: "Syne" }}>Welcome back, <span className="text-gradient">{userName}! 👋</span></h2>
                                    <p className="text-muted text-sm mt-1">{user.department || "LASU"} {user.level ? `• ${user.level} Level` : ""}</p>
                                </div>
                                <div style={{ cursor: hasAnyAccess ? "default" : "pointer" }} onClick={!hasAnyAccess ? onUpgrade : undefined}>
                                    {hasAnyAccess
                                        ? <div>
                                            <span className="badge badge-green">✅ Subscription Active</span>
                                            <div className="text-xs text-muted mt-1">Expires: {formatDate(userPayment?.expiresAt)}</div>
                                        </div>
                                        : <span className="badge badge-yellow">🔓 Free Trial — Tap to Upgrade</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid-4 mb-5">
                            {[
                                { icon: "📊", label: "Questions", value: user.questionsAttempted || 0, color: "var(--primary-light)" },
                                { icon: "🔥", label: "Streak", value: `${user.loginStreak || 0}d`, color: "#fb923c" },
                                { icon: "⏱️", label: "Practice", value: `${Math.floor((user.practiceTime || 0) / 60)}m`, color: "#a78bfa" },
                                { icon: "📚", label: "Courses", value: COURSES.length, color: "#4ade80" },
                            ].map((s, i) => (
                                <div key={i} className="card stat-card card-lifted" style={{ borderLeft: `3px solid ${s.color}30` }}>
                                    <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Penalty Banner */}
                        {inPenalty && <PenaltyBanner penalty={penalty} onUpgrade={onUpgrade} />}

                        {/* Course Search */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                            <h3 style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 700 }}>📚 Available Courses</h3>
                            <div style={{ display: "flex", gap: 8, background: "rgba(15,23,42,0.5)", padding: 4, borderRadius: 10, border: "1px solid var(--card-border)" }}>
                                <button className={`btn btn-sm ${courseFilter === "department" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "6px 12px" }} onClick={() => setCourseFilter("department")}>My Profile Courses</button>
                                <button className={`btn btn-sm ${courseFilter === "all" ? "btn-primary" : "btn-ghost"}`} style={{ padding: "6px 12px" }} onClick={() => setCourseFilter("all")}>All Courses</button>
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 14 }}>
                            <input className="input-field" placeholder="🔍 Search courses..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} style={{ fontSize: 14 }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                            {filteredCourses.map((course, i) => {
                                const canAccess = checkCourseAccess(course.code);
                                const trialsLeft = inPenalty ? 0 : Math.max(0, 3 - (user.trialAttempts || 0));
                                return (
                                    <div key={i} className="card p-5 card-lifted" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15, fontFamily: "Syne" }}>{course.code} — {course.name}</div>
                                            {!canAccess && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`badge ${trialsLeft > 0 ? "badge-blue" : "badge-red"}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                                                        {trialsLeft > 0 ? `${trialsLeft} Attempts Remaining` : "0 Attempts Remaining"}
                                                    </span>
                                                    <span className="text-xs text-muted">5 Questions Per Trial</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {inPenalty && !canAccess ? (
                                                <span className="badge badge-red" style={{ cursor: "pointer" }} onClick={onUpgrade}>⏳ Locked</span>
                                            ) : canAccess || trialsLeft > 0 ? (
                                                <>
                                                    <button className="btn btn-outline btn-sm" onClick={() => onStartQuiz({ course: `${course.code} - ${course.name}`, courseCode: course.code, mode: "no-timer", type: "combined" })}>📖 Study</button>
                                                    <button className="btn btn-primary btn-sm" onClick={() => onStartQuiz({ course: `${course.code} - ${course.name}`, courseCode: course.code, mode: "timer", type: "objective" })}>▶ CBT</button>
                                                </>
                                            ) : (
                                                <button className="btn btn-primary btn-sm" onClick={onUpgrade}>🔒 Unlock</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredCourses.length === 0 && <p className="text-muted text-sm text-center">No courses match your search.</p>}
                        </div>

                        {/* Upgrade Banner */}
                        {!hasGlobalAccess && !inPenalty && (
                            <div className="card p-6 mb-5" style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.14),rgba(96,165,250,0.08))", border: "1px solid rgba(37,99,235,0.28)" }}>
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                    <div>
                                        <h3 style={{ fontFamily: "Syne", fontSize: 17 }}>🚀 Unlock Full Access</h3>
                                        <p className="text-muted text-sm mt-1">Starting from ₦500/month per course</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={onUpgrade}>View Plans 💰</button>
                                </div>
                            </div>
                        )}

                        {/* Support */}
                        <div className="card p-5">
                            <h4 style={{ fontFamily: "Syne", marginBottom: 12, fontSize: 15 }}>🆘 Need Help?</h4>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <a href="https://wa.me/2348153996360" target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#fff" }}>💬 WhatsApp</a>
                                <a href="https://t.me/+2348153996360" target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "#0088cc", color: "#fff" }}>✈️ Telegram</a>
                                <a href="mailto:simycesuh@gmail.com" className="btn btn-outline btn-sm">📧 Email</a>
                            </div>
                        </div>
                    </>
                )}

                {tab === "profile" && <UserProfileTab user={user} users={users} setUsers={setUsers} profilePic={profilePic} setProfilePic={setProfilePic} removeProfilePic={removeProfilePic} payments={payments} showToast={showToast} notifications={notifications} setNotifications={setNotifications} messages={messages} setMessages={setMessages} setLightboxPhoto={setLightboxPhoto} />}
                {tab === "messages" && <UserMessagesTab user={user} messages={messages} setMessages={setMessages} showToast={showToast} />}
            </div>
        </div>
    );
}

// ─── PENALTY BANNER ───────────────────────────────────────────────────────────

function PenaltyBanner({ penalty, onUpgrade }) {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((penalty.until - Date.now()) / 1000)));
    useEffect(() => {
        const tick = () => setTimeLeft(Math.max(0, Math.floor((penalty.until - Date.now()) / 1000)));
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [penalty.until]);
    return (
        <div className="penalty-banner mb-5">
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, color: "#f87171", marginBottom: 6 }}>Free Trial Limit Reached</div>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 28, color: "var(--warning)", marginBottom: 8 }}>{formatTime(timeLeft)}</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>Try again when the timer expires or subscribe to continue now.</p>
            <button className="btn btn-primary btn-sm" onClick={onUpgrade}>Subscribe Now 💰</button>
        </div>
    );
}

// ─── USER PROFILE TAB ─────────────────────────────────────────────────────────

function UserProfileTab({ user, users, setUsers, profilePic, setProfilePic, removeProfilePic, payments, showToast, notifications, setNotifications, messages, setMessages, setLightboxPhoto }) {
    const [editing, setEditing] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: user.fullName, email: user.email, phone: user.phone, reason: "" });
    const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

    const submitEditRequest = () => {
        if (!editForm.reason) { showToast("Please state your reason for this change", "error"); return; }
        setNotifications(prev => [...prev, { to: "admin", subject: "📝 Profile Edit Request", body: `${user.fullName} (${user.matric}) requests changes. Reason: ${editForm.reason}`, time: new Date().toLocaleString(), matric: user.matric, type: "edit_request", newData: { fullName: editForm.fullName, email: editForm.email, phone: editForm.phone } }]);
        showToast("Edit request submitted! Awaiting admin approval.", "success");
        setEditing(false);
    };

    const handlePicUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setProfilePic(ev.target.result); showToast("Photo updated!", "success"); };
        reader.readAsDataURL(file);
    };

    const clearMyMessages = () => {
        setMessages(prev => prev.filter(m => m.from !== user.matric && m.to !== user.matric));
        showToast("Your message history cleared", "success");
    };

    const clearMyNotifications = () => {
        setNotifications(prev => prev.filter(n => n.to !== user.matric));
        showToast("All your notifications cleared!", "success");
    };

    const clearMyPerformance = () => {
        setUsers(prev => prev.map(u => u.matric === user.matric ? { ...u, cbtHistory: [] } : u));
        showToast("Your performance history cleared", "success");
        setConfirmClear(false);
    };

    return (
        <div>
            <h3 style={{ fontFamily: "Syne", fontSize: 20, marginBottom: 20 }}>My Profile</h3>
            <div className="card p-6 text-center mb-5">
                <label style={{ cursor: "pointer" }}>
                    <div className="profile-avatar-large">
                        {profilePic ? <img src={profilePic} alt="Profile" /> : <span>👤</span>}
                        <div className="profile-avatar-overlay">📷</div>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 1 * 1024 * 1024) { showToast("Image must be under 1MB", "error"); return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => { setProfilePic(ev.target.result); showToast("Photo updated!", "success"); };
                        reader.readAsDataURL(file);
                    }} style={{ display: "none" }} />
                </label>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setLightboxPhoto(profilePic)}>👁️ View Photo</button>
                    {profilePic && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", padding: 0 }} onClick={removeProfilePic}>🗑️ Remove</button>}
                </div>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18 }}>{user.fullName}</div>
                <div className="text-muted text-sm mt-1">{user.department} • {user.level} Level</div>
                <div className="badge badge-blue mt-2">{user.matric}</div>
            </div>

            <div className="card p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 style={{ fontFamily: "Syne", fontSize: 16 }}>Account Details</h4>
                    {!editing && <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>✏️ Request Edit</button>}
                </div>
                {!editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[["Full Name", user.fullName], ["Email", user.email], ["Phone", user.phone], ["Faculty", user.faculty], ["Department", user.department], ["Level", `${user.level} Level`], ["Registered", formatDate(user.registeredAt)]].map(([label, value], i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--card-border)", fontSize: 14 }}>
                                <span className="text-muted">{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div style={{ padding: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, marginBottom: 14, fontSize: 13, color: "#fbbf24" }}>⚠️ Changes require admin approval.</div>
                        <div className="input-group"><label className="input-label">Full Name</label><input className="input-field" value={editForm.fullName} onChange={e => set("fullName", e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Email</label><input className="input-field" type="email" value={editForm.email} onChange={e => set("email", e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Phone</label><input className="input-field" value={editForm.phone} onChange={e => set("phone", e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Reason for Change *</label><textarea className="input-field" rows={3} value={editForm.reason} onChange={e => set("reason", e.target.value)} placeholder="Why do you want to make these changes?" /></div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-primary" onClick={submitEditRequest}>Submit for Approval</button>
                            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card p-6 mb-4">
                <h4 style={{ fontFamily: "Syne", fontSize: 16, marginBottom: 14 }}>My Subscriptions</h4>
                {user.latestSubscription && user.latestSubscription.expiresAt && (
                    <div className="card p-4 mb-4" style={{ background: "linear-gradient(135deg,rgba(22,163,74,0.12),rgba(37,99,235,0.08))", border: "1px solid rgba(34,197,94,0.35)" }}>
                        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>✅ Latest approved plan (synced)</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{user.latestSubscription.plan}</div>
                        <div className="text-xs text-muted mt-1">{user.latestSubscription.amount}</div>
                        {user.latestSubscription.targetCourseCode && <div className="text-xs mt-1" style={{ color: "var(--warning)" }}>Course: {user.latestSubscription.targetCourseCode}</div>}
                        <div className="text-sm mt-2" style={{ color: new Date(user.latestSubscription.expiresAt) > new Date() ? "#4ade80" : "#f87171" }}>
                            {new Date(user.latestSubscription.expiresAt) > new Date() ? "Active until" : "Expired on"} {formatDate(user.latestSubscription.expiresAt)}
                        </div>
                    </div>
                )}
                {(() => {
                    const mySubs = payments.filter(p => p.matric === user.matric);
                    if (mySubs.length === 0 && !user.latestSubscription) return <p className="text-muted text-sm">No subscription history found.</p>;
                    if (mySubs.length === 0) return <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Full payment history loads below when synced.</p>;
                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {mySubs.sort((a,b) => new Date(b.paidAt || b.time) - new Date(a.paidAt || a.time)).map((sub, i) => {
                                const active = sub.status === "approved" && sub.expiresAt && new Date(sub.expiresAt) > new Date();
                                return (
                                    <div key={i} className="card-lifted p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)", borderRadius: 10 }}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>{sub.plan}</div>
                                                <div className="text-xs text-muted">Paid: {formatDate(sub.paidAt || sub.time)}</div>
                                                {sub.targetCourseCode && <div className="text-xs" style={{ color: "var(--warning)" }}>Course: {sub.targetCourseCode}</div>}
                                            </div>
                                            <div className="text-right">
                                                <span className={`badge ${active ? "badge-green" : sub.status === "approved" ? "badge-red" : "badge-yellow"}`}>
                                                    {active ? "Active" : sub.status === "approved" ? "Expired" : sub.status}
                                                </span>
                                                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{sub.amount}</div>
                                            </div>
                                        </div>
                                        {active && <div className="text-xs mt-2" style={{ color: "var(--primary-light)" }}>Ends: {formatDate(sub.expiresAt)}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
            <div className="card p-5 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 style={{ fontFamily: "Syne", fontSize: 16 }}>Test History</h4>
                    {(user.cbtHistory && user.cbtHistory.length > 0) && <button className="btn btn-outline btn-sm" onClick={() => {
                        if (!confirmClear) {
                            setConfirmClear(true);
                            showToast("Tap Clear History again to confirm", "warning");
                            setTimeout(() => setConfirmClear(false), 4000);
                            return;
                        }
                        setConfirmClear(false);
                        setUsers(prev => prev.map(u => u.matric === user.matric ? { ...u, cbtHistory: [] } : u));
                    }}>🗑️ Clear History</button>}
                </div>
                {(!user.cbtHistory || user.cbtHistory.length === 0) ? <p className="text-muted text-sm">No test history available.</p> : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", textAlign: "left", fontSize: 14, borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                                    <th style={{ padding: "8px 0" }}>Date</th>
                                    <th>Course</th>
                                    <th>Score</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...user.cbtHistory].reverse().map((h, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td style={{ padding: "10px 0" }}>{formatDate(h.date)}</td>
                                        <td>{h.course.slice(0, 15)}...</td>
                                        <td style={{ color: h.score >= 50 ? "#4ade80" : "#f87171", fontWeight: 600 }}>{h.score}%</td>
                                        <td><button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="card p-5">
                <div className="flex justify-between items-center">
                    <div><div style={{ fontFamily: "Syne", fontWeight: 700 }}>Message History</div><div className="text-sm text-muted">Clear all your messages</div></div>
                    <button className="btn btn-danger btn-sm" onClick={clearMyMessages}>🗑️ Clear</button>
                </div>
            </div>
        </div>
    );
}

// ─── USER MESSAGES TAB ────────────────────────────────────────────────────────

function UserMessagesTab({ user, messages, setMessages, showToast }) {
    const [newMsg, setNewMsg] = useState("");
    const [attachedImage, setAttachedImage] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const myMessages = messages.filter(m => m.to === user.matric || m.from === user.matric || (m.type === "user_to_admin" && m.from === user.matric));

    const handleAttach = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsCompressing(true);
        try {
            const compressed = await compressImage(file, 600, 0.5);
            setAttachedImage(compressed);
            showToast("Image attached", "success");
        } catch (err) {
            showToast("Failed to process image", "error");
        }
        setIsCompressing(false);
    };

    const sendMessage = () => {
        if (!newMsg.trim() && !attachedImage) return;
        setMessages(prev => [...prev, { id: Date.now(), from: user.matric, fromName: user.fullName, to: "admin", body: newMsg, image: attachedImage, time: new Date().toLocaleString(), type: "user_to_admin" }]);
        setNewMsg("");
        setAttachedImage(null);
        showToast("Message sent to admin!", "success");
    };

    return (
        <div>
            <h3 style={{ fontFamily: "Syne", fontSize: 20, marginBottom: 20 }}>Messages</h3>
            <div className="card p-5 mb-5">
                <h4 style={{ fontFamily: "Syne", marginBottom: 12, fontSize: 15 }}>Send a Message to Admin</h4>
                <div className="input-group"><textarea className="input-field" rows={3} value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type your message..." /></div>
                {attachedImage && <div className="mb-3 relative" style={{ display: "inline-block" }}><img src={attachedImage} style={{ maxHeight: 100, borderRadius: 8, border: "2px solid var(--primary)" }} alt="attached preview" /><button className="btn btn-danger btn-sm" style={{ position: "absolute", top: -8, right: -8, padding: "2px 6px", borderRadius: "50%" }} onClick={() => setAttachedImage(null)}>✕</button></div>}
                <div className="flex gap-2">
                    <label className="btn btn-outline" style={{ cursor: "pointer", opacity: isCompressing ? 0.5 : 1 }}>
                        {isCompressing ? "⏳" : "📷"} Attach Image
                        <input type="file" accept="image/*" onChange={handleAttach} style={{ display: "none" }} disabled={isCompressing} />
                    </label>
                    <button className="btn btn-primary flex-1" onClick={sendMessage} disabled={isCompressing}>📤 Send Message</button>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ fontFamily: "Syne", fontSize: 15 }}>Conversation History</h4>
                {myMessages.length > 0 && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", fontSize: 11 }} onClick={() => {
                    if (window.confirm("Clear all your messages? Admin will still have a record for support.")) {
                        setMessages(prev => prev.filter(m => m.from !== user.matric && m.to !== user.matric));
                        showToast("Your message view cleared", "success");
                    }
                }}>🗑️ Clear View</button>}
            </div>
            {myMessages.length === 0 && <p className="text-muted text-sm">No messages yet.</p>}
            {[...myMessages].reverse().map((m, i) => (
                <div key={i} className="card p-4 mb-3" style={{ borderLeft: `3px solid ${m.from === user.matric ? "var(--primary)" : "var(--success)"}` }}>
                    <div className="flex justify-between text-sm mb-2">
                        <strong>{m.from === user.matric ? "You → Admin" : `${m.fromName || "Admin"} → You`}</strong>
                        <span className="text-muted">{m.time}</span>
                    </div>
                    <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</p>
                    {m.image && <img src={m.image} alt="Attachment" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginTop: 8, border: "1px solid var(--text-muted)", cursor: "pointer" }} onClick={(e) => { e.target.style.maxHeight = e.target.style.maxHeight === "200px" ? "none" : "200px" }} />}
                </div>
            ))}
        </div>
    );
}

// ─── QUIZ MODAL ───────────────────────────────────────────────────────────────

function QuizModal({ opts, user, setUsers, users, penaltyData, setPenaltyData, payments, plans, globalQuestions, onClose, onUpgrade, showToast }) {
    const [stage, setStage] = useState("setup");
    const [settings, setSettings] = useState({ questionCount: 10, totalTime: 60, mode: opts?.mode || "timer", type: opts?.type || "combined", feedback: "end", difficulty: "mixed" });
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [flagged, setFlagged] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timeUp, setTimeUp] = useState(false);
    const [showCalc, setShowCalc] = useState(false);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [confirmQuit, setConfirmQuit] = useState(false);
    const timerRef = useRef(null);

    const activePayments = payments.filter(p => p.matric === user?.matric && p.status === "approved" && p.expiresAt && new Date(p.expiresAt) > new Date());
    const hasAccess = (() => {
        if (ADMINS.some(a => a.matric === user?.matric)) return true; // Admin Full Access
        
        return activePayments.some(p => {
            const plan = String(p.plan || "");
            // Tier 1: Single Course Access
            if (plan === "Single Course" || p.targetCourseCode) {
                return p.targetCourseCode === opts?.courseCode;
            }
            // Tier 2: BusAdmin Special Offer (8 courses)
            if (plan.includes("BusAdmin Special Offer")) {
                const specialCourseCodes = ["PMG313", "FIN313", "EHR305", "BUA399", "BUA319", "BUA317", "BUA313", "BUA303"];
                return specialCourseCodes.includes(opts?.courseCode);
            }
            // Tier 3: All-Access Plans (Premium/Dept Full)
            if (plan.includes("Premium") || plan.includes("Full") || plan.includes("Extended")) {
                return true;
            }
            return false;
        });
    })();

    const filterQuestions = useCallback(() => {
        // Always prefer Firestore questions (globalQuestions); fall back to samples only if both are empty
        const pool = globalQuestions && globalQuestions.length > 0 ? globalQuestions : SAMPLE_QUESTIONS;
        let q = [...pool];
        if (opts?.courseCode) q = q.filter(x => x.course === opts.courseCode);
        if (settings.type !== "combined") q = q.filter(x => x.type === settings.type);
        if (settings.difficulty !== "mixed") q = q.filter(x => x.difficulty === settings.difficulty);
        q = shuffleArray(q);

        // Hard clamp to 5 questions maximum if the user has no purchased access
        const limit = hasAccess ? settings.questionCount : Math.min(5, settings.questionCount);
        return q.slice(0, limit);
    }, [settings, opts, globalQuestions, hasAccess]);

    const startQuiz = () => {
        const qs = filterQuestions();
        if (qs.length === 0) { showToast("No questions for this selection yet.", "warning"); return; }

        // Explicit trial counter enforcement for non-purchased access
        if (!hasAccess && opts?.courseCode && user) {
            const latestUser = users?.find(u => u.matric === user.matric) || user;
            const attempts = latestUser.trialAttempts || 0;
            const penaltyUntil = latestUser.trialPenaltyUntil || penaltyData?.[latestUser.matric]?.until;
            const inPenalty = !!(penaltyUntil && Date.now() < penaltyUntil);

            if (inPenalty) {
                onClose();
                showToast("Training locked! Subscribe to bypass the countdown.", "error");
                setTimeout(() => onUpgrade(), 300);
                return;
            }

            // Reset attempts if the previous penalty has expired
            const nextAttempts = attempts >= 3 ? 1 : attempts + 1;
            setUsers(prev => prev.map(u => u.matric === user.matric ? { ...u, trialAttempts: nextAttempts } : u));
        }

        setQuestions(qs); setAnswers({}); setCurrent(0); setFlagged(new Set());
        setTimeLeft(settings.totalTime * 60); setStage("quiz");
    };

    const submitQuiz = useCallback(() => {
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < questions.length && !confirmSubmit) {
            setConfirmSubmit(true);
            showToast(`You have ${questions.length - answeredCount} unfinished questions. Tap Submit again to confirm.`, "warning");
            setTimeout(() => setConfirmSubmit(false), 4000);
            return;
        }
        setConfirmSubmit(false);
        clearInterval(timerRef.current);
        setStage("result");

        if (!hasAccess && opts?.courseCode && user) {
            const latestUser = users?.find(u => u.matric === user.matric) || user;
            const currentAttempts = latestUser.trialAttempts || 0;
            if (currentAttempts >= 3) {
                const until = Date.now() + 4 * 60 * 60 * 1000;
                // Sync across devices: store penalty on the user record
                setUsers(prev => prev.map(u => u.matric === latestUser.matric ? { ...u, trialPenaltyUntil: until } : u));
                // Backwards-compat (older sessions may still read penaltyData)
                setPenaltyData(prev => ({ ...prev, [latestUser.matric]: { until } }));
                // We keep attempts at 3 so Dashboard shows "0 left" during penalty
                setTimeout(() => {
                    showToast("Free Trial limit reached! 4-hour countdown started.", "warning");
                    onUpgrade();
                }, 1500);
            }
        }

        if (user && setUsers && opts?.course) {
            const correctCount = questions.filter((q, i) => {
                const a = answers[i];
                if (q.type === "objective") return a?.startsWith(q.answer);
                if (q.type === "fill") return a?.toLowerCase().trim() === q.answer.toLowerCase().trim();
                return a && a.length > 5;
            }).length;
            const scorePct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

            setUsers(prev => prev.map(u => u.matric === user.matric ? {
                ...u,
                questionsAttempted: (u.questionsAttempted || 0) + questions.length,
                cbtHistory: [...(u.cbtHistory || []), { date: new Date().toISOString(), course: opts.course, score: scorePct, correct: correctCount, total: questions.length }]
            } : u));
        }
    }, [hasAccess, opts, questions, user, setPenaltyData, answers, setUsers, users, onUpgrade, showToast, confirmSubmit]);

    useEffect(() => {
        if (stage === "quiz" && settings.mode !== "no-timer") {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(timerRef.current);
                        setTimeUp(true);
                        setTimeout(() => { setTimeUp(false); submitQuiz(); }, 3000);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [stage, settings.mode, submitQuiz]);

    useEffect(() => {
        if (stage !== "quiz") return;
        const handleKey = (e) => {
            const q = questions[current];
            if (!q) return;
            if (e.key === "n" || e.key === "N") { if (current < questions.length - 1) { setCurrent(c => c + 1); setShowFeedback(false); } }
            if (e.key === "p" || e.key === "P") { if (current > 0) { setCurrent(c => c - 1); setShowFeedback(false); } }
            if (q.type === "objective" && q.options) {
                const keyMap = { a: 0, b: 1, c: 2, d: 3 };
                const idx = keyMap[e.key.toLowerCase()];
                if (idx !== undefined && q.options[idx]) { setAnswers(a => ({ ...a, [current]: q.options[idx] })); if (settings.feedback === "immediate") setShowFeedback(true); }
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [stage, current, questions, settings.feedback]);

    const q = questions[current];
    const answered = Object.keys(answers).length;
    const progress = questions.length ? (answered / questions.length) * 100 : 0;
    const timerClass = timeLeft > 300 ? "timer-blue" : timeLeft > 60 ? "timer-yellow" : "timer-red";

    const correct = questions.filter((q, i) => {
        const a = answers[i];
        if (q.type === "objective") return a?.startsWith(q.answer);
        if (q.type === "fill") return a?.toLowerCase().trim() === q.answer.toLowerCase().trim();
        return a && a.length > 5;
    }).length;
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    const topicScores = {};
    questions.forEach((q, i) => {
        if (!topicScores[q.topic]) topicScores[q.topic] = { correct: 0, total: 0 };
        topicScores[q.topic].total++;
        const a = answers[i];
        const isCorrect = q.type === "objective" ? a?.startsWith(q.answer) : q.type === "fill" ? a?.toLowerCase().trim() === q.answer.toLowerCase().trim() : a?.length > 5;
        if (isCorrect) topicScores[q.topic].correct++;
    });

    if (timeUp) return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.96)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>😢</div>
            <h2 style={{ fontFamily: "Syne", fontSize: 32, marginBottom: 12 }}>Time's Up!</h2>
            <p className="text-muted">Submitting your answers now...</p>
        </div>
    );

    return (
        <>
            {showCalc && <DraggableCalculator onClose={() => setShowCalc(false)} />}
            {/* Floating calc toggle button - only during quiz/study stage */}
            {(stage === "quiz" || stage === "setup") && (
                <button
                    onClick={() => setShowCalc(s => !s)}
                    style={{ position: "fixed", bottom: 24, left: 24, width: 48, height: 48, borderRadius: "50%", background: "var(--gradient)", border: "none", cursor: "pointer", fontSize: 20, zIndex: 600, boxShadow: "0 4px 16px rgba(37,99,235,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Calculator"
                >🧮</button>
            )}
            <div className="modal-overlay">
                <div className="card modal modal-wide" style={{ maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

                    {stage === "setup" && (
                        <>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-gradient">⚙️ Quiz Settings</h3>
                                <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                            </div>
                            {opts?.course && <div className="badge badge-blue mb-4">📚 {opts.course}</div>}
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">Practice Mode</label>
                                    <select className="input-field" value={settings.mode} onChange={e => setSettings(s => ({ ...s, mode: e.target.value }))}>
                                        <option value="no-timer">No Timer (Study)</option>
                                        <option value="timer">Total Timer (JAMB Style)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Difficulty</label>
                                    <select className="input-field" value={settings.difficulty} onChange={e => setSettings(s => ({ ...s, difficulty: e.target.value }))}>
                                        <option value="mixed">Mixed (All Levels)</option>
                                        <option value="easy">Easy Mode</option>
                                        <option value="medium">Medium Mode</option>
                                        <option value="hard">Hard Mode</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Question Type</label>
                                    <select className="input-field" value={settings.type} onChange={e => setSettings(s => ({ ...s, type: e.target.value }))}>
                                        <option value="combined">Combined</option>
                                        <option value="objective">Objective Only</option>
                                        <option value="fill">Fill-in-the-Gap</option>
                                        <option value="theory">Theory Only</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Number of Questions</label>
                                    <input className="input-field" type="number" min={1} max={!hasAccess ? 5 : 500} value={!hasAccess ? Math.min(5, settings.questionCount) : settings.questionCount} onChange={e => setSettings(s => ({ ...s, questionCount: Math.min(Number(e.target.value), !hasAccess ? 5 : 500) }))} disabled={!hasAccess} />
                                    {!hasAccess && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 4, fontWeight: "bold" }}>Max 5 Questions per Free Trial</div>}
                                </div>
                                {settings.mode === "timer" && (
                                    <div className="input-group">
                                        <label className="input-label">Total Time (minutes)</label>
                                        <input className="input-field" type="number" min={1} max={180} value={settings.totalTime} onChange={e => setSettings(s => ({ ...s, totalTime: Number(e.target.value) }))} />
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">Answer Feedback</label>
                                    <select className="input-field" value={settings.feedback} onChange={e => setSettings(s => ({ ...s, feedback: e.target.value }))}>
                                        <option value="immediate">Immediate</option>
                                        <option value="end">End of Session</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ padding: 12, background: "rgba(37,99,235,0.1)", borderRadius: 10, marginBottom: 14, fontSize: 12, color: "var(--text-muted)" }}>
                                ⌨️ Keyboard: <strong style={{ color: "var(--text)" }}>N</strong>=Next, <strong style={{ color: "var(--text)" }}>P</strong>=Prev, <strong style={{ color: "var(--text)" }}>A/B/C/D</strong>=Select answer
                            </div>
                            <button className="btn btn-primary btn-full" onClick={startQuiz}>▶ Start Quiz</button>
                        </>
                    )}

                    {stage === "quiz" && q && (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <span className="badge badge-blue">Q {current + 1}/{questions.length}</span>
                                    <span className={`badge diff-${q.difficulty}`}>{q.difficulty}</span>
                                </div>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    {settings.mode !== "no-timer" && <div className={`${timerClass}`} style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800 }}>⏱ {formatTime(timeLeft)}</div>}
                                    <button className="btn btn-ghost btn-sm" onClick={() => {
                                        const answeredCount = Object.keys(answers).length;
                                        if (answeredCount < questions.length && !confirmQuit) {
                                            setConfirmQuit(true);
                                            showToast(`You have ${questions.length - answeredCount} unfinished questions. Tap ✕ again to quit.`, "warning");
                                            setTimeout(() => setConfirmQuit(false), 4000);
                                            return;
                                        }
                                        clearInterval(timerRef.current); onClose();
                                    }}>✕</button>
                                </div>
                            </div>
                            <div className="progress-bar mb-4"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>{q.type === "objective" ? "🔘 Multiple Choice" : q.type === "fill" ? "✏️ Fill in the Gap" : "📝 Theory"}</div>
                                <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 500 }}>{q.question}</p>
                            </div>
                            {q.type === "objective" && q.options.map((opt, i) => {
                                const letter = opt[0];
                                const isSelected = answers[current] === opt;
                                const feedbackMode = settings.feedback === "immediate" && showFeedback;
                                const isCorrect = feedbackMode && letter === q.answer;
                                const isWrong = feedbackMode && isSelected && letter !== q.answer;
                                return (
                                    <button key={i} className={`option-btn ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => { if (feedbackMode) return; setAnswers(a => ({ ...a, [current]: opt })); if (settings.feedback === "immediate") setShowFeedback(true); }}>
                                        <div className="option-key">{letter}</div>{opt.slice(3)}
                                    </button>
                                );
                            })}
                            {q.type === "fill" && <div className="input-group"><input className="input-field" value={answers[current] || ""} onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))} placeholder="Type your answer..." style={{ fontSize: 15 }} /></div>}
                            {q.type === "theory" && <div className="input-group"><textarea className="input-field" rows={5} value={answers[current] || ""} onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))} placeholder="Write your answer..." style={{ fontSize: 14, resize: "vertical" }} /></div>}
                            {settings.feedback === "immediate" && showFeedback && (
                                <div style={{ padding: 14, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 10, marginBottom: 14 }}>
                                    <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>✅ Correct Answer: {q.answer}</div>
                                    <div className="text-sm text-muted">{q.explanation}</div>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setCurrent(c => Math.max(0, c - 1)); setShowFeedback(false); }} disabled={current === 0}>← Prev</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setFlagged(f => {
                                        const n = new Set(f);
                                        if (n.has(current)) { n.delete(current); } else {
                                            n.add(current);
                                            // Add flagged notification to general admin feed
                                            const notifsData = localStorage.getItem("simyc_notifs");
                                            const oldNotifs = notifsData ? JSON.parse(notifsData) : [];
                                            localStorage.setItem("simyc_notifs", JSON.stringify([...oldNotifs, { to: "admin", subject: "🚩 Question Flagged", body: `A user flagged question: "${q.question}" from ${q.course}`, time: new Date().toLocaleString(), type: "flagged_question" }]));
                                            showToast("Question flagged for review!", "info");
                                        }
                                        return n;
                                    })}>{flagged.has(current) ? "🚩" : "🏳️"}</button>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {current < questions.length - 1 ? <button className="btn btn-primary btn-sm" onClick={() => { setCurrent(c => c + 1); setShowFeedback(false); }}>Next →</button> : <button className="btn btn-success btn-sm" onClick={submitQuiz}>📩 Submit</button>}
                                </div>
                            </div>
                            <div style={{ marginTop: 14, display: "flex", gap: 5, flexWrap: "wrap" }}>
                                {questions.map((_, i) => (
                                    <div key={i} onClick={() => { setCurrent(i); setShowFeedback(false); }} style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, cursor: "pointer", background: i === current ? "var(--primary)" : flagged.has(i) ? "rgba(245,158,11,0.4)" : answers[i] ? "rgba(22,163,74,0.3)" : "var(--card-border)", border: i === current ? "2px solid var(--primary-light)" : "1px solid transparent", transition: "all 0.15s" }}>{i + 1}</div>
                                ))}
                            </div>
                        </>
                    )}

                    {stage === "result" && (
                        <>
                            <div className="text-center mb-6">
                                <div style={{ fontSize: 60, marginBottom: 10 }}>{score >= 70 ? "🏆" : score >= 50 ? "👍" : "📖"}</div>
                                <h2 className="text-gradient" style={{ fontSize: 30 }}>{score}%</h2>
                                <p className="text-muted">{correct} correct out of {questions.length}</p>
                                <div className="mt-4"><span className={`badge ${score >= 70 ? "badge-green" : score >= 50 ? "badge-yellow" : "badge-red"}`}>{score >= 70 ? "Excellent! 🎯" : score >= 50 ? "Good effort 👍" : "Needs improvement 📚"}</span></div>
                            </div>
                            <div className="grid-3 mb-5">
                                <div className="card p-4 text-center"><div style={{ fontSize: 22, color: "#4ade80", fontWeight: 800 }}>{correct}</div><div className="text-xs text-muted">Correct</div></div>
                                <div className="card p-4 text-center"><div style={{ fontSize: 22, color: "#f87171", fontWeight: 800 }}>{questions.length - correct}</div><div className="text-xs text-muted">Wrong</div></div>
                                <div className="card p-4 text-center"><div style={{ fontSize: 22, color: "var(--primary-light)", fontWeight: 800 }}>{questions.filter((_, i) => !answers[i]).length}</div><div className="text-xs text-muted">Unanswered</div></div>
                            </div>
                            <h4 style={{ fontFamily: "Syne", marginBottom: 12 }}>📊 Topic Performance</h4>
                            {Object.entries(topicScores).map(([topic, data]) => {
                                const pct = Math.round((data.correct / data.total) * 100);
                                return (
                                    <div key={topic} style={{ marginBottom: 12 }}>
                                        <div className="flex justify-between text-sm mb-1"><span>{topic}</span><span style={{ color: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171" }}>{pct}%</span></div>
                                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)" }} /></div>
                                    </div>
                                );
                            })}
                            {Object.entries(topicScores).filter(([, d]) => d.correct / d.total < 0.6).length > 0 && (
                                <div style={{ padding: 14, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, marginBottom: 14 }}>
                                    <strong style={{ color: "#fbbf24" }}>💡 Recommendation:</strong>
                                    <p className="text-sm text-muted mt-1">Focus on: <strong>{Object.entries(topicScores).filter(([, d]) => d.correct / d.total < 0.6).map(([t]) => t).join(", ")}</strong></p>
                                </div>
                            )}
                            <h4 style={{ fontFamily: "Syne", marginBottom: 12 }}>📋 Review</h4>
                            {questions.map((q, i) => {
                                const isCorrect = q.type === "objective" ? answers[i]?.startsWith(q.answer) : q.type === "fill" ? answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim() : answers[i]?.length > 5;
                                return (
                                    <div key={i} style={{ padding: "12px 14px", marginBottom: 8, background: "var(--card)", borderRadius: 10, border: `1px solid ${isCorrect ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}` }}>
                                        <div className="flex items-center gap-2 mb-1"><span>{isCorrect ? "✅" : "❌"}</span><span style={{ fontSize: 13, fontWeight: 600 }}>Q{i + 1}: {q.question.slice(0, 70)}...</span></div>
                                        {q.image && <img src={q.image} style={{ maxHeight: 80, display: "block", marginBottom: 8, borderRadius: 4 }} alt="Diagram" />}
                                        <div className="text-sm"><span className="text-muted">Your answer: </span>{answers[i] || "Not answered"}</div>
                                        {!isCorrect && <div className="text-sm mt-1"><span className="text-muted">Correct: </span><span style={{ color: "#4ade80", fontWeight: 600 }}>{q.answer}</span></div>}
                                        <div className="text-xs text-muted mt-1">{q.explanation}</div>
                                    </div>
                                );
                            })}
                            <div className="flex gap-3 mt-5">
                                <button className="btn btn-primary btn-full" onClick={() => setStage("setup")}>🔄 Try Again</button>
                                <button className="btn btn-outline btn-full" onClick={onClose}>✕ Close</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

function PaymentModal({ onClose, payments, setPayments, user, plans, showToast }) {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [step, setStep] = useState("plans");
    const [proofText, setProofText] = useState("");
    const [targetCourseCode, setTargetCourseCode] = useState("");

    const handleSubmit = () => {
        if (!proofText) { showToast("Please confirm payment sent", "error"); return; }
        setPayments(prev => [...prev, { id: Date.now(), matric: user.matric, name: user.fullName || user.name, plan: selectedPlan.name, amount: selectedPlan.price, status: "pending", time: new Date().toLocaleString(), durationDays: selectedPlan.durationDays, targetCourseCode: selectedPlan.id === "single" ? targetCourseCode : null }]);
        setStep("submitted");
        showToast("Payment submitted! Awaiting admin approval.", "success");
    };

    return (
        <div className="modal-overlay">
            <div className="card modal modal-wide" style={{ maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-gradient">💰 Upgrade Your Access</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>

                {step === "plans" && (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                            {plans.map(plan => (
                                <div key={plan.id} className={`card p-5 card-lifted pointer ${plan.special ? "plan-special" : ""}`}
                                    style={{ border: selectedPlan?.id === plan.id ? "2px solid var(--primary)" : plan.special ? undefined : "1px solid var(--card-border)", cursor: "pointer", position: "relative" }}
                                    onClick={() => setSelectedPlan(plan)}>
                                    {plan.special && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#f59e0b", marginBottom: 6 }}>⭐ BEST VALUE</div>}
                                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>{plan.name}</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: plan.special ? "#f59e0b" : "var(--primary-light)", margin: "8px 0" }}>{plan.price}</div>
                                    <div className="text-sm text-muted">{plan.duration}</div>
                                    <div className="text-sm mt-2 font-semibold" style={{ color: plan.id === "single" ? "var(--warning)" : "var(--success)" }}>
                                        {plan.id === "single" ? "🎯 Access to 1 Course only" : "🔥 Access to ALL Courses"}
                                    </div>
                                    <div className="text-xs mt-1 text-muted">{plan.description}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: 12, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, marginBottom: 14, fontSize: 13, color: "#f87171" }}>
                            ⚠️ Please do not share your login credentials after payment. Exposing your account constraints will lead to an immediate ban without refund.
                        </div>
                        {selectedPlan?.id === "single" && (
                            <div className="card p-4 mb-4" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.3)" }}>
                                <h4 style={{ fontFamily: "Syne", fontSize: 14, marginBottom: 8, color: "#fbbf24" }}>🎯 Select Your Target Course:</h4>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <select className="input-field" value={targetCourseCode} onChange={e => setTargetCourseCode(e.target.value)}>
                                        <option value="">-- Choose Course --</option>
                                        {COURSES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                        <button className="btn btn-primary btn-full" onClick={() => { if (!selectedPlan) { showToast("Please click on a plan card to select it first.", "warning"); return; } if (selectedPlan.id === "single" && !targetCourseCode) { showToast("Please select a target course from the dropdown.", "warning"); return; } setStep("instructions"); }}>
                            Continue {selectedPlan ? `with ${selectedPlan.name}` : ""} →
                        </button>
                    </>
                )}

                {step === "instructions" && (
                    <>
                        <div className="card p-5 mb-5" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)" }}>
                            <h4 style={{ fontFamily: "Syne", marginBottom: 12 }}>📋 Payment Instructions</h4>
                            <ol style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: 14 }}>
                                <li>Send <strong style={{ color: "var(--primary-light)" }}>{selectedPlan.price}</strong> to <strong>Pocket App: 7381677614</strong></li>
                                <li>Use your Matric Number as payment description</li>
                                <li>Screenshot your successful payment</li>
                                <li>Send to WhatsApp: <a href="https://wa.me/2348153996360" target="_blank" rel="noreferrer" style={{ color: "#25D366" }}>+234 815 399 6360</a></li>
                                <li>Click "I've Paid" below</li>
                            </ol>
                            <div style={{ marginTop: 12, padding: 12, background: "rgba(245,158,11,0.1)", borderRadius: 8, fontSize: 13, color: "#fbbf24" }}>⚠️ Always use your matric number as payment description.</div>
                        </div>
                        <label className="checkbox-group">
                            <input type="checkbox" checked={!!proofText} onChange={e => setProofText(e.target.checked ? "confirmed" : "")} />
                            <span style={{ fontSize: 14 }}>I have sent <strong>{selectedPlan.price}</strong> and WhatsApped my receipt</span>
                        </label>
                        <button className="btn btn-success btn-full mt-4" onClick={handleSubmit}>✅ I've Paid — Notify Admin</button>
                        <button className="btn btn-ghost btn-full mt-3" onClick={() => setStep("plans")}>← Back to Plans</button>
                    </>
                )}

                {step === "submitted" && (
                    <div className="text-center" style={{ padding: "24px 0" }}>
                        <div style={{ fontSize: 64 }}>⏳</div>
                        <h3 style={{ fontFamily: "Syne", marginTop: 16 }}>Payment Submitted!</h3>
                        <p className="text-muted mt-2">You'll be notified once approved.</p>
                        <div style={{ marginTop: 20, padding: 16, background: "var(--card)", borderRadius: 12, fontSize: 14 }}>
                            <div>Plan: <strong>{selectedPlan.name}</strong></div>
                            <div>Amount: <strong>{selectedPlan.price}</strong></div>
                            <div>Status: <span className="badge badge-yellow">⏳ Pending</span></div>
                        </div>
                        <button className="btn btn-outline btn-full mt-4" onClick={onClose}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── ADMIN SCREEN ─────────────────────────────────────────────────────────────

function AdminScreen({ user, users, setUsers, payments, setPayments, notifications, setNotifications, broadcasts, setBroadcasts, adminLogs, setAdminLogs, logAdminAction, messages, setMessages, readAdminMsgs, setReadAdminMsgs, onLogout, showToast, isSuperAdmin, maintenanceMode, setMaintenanceMode, plans, setPlans, questions, setQuestions, setLightboxPhoto }) {
    const [section, setSection] = useState("overview");

    const unreadTotal = messages.filter(m => m.type === "user_to_admin" && !readAdminMsgs.includes(m.id)).length;
    const unreadEditRequests = notifications.filter(n => n.type === "edit_request" && n.status !== "approved" && n.status !== "rejected").length;
    const pendingPayments = payments.filter(p => p.status === "pending").length;
    const systemAdminNotifs = notifications.filter(n => (n.to === "admin" || n.to === "superadmin") && n.type !== "edit_request");

    const sidebarItems = [
        { id: "overview", icon: "🏠", label: "Overview" },
        { id: "users", icon: "👥", label: "User Management" },
        { id: "payments", icon: "💰", label: "Payments" },
        { id: "questions", icon: "📚", label: "Questions" },
        { id: "broadcast", icon: "📢", label: "Broadcast" },
        { id: "messages", icon: "💬", label: "Messages" },
        { id: "editrequests", icon: "✏️", label: "Edit Requests" },
        { id: "notifications", icon: "🔔", label: "System Notifications" },
        { id: "analytics", icon: "📊", label: "Analytics" },
        { id: "subscriptionmonitor", icon: "📉", label: "Subscription Monitor" },
        { id: "performance", icon: "📈", label: "Student Performance" },
        { id: "cbt", icon: "🎓", label: "My CBT Practice" },
        ...(isSuperAdmin ? [{ id: "superadmin", icon: "👑", label: "Super Admin" }, { id: "planmanager", icon: "💳", label: "Manage Plans" }] : []),
        { id: "settings", icon: "⚙️", label: "Settings" },
    ];

    return (
        <div className="admin-layout">
            <div className="admin-sidebar">
                <div style={{ padding: "16px 18px", marginBottom: 8, borderBottom: "1px solid var(--card-border)" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15 }}>{isSuperAdmin ? "👑 Super Admin" : "🛡️ Admin Panel"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{user.name}</div>
                </div>
                {sidebarItems.map(item => (
                    <div key={item.id} className={`sidebar-item ${section === item.id ? "active" : ""}`} onClick={() => setSection(item.id)}>
                        {item.icon} {item.label}
                        {item.id === "messages" && unreadTotal > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: "auto", fontSize: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 0 }}>{unreadTotal}</span>
                        )}
                        {item.id === "editrequests" && unreadEditRequests > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: "auto", fontSize: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 0 }}>{unreadEditRequests}</span>
                        )}
                        {item.id === "payments" && pendingPayments > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: "auto", fontSize: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 0 }}>{pendingPayments}</span>
                        )}
                        {item.id === "notifications" && systemAdminNotifs.length > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: "auto", fontSize: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 0 }}>{systemAdminNotifs.length}</span>
                        )}
                    </div>
                ))}
                <div style={{ padding: "20px 16px" }}>
                    <button className="btn-logout" style={{ width: "100%", justifyContent: "center" }} onClick={onLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="admin-main">
                {section === "overview" && <AdminOverview users={users} payments={payments} adminLogs={adminLogs} notifications={notifications} isSuperAdmin={isSuperAdmin} setSection={setSection} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} questions={questions} />}
                {section === "users" && <AdminUsers users={users} setUsers={setUsers} notifications={notifications} setNotifications={setNotifications} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} isSuperAdmin={isSuperAdmin} setLightboxPhoto={setLightboxPhoto} />}
                {section === "payments" && <AdminPayments payments={payments} setPayments={setPayments} users={users} setUsers={setUsers} notifications={notifications} setNotifications={setNotifications} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} isSuperAdmin={isSuperAdmin} />}
                {section === "questions" && <AdminQuestions questions={questions} setQuestions={setQuestions} showToast={showToast} />}
                {section === "broadcast" && <AdminBroadcast broadcasts={broadcasts} setBroadcasts={setBroadcasts} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} isSuperAdmin={isSuperAdmin} />}
                {section === "messages" && <AdminMessages messages={messages} setMessages={setMessages} readAdminMsgs={readAdminMsgs} setReadAdminMsgs={setReadAdminMsgs} users={users} adminName={user.name} showToast={showToast} isSuperAdmin={isSuperAdmin} />}
                {section === "editrequests" && <AdminEditRequests notifications={notifications} setNotifications={setNotifications} users={users} setUsers={setUsers} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} isSuperAdmin={isSuperAdmin} currentUser={user} />}
                {section === "notifications" && <AdminNotifications notifications={notifications} setNotifications={setNotifications} showToast={showToast} />}
                {section === "analytics" && <AdminAnalytics users={users} payments={payments} setSection={setSection} />}
                {section === "performance" && <AdminPerformance users={users} setUsers={setUsers} showToast={showToast} />}
                {section === "subscriptionmonitor" && <AdminSubscriptionMonitor users={users} payments={payments} setPayments={setPayments} showToast={showToast} />}
                {section === "cbt" && <AdminCBTPractice user={user} questions={questions} showToast={showToast} />}
                {section === "superadmin" && isSuperAdmin && (
                    <SuperAdminPanel
                        adminLogs={adminLogs} setAdminLogs={setAdminLogs}
                        users={users} setUsers={setUsers}
                        payments={payments} setPayments={setPayments}
                        notifications={notifications} setNotifications={setNotifications}
                        messages={messages} setMessages={setMessages}
                        showToast={showToast}
                        logAdminAction={(a) => logAdminAction(user.name, a)}
                    />
                )}
                {section === "planmanager" && isSuperAdmin && <PlanManager plans={plans} setPlans={setPlans} showToast={showToast} />}
                {section === "settings" && <AdminSettings showToast={showToast} />}
            </div>
        </div>
    );
}

// ─── ADMIN OVERVIEW ───────────────────────────────────────────────────────────

function AdminOverview({ users, payments, adminLogs, notifications, isSuperAdmin, setSection, maintenanceMode, setMaintenanceMode, logAdminAction, showToast, questions }) {
    const [maintenanceMsg, setMaintenanceMsg] = useState(maintenanceMode.message || "");
    const pending = payments.filter(p => p.status === "pending").length;
    const approved = payments.filter(p => p.status === "approved").length;

    const toggleMaintenance = () => {
        const newState = { active: !maintenanceMode.active, message: maintenanceMsg || "System update in progress. Please check back shortly." };
        setMaintenanceMode(newState);
        logAdminAction(`${newState.active ? "Enabled" : "Disabled"} maintenance mode`);
        showToast(newState.active ? "🔧 App is now in maintenance mode" : "✅ App is now live", newState.active ? "warning" : "success");
    };

    return (
        <div>
            <h2 className="text-gradient mb-5" style={{ fontSize: 22 }}>Dashboard Overview</h2>

            {/* Maintenance Mode */}
            <div className="card p-5 mb-5" style={{ border: `1px solid ${maintenanceMode.active ? "rgba(220,38,38,0.4)" : "var(--card-border)"}`, background: maintenanceMode.active ? "rgba(220,38,38,0.05)" : undefined }}>
                <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                    <div>
                        <div style={{ fontFamily: "Syne", fontWeight: 700 }}>🔧 Maintenance Mode</div>
                        <div className="text-sm text-muted mt-1">Put the app on hold — users will see your message instead of the login page</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span className={`badge ${maintenanceMode.active ? "badge-red" : "badge-green"}`}>{maintenanceMode.active ? "🔴 ACTIVE" : "🟢 OFFLINE"}</span>
                        <button className={`btn btn-sm ${maintenanceMode.active ? "btn-success" : "btn-danger"}`} onClick={toggleMaintenance}>
                            {maintenanceMode.active ? "✅ Go Live" : "🔧 Enable Maintenance"}
                        </button>
                    </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Billboard Message</label>
                    <input className="input-field" value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} placeholder="e.g. System update in progress. Back in 30 minutes." />
                </div>
            </div>

            <div className="grid-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {[
                    { icon: "👥", label: "Total Students", value: users.filter(u => !u.isDeleted).length, color: "var(--primary-light)", section: "users" },
                    { icon: "⏳", label: "Pending Payments", value: pending, color: "#fbbf24", section: "payments" },
                    { icon: "✅", label: "Active Subscribers", value: approved, color: "#4ade80", section: "payments" },
                    { icon: "📚", label: "Questions", value: questions?.length || 0, color: "#a78bfa", section: "questions" },
                    { icon: "📝", label: "Edit Requests", value: notifications.filter(n => n.type === "edit_request" && n.status !== "approved" && n.status !== "rejected").length, color: "#f472b6", section: "editrequests" },
                ].map((s, i) => (
                    <div key={i} className="card stat-card stat-card-clickable" onClick={() => setSection(s.section)}>
                        <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                        <div style={{ fontSize: 10, color: "var(--primary-light)", marginTop: 6 }}>Tap to manage →</div>
                    </div>
                ))}
            </div>

            {isSuperAdmin && adminLogs.length > 0 && (
                <>
                    <h3 style={{ fontFamily: "Syne", marginBottom: 12, fontSize: 16 }}>🔍 Recent Admin Activity</h3>
                    <div className="card">
                        {adminLogs.slice(0, 8).map((log, i) => (
                            <div key={i} style={{ padding: "11px 16px", borderBottom: i < 7 ? "1px solid var(--card-border)" : "none", fontSize: 13 }}>
                                <strong>{log.admin}</strong> — {log.action} <span className="text-muted text-xs">({log.time})</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── ADMIN USERS ──────────────────────────────────────────────────────────────

function AdminUsers({ users, setUsers, notifications, setNotifications, logAdminAction, showToast, isSuperAdmin, setLightboxPhoto }) {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [warnMsg, setWarnMsg] = useState("");
    const [createModal, setCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ fullName: "", matric: "", email: "", phone: "", password: "", faculty: "", department: "", level: "100" });
    const [showPass, setShowPass] = useState(null);
    const [showDeleted, setShowDeleted] = useState(false);

    const filtered = users.filter(u => {
        const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.matric?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchDeleted = showDeleted ? u.isDeleted : !u.isDeleted;
        return matchSearch && matchDeleted;
    });

    const banUser = (u) => {
        setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, banned: !x.banned } : x));
        logAdminAction(`${u.banned ? "Unbanned" : "Banned"} user ${u.matric} (${u.fullName})`);
        showToast(`User ${u.banned ? "unbanned" : "banned"}`, "success");
        setSelectedUser(null);
    };

    const warnUser = (u) => {
        if (!warnMsg) { showToast("Enter a warning message", "error"); return; }
        const warnings = (u.warnings || 0) + 1;
        setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, warnings, banned: warnings >= 3 } : x));
        setNotifications(prev => [...prev, { to: u.matric, subject: "⚠️ Warning from Admin", body: warnMsg, time: new Date().toLocaleString() }]);
        logAdminAction(`Warned user ${u.matric} (${warnings} warnings)`);
        showToast(`Warning sent (${warnings}/3)`, "warning");
        setWarnMsg(""); setSelectedUser(null);
    };

    const deleteUser = (u) => {
        if (!isSuperAdmin) { showToast("Only Super Admin can deactivate accounts", "error"); return; }
        setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, isDeleted: true } : x));
        logAdminAction(`Deactivated user account ${u.matric} (${u.fullName})`);
        showToast("User account deactivated", "success");
        setSelectedUser(null);
    };

    const permanentDeleteUser = (u) => {
        if (!isSuperAdmin) return;
        if (window.confirm(`PERMANENTLY DELETE ${u.fullName} (${u.matric})? This will erase everything from the database forever.`)) {
            setUsers(prev => prev.filter(x => x.matric !== u.matric));
            logAdminAction(`PERMANENTLY DELETED user account ${u.matric}`);
            showToast("User deleted from database permanently", "success");
            setSelectedUser(null);
        }
    };

    const clearUserPerformance = (u) => {
        setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, cbtHistory: [] } : x));
        logAdminAction(`Cleared performance history for ${u.matric}`);
        showToast("User's history cleared", "success");
    };

    const deleteProfilePic = (u) => {
        setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, profilePic: null } : x));
        logAdminAction(`Deleted profile picture for ${u.matric} (${u.fullName})`);
        showToast("Profile picture deleted permanently", "success");
        setSelectedUser(null);
    };

    const restoreUser = (u) => {
        if (!isSuperAdmin) { showToast("Only Super Admin can restore accounts", "error"); return; }
        setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, isDeleted: false, banned: false } : x));
        logAdminAction(`Restored user account ${u.matric} (${u.fullName})`);
        showToast("User account restored!", "success");
        setSelectedUser(null);
    };

    const createUser = async () => {
        if (!isSuperAdmin) { showToast("Only Super Admin can create accounts", "error"); return; }
        if (!newUser.fullName || !newUser.matric || !newUser.password) { showToast("Fill required fields", "error"); return; }
        if (!newUser.email?.trim()) { showToast("Email is required — students sign in with Firebase (email + password).", "error"); return; }
        const cleanEmail = newUser.email.trim().toLowerCase();
        if (users.find(u => u.matric === newUser.matric.trim())) { showToast("Matric already exists", "error"); return; }
        if (users.some(u => (u.email || "").toLowerCase() === cleanEmail)) { showToast("That email is already used by another student.", "error"); return; }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, newUser.password);
            const uid = userCredential.user.uid;
            setUsers(prev => [...prev, {
                ...newUser,
                matric: newUser.matric.trim(),
                email: cleanEmail,
                uid,
                role: "student",
                registeredAt: new Date().toISOString(),
                questionsAttempted: 0,
                loginStreak: 0,
                practiceTime: 0,
                trialUsed: {},
                termsAcceptedAt: new Date().toISOString()
            }]);
            await signOut(auth);
            logAdminAction(`Created user account ${newUser.matric} (${newUser.fullName}) + Firebase Auth`);
            showToast("Account created in Firestore and Firebase Auth. Student can log in with that email.", "success");
            setCreateModal(false);
            setNewUser({ fullName: "", matric: "", email: "", phone: "", password: "", faculty: "", department: "", level: "100" });
        } catch (err) {
            if (err.code === "auth/email-already-in-use") showToast("That email already has a Firebase account. Use password reset or link existing user.", "error");
            else if (err.code === "auth/weak-password") showToast("Password must be at least 6 characters.", "error");
            else if (err.code === "auth/invalid-email") showToast("Invalid email address.", "error");
            else showToast(err.message || "Failed to create Firebase login", "error");
        }
    };

    const [linkingAuth, setLinkingAuth] = useState(false);
    const ensureFirebaseAuthForUser = async (u) => {
        if (!isSuperAdmin) { showToast("Only Super Admin can link Firebase login", "error"); return; }
        const email = (u.email || "").trim().toLowerCase();
        if (!email) { showToast("User has no email on file.", "error"); return; }
        if (!u.password) { showToast("No password stored for this user. Set a password in Firestore or edit the user.", "error"); return; }
        setLinkingAuth(true);
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.length > 0) {
                showToast("Firebase Auth already exists for this email. Student should use Forgot Password or the correct password.", "warning");
                return;
            }
            const cred = await createUserWithEmailAndPassword(auth, email, u.password);
            setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, uid: cred.user.uid } : x));
            await signOut(auth);
            logAdminAction(`Linked Firebase Auth for ${u.matric} (${email})`);
            showToast("Firebase login created. Student can sign in now with the same email + password.", "success");
        } catch (err) {
            if (err.code === "auth/email-already-in-use") showToast("Email already registered in Firebase. Use Forgot Password.", "error");
            else if (err.code === "auth/weak-password") showToast("Stored password is invalid for Firebase (min 6 chars). Update password in Firestore.", "error");
            else showToast(err.message || "Failed to link Firebase", "error");
        } finally {
            setLinkingAuth(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 className="text-gradient" style={{ fontSize: 22 }}>User Management</h2>
                {isSuperAdmin && <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}>➕ Create User</button>}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><input className="input-field" placeholder="🔍 Search by name, matric, or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <button className={`btn btn-sm ${showDeleted ? "btn-danger" : "btn-outline"}`} onClick={() => setShowDeleted(!showDeleted)}>
                    {showDeleted ? "📂 Show Active" : "🗑️ Show Deactivated"}
                </button>
            </div>

            {createModal && isSuperAdmin && (
                <div className="modal-overlay">
                    <div className="card modal p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3>➕ Create User Account</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCreateModal(false)}>✕</button>
                        </div>
                        {[["Full Name *", "fullName", "text"], ["Matric Number *", "matric", "text"], ["Email * (login)", "email", "email"], ["Phone", "phone", "text"], ["Password *", "password", "password"]].map(([label, key, type]) => (
                            <div key={key} className="input-group"><label className="input-label">{label}</label><input className="input-field" type={type} value={newUser[key]} onChange={e => setNewUser(p => ({ ...p, [key]: e.target.value }))} /></div>
                        ))}
                        <div className="input-group">
                            <label className="input-label">Level</label>
                            <select className="input-field" value={newUser.level} onChange={e => setNewUser(p => ({ ...p, level: e.target.value }))}>
                                {["100", "200", "300", "400", "500", "600"].map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                        <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.6 }}>Creates both Firestore profile and Firebase Authentication so the student can log in with this email.</p>
                        <button className="btn btn-primary btn-full" onClick={createUser}>✅ Create Account</button>
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="modal-overlay">
                    <div className="card modal p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                {selectedUser.profilePic ? (
                                    <img src={selectedUser.profilePic} alt="User" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-light)" }} />
                                ) : (
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                                )}
                                <div>
                                    <h3 style={{ margin: 0 }}>{selectedUser.fullName}</h3>
                                    <div className="text-xs text-muted">ID: {selectedUser.matric}</div>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>✕</button>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 2.2, color: "var(--text-muted)" }}>
                            <div>Matric: <strong style={{ color: "var(--text)" }}>{selectedUser.matric}</strong></div>
                            <div>Email: <strong style={{ color: "var(--text)" }}>{selectedUser.email}</strong></div>
                            <div>Phone: <strong style={{ color: "var(--text)" }}>{selectedUser.phone}</strong></div>
                            <div>Department: {selectedUser.department}</div>
                            <div>Level: {selectedUser.level}</div>
                            <div>Registered: {formatDate(selectedUser.registeredAt)}</div>
                            <div>Warnings: <span style={{ color: (selectedUser.warnings || 0) >= 2 ? "var(--danger)" : "var(--text)" }}>{selectedUser.warnings || 0}/3</span></div>
                            <div>Status: {selectedUser.isDeleted ? <span className="badge badge-red">DEACTIVATED</span> : selectedUser.banned ? <span className="badge badge-red">Banned</span> : <span className="badge badge-green">Active</span>}</div>
                            <div style={{ marginTop: 8 }}>
                                <button className="btn btn-ghost btn-sm" style={{ border: "1px solid var(--card-border)", padding: "4px 8px" }} onClick={() => clearUserPerformance(selectedUser)}>🗑️ Clear Performance History</button>
                            </div>
                            {isSuperAdmin && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        Password: <span style={{ color: "var(--text)", fontFamily: "monospace" }}>{showPass === selectedUser.matric ? selectedUser.password : "••••••••"}</span>
                                        <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setShowPass(p => p === selectedUser.matric ? null : selectedUser.matric)}>
                                            {showPass === selectedUser.matric ? "Hide" : "View"}
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        disabled={linkingAuth}
                                        onClick={() => ensureFirebaseAuthForUser(selectedUser)}
                                        title="If this user was created only in Firestore, this creates the Firebase Auth account so they can log in."
                                    >
                                        {linkingAuth ? "⏳..." : "🔐 Enable Firebase login (same email + password)"}
                                    </button>
                                    <p className="text-xs text-muted" style={{ margin: 0, lineHeight: 1.5 }}>
                                        Use this if the student shows in User Management but &quot;invalid email or password&quot; on login. Firebase Auth was missing; this links it once.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="input-group mt-4"><label className="input-label">Warning Message</label><textarea className="input-field" rows={3} value={warnMsg} onChange={e => setWarnMsg(e.target.value)} placeholder="Reason for warning..." /></div>
                        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                            {selectedUser.isDeleted ? (
                                <button className="btn btn-success btn-sm" onClick={() => restoreUser(selectedUser)}>♻️ Restore Account</button>
                            ) : (
                                <>
                                    <button className="btn btn-sm" style={{ background: "var(--warning)", color: "#000", fontFamily: "Syne" }} onClick={() => warnUser(selectedUser)}>⚠️ Warn</button>
                                    {isSuperAdmin && (
                                        <>
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(selectedUser)}>🗑️ Deactivate</button>
                                            <button className="btn btn-danger btn-sm" style={{ background: "black", border: "1px solid var(--danger)" }} onClick={() => permanentDeleteUser(selectedUser)}>🔥 PERMANENT DELETE</button>
                                        </>
                                    )}
                                    {selectedUser.profilePic && (
                                        <>
                                            <button className="btn btn-sm btn-outline" color="var(--primary-light)" onClick={() => setLightboxPhoto(selectedUser.profilePic)}>👁️ View Photo</button>
                                            <button className="btn btn-sm btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => deleteProfilePic(selectedUser)}>📷 Delete Photo</button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.length === 0 && <p className="text-muted text-center mt-4">No users found</p>}
                {filtered.map((u, i) => (
                    <div key={i} className="card p-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div className="flex items-center gap-4">
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: u.profilePic ? "1px solid var(--primary-light)" : "none" }}>
                                {u.profilePic ? <img src={u.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>👤</span>}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontFamily: "Syne" }}>{u.fullName} {u.banned && <span className="badge badge-red">Banned</span>}</div>
                                <div className="text-sm text-muted">{u.matric} · {u.department} · {u.level} Level</div>
                                <div className="text-xs text-muted">{u.email}</div>
                            </div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedUser(u)}>View / Manage</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── ADMIN PAYMENTS ───────────────────────────────────────────────────────────

function AdminPayments({ payments, setPayments, users, setUsers, notifications, setNotifications, logAdminAction, showToast, isSuperAdmin }) {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [adjustModal, setAdjustModal] = useState(null);
    const [adjustDays, setAdjustDays] = useState(0);
    const [editPaymentModal, setEditPaymentModal] = useState(null);

    const filtered = payments.filter(p => {
        const matchFilter = filter === "all" ? true : p.status === filter;
        const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.matric?.includes(search);
        return matchFilter && matchSearch;
    });

    const isSpecialSuper = isSuperAdmin;

    const clearPaymentHistory = (onlyApproved = false) => {
        if (!isSpecialSuper) return;
        if (window.confirm(onlyApproved ? "Clear all APPROVED payment records from database?" : "CLEAR ENTIRE PAYMENT LOG? This cannot be undone.")) {
            setPayments(prev => onlyApproved ? prev.filter(p => p.status !== "approved") : []);
            logAdminAction(`Cleared ${onlyApproved ? "approved" : "FULL"} payment history`);
            showToast("Payment history cleared in database", "success");
        }
    };

    const approve = (p) => {
        const expiresAt = addDays(p.durationDays || 30);
        const paidAt = new Date().toISOString();
        const planName = p.targetCourseCode ? `${p.plan} (${p.targetCourseCode})` : p.plan;
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "approved", paidAt, expiresAt } : x));
        // Stamp a quick "latest subscription" snapshot on the user profile for instant syncing across devices.
        // Access control still uses the payments collection as the source of truth.
        setUsers?.(prev => prev.map(u => u.matric === p.matric ? {
            ...u,
            latestSubscription: {
                plan: p.plan,
                amount: p.amount,
                targetCourseCode: p.targetCourseCode || null,
                paidAt,
                expiresAt
            }
        } : u));
        setNotifications(prev => [...prev, { to: p.matric, subject: "✅ Payment Approved!", body: `Your ${planName} subscription (${p.amount}) is now active! Paid: ${formatDate(paidAt)} | Expires: ${formatDate(expiresAt)}`, time: new Date().toLocaleString() }]);
        logAdminAction(`Approved payment for ${p.matric} (${p.name}) — ${planName}`);
        showToast(`Payment approved for ${p.name}!`, "success");
    };

    const reject = (p) => {
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "rejected" } : x));
        setNotifications(prev => [...prev, { to: p.matric, subject: "❌ Payment Rejected", body: `Your payment for ${p.plan} was rejected. Contact support.`, time: new Date().toLocaleString() }]);
        logAdminAction(`Rejected payment for ${p.matric}`);
        showToast("Payment rejected", "error");
    };

    const cancelApproval = (p) => {
        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "pending", paidAt: undefined, expiresAt: undefined } : x));
        // Also clear latest subscription from user profile for instant sync
        setUsers?.(prev => prev.map(u => u.matric === p.matric ? { ...u, latestSubscription: null } : u));
        setNotifications(prev => [...prev, { to: p.matric, subject: "⚠️ Subscription Cancelled", body: `Your ${p.plan} subscription has been cancelled by admin. Contact support.`, time: new Date().toLocaleString() }]);
        logAdminAction(`Cancelled approved payment for ${p.matric}`);
        showToast("Approval cancelled", "warning");
    };

    const adjustExpiry = (p) => {
        const days = parseInt(adjustDays);
        if (isNaN(days)) { showToast("Invalid amount of days", "error"); return; }
        
        const currentExpiry = p.expiresAt ? new Date(p.expiresAt) : new Date();
        currentExpiry.setDate(currentExpiry.getDate() + days);
        const newExpiryIso = currentExpiry.toISOString();

        setPayments(prev => prev.map(x => x.id === p.id ? { ...x, expiresAt: newExpiryIso } : x));
        
        // Update user profile for instant sync across devices
        setUsers?.(prev => prev.map(u => u.matric === p.matric ? {
            ...u,
            latestSubscription: u.latestSubscription ? { ...u.latestSubscription, expiresAt: newExpiryIso } : null
        } : u));

        logAdminAction(`Adjusted expiry for ${p.matric} by ${days} days`);
        showToast(`Expiry ${days > 0 ? "extended" : "reduced"} by ${Math.abs(days)} days`, "success");
        setAdjustModal(null);
    };

    const deletePaymentLog = (p) => {
        if (!isSuperAdmin) { showToast("Only Super Admin can delete payment logs", "error"); return; }
        setPayments(prev => prev.filter(x => x.id !== p.id));
        showToast("Payment log deleted", "success");
    };

    const saveEditedPayment = (paymentToSave) => {
        setPayments(prev => prev.map(x => x.id === editPaymentModal.p.id ? paymentToSave : x));
        
        // If payment is approved, sync with user profile
        if (paymentToSave.status === "approved") {
            setUsers?.(prev => prev.map(u => u.matric === paymentToSave.matric ? {
                ...u,
                latestSubscription: {
                    plan: paymentToSave.plan,
                    amount: paymentToSave.amount,
                    targetCourseCode: paymentToSave.targetCourseCode || null,
                    paidAt: paymentToSave.paidAt || new Date().toISOString(),
                    expiresAt: paymentToSave.expiresAt
                }
            } : u));
        } else if (paymentToSave.status === "pending" || paymentToSave.status === "rejected") {
            // If it was approved but now isn't, clear latestSubscription
            setUsers?.(prev => prev.map(u => u.matric === paymentToSave.matric ? { ...u, latestSubscription: null } : u));
        }

        logAdminAction(`Manually edited payment details for ${paymentToSave.matric}`);
        showToast("Payment updated successfully!", "success");
        setEditPaymentModal(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-gradient" style={{ fontSize: 22 }}>Payment Management</h2>
                {isSpecialSuper && (
                    <div className="flex gap-2">
                        <button className="btn btn-danger btn-sm" onClick={() => clearPaymentHistory(true)}>🗑️ Clear Approved</button>
                        <button className="btn btn-danger btn-sm" style={{ background: "#000", border: "1px solid var(--danger)" }} onClick={() => clearPaymentHistory(false)}>🔥 Clear ALL Records</button>
                    </div>
                )}
            </div>
            <div className="input-group"><input className="input-field" placeholder="🔍 Search by name or matric..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {["all", "pending", "approved", "rejected"].map(f => (
                    <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
            </div>

            {adjustModal && (
                <div className="modal-overlay">
                    <div className="card modal p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="mb-4">📅 Adjust Subscription Timeline</h3>
                        <p className="text-sm text-muted mb-4">Current expiry: <strong>{formatDate(adjustModal.p.expiresAt)}</strong></p>
                        <div className="input-group"><label className="input-label">Days to Add (negative to reduce)</label><input className="input-field" type="number" value={adjustDays} onChange={e => setAdjustDays(e.target.value)} placeholder="e.g. 7 or -3" /></div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-primary" onClick={() => adjustExpiry(adjustModal.p, adjustModal.idx)}>Apply</button>
                            <button className="btn btn-ghost" onClick={() => setAdjustModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {filtered.length === 0 && <p className="text-muted">No payments found.</p>}
            {filtered.map((p, i) => {
                const realIndex = payments.indexOf(p);
                return (
                    <div key={i} className="card p-5 mb-3">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                            <div>
                                <div style={{ fontWeight: 700, fontFamily: "Syne", fontSize: 15 }}>{p.name || "Unknown"}</div>
                                <div className="text-sm text-muted mt-1">Matric: <strong style={{ color: "var(--text)" }}>{p.matric}</strong></div>
                                <div className="text-sm text-muted">Plan: <strong>{p.plan}</strong> · <strong style={{ color: "var(--primary-light)" }}>{p.amount}</strong></div>
                                {p.targetCourseCode && <div className="text-sm text-muted">Target Course: <strong style={{ color: "var(--warning)" }}>{p.targetCourseCode}</strong></div>}
                                {p.paidAt && <div className="text-xs text-muted mt-1">Paid: {formatDate(p.paidAt)} | Expires: <strong style={{ color: p.expiresAt && new Date(p.expiresAt) > new Date() ? "#4ade80" : "#f87171" }}>{formatDate(p.expiresAt)}</strong></div>}
                                <div className="text-xs text-muted">{p.time}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <span className={`badge ${p.status === "approved" ? "badge-green" : p.status === "rejected" ? "badge-red" : "badge-yellow"}`}>{p.status}</span>
                                {p.status === "pending" && (<><button className="btn btn-success btn-sm" onClick={() => approve(p)}>✅ Approve</button><button className="btn btn-danger btn-sm" onClick={() => reject(p)}>❌ Reject</button></>)}
                                {p.status === "approved" && (<><button className="btn btn-sm btn-outline" onClick={() => { setAdjustModal({ p }); setAdjustDays(0); }}>📅 Adjust</button><button className="btn btn-danger btn-sm" onClick={() => cancelApproval(p)}>Cancel</button></>)}
                                {isSuperAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setEditPaymentModal({ p: { ...p }, idx: realIndex })}>✏️</button>}
                                {isSuperAdmin && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => deletePaymentLog(p)}>🗑️</button>}
                            </div>
                        </div>
                    </div>
                );
            })}

            {editPaymentModal && (
                <div className="modal-overlay">
                    <div className="card modal p-6" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: 500 }}>
                        <h3 className="mb-4">✏️ Edit Payment Details</h3>
                        <div className="input-group"><label className="input-label">Student Name</label><input className="input-field" value={editPaymentModal.p.name || ""} onChange={e => setEditPaymentModal(prev => ({ ...prev, p: { ...prev.p, name: e.target.value } }))} /></div>
                        <div className="input-group"><label className="input-label">Matric</label><input className="input-field" value={editPaymentModal.p.matric || ""} onChange={e => setEditPaymentModal(prev => ({ ...prev, p: { ...prev.p, matric: e.target.value } }))} /></div>
                        <div className="input-group"><label className="input-label">Plan Name / Description</label><input className="input-field" value={editPaymentModal.p.plan || ""} onChange={e => setEditPaymentModal(prev => ({ ...prev, p: { ...prev.p, plan: e.target.value } }))} /></div>
                        <div className="input-group"><label className="input-label">Amount (e.g. ₦2,000)</label><input className="input-field" value={editPaymentModal.p.amount || ""} onChange={e => setEditPaymentModal(prev => ({ ...prev, p: { ...prev.p, amount: e.target.value } }))} /></div>
                        <div className="input-group"><label className="input-label">Target Course Code (Optional)</label><input className="input-field" value={editPaymentModal.p.targetCourseCode || ""} onChange={e => setEditPaymentModal(prev => ({ ...prev, p: { ...prev.p, targetCourseCode: e.target.value } }))} /></div>
                        <div className="input-group"><label className="input-label">Status</label><select className="input-field" value={editPaymentModal.p.status || "pending"} onChange={e => setEditPaymentModal(prev => ({ ...prev, p: { ...prev.p, status: e.target.value } }))}><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option></select></div>
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                            <button className="btn btn-primary btn-full" onClick={() => saveEditedPayment(editPaymentModal.p)}>💾 Save Adjustments</button>
                            <button className="btn btn-ghost btn-full" onClick={() => setEditPaymentModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── ADMIN QUESTIONS ──────────────────────────────────────────────────────────

function AdminQuestions({ questions, setQuestions, showToast }) {
    const [filterCourse, setFilterCourse] = useState(COURSES[0].code);
    const [showAdd, setShowAdd] = useState(false);
    const [targetQuery, setTargetQuery] = useState("");
    const filtered = questions.filter(q => q.course === filterCourse && (!targetQuery || q.question.toLowerCase().includes(targetQuery.toLowerCase())));

    const [form, setForm] = useState({ type: "objective", question: "", answer: "A", explanation: "", options: ["", "", "", ""] });
    const [qImage, setQImage] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const handleAttach = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsCompressing(true);
        try { setQImage(await compressImage(file, 600, 0.5)); showToast("Image attached", "success"); }
        catch (err) { showToast("Failed to process image", "error"); }
        setIsCompressing(false);
    };

    const saveQuestion = () => {
        if (!form.question.trim()) { showToast("Question text required", "error"); return; }
        if (form.type === "objective" && form.options.some(o => !o.trim())) { showToast("All 4 options must be filled", "error"); return; }
        const newQ = { id: Date.now(), course: filterCourse, type: form.type, question: form.question, answer: form.answer, explanation: form.explanation, image: qImage };
        if (newQ.type === "objective") newQ.options = [...form.options];
        setQuestions(prev => [newQ, ...prev]);
        showToast("Question Added!", "success");
        setForm({ type: "objective", question: "", answer: "A", explanation: "", options: ["", "", "", ""] });
        setQImage(null);
        setShowAdd(false);
    };

    const deleteQ = (id) => {
        setQuestions(prev => prev.filter(q => q.id !== id && q.question !== id));
        showToast("Question deleted", "success");
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 className="text-gradient" style={{ fontSize: 22, margin: 0 }}>Question Bank</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>➕ Add Question</button>
            </div>

            <div className="card p-5 mb-5 flex justify-between gap-3 flex-wrap items-center">
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                    <select className="input-field max-w-xs mb-0" style={{ maxWidth: 200 }} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                        {COURSES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                    <input className="input-field mb-0" style={{ maxWidth: 250 }} placeholder="🔍 Search questions..." value={targetQuery} onChange={e => setTargetQuery(e.target.value)} />
                </div>
                <span className="badge badge-blue">{filtered.length} Questions</span>
            </div>

            {showAdd && (
                <div className="card p-5 mb-5" style={{ background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.3)" }}>
                    <div className="flex justify-between items-center mb-4">
                        <h4 style={{ fontFamily: "Syne", margin: 0 }}>Create Question</h4>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
                    </div>

                    <div className="grid-2 gap-4 mb-4">
                        <div className="input-group mb-0">
                            <label className="input-label">Type</label>
                            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="objective">Objective (Multiple Choice)</option>
                                <option value="fill">Fill in the Blank</option>
                            </select>
                        </div>

                        <div className="input-group mb-0" style={{ display: "flex", alignItems: "flex-end" }}>
                            <label className="btn btn-outline" style={{ display: "flex", width: "100%", height: 38, alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: isCompressing ? 0.5 : 1 }}>
                                {isCompressing ? "⏳" : "📷"} {qImage ? "Change Diagram" : "Attach Diagram"}
                                <input type="file" accept="image/*" onChange={handleAttach} style={{ display: "none" }} disabled={isCompressing} />
                            </label>
                        </div>
                    </div>

                    {qImage && <div className="mb-4 relative" style={{ display: "inline-block" }}><img src={qImage} style={{ maxHeight: 120, borderRadius: 8, border: "1px solid var(--primary)" }} alt="Q Preview" /><button className="btn btn-danger btn-sm" style={{ position: "absolute", top: -8, right: -8, padding: "2px 6px", borderRadius: "50%" }} onClick={() => setQImage(null)}>✕</button></div>}

                    <div className="input-group"><label className="input-label">Question Text</label><textarea className="input-field" rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="What is..." /></div>

                    {form.type === "objective" && (
                        <div className="mb-4">
                            <label className="input-label">Options (A, B, C, D)</label>
                            <div className="grid-2 gap-2">
                                {[0, 1, 2, 3].map(idx => (
                                    <input key={idx} className="input-field mb-0" placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={form.options[idx]} onChange={e => { const nm = [...form.options]; nm[idx] = e.target.value; setForm({ ...form, options: nm }); }} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid-2 gap-4">
                        <div className="input-group mb-0">
                            <label className="input-label">Correct Answer</label>
                            {form.type === "objective" ? (
                                <select className="input-field" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })}>
                                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                </select>
                            ) : (
                                <input className="input-field" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Exact answer..." />
                            )}
                        </div>
                        <div className="input-group mb-0">
                            <label className="input-label">Explanation (Optional)</label>
                            <input className="input-field" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Why is this correct?" />
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full mt-5" onClick={saveQuestion} disabled={isCompressing}>💾 Save to Course</button>
                </div>
            )}

            {filtered.map((q, i) => (
                <div key={q.id || i} className="card p-5 mb-3 relative">
                    <button className="btn btn-ghost btn-sm" style={{ position: "absolute", top: 12, right: 12, color: "var(--danger)" }} onClick={() => deleteQ(q.id || q.question)}>🗑️ Remove</button>
                    <div className="flex gap-2 items-center mb-3">
                        <span className="badge badge-purple">{q.type === "objective" ? "Objective" : "Fill-in"}</span>
                        <span className="badge badge-green">Ans: {q.answer}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: q.image ? 12 : 8, whiteSpace: "pre-wrap" }}>Q: {q.question}</div>
                    {q.image && <img src={q.image} style={{ maxHeight: 200, borderRadius: 8, marginBottom: 12, border: "1px solid var(--card-border)" }} alt="Diagram" />}

                    {q.type === "objective" && q.options && (
                        <div className="grid-2 gap-2 mt-2">
                            {q.options.map((opt, idx) => (
                                <div key={idx} style={{ padding: "8px 12px", borderRadius: 8, background: opt.startsWith(q.answer) ? "rgba(22,163,74,0.1)" : "var(--bg)", border: opt.startsWith(q.answer) ? "1px solid rgba(22,163,74,0.3)" : "1px solid var(--card-border)", fontSize: 13, display: "flex", gap: 8 }}>
                                    <strong style={{ color: opt.startsWith(q.answer) ? "var(--success)" : "var(--text-muted)" }}>{String.fromCharCode(65 + idx)}.</strong> {opt}
                                </div>
                            ))}
                        </div>
                    )}
                    {q.explanation && <div className="text-sm text-muted mt-4 p-3 rounded" style={{ background: "rgba(255,184,77,0.1)" }}>💡 <strong>Explanation:</strong> {q.explanation}</div>}
                </div>
            ))}
            {filtered.length === 0 && <div className="card p-8 text-center text-muted">No questions found for this course and search filter. Use the 'Add Question' button above to create one!</div>}
        </div>
    );
}

// ─── ADMIN BROADCAST ──────────────────────────────────────────────────────────

function AdminBroadcast({ broadcasts, setBroadcasts, logAdminAction, showToast, isSuperAdmin }) {
    const [msg, setMsg] = useState("");
    const [color, setColor] = useState("green");

    const send = () => {
        if (!msg.trim()) { showToast("Enter a message", "error"); return; }
        setBroadcasts(prev => [{ id: Date.now(), message: msg, color, active: true, time: new Date().toLocaleString() }, ...prev.map(b => ({ ...b, active: false }))]);
        logAdminAction(`Sent ${color.toUpperCase()} broadcast`);
        showToast("Broadcast sent! Visible to all users.", "success");
        setMsg("");
    };

    const deleteBroadcast = (i) => {
        if (!isSuperAdmin) { showToast("Only Super Admin can delete broadcasts", "error"); return; }
        setBroadcasts(prev => prev.filter((_, j) => j !== i));
        showToast("Broadcast deleted", "success");
    };

    return (
        <div>
            <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Broadcast System</h2>
            <div style={{ padding: 14, background: "rgba(37,99,235,0.1)", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "var(--text-muted)" }}>
                ℹ️ Broadcasts appear at the top of the app for all users — even when not logged in.
            </div>
            <div className="card p-6 mb-5">
                <h4 style={{ fontFamily: "Syne", marginBottom: 14 }}>Send New Broadcast</h4>
                <div className="input-group"><label className="input-label">Message</label><textarea className="input-field" rows={3} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your announcement..." /></div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    {[{ id: "red", label: "🔴 URGENT" }, { id: "yellow", label: "🟡 IMPORTANT" }, { id: "green", label: "🟢 INFO" }].map(c => (
                        <button key={c.id} className={`btn btn-sm ${color === c.id ? "btn-primary" : "btn-ghost"}`} onClick={() => setColor(c.id)}>{c.label}</button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={send}>📢 Send Broadcast</button>
            </div>
            <div className="flex justify-between items-center mb-3">
                <h4 style={{ fontFamily: "Syne" }}>History</h4>
                {isSuperAdmin && broadcasts.length > 0 && <button className="btn btn-danger btn-sm" onClick={() => { setBroadcasts([]); showToast("All broadcasts cleared", "success"); }}>🗑️ Clear All</button>}
            </div>
            {broadcasts.map((b, i) => (
                <div key={i} className="card p-4 mb-3">
                    <div className="flex justify-between items-start gap-3">
                        <div>
                            <span className={`badge badge-${b.color === "red" ? "red" : b.color === "yellow" ? "yellow" : "green"} mb-2`}>{b.color.toUpperCase()}</span>
                            <p style={{ fontSize: 14 }}>{b.message}</p>
                            <p className="text-xs text-muted mt-1">{b.time}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            {b.active && <span className="badge badge-green">LIVE</span>}
                            <button className="btn btn-sm btn-ghost" onClick={() => setBroadcasts(prev => prev.map((x, j) => j === i ? { ...x, active: !x.active } : { ...x, active: false }))}>{b.active ? "Deactivate" : "Activate"}</button>
                            {isSuperAdmin && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => deleteBroadcast(i)}>🗑️</button>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── ADMIN MESSAGES ───────────────────────────────────────────────────────────

function AdminMessages({ messages, setMessages, readAdminMsgs, setReadAdminMsgs, users, adminName, showToast, isSuperAdmin }) {
    const [replyTarget, setReplyTarget] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyImg, setReplyImg] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [viewConv, setViewConv] = useState(null);

    useEffect(() => {
        if (viewConv) {
            const convMsgs = messages.filter(m => (m.from === viewConv || m.to === viewConv) && m.type === "user_to_admin" && !readAdminMsgs.includes(m.id));
            if (convMsgs.length > 0) {
                setReadAdminMsgs(prev => [...new Set([...prev, ...convMsgs.map(m => m.id)])]);
            }
        }
    }, [viewConv, messages, readAdminMsgs, setReadAdminMsgs]);

    const userMessages = messages.filter(m => m.type === "user_to_admin" || m.to === "admin");
    const uniqueSenders = [...new Set(userMessages.map(m => m.from))];

    const handleAttach = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsCompressing(true);
        try { setReplyImg(await compressImage(file, 600, 0.5)); showToast("Image attached", "success"); }
        catch (err) { showToast("Failed to process image", "error"); }
        setIsCompressing(false);
    };

    const sendReply = (toMatric, toName) => {
        if (!replyText.trim() && !replyImg) return;
        setMessages(prev => [...prev, { id: Date.now(), from: `admin`, fromName: "ADMIN", to: toMatric, toName, body: replyText, image: replyImg, time: new Date().toLocaleString(), type: "admin_to_user" }]);
        showToast("Reply sent!", "success");
        setReplyText("");
        setReplyImg(null);
    };

    const deleteConversation = (matric) => {
        if (!isSuperAdmin) { showToast("Only Super Admin can delete message logs", "error"); return; }
        setMessages(prev => prev.filter(m => m.from !== matric && m.to !== matric));
        showToast("Conversation deleted", "success");
        setViewConv(null);
    };

    const clearUserMessages = (matric) => {
        setMessages(prev => prev.filter(m => m.from !== matric && m.to !== matric));
        showToast("User message history cleared", "success");
    };

    return (
        <div>
            <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Messages</h2>
            <div className="card p-5 mb-5">
                <h4 style={{ fontFamily: "Syne", marginBottom: 12, fontSize: 15 }}>Send Direct Message</h4>
                <div className="input-group">
                    <label className="input-label">Select Student</label>
                    <select className="input-field" value={replyTarget?.matric || ""} onChange={e => { const u = users.find(x => x.matric === e.target.value); setReplyTarget(u || null); }}>
                        <option value="">Choose student...</option>
                        {users.map(u => <option key={u.matric} value={u.matric}>{u.fullName} ({u.matric})</option>)}
                    </select>
                </div>
                <div className="input-group"><label className="input-label">Message</label><textarea className="input-field" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your message..." /></div>
                {replyImg && <div className="mb-3 relative" style={{ display: "inline-block" }}><img src={replyImg} style={{ maxHeight: 100, borderRadius: 8, border: "2px solid var(--primary)" }} alt="attached" /><button className="btn btn-danger btn-sm" style={{ position: "absolute", top: -8, right: -8, padding: "2px 6px", borderRadius: "50%" }} onClick={() => setReplyImg(null)}>✕</button></div>}
                <div className="flex gap-2">
                    <label className="btn btn-outline" style={{ cursor: "pointer", opacity: isCompressing ? 0.5 : 1 }}>
                        {isCompressing ? "⏳" : "📷"} Attach Image
                        <input type="file" accept="image/*" onChange={handleAttach} style={{ display: "none" }} disabled={isCompressing} />
                    </label>
                    <button className="btn btn-primary flex-1" onClick={() => replyTarget && sendReply(replyTarget.matric, replyTarget.fullName)} disabled={!replyTarget || (!replyText.trim() && !replyImg) || isCompressing}>📤 Send Message</button>
                </div>
            </div>

            <h4 style={{ fontFamily: "Syne", marginBottom: 12 }}>Student Inbox</h4>
            {uniqueSenders.length === 0 && <p className="text-muted text-sm">No student messages yet.</p>}
            {uniqueSenders.map(senderMatric => {
                const senderMsgs = messages.filter(m => m.from === senderMatric || m.to === senderMatric);
                const sender = users.find(u => u.matric === senderMatric);
                const lastMsg = senderMsgs[senderMsgs.length - 1];
                return (
                    <div key={senderMatric} className="card p-4 mb-3">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <div style={{ cursor: "pointer", flex: 1 }} onClick={() => setViewConv(senderMatric)}>
                                <div style={{ fontWeight: 600, fontFamily: "Syne" }}>{sender?.fullName || senderMatric}</div>
                                <div className="text-sm text-muted mt-1">{lastMsg?.body?.slice(0, 55)}...</div>
                                <div className="text-xs text-muted">{lastMsg?.time}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {messages.filter(m => m.from === senderMatric && m.type === "user_to_admin" && !readAdminMsgs.includes(m.id)).length > 0 && (
                                    <span className="badge badge-red" style={{ fontSize: 10 }}>{messages.filter(m => m.from === senderMatric && m.type === "user_to_admin" && !readAdminMsgs.includes(m.id)).length} New</span>
                                )}
                                <span className="badge badge-blue">{senderMsgs.length} msgs</span>
                                <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => clearUserMessages(senderMatric)}>🗑️ Clear</button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {viewConv && (
                <div className="modal-overlay">
                    <div className="card modal modal-wide p-6" onClick={e => e.stopPropagation()} style={{ maxHeight: "85vh", overflowY: "auto" }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3>{users.find(u => u.matric === viewConv)?.fullName || viewConv}</h3>
                            <div style={{ display: "flex", gap: 8 }}>
                                {isSuperAdmin && <button className="btn btn-danger btn-sm" onClick={() => deleteConversation(viewConv)}>🗑️ Delete Log</button>}
                                <button className="btn btn-ghost btn-sm" onClick={() => setViewConv(null)}>✕</button>
                            </div>
                        </div>
                        {messages.filter(m => m.from === viewConv || m.to === viewConv).map((m, i) => (
                            <div key={i} style={{ padding: "10px 14px", marginBottom: 8, borderRadius: 10, background: m.from === viewConv ? "rgba(37,99,235,0.1)" : "rgba(22,163,74,0.1)", border: `1px solid ${m.from === viewConv ? "rgba(37,99,235,0.2)" : "rgba(22,163,74,0.2)"}` }}>
                                <div className="flex justify-between text-xs text-muted mb-1"><strong>{m.fromName || "Admin"}</strong><span>{m.time}</span></div>
                                <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</p>
                                {m.image && <img src={m.image} alt="Attachment" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginTop: 8, border: "1px solid var(--card-border)", cursor: "pointer" }} onClick={(e) => { e.target.style.maxHeight = e.target.style.maxHeight === "200px" ? "none" : "200px" }} />}
                            </div>
                        ))}
                        <div className="input-group mt-4"><textarea className="input-field" rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply..." /></div>
                        {replyImg && <div className="mb-3 relative" style={{ display: "inline-block" }}><img src={replyImg} style={{ maxHeight: 100, borderRadius: 8, border: "2px solid var(--success)" }} alt="attached hidden" /><button className="btn btn-danger btn-sm" style={{ position: "absolute", top: -8, right: -8, padding: "2px 6px", borderRadius: "50%" }} onClick={() => setReplyImg(null)}>✕</button></div>}
                        <div className="flex gap-2">
                            <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                                📷 Attach
                                <input type="file" accept="image/*" onChange={handleAttach} style={{ display: "none" }} />
                            </label>
                            <button className="btn btn-primary btn-sm flex-1" onClick={() => { const u = users.find(x => x.matric === viewConv); sendReply(viewConv, u?.fullName); }}>Send Reply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── ADMIN EDIT REQUESTS ──────────────────────────────────────────────────────

function AdminEditRequests({ notifications, setNotifications, users, setUsers, logAdminAction, showToast, isSuperAdmin, currentUser }) {
    const editRequests = notifications.filter(n => n.type === "edit_request");
    const clearHandled = () => {
        setNotifications(prev => prev.filter(n => n.type !== "edit_request" || (n.status !== "approved" && n.status !== "rejected")));
        showToast("Handled requests cleared from logs", "success");
    };
    const approve = (req) => {
        const oldValue = users.find(u => u.matric === req.matric);
        const changedFields = [];
        if (!oldValue) {
            showToast("User record not loaded yet. Please wait a moment and try again.", "error");
            return;
        }
        if (req.newData.fullName !== oldValue.fullName) changedFields.push(`Name: ${oldValue.fullName} → ${req.newData.fullName}`);
        if (req.newData.email !== oldValue.email) changedFields.push(`Email: ${oldValue.email} → ${req.newData.email}`);
        if (req.newData.phone !== oldValue.phone) changedFields.push(`Phone: ${oldValue.phone} → ${req.newData.phone}`);
        
        setUsers(prev => prev.map(u => {
            if (u.matric !== req.matric) return u;
            const emailChanged = (req.newData.email || "").toLowerCase().trim() !== (u.email || "").toLowerCase().trim();
            return {
                ...u,
                ...req.newData,
                ...(emailChanged ? {
                    authEmailNeedsUpdate: true,
                    authEmailOld: u.email || null,
                    authEmailApprovedAt: new Date().toISOString(),
                } : {}),
            };
        }));
        setNotifications(prev => {
            const next = prev.map(n => n === req ? { ...n, status: "approved", handledBy: currentUser.name } : n);
            next.push({
                to: req.matric,
                subject: "✅ Profile Edit Approved",
                body: `Your profile update is approved. Summary of changes: ${changedFields.join(", ")}`,
                time: new Date().toLocaleString()
            });
            return next;
        });
        logAdminAction(`Approved profile edit for ${req.matric}`);
        showToast("Profile edit approved!", "success");
    };
    const reject = (req) => {
        setNotifications(prev => prev.map(n => n === req ? { ...n, status: "rejected", handledBy: currentUser.name } : n));
        logAdminAction(`Rejected profile edit for ${req.matric}`);
        showToast("Rejected", "error");
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-gradient" style={{ fontSize: 22 }}>Profile Edit Requests</h2>
                <button className="btn btn-ghost btn-sm" onClick={clearHandled}>🗑️ Clear Handled Logs</button>
            </div>
            {editRequests.length === 0 && <p className="text-muted">No pending edit requests.</p>}
            {editRequests.map((req, i) => (
                <div key={i} className="card p-5 mb-3">
                    <div style={{ fontWeight: 700, fontFamily: "Syne", marginBottom: 8 }}>{req.matric}</div>
                    <p className="text-sm text-muted mb-2">{req.body}</p>
                    {req.newData && <div style={{ fontSize: 13, marginBottom: 12, border: "1px solid var(--card-border)", padding: 8, borderRadius: 8, background: "rgba(0,0,0,0.2)" }}>
                        <div><strong>New Name:</strong> {req.newData.fullName}</div>
                        <div><strong>New Email:</strong> {req.newData.email}</div>
                        <div><strong>New Phone:</strong> {req.newData.phone}</div>
                    </div>}

                    {req.status === "approved" ? (
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span className="badge badge-green">Approved by {req.handledBy || "Admin"}</span>
                            {isSuperAdmin && <button className="btn btn-danger btn-sm" onClick={() => reject(req)}>❌ Override & Reject</button>}
                        </div>
                    ) : req.status === "rejected" ? (
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span className="badge badge-red">Rejected by {req.handledBy || "Admin"}</span>
                            {isSuperAdmin && <button className="btn btn-success btn-sm" onClick={() => approve(req)}>✅ Override & Approve</button>}
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn-success btn-sm" onClick={() => approve(req)}>✅ Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => reject(req)}>❌ Reject</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── ADMIN SYSTEM NOTIFICATIONS ───────────────────────────────────────────────

function AdminNotifications({ notifications, setNotifications, showToast }) {
    const adminNotifs = notifications.filter(n => n.to === "admin" || n.to === "superadmin");
    const clearLogs = () => {
        if (window.confirm("Clear all notification logs for everyone?")) {
            setNotifications([]);
            showToast("All notification logs cleared", "success");
        }
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-gradient" style={{ fontSize: 22 }}>System Notifications</h2>
                <button className="btn btn-danger btn-sm" onClick={clearLogs}>🗑️ Clear Notification Logs</button>
            </div>
            {adminNotifs.length === 0 && <p className="text-muted">No notifications.</p>}
            {[...adminNotifs].reverse().map((n, i) => (
                <div key={i} className="card p-4 mb-3">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{n.subject}</div>
                    <div className="text-muted text-sm mt-1">{n.body}</div>
                    <div className="text-xs text-muted mt-1">{n.time}</div>
                </div>
            ))}
        </div>
    );
}

// ─── ADMIN STUDENT PERFORMANCE ────────────────────────────────────────────────

function AdminPerformance({ users, setUsers, showToast }) {
    const [search, setSearch] = useState("");
    const clearGlobalRecords = () => {
        if (window.confirm("ERASE ALL CBT HISTORY for ALL students? This cannot be undone.")) {
            setUsers(prev => prev.map(u => ({ ...u, cbtHistory: [] })));
            showToast("Global performance records erased", "success");
        }
    };
    const usersWithHistory = users.filter(u => u.cbtHistory && u.cbtHistory.length > 0);
    const filtered = usersWithHistory.filter(u => u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.matric?.includes(search));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-gradient" style={{ fontSize: 22 }}>Student Performance</h2>
                <button className="btn btn-danger btn-sm" onClick={clearGlobalRecords}>🔥 Erase All Records</button>
            </div>
            <div className="input-group"><input className="input-field" placeholder="🔍 Search students..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            {filtered.length === 0 && <p className="text-muted mt-4">No student performance records found.</p>}
            {filtered.map(u => {
                const avgScore = u.cbtHistory.reduce((acc, h) => acc + h.score, 0) / u.cbtHistory.length;
                return (
                    <div key={u.matric} className="card p-5 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <div style={{ fontWeight: 700, fontFamily: "Syne", fontSize: 16 }}>{u.fullName}</div>
                                <div className="text-sm text-muted">{u.matric} · {u.department}</div>
                            </div>
                            <div className="text-right">
                                <div style={{ fontSize: 20, fontWeight: 800, color: avgScore >= 50 ? "#4ade80" : "#f87171" }}>{avgScore.toFixed(1)}%</div>
                                <div className="text-xs text-muted">Average Score</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                            {u.cbtHistory.map((h, i) => (
                                <div key={i} style={{ minWidth: 140, padding: 10, background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid var(--card-border)" }}>
                                    <div className="text-xs text-muted mb-1">{formatDate(h.date)}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.course.slice(0, 12)}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: h.score >= 50 ? "#4ade80" : "#f87171" }}>{h.score}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── ADMIN ANALYTICS ──────────────────────────────────────────────────────────

function AdminAnalytics({ users, payments, setSection }) {
    const approvedPayments = payments.filter(p => p.status === "approved");
    const byPlan = {};
    approvedPayments.forEach(p => { byPlan[p.plan] = (byPlan[p.plan] || 0) + 1; });
    return (
        <div>
            <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Analytics & Reports</h2>
            <div className="grid-2 mb-5">
                <div className="card p-6">
                    <h4 style={{ fontFamily: "Syne", marginBottom: 14, fontSize: 15 }}>Faculty Distribution</h4>
                    {FACULTIES.slice(0, 6).map(f => {
                        const count = users.filter(u => u.faculty === f.name).length;
                        const pct = users.length ? (count / users.length) * 100 : 0;
                        return (
                            <div key={f.name} style={{ marginBottom: 10 }}>
                                <div className="flex justify-between text-sm mb-1"><span style={{ fontSize: 12 }}>{f.name.replace("Faculty of ", "")}</span><span>{count}</span></div>
                                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                            </div>
                        );
                    })}
                </div>
                <div className="card p-6">
                    <h4 style={{ fontFamily: "Syne", marginBottom: 14, fontSize: 15 }}>Subscription Plans</h4>
                    {Object.entries(byPlan).length === 0 && <p className="text-muted text-sm">No approved subscriptions yet.</p>}
                    {Object.entries(byPlan).map(([plan, count]) => (
                        <div key={plan} style={{ marginBottom: 12 }}>
                            <div className="flex justify-between text-sm mb-1"><span style={{ fontSize: 12 }}>{plan}</span><span>{count}</span></div>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${approvedPayments.length ? (count / approvedPayments.length) * 100 : 0}%` }} /></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid-3">
                {[
                    { label: "Total Registered", value: users.length, icon: "👥", color: "var(--primary-light)", section: "users", hint: "→ User Management" },
                    { label: "Active Subscribers", value: approvedPayments.length, icon: "✅", color: "#4ade80", section: "payments", hint: "→ Payments" },
                    { label: "Pending Payments", value: payments.filter(p => p.status === "pending").length, icon: "⏳", color: "#fbbf24", section: "payments", hint: "→ Payments" },
                ].map((s, i) => (
                    <div key={i} className="card stat-card text-center stat-card-clickable" onClick={() => setSection(s.section)}>
                        <div style={{ fontSize: 32 }}>{s.icon}</div>
                        <div className="stat-value mt-2" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                        <div style={{ fontSize: 10, color: "var(--primary-light)", marginTop: 6 }}>{s.hint}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── ADMIN CBT PRACTICE ───────────────────────────────────────────────────────

function AdminCBTPractice({ user, questions, showToast }) {
    const [modal, setModal] = useState(null);
    const toast = showToast || ((msg, type) => alert(msg));
    return (
        <div>
            <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>🎓 My CBT Practice</h2>
            <div style={{ padding: 14, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#4ade80" }}>
                ✅ As an admin, you have free unlimited access to all CBT practice questions.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {COURSES.map((course, i) => {
                    const realCount = (questions || []).filter(q => q.course === course.code).length;
                    const displayCount = realCount > 0 ? realCount : SAMPLE_QUESTIONS.filter(q => q.course === course.code).length;
                    return (
                        <div key={i} className="card p-5 card-lifted" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 15, fontFamily: "Syne" }}>{course.code} — {course.name}</div>
                                <div className="text-sm text-muted mt-1">
                                    <span style={{ color: "var(--primary-light)", fontWeight: 700 }}>{displayCount}</span> questions available
                                    {realCount > 0 && <span style={{ color: "#4ade80", fontSize: 11, marginLeft: 6 }}>✅ Live from database</span>}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setModal({ course: `${course.code} - ${course.name}`, courseCode: course.code, mode: "no-timer", type: "combined" })}>📖 Study</button>
                                <button className="btn btn-primary btn-sm" onClick={() => setModal({ course: `${course.code} - ${course.name}`, courseCode: course.code, mode: "timer", type: "objective" })}>▶ CBT</button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {modal && (
                <QuizModal
                    opts={modal}
                    user={user}
                    users={[user]}
                    setUsers={() => { }}
                    penaltyData={{}}
                    setPenaltyData={() => { }}
                    payments={[{ matric: user.matric, status: "approved", expiresAt: addDays(9999), targetCourseCode: null }]}
                    plans={DEFAULT_PLANS}
                    globalQuestions={questions && questions.length > 0 ? questions : SAMPLE_QUESTIONS}
                    onClose={() => setModal(null)}
                    onUpgrade={() => { }}
                    showToast={toast}
                />
            )}
        </div>
    );
}

// ─── PLAN MANAGER (Super Admin) ───────────────────────────────────────────────

function PlanManager({ plans, setPlans, showToast }) {
    const [editingPlan, setEditingPlan] = useState(null);

    const savePlan = (plan) => {
        // Force direct index targeting to prevent any duplicate ID collision bugs locking edits
        setPlans(prev => prev.map((p, index) => index === plan._idx ? { ...plan, _idx: undefined } : p));
        showToast("Plan updated! Changes reflect everywhere instantly.", "success");
        setEditingPlan(null);
    };

    return (
        <div>
            <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>💳 Manage Payment Plans</h2>
            <div style={{ padding: 14, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#fbbf24" }}>
                ⚡ Changes you make here reflect immediately across the entire app for all students.
            </div>

            {editingPlan && (
                <div className="modal-overlay">
                    <div className="card modal p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3>Edit Plan</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingPlan(null)}>✕</button>
                        </div>
                        <div className="input-group"><label className="input-label">Plan Name</label><input className="input-field" value={editingPlan.name} onChange={e => setEditingPlan(p => ({ ...p, name: e.target.value }))} /></div>
                        <div className="input-group"><label className="input-label">Price (display, e.g. ₦500)</label><input className="input-field" value={editingPlan.price} onChange={e => setEditingPlan(p => ({ ...p, price: e.target.value }))} /></div>
                        <div className="input-group"><label className="input-label">Amount (number, e.g. 500)</label><input className="input-field" type="number" value={editingPlan.amount} onChange={e => setEditingPlan(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                        <div className="input-group"><label className="input-label">Duration Label (e.g. 1 Month)</label><input className="input-field" value={editingPlan.duration} onChange={e => setEditingPlan(p => ({ ...p, duration: e.target.value }))} /></div>
                        <div className="input-group"><label className="input-label">Duration in Days</label><input className="input-field" type="number" value={editingPlan.durationDays} onChange={e => setEditingPlan(p => ({ ...p, durationDays: Number(e.target.value) }))} /></div>
                        <div className="input-group"><label className="input-label">Description</label><textarea className="input-field" rows="3" value={editingPlan.description} onChange={e => setEditingPlan(p => ({ ...p, description: e.target.value }))} /></div>
                        <button className="btn btn-primary btn-full" onClick={() => savePlan(editingPlan)}>💾 Save Changes</button>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {plans.map((plan, i) => {
                    const isSpecial = plan.id === "busadmin_special" || plan.special;
                    return (
                        <div key={`${plan.id}-${i}`} className={`card p-5 ${isSpecial ? "plan-special" : ""}`} style={{ position: "relative" }}>
                            <div className="flex justify-between items-center flex-wrap gap-3">
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    {isSpecial && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#f59e0b", marginBottom: 4 }}>⭐ SPECIAL OFFER</div>}
                                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: isSpecial ? "#f59e0b" : "var(--primary-light)", margin: "4px 0" }}>{plan.price}</div>
                                    <div className="text-sm text-muted">{plan.duration} · {plan.durationDays} days · {plan.description}</div>
                                </div>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setEditingPlan({ ...plan, _idx: i })}
                                    title="Edit Plan"
                                >
                                    ✏️ Edit
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── SUPER ADMIN PANEL ────────────────────────────────────────────────────────

function SuperAdminPanel({ adminLogs, setAdminLogs, users, setUsers, payments, setPayments, notifications, setNotifications, messages, setMessages, showToast, logAdminAction }) {
    const [confirmPop, setConfirmPop] = useState(null); // { type: 'users', count: 10 }

    const performPurge = async (type) => {
        try {
            if (type === "users" || type === "total") {
                const nonAdmins = users.filter(u => !ADMINS.some(a => a.matric === u.matric));
                setUsers(prev => prev.filter(u => ADMINS.some(a => a.matric === u.matric)));
                logAdminAction(`Purged ${nonAdmins.length} student profiles`);
            }
            if (type === "payments" || type === "total") {
                setPayments([]);
                logAdminAction(`Purged all payment history`);
            }
            if (type === "notifications" || type === "total") {
                setNotifications([]);
                logAdminAction(`Purged all notifications`);
            }
            if (type === "messages" || type === "total") {
                setMessages([]);
                logAdminAction(`Purged all message history`);
            }
            if (type === "logs" || type === "total") {
                setAdminLogs([]);
                showToast("Admin logs cleared successfully", "success");
            }
            
            showToast(`${type === 'total' ? 'System reset' : type.charAt(0).toUpperCase() + type.slice(1) + ' purged'} successfully!`, "success");
            setConfirmPop(null);
        } catch (err) {
            showToast("Failed to complete purge: " + err.message, "error");
        }
    };

    const confirmActions = {
        users: { label: "Students", icon: "👥", desc: "Permanent delete all student accounts (Admins protected)." },
        payments: { label: "Payments", icon: "💰", desc: "Wipe all transaction and subscription logs." },
        notifications: { label: "Notifications", icon: "🔔", desc: "Clear all system and user notifications." },
        messages: { label: "Messages", icon: "💬", desc: "Erase all student-admin conversation history." },
        logs: { label: "Admin Logs", icon: "📜", desc: "Clear recent activity logs." },
        total: { label: "TOTAL SYSTEM RESET", icon: "🔥", desc: "Wipe EVERYTHING except Admins, Questions, and Plans." }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <div style={{ fontSize: 32 }}>👑</div>
                <h2 className="text-gradient" style={{ fontSize: 22 }}>Super Admin Controls</h2>
            </div>
            <div className="card p-5 mb-5" style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
                <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 8, fontFamily: "Syne" }}>⚡ Supreme Powers Active</div>
                <p className="text-sm text-muted">You have full control over all accounts, logs, messages, payments, and system settings.</p>
            </div>

            <div style={{ marginBottom: 30 }}>
                <h3 style={{ fontFamily: "Syne", fontSize: 18, marginBottom: 15 }}>🗄️ Database & Storage Maintenance</h3>
                <div className="grid-3 mb-5">
                    {Object.entries(confirmActions).map(([key, info]) => (
                        <div key={key} className={`card p-5 card-lifted ${key === 'total' ? 'border-danger' : ''}`} style={key === 'total' ? { border: '1px solid var(--danger)', background: 'rgba(220,38,38,0.05)' } : {}}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{info.icon}</div>
                            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>{info.label}</div>
                            <div className="text-xs text-muted mt-1 mb-4" style={{ minHeight: 40 }}>{info.desc}</div>
                            <button className={`btn btn-sm btn-full ${key === 'total' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setConfirmPop(key)}>
                                {key === 'total' ? '🔥 TOTAL RESET' : `Purge ${info.label}`}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {confirmPop && (
                <div className="modal-overlay">
                    <div className="card modal p-6 border-danger" onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>⚠️</div>
                        <h3 className="text-center mb-2">Confirm {confirmActions[confirmPop].label} Purge</h3>
                        <p className="text-center text-muted text-sm mb-6">
                            This action is <strong>PERMANENT</strong> and cannot be undone. All selected records will be wiped from Firestore.
                        </p>
                        <div className="flex gap-3">
                            <button className="btn btn-danger btn-full" onClick={() => performPurge(confirmPop)}>🔥 Yes, I'm Sure</button>
                            <button className="btn btn-ghost btn-full" onClick={() => setConfirmPop(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid-2 mb-5">
                {[
                    { icon: "👤", title: "Admin Accounts", desc: "Create, edit, delete admin accounts", action: "Manage Admins" },
                    { icon: "🔑", title: "Password Override", desc: "Reset any admin or user password", action: "Override Password" },
                    { icon: "📤", title: "Data Export", desc: "Export all user and payment data", action: "Export Data" },
                    { icon: "🛡️", title: "Security Logs", desc: "Full system access logs", action: "View Logs" },
                ].map((item, i) => (
                    <div key={i} className="card p-5 card-lifted">
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontFamily: "Syne", fontWeight: 700 }}>{item.title}</div>
                        <div className="text-sm text-muted mt-1 mb-4">{item.desc}</div>
                        <button className="btn btn-outline btn-sm" onClick={() => showToast(`${item.title} — requires backend`, "info")}>{item.action}</button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mb-3">
                <h4 style={{ fontFamily: "Syne", fontSize: 15 }}>📋 Full Admin Activity Log</h4>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmPop('logs')}>🗑️ Clear All Logs</button>
            </div>
            <div className="card">
                {adminLogs.length === 0 && <p className="text-muted p-4 text-sm">No actions recorded yet.</p>}
                {adminLogs.map((log, i) => (
                    <div key={i} style={{ padding: "11px 16px", borderBottom: i < adminLogs.length - 1 ? "1px solid var(--card-border)" : "none", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span><strong>{log.admin}</strong> — {log.action}</span>
                        <span className="text-muted text-xs">{log.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── ADMIN SETTINGS ───────────────────────────────────────────────────────────

function AdminSettings({ showToast }) {
    return (
        <div>
            <h2 className="text-gradient mb-5" style={{ fontSize: 22 }}>System Settings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                    { title: "📧 Email Configuration", desc: "SMTP settings for automated emails", btn: "Configure SMTP" },
                    { title: "🏫 Faculty & Department List", desc: "Manage LASU faculties and departments", btn: "Edit Faculties" },
                    { title: "📜 Terms & Conditions", desc: "Update the Terms & Conditions", btn: "Edit Terms" },
                    { title: "📞 Support Contacts", desc: "Update WhatsApp, Telegram, Email contacts", btn: "Update Contacts" },
                    { title: "🗄️ Database Backup", desc: "Export a full backup of all app data", btn: "Download Backup" },
                ].map((s, i) => (
                    <div key={i} className="card p-5 flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                            <div className="text-sm text-muted mt-1">{s.desc}</div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => showToast(`${s.btn} — requires backend`, "info")}>{s.btn}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── ADMIN SUBSCRIPTION MONITOR ─────────────────────────────────────────────

function AdminSubscriptionMonitor({ users, payments, setPayments, showToast }) {
    const [view, setView] = useState("summary");
    const expiredUsers = payments.filter(p => p.status === "approved" && p.expiresAt && new Date(p.expiresAt) <= new Date());
    const activeUsers = payments.filter(p => p.status === "approved" && p.expiresAt && new Date(p.expiresAt) > new Date());
    
    // Simple Chart Logic
    const total = activeUsers.length + expiredUsers.length;
    const activeBarHeight = total ? (activeUsers.length / total) * 100 : 0;
    const expiredBarHeight = total ? (expiredUsers.length / total) * 100 : 0;

    const clearExpired = () => {
        if (window.confirm("Clear all expired subscription records from history?")) {
            setPayments(prev => prev.filter(p => !(p.status === "approved" && p.expiresAt && new Date(p.expiresAt) <= new Date())));
            showToast("Expired logs cleared", "success");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-gradient" style={{ fontSize: 22 }}>Subscription Monitor</h2>
                <div style={{ display: "flex", gap: 8, background: "rgba(15,23,42,0.5)", padding: 4, borderRadius: 10, border: "1px solid var(--card-border)" }}>
                    <button className={`btn btn-sm ${view === "summary" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("summary")}>Summary</button>
                    <button className={`btn btn-sm ${view === "active" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("active")}>Active ({activeUsers.length})</button>
                    <button className={`btn btn-sm ${view === "expired" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("expired")}>Expired ({expiredUsers.length})</button>
                </div>
            </div>
            
            {view === "summary" && (
                <>
                    <div className="grid grid-2 gap-5 mb-6">
                        <div className="card p-6 text-center stat-card-clickable" onClick={() => setView("active")}>
                            <div className="text-sm text-muted mb-1">Active Subscriptions</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--success)" }}>{activeUsers.length}</div>
                        </div>
                        <div className="card p-6 text-center stat-card-clickable" onClick={() => setView("expired")}>
                            <div className="text-sm text-muted mb-1">Expired Subscriptions</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--danger)" }}>{expiredUsers.length}</div>
                        </div>
                    </div>

                    <div className="card p-6 mb-8">
                        <h4 style={{ fontFamily: "Syne", marginBottom: 20, fontSize: 15 }}>📊 Subscription Breakdown</h4>
                        <div style={{ height: 200, display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 30, padding: "20px 0", borderBottom: "2px solid var(--card-border)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                                <div style={{ height: `${activeBarHeight}%`, width: 60, background: "linear-gradient(to top, #166534, var(--success))", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" }}>
                                     {activeBarHeight > 10 && <div style={{ color: "white", fontSize: 10, fontWeight: 800, textAlign: "center", marginTop: 5 }}>{Math.round(activeBarHeight)}%</div>}
                                </div>
                                <div className="text-xs text-muted mt-3 font-bold">ACTIVE</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                                <div style={{ height: `${expiredBarHeight}%`, width: 60, background: "linear-gradient(to top, #7f1d1d, var(--danger))", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease" }}>
                                     {expiredBarHeight > 10 && <div style={{ color: "white", fontSize: 10, fontWeight: 800, textAlign: "center", marginTop: 5 }}>{Math.round(expiredBarHeight)}%</div>}
                                </div>
                                <div className="text-xs text-muted mt-3 font-bold">EXPIRED</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {view === "active" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <h4 style={{ fontFamily: "Syne", marginBottom: 10 }}>🟢 Currently Active Accounts</h4>
                    {activeUsers.length === 0 && <p className="text-muted text-sm italic">No active subscriptions at the moment.</p>}
                    {activeUsers.map((sub, i) => (
                        <div key={i} className="card p-4 border-left-success">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <div style={{ fontWeight: 700 }}>{sub.name}</div>
                                    <div className="text-sm text-muted">{sub.matric} · {sub.plan}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted">Expires:</div>
                                    <div style={{ fontWeight: 700, color: "var(--success)" }}>{formatDate(sub.expiresAt)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === "expired" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="flex justify-between items-center mb-2">
                        <h4 style={{ fontFamily: "Syne" }}>🔴 Expired Subscriptions</h4>
                        <button className="btn btn-danger btn-sm" onClick={clearExpired}>🗑️ Clear Expired History</button>
                    </div>
                    {expiredUsers.length === 0 && <p className="text-muted text-sm italic">No expired subscriptions found.</p>}
                    {expiredUsers.sort((a,b) => new Date(b.expiresAt) - new Date(a.expiresAt)).map((sub, i) => (
                        <div key={i} className="card p-4 border-left-danger">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{sub.name}</div>
                                    <div className="text-sm text-muted">{sub.matric} · Plan: <span style={{ color: "var(--warning)" }}>{sub.plan}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted">Expired on:</div>
                                    <div style={{ fontWeight: 700, color: "var(--danger)", fontSize: 13 }}>{formatDate(sub.expiresAt)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
