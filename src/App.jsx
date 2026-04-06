import { useState, useEffect, useRef, useCallback } from "react";

// ─── API BASE ─────────────────────────────────────────────────────────────────
const API_BASE = "https://simyc-backend.onrender.com/api";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SUPER_ADMIN = { matric: "23110821060", password: "Dexter20" };

const ADMINS = [
  { matric: "23110821060", password: "Dexter20", name: "Esuh Simeon Chioma", role: "superadmin" },
  { matric: "23110821177", password: "UMUNAKWE", name: "Umunakwe", role: "admin" },
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

const PLANS = [
  { id: "single", name: "Single Course", price: "₦500", duration: "1 Month", description: "One specific course" },
  { id: "dept_monthly", name: "Department Full", price: "₦3,000", duration: "1 Month", description: "All courses in department" },
  { id: "dept_extended", name: "Department Extended", price: "₦5,000", duration: "3 Months", description: "All courses in department" },
  { id: "premium", name: "Premium All Access", price: "₦10,000", duration: "3 Months", description: "All courses in ALL faculties" },
];

const TERMS = `TERMS AND CONDITIONS --- SIMYC EXAM PREP NG

1. ACCEPTANCE OF TERMS

By registering on Simyc Exam Prep NG, you agree to be bound by these Terms and Conditions. These terms govern your use of the platform and all its services.

2. ELIGIBILITY

This platform is intended exclusively for students of Lagos State University (LASU). By registering, you confirm that you are a current LASU student with a valid matric number.

3. USER ACCOUNT

You are responsible for maintaining the confidentiality of your login credentials. Sharing your account with other users is strictly prohibited and may result in immediate account suspension.

4. PAYMENT POLICY

All payments are non-refundable once access has been granted. Subscriptions are time-limited and will expire at the end of the stated period. Payment verification is manual and may take up to 24 hours.

5. CONTENT USE

All questions, materials, and resources on this platform are proprietary. You may not copy, reproduce, distribute, or share any content from this platform without express written permission.

6. PROHIBITED CONDUCT

Users must not: attempt to hack or compromise the platform, share login credentials, use automated tools to access content, or engage in any disruptive behaviour that affects other users.

7. PRIVACY

Your personal data (name, matric, email, phone) is collected for account management purposes only. We do not sell or share your data with third parties.

8. DISCLAIMER

Questions provided are for practice purposes. Simyc Exam Prep NG does not guarantee that practice questions will appear in actual LASU exams.

9. TERMINATION

We reserve the right to suspend or terminate any account that violates these terms without prior notice or refund.

10. CONTACT

For disputes or enquiries: simycesuh@gmail.com | WhatsApp: +234 815 399 6360`;

const SAMPLE_QUESTIONS = [
  { id: 1, topic: "Project Scope Management", type: "objective", question: "Which process involves defining and documenting stakeholders' needs to meet the project objectives?", options: ["A. Collect Requirements", "B. Define Scope", "C. Create WBS", "D. Control Scope"], answer: "A", explanation: "Collect Requirements is the process of determining, documenting, and managing stakeholder needs." },
  { id: 2, topic: "Project Scope Management", type: "objective", question: "The Work Breakdown Structure (WBS) is a:", options: ["A. Gantt chart", "B. Hierarchical decomposition of project scope", "C. Risk register", "D. Resource plan"], answer: "B", explanation: "WBS is a hierarchical decomposition of the total scope of work to accomplish project objectives." },
  { id: 3, topic: "Project Scope Management", type: "objective", question: "Scope creep refers to:", options: ["A. Planned scope changes", "B. Unauthorized scope changes", "C. Scope reduction", "D. Budget increase"], answer: "B", explanation: "Scope creep is the uncontrolled expansion of project scope without proper approval." },
  { id: 4, topic: "Project Scope Management", type: "fill", question: "The ________ defines the project boundaries and deliverables.", answer: "Project Scope Statement", explanation: "The Project Scope Statement documents what is and is not included in the project." },
  { id: 5, topic: "Financial Management", type: "objective", question: "Working capital is defined as:", options: ["A. Total assets minus total liabilities", "B. Current assets minus current liabilities", "C. Fixed assets minus long-term liabilities", "D. Total revenue minus total expenses"], answer: "B", explanation: "Working capital = Current Assets - Current Liabilities, measuring short-term liquidity." },
  { id: 6, topic: "Financial Management", type: "objective", question: "Which financial ratio measures a company's ability to pay short-term obligations?", options: ["A. Debt ratio", "B. Return on equity", "C. Current ratio", "D. Gross margin"], answer: "C", explanation: "Current ratio (Current Assets / Current Liabilities) measures short-term liquidity." },
  { id: 7, topic: "Management Theory", type: "objective", question: "Frederick Taylor is known for his contribution to:", options: ["A. Human Relations Theory", "B. Scientific Management", "C. Systems Theory", "D. Contingency Theory"], answer: "B", explanation: "Frederick Taylor developed Scientific Management, focusing on efficiency and productivity." },
  { id: 8, topic: "Management Theory", type: "objective", question: "Maslow's Hierarchy of Needs places ________ at the highest level.", options: ["A. Safety needs", "B. Social needs", "C. Esteem needs", "D. Self-actualization"], answer: "D", explanation: "Self-actualization is the highest level in Maslow's hierarchy, representing full personal potential." },
  { id: 9, topic: "Project Scope Management", type: "theory", question: "Explain the difference between product scope and project scope.", answer: "Product scope refers to the features and functions that characterize a product or service. Project scope refers to the work that needs to be accomplished to deliver the product, service, or result with the specified features and functions.", explanation: "Both scopes must be aligned for successful project delivery." },
  { id: 10, topic: "Financial Management", type: "fill", question: "The formula for calculating Net Present Value (NPV) discounts future cash flows at the ________ rate.", answer: "discount", explanation: "NPV uses the discount rate (cost of capital) to bring future values to present value." },
  { id: 11, topic: "Management Theory", type: "objective", question: "Henri Fayol's 14 principles of management include:", options: ["A. Unity of command", "B. Theory X and Y", "C. Scientific method", "D. Systems approach"], answer: "A", explanation: "Unity of command is one of Fayol's 14 principles — each employee should receive orders from only one superior." },
  { id: 12, topic: "Project Scope Management", type: "objective", question: "Which document formally authorizes a project?", options: ["A. Project Scope Statement", "B. Project Charter", "C. WBS Dictionary", "D. Stakeholder Register"], answer: "B", explanation: "The Project Charter formally authorizes the project and documents initial requirements." },
  { id: 13, topic: "Financial Management", type: "objective", question: "Depreciation is best described as:", options: ["A. Cash outflow", "B. Non-cash expense", "C. Revenue reduction", "D. Tax payment"], answer: "B", explanation: "Depreciation is a non-cash expense that allocates the cost of an asset over its useful life." },
  { id: 14, topic: "Management Theory", type: "objective", question: "The Hawthorne studies led to the development of:", options: ["A. Scientific Management", "B. Human Relations Movement", "C. Bureaucratic Theory", "D. Contingency Theory"], answer: "B", explanation: "Hawthorne studies showed that human factors affect productivity, leading to the Human Relations Movement." },
  { id: 15, topic: "Project Scope Management", type: "objective", question: "Validated deliverables are an output of which process?", options: ["A. Define Scope", "B. Control Scope", "C. Validate Scope", "D. Create WBS"], answer: "C", explanation: "Validate Scope formalizes acceptance of completed project deliverables." },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #2563eb;
  --primary-dark: #1e3a8a;
  --primary-light: #60a5fa;
  --bg: #020617;
  --card: #0f172a;
  --card-border: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --success: #16a34a;
  --warning: #f59e0b;
  --danger: #dc2626;
  --gradient: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
  --card-glass: rgba(15,23,42,0.7);
}

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; }

.app-wrapper {
  min-height: 100vh;
  background: var(--bg);
  position: relative;
}

/* Animated background blobs */

.bg-blobs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  animation: blobMove 12s ease-in-out infinite alternate;
}

.blob1 { width: 500px; height: 500px; background: #2563eb; top: -100px; left: -100px; animation-delay: 0s; }
.blob2 { width: 400px; height: 400px; background: #60a5fa; bottom: -100px; right: -100px; animation-delay: 3s; }
.blob3 { width: 300px; height: 300px; background: #1e3a8a; top: 50%; left: 50%; animation-delay: 6s; }

@keyframes blobMove { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(40px, -40px) scale(1.1); } }

/* Page content */

.page { position: relative; z-index: 1; min-height: 100vh; animation: fadeUp 0.55s ease; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Cards */

.card {
  background: var(--card-glass);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
}

.card:hover { border-color: rgba(96,165,250,0.35); box-shadow: 0 8px 32px rgba(37,99,235,0.15); }
.card-lifted:hover { transform: translateY(-2px); }

/* Buttons */

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 24px; border-radius: 10px; border: none; cursor: pointer;
  font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px;
  transition: all 0.2s; text-decoration: none;
}

.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--gradient); color: #fff; box-shadow: 0 4px 20px rgba(37,99,235,0.4); }
.btn-primary:hover { box-shadow: 0 6px 28px rgba(37,99,235,0.6); transform: translateY(-1px); }
.btn-outline { background: transparent; color: var(--primary-light); border: 1px solid var(--primary); }
.btn-outline:hover { background: rgba(37,99,235,0.15); }
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { background: #b91c1c; }
.btn-success { background: var(--success); color: #fff; }
.btn-success:hover { background: #15803d; }
.btn-ghost { background: transparent; color: var(--text-muted); }
.btn-ghost:hover { color: var(--text); background: var(--card); }
.btn-sm { padding: 8px 16px; font-size: 13px; border-radius: 8px; }
.btn-full { width: 100%; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

/* Inputs */

.input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.input-label { font-size: 13px; font-weight: 500; color: var(--text-muted); letter-spacing: 0.5px; }

.input-field {
  background: rgba(15,23,42,0.8); border: 1px solid var(--card-border); border-radius: 10px;
  padding: 12px 16px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s; outline: none; width: 100%;
}

.input-field:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.input-field::placeholder { color: var(--text-muted); opacity: 0.6; }
select.input-field { cursor: pointer; }
select.input-field option { background: #0f172a; }

/* Top nav */

.topnav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; background: rgba(2,6,23,0.8); border-bottom: 1px solid var(--card-border);
  backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100;
}

.topnav-logo { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; }
.topnav-logo span { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.topnav-actions { display: flex; align-items: center; gap: 12px; }

/* Badges */

.badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.badge-blue { background: rgba(37,99,235,0.2); color: var(--primary-light); border: 1px solid rgba(37,99,235,0.3); }
.badge-green { background: rgba(22,163,74,0.2); color: #4ade80; border: 1px solid rgba(22,163,74,0.3); }
.badge-red { background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid rgba(220,38,38,0.3); }
.badge-yellow { background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }

/* Notification bell */

.notif-bell { position: relative; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; }
.notif-bell:hover { background: var(--card); }
.notif-count {
  position: absolute; top: 2px; right: 2px; background: var(--danger);
  color: #fff; font-size: 10px; font-weight: 700; width: 16px; height: 16px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}

/* Grid helpers */

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

/* Misc */

.divider { height: 1px; background: var(--card-border); margin: 20px 0; }
.text-gradient { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-muted { color: var(--text-muted); }
.text-sm { font-size: 13px; }
.text-xs { font-size: 11px; }
.text-center { text-align: center; }
.mt-4 { margin-top: 16px; }
.mt-6 { margin-top: 24px; }
.mt-8 { margin-top: 32px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.w-full { width: 100%; }
.p-4 { padding: 16px; }
.p-6 { padding: 24px; }
.p-8 { padding: 32px; }
.rounded { border-radius: 8px; }
.pointer { cursor: pointer; }

/* Timer colors */

.timer-blue { color: var(--primary-light); }
.timer-yellow { color: var(--warning); }
.timer-red { color: var(--danger); animation: pulse 1s ease infinite; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

/* Progress bar */

.progress-bar { height: 6px; background: var(--card-border); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--gradient); border-radius: 99px; transition: width 0.4s ease; }

/* Modal overlay */

.modal-overlay {
  position: fixed; inset: 0; background: rgba(2,6,23,0.85); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  backdrop-filter: blur(4px); animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal { max-width: 480px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 32px; }
.modal-wide { max-width: 640px; }

/* Scrollbar */

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 3px; }

/* Answer option buttons */

.option-btn {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 14px 18px; background: rgba(15,23,42,0.6); border: 1px solid var(--card-border);
  border-radius: 10px; color: var(--text); font-size: 15px; cursor: pointer;
  transition: all 0.2s; text-align: left; font-family: 'DM Sans', sans-serif;
  margin-bottom: 10px;
}

.option-btn:hover { border-color: var(--primary); background: rgba(37,99,235,0.1); }
.option-btn.selected { border-color: var(--primary); background: rgba(37,99,235,0.2); }
.option-btn.correct { border-color: var(--success); background: rgba(22,163,74,0.2); }
.option-btn.wrong { border-color: var(--danger); background: rgba(220,38,38,0.15); }

.option-key { width: 30px; height: 30px; border-radius: 6px; background: var(--card-border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }

/* Stat cards */

.stat-card { padding: 20px; }
.stat-value { font-size: 28px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* Floating icons animation */

.floating { animation: float 3s ease-in-out infinite alternate; }
.floating-delay { animation: float 3s ease-in-out 1.5s infinite alternate; }

@keyframes float { from { transform: translateY(0); } to { transform: translateY(-10px); } }

/* Welcome screen */

.welcome-hero {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 40px 24px; text-align: center;
}

.welcome-logo { font-size: 48px; font-weight: 800; margin-bottom: 8px; }
.welcome-sub { font-size: 16px; color: var(--text-muted); max-width: 400px; margin: 0 auto 40px; line-height: 1.6; }
.welcome-icons { display: flex; gap: 24px; justify-content: center; margin-bottom: 48px; font-size: 40px; }

/* Checkbox */

.checkbox-group { display: flex; align-items: flex-start; gap: 12px; padding: 14px; background: var(--card); border: 1px solid var(--card-border); border-radius: 10px; cursor: pointer; margin-bottom: 12px; }
.checkbox-group input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; flex-shrink: 0; margin-top: 2px; }

/* Admin sidebar */

.admin-layout { display: flex; min-height: 100vh; }
.admin-sidebar {
  width: 240px; background: rgba(15,23,42,0.9); border-right: 1px solid var(--card-border);
  padding: 24px 0; position: fixed; top: 0; left: 0; height: 100vh; overflow-y: auto; z-index: 50;
}

.admin-main { margin-left: 240px; flex: 1; padding: 24px; }

.sidebar-item {
  display: flex; align-items: center; gap: 10px; padding: 12px 20px; cursor: pointer;
  transition: all 0.2s; font-size: 14px; color: var(--text-muted);
}

.sidebar-item:hover { background: rgba(37,99,235,0.1); color: var(--text); }
.sidebar-item.active { background: rgba(37,99,235,0.15); color: var(--primary-light); border-right: 2px solid var(--primary); }

/* Broadcast notification */

.broadcast { padding: 12px 20px; font-weight: 600; font-size: 14px; text-align: center; }
.broadcast-red { background: rgba(220,38,38,0.2); border-bottom: 1px solid rgba(220,38,38,0.4); color: #f87171; }
.broadcast-yellow { background: rgba(245,158,11,0.2); border-bottom: 1px solid rgba(245,158,11,0.4); color: #fbbf24; }
.broadcast-green { background: rgba(22,163,74,0.2); border-bottom: 1px solid rgba(22,163,74,0.4); color: #4ade80; }

/* Banned screen */
.banned-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 40px 24px; text-align: center;
}

/* Responsive */

@media (max-width: 768px) {
  .grid-2 { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: 1fr 1fr; }
  .admin-sidebar { width: 100%; height: auto; position: relative; }
  .admin-layout { flex-direction: column; }
  .admin-main { margin-left: 0; }
}
`;

// ─── UTILITY ──────────────────────────────────────────────────────────────────

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }
    catch { return defaultValue; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
};

const formatTime = (sec) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ─── API HELPERS ──────────────────────────────────────────────────────────────

const apiFetch = async (path, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: "Cannot connect to server. Check your connection." } };
  }
};

// ─── ICON COMPONENTS ──────────────────────────────────────────────────────────

const Icon = ({ name, size = 18 }) => {
  const icons = {
    book: "📚", clock: "⏱️", star: "⭐", user: "👤", lock: "🔒", mail: "📧",
    phone: "📱", check: "✅", x: "❌", bell: "🔔", shield: "🛡️", chart: "📊",
    logout: "🚪", settings: "⚙️", upload: "📤", message: "💬", warning: "⚠️",
    trophy: "🏆", fire: "🔥", target: "🎯", play: "▶️", home: "🏠", edit: "✏️",
    trash: "🗑️", ban: "🚫", help: "❓", dollar: "💰", list: "📋", eye: "👁️",
    search: "🔍", add: "➕", arrow: "→", back: "←", refresh: "🔄", crown: "👑",
    flag: "🚩", info: "ℹ️", download: "📥", whatsapp: "💬", telegram: "✈️",
    correct: "✅", wrong: "❌", next: "⏭️", prev: "⏮️", submit: "📩",
  };
  return <span style={{ fontSize: size }} role="img">{icons[name] || "•"}</span>;
};

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  // currentUser stored in localStorage only for UI persistence
  const [currentUser, setCurrentUser] = useLocalStorage("simyc_current", null);

  // These remain local/localStorage only (non-user data)
  const [notifications, setNotifications] = useLocalStorage("simyc_notifs", []);
  const [broadcasts, setBroadcasts] = useLocalStorage("simyc_broadcasts", []);
  const [adminLogs, setAdminLogs] = useLocalStorage("simyc_admin_logs", []);
  const [termsAccepted, setTermsAccepted] = useLocalStorage("simyc_terms", {});
  const [messages, setMessages] = useLocalStorage("simyc_messages", []);

  // Backend-driven state
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [backendReady, setBackendReady] = useState(false);

  // Screen states
  const [screen, setScreen] = useState("welcome");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const logAdminAction = useCallback((adminName, action) => {
    setAdminLogs(prev => [{ admin: adminName, action, time: new Date().toLocaleString() }, ...prev.slice(0, 99)]);
  }, [setAdminLogs]);

  // Load users and payments from backend on mount
  const loadBackendData = useCallback(async () => {
    const [usersRes, paymentsRes] = await Promise.all([
      apiFetch("/users"),
      apiFetch("/payments"),
    ]);
    if (usersRes.ok) setUsers(usersRes.data);
    if (paymentsRes.ok) setPayments(paymentsRes.data);
    setBackendReady(true);
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Determine screen on load from persisted user
  useEffect(() => {
    if (currentUser) {
      if (currentUser.banned) {
        setScreen("banned");
        return;
      }
      const isAdmin = ADMINS.some(a => a.matric === currentUser.matric);
      setScreen(isAdmin ? "admin" : "dashboard");
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen("welcome");
    showToast("Logged out successfully");
  };

  const activeBroadcast = broadcasts.find(b => b.active);

  // Wrap setPayments to also POST to backend
  const addPayment = useCallback(async (paymentData) => {
    const res = await apiFetch("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
    if (res.ok) {
      setPayments(prev => [...prev, res.data]);
      return true;
    } else {
      // Fallback: store locally if backend is down
      setPayments(prev => [...prev, { ...paymentData, _id: Date.now().toString() }]);
      return false;
    }
  }, []);

  // Wrap banUser to hit backend
  const banUserBackend = useCallback(async (matric, banned) => {
    const res = await apiFetch(`/users/${matric}/ban`, {
      method: "PUT",
      body: JSON.stringify({ banned }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.matric === matric ? { ...u, banned } : u));
      // If current user just got banned/unbanned, update localStorage
      if (currentUser && currentUser.matric === matric) {
        setCurrentUser(prev => ({ ...prev, banned }));
        if (banned) setScreen("banned");
      }
      return true;
    }
    return false;
  }, [currentUser, setCurrentUser]);

  return (
    <>
      <style>{css}</style>
      <div className="app-wrapper">
        <div className="bg-blobs">
          <div className="blob blob1" />
          <div className="blob blob2" />
          <div className="blob blob3" />
        </div>

        {activeBroadcast && (
          <div className={`broadcast broadcast-${activeBroadcast.color}`}>
            📢 {activeBroadcast.message}
          </div>
        )}

        {screen === "welcome" && <WelcomeScreen onNext={() => setScreen("terms")} />}

        {screen === "terms" && (
          <TermsScreen
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            onNext={() => setScreen("login")}
            onBack={() => setScreen("welcome")}
            currentUser={currentUser}
          />
        )}

        {screen === "login" && (
          <LoginScreen
            admins={ADMINS}
            setCurrentUser={setCurrentUser}
            onRegister={() => setScreen("register")}
            onLogin={(u) => {
              setCurrentUser(u);
              if (u.banned) { setScreen("banned"); return; }
              const isAdmin = ADMINS.some(a => a.matric === u.matric);
              setScreen(isAdmin ? "admin" : "dashboard");
              loadBackendData();
            }}
            showToast={showToast}
          />
        )}

        {screen === "register" && (
          <RegisterScreen
            termsAccepted={termsAccepted}
            onSuccess={() => { showToast("Account created! Please log in.", "success"); setScreen("login"); }}
            onBack={() => setScreen("login")}
            showToast={showToast}
          />
        )}

        {screen === "banned" && currentUser && (
          <BannedScreen user={currentUser} onLogout={handleLogout} />
        )}

        {screen === "dashboard" && currentUser && (
          <DashboardScreen
            user={currentUser}
            notifications={notifications}
            payments={payments}
            broadcasts={broadcasts}
            onLogout={handleLogout}
            onStartQuiz={(opts) => { setModal({ type: "quiz", opts }); }}
            onUpgrade={() => setModal({ type: "payment" })}
            showToast={showToast}
          />
        )}

        {screen === "admin" && currentUser && (
          <AdminScreen
            user={currentUser}
            users={users}
            setUsers={setUsers}
            payments={payments}
            setPayments={setPayments}
            notifications={notifications}
            setNotifications={setNotifications}
            broadcasts={broadcasts}
            setBroadcasts={setBroadcasts}
            adminLogs={adminLogs}
            logAdminAction={logAdminAction}
            messages={messages}
            setMessages={setMessages}
            onLogout={handleLogout}
            showToast={showToast}
            isSuperAdmin={currentUser?.matric === SUPER_ADMIN.matric}
            banUserBackend={banUserBackend}
            reloadData={loadBackendData}
          />
        )}

        {modal?.type === "quiz" && (
          <QuizModal opts={modal.opts} user={currentUser} onClose={() => setModal(null)} showToast={showToast} />
        )}

        {modal?.type === "payment" && (
          <PaymentModal
            onClose={() => setModal(null)}
            payments={payments}
            addPayment={addPayment}
            user={currentUser}
            showToast={showToast}
          />
        )}

        {toast && <ToastNotif msg={toast.msg} type={toast.type} />}
      </div>
    </>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function ToastNotif({ msg, type }) {
  const colors = { info: "#2563eb", success: "#16a34a", error: "#dc2626", warning: "#f59e0b" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, background: colors[type] || colors.info, color: "#fff", padding: "14px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "fadeUp 0.3s ease", maxWidth: 320 }}>
      {msg}
    </div>
  );
}

// ─── BANNED SCREEN ────────────────────────────────────────────────────────────

function BannedScreen({ user, onLogout }) {
  return (
    <div className="page">
      <div className="banned-screen">
        <div style={{ fontSize: 72, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 28, color: "#f87171", marginBottom: 12 }}>
          Account Suspended
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 400, lineHeight: 1.7, marginBottom: 8 }}>
          Your account (<strong style={{ color: "var(--text)" }}>{user.fullName || user.name}</strong> · {user.matric}) has been temporarily suspended by an administrator.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 400, lineHeight: 1.7, marginBottom: 32 }}>
          If you believe this is a mistake or would like to appeal, please contact the admin via WhatsApp.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href={`https://wa.me/2348153996360?text=Hello%2C%20I%20would%20like%20to%20appeal%20the%20suspension%20of%20my%20account.%20Matric%3A%20${user.matric}`}
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ background: "#25D366", color: "#fff", fontSize: 15 }}
          >
            💬 Appeal on WhatsApp
          </a>
          <button className="btn btn-ghost" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
        <div style={{ marginTop: 32, padding: "16px 24px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 12, maxWidth: 400, fontSize: 13, color: "var(--text-muted)" }}>
          ⚠️ Accounts may be suspended for violating our Terms & Conditions, including sharing login credentials, unauthorized access attempts, or disruptive behaviour.
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
        <div className="welcome-icons">
          <span className="floating">📚</span>
          <span className="floating-delay">🎯</span>
          <span className="floating">🏆</span>
        </div>
        <div className="welcome-logo text-gradient">Simyc Exam Prep NG</div>
        <div style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 }}>LASU</div>
        <p className="welcome-sub">
          The ultimate CBT exam preparation platform for Lagos State University students. Practice smarter, score higher.
        </p>
        <button className="btn btn-primary" onClick={onNext} style={{ fontSize: 17, padding: "16px 48px" }}>
          Get Started <Icon name="arrow" />
        </button>
        <div style={{ marginTop: 24, display: "flex", gap: 32, color: "var(--text-muted)", fontSize: 13 }}>
          <span>✅ 3 Courses</span>
          <span>✅ JAMB-Style Timer</span>
          <span>✅ Score Analytics</span>
        </div>
        <div style={{ marginTop: 48, padding: "20px 24px", background: "var(--card-glass)", border: "1px solid var(--card-border)", borderRadius: 16, maxWidth: 360, textAlign: "center" }}>
          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, marginBottom: 8 }}>About the Founder</div>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👨‍💻</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Esuh Simeon Chioma</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Business Administration, LASU • Matric: 23110821060</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.6 }}>
            Visionary tech entrepreneur building tools to empower every LASU student with quality exam preparation.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── TERMS SCREEN ─────────────────────────────────────────────────────────────

function TermsScreen({ termsAccepted, setTermsAccepted, onNext, onBack, currentUser }) {
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  if (currentUser && termsAccepted[currentUser.matric]) { onNext(); return null; }

  const handleProceed = () => {
    setTermsAccepted(prev => ({ ...prev, guest: new Date().toISOString() }));
    onNext();
  };

  return (
    <div className="page" style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ paddingTop: 40 }}>
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="back" /> Back</button>
          <h2 className="text-gradient" style={{ fontSize: 22 }}>Terms & Conditions</h2>
        </div>
        <div className="card p-6" style={{ maxHeight: 360, overflowY: "auto", marginBottom: 20, lineHeight: 1.7, fontSize: 14, color: "var(--text-muted)" }}>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "DM Sans, sans-serif" }}>{TERMS}</pre>
        </div>
        <label className="checkbox-group">
          <input type="checkbox" checked={check1} onChange={e => setCheck1(e.target.checked)} />
          <span style={{ fontSize: 14 }}>I have read and agree to the <strong style={{ color: "var(--primary-light)" }}>Terms & Conditions</strong></span>
        </label>
        <label className="checkbox-group">
          <input type="checkbox" checked={check2} onChange={e => setCheck2(e.target.checked)} />
          <span style={{ fontSize: 14 }}>I agree to the <strong style={{ color: "var(--primary-light)" }}>User Guidelines</strong> and will use this platform responsibly</span>
        </label>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>📅 Accepted on: {new Date().toLocaleString()}</div>
        <button className="btn btn-primary btn-full mt-4" onClick={handleProceed} disabled={!check1 || !check2}>
          Continue to Login <Icon name="arrow" />
        </button>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ admins, onRegister, onLogin, showToast }) {
  const [matric, setMatric] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [needOtp, setNeedOtp] = useState(false);
  const [forgotFlow, setForgotFlow] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (attempts >= 5) { showToast("Too many attempts. Try again later.", "error"); return; }

    // Check admin accounts locally (they are hardcoded)
    const admin = admins.find(a => a.matric === matric);
    if (admin) {
      if (admin.otp) {
        if (!needOtp) {
          const code = generateOTP();
          setGeneratedOtp(code);
          setNeedOtp(true);
          showToast(`OTP generated: ${code} (sent to admin emails)`, "info");
          return;
        }
        if (otp !== generatedOtp) { showToast("Invalid OTP", "error"); setAttempts(a => a + 1); return; }
        onLogin({ matric: admin.matric, name: admin.name, role: admin.role });
        return;
      }
      if (admin.password && password === admin.password) {
        onLogin({ matric: admin.matric, name: admin.name, role: admin.role });
        return;
      }
      showToast("Invalid credentials", "error"); setAttempts(a => a + 1); return;
    }

    // Regular student: hit the backend
    setLoading(true);
    const res = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ matric, password }),
    });
    setLoading(false);

    if (!res.ok) {
      if (res.status === 0) {
        showToast("⚠️ Cannot connect to server. Check your connection.", "error");
      } else {
        showToast(res.data.message || "Invalid matric number or password", "error");
      }
      setAttempts(a => a + 1);
      return;
    }

    const user = res.data;
    if (user.banned) {
      onLogin({ ...user, role: "student" });
      return;
    }
    onLogin({ ...user, role: "student" });
  };

  if (forgotFlow) return (
    <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card p-8" style={{ maxWidth: 420, width: "100%" }}>
        <h2 className="text-gradient mb-4">Password Recovery</h2>
        {!resetSent ? (<>
          <p className="text-muted text-sm mb-4">Enter your registered email address to receive a reset link.</p>
          <div className="input-group"><label className="input-label">Email Address</label><input className="input-field" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="your@email.com" /></div>
          <button className="btn btn-primary btn-full" onClick={() => { if (!resetEmail) return; setResetSent(true); showToast("Reset instructions sent to email", "success"); }}>Send Reset Link</button>
          <button className="btn btn-ghost btn-full mt-4" onClick={() => setForgotFlow(false)}>Back to Login</button>
        </>) : (<>
          <div style={{ textAlign: "center", padding: "20px 0" }}><div style={{ fontSize: 48 }}>📧</div><p style={{ marginTop: 12, color: "var(--text-muted)" }}>Password reset instructions have been sent to <strong>{resetEmail}</strong>. Check your inbox.</p></div>
          <button className="btn btn-outline btn-full mt-4" onClick={() => { setForgotFlow(false); setResetSent(false); setResetEmail(""); }}>Back to Login</button>
        </>)}
      </div>
    </div>
  );

  return (
    <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card p-8" style={{ maxWidth: 420, width: "100%" }}>
        <div className="text-center mb-6">
          <div style={{ fontSize: 36 }}>🎓</div>
          <h2 className="text-gradient" style={{ fontSize: 24, marginTop: 8 }}>Welcome Back</h2>
          <p className="text-muted text-sm mt-2">Simyc Exam Prep NG | LASU</p>
        </div>
        <div className="input-group"><label className="input-label">Matric Number</label><input className="input-field" value={matric} onChange={e => setMatric(e.target.value)} placeholder="e.g. 23110821060" /></div>
        {!needOtp && <div className="input-group"><label className="input-label">Password</label><input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>}
        {needOtp && <div className="input-group"><label className="input-label">Enter OTP (sent to admin emails)</label><input className="input-field" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" /></div>}
        {!needOtp && <div className="text-right mb-4"><span className="text-sm" style={{ color: "var(--primary-light)", cursor: "pointer" }} onClick={() => setForgotFlow(true)}>Forgot Password?</span></div>}
        <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={loading}>
          <Icon name="lock" /> {loading ? "Logging in…" : needOtp ? "Verify OTP" : "Login"}
        </button>
        <div className="divider" />
        <div className="text-center text-sm text-muted">
          New student? <span style={{ color: "var(--primary-light)", cursor: "pointer", fontWeight: 600 }} onClick={onRegister}>Create Account</span>
        </div>
        <div className="text-center mt-4 text-xs text-muted">
          Need help? <a href="https://wa.me/2348153996360" target="_blank" rel="noreferrer" style={{ color: "#25D366" }}>💬 WhatsApp Support</a>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER SCREEN ──────────────────────────────────────────────────────────

function RegisterScreen({ termsAccepted, onSuccess, onBack, showToast }) {
  const [form, setForm] = useState({ fullName: "", matric: "", email: "", phone: "", password: "", confirm: "", faculty: "", department: "", level: "100" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const faculties = FACULTIES.map(f => f.name);
  const depts = FACULTIES.find(f => f.name === form.faculty)?.departments || [];

  const handleRegister = async () => {
    if (!form.fullName || !form.matric || !form.email || !form.phone || !form.password || !form.faculty || !form.department) {
      showToast("Please fill all required fields", "error"); return;
    }
    if (form.password !== form.confirm) { showToast("Passwords do not match", "error"); return; }
    if (form.password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    if (ADMINS.find(a => a.matric === form.matric)) { showToast("This matric number is reserved", "error"); return; }

    setLoading(true);
    const payload = { ...form, confirm: undefined, role: "student", questionsAttempted: 0, loginStreak: 0, practiceTime: 0, trialUsed: {} };
    const res = await apiFetch("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      if (res.status === 0) {
        showToast("⚠️ Cannot connect to server. Check your connection.", "error");
      } else {
        showToast(res.data.message || "Registration failed. Try again.", "error");
      }
      return;
    }

    showToast("Account created successfully!", "success");
    onSuccess();
  };

  return (
    <div className="page" style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ paddingTop: 40 }}>
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="back" /> Back</button>
          <h2 className="text-gradient" style={{ fontSize: 22 }}>Create Account</h2>
        </div>
        <div className="card p-6">
          <div className="grid-2">
            <div className="input-group"><label className="input-label">Full Name *</label><input className="input-field" value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Esuh Simeon Chioma" /></div>
            <div className="input-group"><label className="input-label">Matric Number *</label><input className="input-field" value={form.matric} onChange={e => set("matric", e.target.value)} placeholder="23XXXXXXXXX" /></div>
            <div className="input-group"><label className="input-label">Email Address *</label><input className="input-field" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" /></div>
            <div className="input-group"><label className="input-label">Phone Number *</label><input className="input-field" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+234..." /></div>
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
            <div className="input-group"><label className="input-label">Password *</label><input className="input-field" type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 chars" /></div>
            <div className="input-group"><label className="input-label">Confirm Password *</label><input className="input-field" type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Repeat password" /></div>
          </div>
          <button className="btn btn-primary btn-full mt-4" onClick={handleRegister} disabled={loading}>
            <Icon name="check" /> {loading ? "Creating Account…" : "Create My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardScreen({ user, notifications, payments, onLogout, onStartQuiz, onUpgrade, showToast }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const userNotifs = notifications.filter(n => n.to === user.matric || n.to === "all");
  const unread = userNotifs.filter(n => !n.read).length;
  const userPayment = payments.find(p => p.matric === user.matric && p.status === "approved");
  const hasAccess = !!userPayment;
  const courseList = ["PMG313 - Project Scope Management", "BFN320 - Financial Management", "BUS330 - Management Theory"];

  return (
    <div className="page">
      {/* Top Nav */}
      <div className="topnav">
        <div className="topnav-logo"><span>Simyc</span> <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>| LASU</span></div>
        <div className="topnav-actions">
          <div className="notif-bell" onClick={() => setShowNotifs(!showNotifs)}>
            <Icon name="bell" size={20} />
            {unread > 0 && <div className="notif-count">{unread}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--card-border)" }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user.fullName?.split(" ")[0] || user.name}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}><Icon name="logout" /></button>
        </div>
      </div>

      {showNotifs && (
        <div className="modal-overlay" onClick={() => setShowNotifs(false)}>
          <div className="card modal p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gradient">Notifications</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifs(false)}>✕</button>
            </div>
            {userNotifs.length === 0 ? <p className="text-muted text-sm">No notifications yet</p> : userNotifs.map((n, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--card-border)" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.subject || "Notification"}</div>
                <div className="text-muted text-sm mt-1">{n.body}</div>
                <div className="text-xs text-muted mt-1">{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {/* Welcome */}
        <div className="card p-6 mb-6" style={{ background: "linear-gradient(135deg, rgba(30,58,138,0.4), rgba(37,99,235,0.2))" }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 style={{ fontSize: 22, fontFamily: "Space Grotesk" }}>Welcome back, <span className="text-gradient">{user.fullName?.split(" ")[0] || user.name}! 👋</span></h2>
              <p className="text-muted text-sm mt-1">{user.department || "LASU"} • {user.level ? `${user.level} Level` : ""}</p>
            </div>
            {hasAccess ? <span className="badge badge-green">✅ Premium Active</span> : <span className="badge badge-yellow">🔓 Free Trial</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-6">
          {[
            { icon: "📊", label: "Questions Attempted", value: user.questionsAttempted || 0 },
            { icon: "🔥", label: "Login Streak", value: `${user.loginStreak || 0} days` },
            { icon: "⏱️", label: "Practice Time", value: `${Math.floor((user.practiceTime || 0) / 60)}m` },
            { icon: "🎯", label: "Courses Available", value: courseList.length },
          ].map((s, i) => (
            <div key={i} className="card stat-card card-lifted">
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Courses */}
        <h3 style={{ fontFamily: "Space Grotesk", marginBottom: 16, fontSize: 18 }}>📚 Available Courses</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {courseList.map((course, i) => {
            const trialDone = (user.trialUsed || {})[course] >= 15;
            const canAccess = hasAccess || !trialDone;
            return (
              <div key={i} className="card p-6 card-lifted" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{course}</div>
                  {!hasAccess && <div className="text-sm text-muted mt-1">{trialDone ? "Free trial used (15/15 questions)" : `Free trial: ${(user.trialUsed || {})[course] || 0}/15 questions`}</div>}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {canAccess ? (<>
                    <button className="btn btn-outline btn-sm" onClick={() => onStartQuiz({ course, mode: "no-timer", type: "combined" })}>📖 Study</button>
                    <button className="btn btn-primary btn-sm" onClick={() => onStartQuiz({ course, mode: "timer", type: "objective" })}>▶️ Timed CBT</button>
                  </>) : (
                    <button className="btn btn-primary btn-sm" onClick={onUpgrade}>🔒 Unlock Course</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade banner */}
        {!hasAccess && (
          <div className="card p-6 mb-6" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(96,165,250,0.1))", border: "1px solid rgba(37,99,235,0.3)" }}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 style={{ fontFamily: "Space Grotesk", fontSize: 18 }}>🚀 Unlock Full Access</h3>
                <p className="text-muted text-sm mt-1">Starting from ₦500/month per course</p>
              </div>
              <button className="btn btn-primary" onClick={onUpgrade}>View Plans 💰</button>
            </div>
          </div>
        )}

        {/* Support */}
        <div className="card p-6">
          <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>Need Help? Contact Support</h4>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="https://wa.me/2348153996360" target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#fff" }}>💬 WhatsApp</a>
            <a href="https://t.me/+2348153996360" target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "#0088cc", color: "#fff" }}>✈️ Telegram</a>
            <a href="mailto:simycesuh@gmail.com" className="btn btn-outline btn-sm">📧 Email Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QUIZ MODAL ───────────────────────────────────────────────────────────────

function QuizModal({ opts, user, onClose, showToast }) {
  const [stage, setStage] = useState("setup");
  const [settings, setSettings] = useState({ questionCount: 15, totalTime: 60, mode: opts?.mode || "timer", type: opts?.type || "combined", feedback: "end" });
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef(null);

  const filterQuestions = useCallback(() => {
    let q = [...SAMPLE_QUESTIONS];
    if (settings.type !== "combined") q = q.filter(x => x.type === settings.type);
    return q.slice(0, settings.questionCount);
  }, [settings]);

  const startQuiz = () => {
    const qs = filterQuestions();
    if (qs.length === 0) { showToast("No questions available for selected type", "warning"); return; }
    setQuestions(qs);
    setAnswers({});
    setCurrent(0);
    setFlagged(new Set());
    setTimeLeft(settings.totalTime * 60);
    setStage("quiz");
  };

  useEffect(() => {
    if (stage === "quiz" && settings.mode !== "no-timer") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); submitQuiz(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const submitQuiz = useCallback(() => {
    clearInterval(timerRef.current);
    setStage("result");
  }, []);

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

  return (
    <div className="modal-overlay">
      <div className="card modal modal-wide" style={{ maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        {/* SETUP */}
        {stage === "setup" && (<>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gradient">⚙️ Quiz Settings</h3>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
          {opts?.course && <div className="badge badge-blue mb-4">📚 {opts.course}</div>}
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Practice Mode</label>
              <select className="input-field" value={settings.mode} onChange={e => setSettings(s => ({ ...s, mode: e.target.value }))}>
                <option value="no-timer">No Timer (Study Mode)</option>
                <option value="timer">Total Timer (JAMB Style)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Question Type</label>
              <select className="input-field" value={settings.type} onChange={e => setSettings(s => ({ ...s, type: e.target.value }))}>
                <option value="combined">Combined (All Types)</option>
                <option value="objective">Objective Only</option>
                <option value="fill">Fill-in-the-Gap</option>
                <option value="theory">Theory Only</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Number of Questions (max {settings.mode === "no-timer" ? 500 : 100})</label>
              <input className="input-field" type="number" min={1} max={settings.mode === "no-timer" ? SAMPLE_QUESTIONS.length : Math.min(100, SAMPLE_QUESTIONS.length)} value={settings.questionCount} onChange={e => setSettings(s => ({ ...s, questionCount: Math.min(Number(e.target.value), settings.mode === "no-timer" ? SAMPLE_QUESTIONS.length : Math.min(100, SAMPLE_QUESTIONS.length)) }))} />
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
                <option value="immediate">Immediate (after each question)</option>
                <option value="end">End of Session</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-full mt-4" onClick={startQuiz}>
            <Icon name="play" /> Start Quiz ({settings.questionCount} Questions)
          </button>
        </>)}

        {/* QUIZ */}
        {stage === "quiz" && q && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span className="badge badge-blue">Q {current + 1} / {questions.length}</span>
              <span className="badge badge-blue" style={{ marginLeft: 8 }}>{q.topic}</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {settings.mode !== "no-timer" && (
                <div className={`${timerClass}`} style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700 }}>
                  ⏱️ {formatTime(timeLeft)}
                </div>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => { clearInterval(timerRef.current); onClose(); }}>✕</button>
            </div>
          </div>
          <div className="progress-bar mb-4"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>
              {q.type === "objective" ? "🔘 Multiple Choice" : q.type === "fill" ? "✏️ Fill in the Gap" : "📝 Theory"}
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500 }}>{q.question}</p>
          </div>
          {q.type === "objective" && q.options.map((opt, i) => {
            const letter = opt[0];
            const isSelected = answers[current] === opt;
            const feedbackMode = settings.feedback === "immediate" && showFeedback;
            const isCorrect = feedbackMode && letter === q.answer;
            const isWrong = feedbackMode && isSelected && letter !== q.answer;
            return (
              <button key={i} className={`option-btn ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                onClick={() => { if (feedbackMode) return; setAnswers(a => ({ ...a, [current]: opt })); if (settings.feedback === "immediate") setShowFeedback(true); }}>
                <div className="option-key">{letter}</div>
                {opt.slice(3)}
              </button>
            );
          })}
          {q.type === "fill" && (
            <div className="input-group">
              <input className="input-field" value={answers[current] || ""} onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))} placeholder="Type your answer here..." style={{ fontSize: 16 }} />
            </div>
          )}
          {q.type === "theory" && (
            <div className="input-group">
              <textarea className="input-field" rows={5} value={answers[current] || ""} onChange={e => setAnswers(a => ({ ...a, [current]: e.target.value }))} placeholder="Write your answer here..." style={{ fontSize: 15, resize: "vertical" }} />
            </div>
          )}
          {settings.feedback === "immediate" && showFeedback && (
            <div style={{ padding: 14, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>✅ Correct Answer: {q.answer}</div>
              <div className="text-sm text-muted">{q.explanation}</div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCurrent(c => Math.max(0, c - 1)); setShowFeedback(false); }} disabled={current === 0}><Icon name="prev" /> Prev</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFlagged(f => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; }) }}>
                {flagged.has(current) ? "🚩 Flagged" : "🏳️ Flag"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {current < questions.length - 1 ? (
                <button className="btn btn-primary btn-sm" onClick={() => { setCurrent(c => c + 1); setShowFeedback(false); }}>Next <Icon name="next" /></button>
              ) : (
                <button className="btn btn-success btn-sm" onClick={submitQuiz}><Icon name="submit" /> Submit Quiz</button>
              )}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {questions.map((_, i) => (
              <div key={i} onClick={() => { setCurrent(i); setShowFeedback(false); }} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", background: i === current ? "var(--primary)" : flagged.has(i) ? "rgba(245,158,11,0.4)" : answers[i] ? "rgba(22,163,74,0.3)" : "var(--card-border)", border: i === current ? "2px solid var(--primary-light)" : "1px solid transparent", transition: "all 0.15s" }}>{i + 1}</div>
            ))}
          </div>
        </>)}

        {/* RESULTS */}
        {stage === "result" && (<>
          <div className="text-center mb-6">
            <div style={{ fontSize: 56, marginBottom: 8 }}>{score >= 70 ? "🏆" : score >= 50 ? "👍" : "📖"}</div>
            <h2 className="text-gradient" style={{ fontSize: 28 }}>{score}%</h2>
            <p className="text-muted">{correct} correct out of {questions.length} questions</p>
            <div className="mt-4">
              <span className={`badge ${score >= 70 ? "badge-green" : score >= 50 ? "badge-yellow" : "badge-red"}`}>
                {score >= 70 ? "Excellent! 🎯" : score >= 50 ? "Good effort 👍" : "Needs improvement 📚"}
              </span>
            </div>
          </div>
          <div className="grid-3 mb-6">
            <div className="card p-4 text-center"><div style={{ fontSize: 22, color: "#4ade80", fontWeight: 700 }}>{correct}</div><div className="text-xs text-muted">Correct</div></div>
            <div className="card p-4 text-center"><div style={{ fontSize: 22, color: "#f87171", fontWeight: 700 }}>{questions.length - correct}</div><div className="text-xs text-muted">Wrong</div></div>
            <div className="card p-4 text-center"><div style={{ fontSize: 22, color: "var(--primary-light)", fontWeight: 700 }}>{questions.filter((_, i) => !answers[i]).length}</div><div className="text-xs text-muted">Unanswered</div></div>
          </div>
          <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>📊 Topic Performance</h4>
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
            <div style={{ padding: 14, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, marginBottom: 16 }}>
              <strong style={{ color: "#fbbf24" }}>💡 Recommendation:</strong>
              <p className="text-sm text-muted mt-1">Focus more on: <strong>{Object.entries(topicScores).filter(([, d]) => d.correct / d.total < 0.6).map(([t]) => t).join(", ")}</strong></p>
            </div>
          )}
          <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>📋 Question Review</h4>
          {questions.map((q, i) => {
            const isCorrect = q.type === "objective" ? answers[i]?.startsWith(q.answer) : q.type === "fill" ? answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim() : answers[i]?.length > 5;
            return (
              <div key={i} style={{ padding: "14px 16px", marginBottom: 10, background: "var(--card)", borderRadius: 10, border: `1px solid ${isCorrect ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{isCorrect ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Q{i + 1}: {q.question.slice(0, 60)}...</span>
                </div>
                <div className="text-sm"><span style={{ color: "var(--text-muted)" }}>Your answer: </span><span>{answers[i] || "Not answered"}</span></div>
                {!isCorrect && <div className="text-sm mt-1"><span style={{ color: "var(--text-muted)" }}>Correct: </span><span style={{ color: "#4ade80", fontWeight: 600 }}>{q.answer}</span></div>}
                <div className="text-xs text-muted mt-1">{q.explanation}</div>
              </div>
            );
          })}
          <div className="flex gap-3 mt-6">
            <button className="btn btn-primary btn-full" onClick={() => setStage("setup")}>🔄 Try Again</button>
            <button className="btn btn-outline btn-full" onClick={onClose}>✕ Close</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

function PaymentModal({ onClose, payments, addPayment, user, showToast }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState("plans");
  const [proofText, setProofText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!proofText) { showToast("Please confirm you've sent the payment", "error"); return; }
    setLoading(true);
    const paymentData = {
      matric: user.matric,
      name: user.fullName || user.name,
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      status: "pending",
      time: new Date().toLocaleString(),
    };
    const backendOk = await addPayment(paymentData);
    setLoading(false);
    if (!backendOk) {
      showToast("⚠️ Server offline — payment recorded locally. Admin will be notified via WhatsApp.", "warning");
    } else {
      showToast("Payment submitted! Awaiting admin approval.", "success");
    }
    setStep("submitted");
  };

  return (
    <div className="modal-overlay">
      <div className="card modal" style={{ maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gradient">💰 Upgrade Plan</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {step === "plans" && (<>
          <p className="text-muted text-sm mb-4">Select a plan to unlock full access to Simyc Exam Prep NG.</p>
          {PLANS.map(plan => (
            <div key={plan.id} onClick={() => setSelectedPlan(plan)} className="card p-5 mb-3 pointer card-lifted" style={{ border: selectedPlan?.id === plan.id ? "1px solid var(--primary)" : "1px solid var(--card-border)", background: selectedPlan?.id === plan.id ? "rgba(37,99,235,0.1)" : "var(--card-glass)" }}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.name}</div>
                  <div className="text-sm text-muted mt-1">{plan.description} · {plan.duration}</div>
                </div>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: "var(--primary-light)" }}>{plan.price}</div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary btn-full mt-4" onClick={() => { if (!selectedPlan) { showToast("Please select a plan", "warning"); return; } setStep("instructions"); }} disabled={!selectedPlan}>
            Continue with {selectedPlan?.name || "a Plan"} →
          </button>
        </>)}

        {step === "instructions" && (<>
          <div className="card p-5 mb-5" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)" }}>
            <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>📋 Payment Instructions</h4>
            <ol style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: 15 }}>
              <li>Send <strong style={{ color: "var(--primary-light)" }}>{selectedPlan.price}</strong> to <strong>Pocket App: 7381677614</strong></li>
              <li>Use your Matric Number (<strong>{user.matric}</strong>) as payment description</li>
              <li>Screenshot your successful payment</li>
              <li>Send screenshot to WhatsApp: <a href="https://wa.me/2348153996360" target="_blank" rel="noreferrer" style={{ color: "#25D366" }}>+234 815 399 6360</a></li>
              <li>Click "I've Paid" below and wait for admin approval</li>
            </ol>
            <div style={{ marginTop: 12, padding: 12, background: "rgba(245,158,11,0.1)", borderRadius: 8, fontSize: 13, color: "#fbbf24" }}>
              ⚠️ Always use your matric number as payment description to avoid delays.
            </div>
          </div>
          <label className="checkbox-group">
            <input type="checkbox" checked={!!proofText} onChange={e => setProofText(e.target.checked ? "confirmed" : "")} />
            <span style={{ fontSize: 14 }}>I have sent the payment of <strong>{selectedPlan.price}</strong> and WhatsApped my receipt</span>
          </label>
          <button className="btn btn-success btn-full mt-4" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : "✅ I've Paid — Notify Admin"}
          </button>
          <button className="btn btn-ghost btn-full mt-3" onClick={() => setStep("plans")}>← Back to Plans</button>
        </>)}

        {step === "submitted" && (
          <div className="text-center" style={{ padding: "20px 0" }}>
            <div style={{ fontSize: 64 }}>⏳</div>
            <h3 style={{ fontFamily: "Space Grotesk", marginTop: 16 }}>Payment Submitted!</h3>
            <p className="text-muted mt-2">Your payment is being reviewed. You'll receive a notification once approved (usually within a few hours).</p>
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

function AdminScreen({ user, users, setUsers, payments, setPayments, notifications, setNotifications, broadcasts, setBroadcasts, adminLogs, logAdminAction, messages, setMessages, onLogout, showToast, isSuperAdmin, banUserBackend, reloadData }) {
  const [section, setSection] = useState("overview");

  const sidebarItems = [
    { id: "overview", icon: "🏠", label: "Overview" },
    { id: "users", icon: "👥", label: "User Management" },
    { id: "payments", icon: "💰", label: "Payments" },
    { id: "questions", icon: "📚", label: "Questions" },
    { id: "broadcast", icon: "📢", label: "Broadcast" },
    { id: "messages", icon: "💬", label: "Messages" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    ...(isSuperAdmin ? [{ id: "superadmin", icon: "👑", label: "Super Admin" }] : []),
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{ padding: "16px 20px", marginBottom: 8 }}>
          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 16 }}>
            {isSuperAdmin ? "👑 Super Admin" : "🛡️ Admin Panel"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{user.name}</div>
        </div>
        {sidebarItems.map(item => (
          <div key={item.id} className={`sidebar-item ${section === item.id ? "active" : ""}`} onClick={() => setSection(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
        <div style={{ padding: "20px" }}>
          <button className="btn btn-ghost btn-sm btn-full" onClick={reloadData} style={{ marginBottom: 8 }}>🔄 Refresh Data</button>
          <button className="btn btn-ghost btn-sm btn-full" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>
      <div className="admin-main">
        {section === "overview" && <AdminOverview users={users} payments={payments} adminLogs={adminLogs} isSuperAdmin={isSuperAdmin} />}
        {section === "users" && <AdminUsers users={users} setUsers={setUsers} notifications={notifications} setNotifications={setNotifications} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} isSuperAdmin={isSuperAdmin} banUserBackend={banUserBackend} />}
        {section === "payments" && <AdminPayments payments={payments} setPayments={setPayments} users={users} setUsers={setUsers} notifications={notifications} setNotifications={setNotifications} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} />}
        {section === "questions" && <AdminQuestions showToast={showToast} />}
        {section === "broadcast" && <AdminBroadcast broadcasts={broadcasts} setBroadcasts={setBroadcasts} logAdminAction={(a) => logAdminAction(user.name, a)} showToast={showToast} />}
        {section === "messages" && <AdminMessages messages={messages} setMessages={setMessages} users={users} adminName={user.name} showToast={showToast} />}
        {section === "analytics" && <AdminAnalytics users={users} payments={payments} />}
        {section === "superadmin" && isSuperAdmin && <SuperAdminPanel adminLogs={adminLogs} showToast={showToast} />}
        {section === "settings" && <AdminSettings showToast={showToast} />}
      </div>
    </div>
  );
}

function AdminOverview({ users, payments, adminLogs, isSuperAdmin }) {
  const pending = payments.filter(p => p.status === "pending").length;
  const approved = payments.filter(p => p.status === "approved").length;

  return (
    <div>
      <h2 className="text-gradient mb-6" style={{ fontSize: 22 }}>Dashboard Overview</h2>
      <div className="grid-4 mb-6">
        {[
          { icon: "👥", label: "Total Students", value: users.length },
          { icon: "⏳", label: "Pending Payments", value: pending, color: "#fbbf24" },
          { icon: "✅", label: "Active Subscribers", value: approved, color: "#4ade80" },
          { icon: "📚", label: "Questions Available", value: SAMPLE_QUESTIONS.length },
        ].map((s, i) => (
          <div key={i} className="card stat-card">
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color || "var(--text)" }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      {isSuperAdmin && adminLogs.length > 0 && (<>
        <h3 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>🔍 Recent Admin Activity</h3>
        <div className="card">
          {adminLogs.slice(0, 8).map((log, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: i < adminLogs.slice(0, 8).length - 1 ? "1px solid var(--card-border)" : "none", fontSize: 13 }}>
              <strong>{log.admin}</strong> — {log.action} <span className="text-muted">({log.time})</span>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}

function AdminUsers({ users, setUsers, notifications, setNotifications, logAdminAction, showToast, isSuperAdmin, banUserBackend }) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.matric?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const banUser = async (u) => {
    setActionLoading(true);
    const newBanned = !u.banned;
    const ok = await banUserBackend(u.matric, newBanned);
    setActionLoading(false);
    if (ok) {
      logAdminAction(`${newBanned ? "Banned" : "Unbanned"} user ${u.matric}`);
      showToast(`User ${newBanned ? "banned" : "unbanned"}`, "success");
    } else {
      // Fallback: update locally if backend is down
      setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, banned: newBanned } : x));
      logAdminAction(`${newBanned ? "Banned" : "Unbanned"} user ${u.matric} (offline)`);
      showToast(`User ${newBanned ? "banned" : "unbanned"} (offline mode)`, "warning");
    }
  };

  const warnUser = (u) => {
    if (!warnMsg) return;
    const warnings = (u.warnings || 0) + 1;
    setUsers(prev => prev.map(x => x.matric === u.matric ? { ...x, warnings, banned: warnings >= 3 } : x));
    setNotifications(prev => [...prev, { to: u.matric, subject: "⚠️ Warning from Admin", body: warnMsg, time: new Date().toLocaleString() }]);
    logAdminAction(`Warned user ${u.matric} (${warnings} warnings)`);
    showToast(`Warning sent (${warnings}/3 — ${warnings >= 3 ? "auto-banned!" : ""})`, "warning");
    setWarnMsg(""); setSelectedUser(null);
  };

  return (
    <div>
      <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>User Management</h2>
      <div className="input-group"><input className="input-field" placeholder="🔍 Search by name, matric, or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      {selectedUser && (
        <div className="modal-overlay">
          <div className="card modal p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3>👤 {selectedUser.fullName}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 2, color: "var(--text-muted)" }}>
              <div>Matric: <strong style={{ color: "var(--text)" }}>{selectedUser.matric}</strong></div>
              <div>Email: {selectedUser.email}</div>
              <div>Department: {selectedUser.department}</div>
              <div>Level: {selectedUser.level}</div>
              <div>Warnings: <span style={{ color: (selectedUser.warnings || 0) >= 2 ? "var(--danger)" : "var(--text)" }}>{selectedUser.warnings || 0}/3</span></div>
              <div>Status: {selectedUser.banned ? <span className="badge badge-red">Banned</span> : <span className="badge badge-green">Active</span>}</div>
            </div>
            <div className="input-group mt-4"><label className="input-label">Warning Message</label><textarea className="input-field" rows={3} value={warnMsg} onChange={e => setWarnMsg(e.target.value)} placeholder="Reason for warning..." /></div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={() => { banUser(selectedUser); setSelectedUser(null); }} disabled={actionLoading}>
                {actionLoading ? "Processing…" : selectedUser.banned ? "Unban User" : "Ban User"}
              </button>
              <button className="btn btn-sm" style={{ background: "var(--warning)", color: "#000" }} onClick={() => warnUser(selectedUser)}>⚠️ Send Warning</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && <p className="text-muted text-center mt-4">No users found</p>}
        {filtered.map((u, i) => (
          <div key={i} className="card p-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{u.fullName} {u.banned && <span className="badge badge-red">Banned</span>}</div>
              <div className="text-sm text-muted">{u.matric} · {u.department} · {u.level} Level</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedUser(u)}>View / Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPayments({ payments, setPayments, users, setUsers, notifications, setNotifications, logAdminAction, showToast }) {
  const approve = async (i) => {
    const p = payments[i];
    // Optimistic update
    setPayments(prev => prev.map((x, j) => j === i ? { ...x, status: "approved" } : x));
    setNotifications(prev => [...prev, { to: p.matric, subject: "✅ Payment Approved!", body: `Your ${p.plan} subscription (${p.amount}) has been approved. Enjoy full access!`, time: new Date().toLocaleString() }]);
    logAdminAction(`Approved payment for ${p.matric} — ${p.plan}`);
    showToast("Payment approved!", "success");
  };

  const reject = async (i) => {
    const p = payments[i];
    setPayments(prev => prev.map((x, j) => j === i ? { ...x, status: "rejected" } : x));
    logAdminAction(`Rejected payment for ${p.matric}`);
    showToast("Payment rejected", "error");
  };

  return (
    <div>
      <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Payment Management</h2>
      {payments.length === 0 && <p className="text-muted">No payments yet.</p>}
      {payments.map((p, i) => (
        <div key={i} className="card p-5 mb-3">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <div style={{ fontWeight: 600 }}>{p.name} <span className="text-muted text-sm">({p.matric})</span></div>
              <div className="text-sm text-muted mt-1">Plan: <strong>{p.plan}</strong> · Amount: <strong style={{ color: "var(--primary-light)" }}>{p.amount}</strong></div>
              <div className="text-xs text-muted">{p.time}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`badge ${p.status === "approved" ? "badge-green" : p.status === "rejected" ? "badge-red" : "badge-yellow"}`}>{p.status}</span>
              {p.status === "pending" && (<>
                <button className="btn btn-success btn-sm" onClick={() => approve(i)}>✅ Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => reject(i)}>❌ Reject</button>
              </>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminQuestions({ showToast }) {
  return (
    <div>
      <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Question Management</h2>
      <div className="card p-8 text-center">
        <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
        <h3 style={{ fontFamily: "Space Grotesk", marginBottom: 8 }}>Question Bank</h3>
        <p className="text-muted text-sm mb-4">Currently loaded with {SAMPLE_QUESTIONS.length} practice questions across PMG313, BFN320, and BUS330.</p>
        <p className="text-muted text-sm mb-6">Additional questions will be uploaded as more course PDFs are provided by the admin.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => showToast("PDF upload feature — connect backend to enable", "info")}>📤 Upload Questions PDF</button>
          <button className="btn btn-outline" onClick={() => showToast("Coming with backend integration", "info")}>✏️ Edit Questions</button>
        </div>
      </div>
      <div className="mt-6">
        <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>Current Questions Preview</h4>
        {SAMPLE_QUESTIONS.slice(0, 5).map((q, i) => (
          <div key={i} className="card p-4 mb-3">
            <div className="flex justify-between items-start gap-4">
              <div style={{ fontSize: 14, flex: 1 }}><strong>Q{i + 1}:</strong> {q.question}</div>
              <span className="badge badge-blue">{q.type}</span>
            </div>
            <div className="text-xs text-muted mt-2">Topic: {q.topic}</div>
          </div>
        ))}
        <p className="text-muted text-sm text-center mt-4">...and {SAMPLE_QUESTIONS.length - 5} more questions</p>
      </div>
    </div>
  );
}

function AdminBroadcast({ broadcasts, setBroadcasts, logAdminAction, showToast }) {
  const [msg, setMsg] = useState("");
  const [color, setColor] = useState("blue");

  const send = () => {
    if (!msg) return;
    setBroadcasts(prev => [{ id: Date.now(), message: msg, color, active: true, time: new Date().toLocaleString() }, ...prev.map(b => ({ ...b, active: false }))]);
    logAdminAction(`Sent ${color.toUpperCase()} broadcast: ${msg.slice(0, 40)}...`);
    showToast("Broadcast sent!", "success");
    setMsg("");
  };

  return (
    <div>
      <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Broadcast System</h2>
      <div className="card p-6 mb-6">
        <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 16 }}>📢 Send New Broadcast</h4>
        <div className="input-group">
          <label className="input-label">Priority Level</label>
          <select className="input-field" value={color} onChange={e => setColor(e.target.value)}>
            <option value="green">🟢 GREEN — Info/Update</option>
            <option value="yellow">🟡 YELLOW — Notice/Warning</option>
            <option value="red">🔴 RED — Urgent/Emergency</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Message</label>
          <textarea className="input-field" rows={3} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your broadcast message..." />
        </div>
        <button className="btn btn-primary" onClick={send} disabled={!msg}>📢 Send Broadcast</button>
      </div>
      <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>📋 Broadcast History</h4>
      {broadcasts.length === 0 && <p className="text-muted">No broadcasts sent yet.</p>}
      {broadcasts.map((b, i) => (
        <div key={i} className="card p-4 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <span className={`badge badge-${b.color === "green" ? "green" : b.color === "red" ? "red" : "yellow"} mb-2`}>{b.color.toUpperCase()}</span>
              <p style={{ fontSize: 14 }}>{b.message}</p>
              <div className="text-xs text-muted mt-1">{b.time}</div>
            </div>
            {b.active && <span className="badge badge-green">Active</span>}
          </div>
          {b.active && (
            <button className="btn btn-ghost btn-sm mt-3" onClick={() => setBroadcasts(prev => prev.map((x, j) => j === i ? { ...x, active: false } : x))}>
              Deactivate
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminMessages({ messages, setMessages, users, adminName, showToast }) {
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");

  const sendMessage = (toMatric, toName) => {
    if (!replyText) return;
    setMessages(prev => [...prev, { fromName: adminName, toMatric, toName, body: replyText, time: new Date().toLocaleString() }]);
    showToast("Message sent!", "success");
    setReplyText(""); setReplyTarget(null);
  };

  return (
    <div>
      <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Messages</h2>
      <div className="card p-6 mb-6">
        <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>Send Direct Message</h4>
        <div className="input-group">
          <label className="input-label">Select Student</label>
          <select className="input-field" value={replyTarget?.matric || ""} onChange={e => { const u = users.find(x => x.matric === e.target.value); setReplyTarget(u || null); }}>
            <option value="">Choose student...</option>
            {users.map(u => <option key={u.matric} value={u.matric}>{u.fullName} ({u.matric})</option>)}
          </select>
        </div>
        <div className="input-group"><label className="input-label">Message</label><textarea className="input-field" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your message..." /></div>
        <button className="btn btn-primary" onClick={() => replyTarget && sendMessage(replyTarget.matric, replyTarget.fullName)} disabled={!replyTarget}>Send Message</button>
      </div>
      <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>Message Log</h4>
      {messages.length === 0 && <p className="text-muted">No messages yet.</p>}
      {messages.map((m, i) => (
        <div key={i} className="card p-4 mb-3">
          <div className="flex justify-between text-sm mb-2">
            <strong>{m.fromName} → {m.toName}</strong>
            <span className="text-muted">{m.time}</span>
          </div>
          <p style={{ fontSize: 14 }}>{m.body}</p>
        </div>
      ))}
    </div>
  );
}

function AdminAnalytics({ users, payments }) {
  const approvedPayments = payments.filter(p => p.status === "approved");
  const byPlan = {};
  approvedPayments.forEach(p => { byPlan[p.plan] = (byPlan[p.plan] || 0) + 1; });

  return (
    <div>
      <h2 className="text-gradient mb-4" style={{ fontSize: 22 }}>Analytics & Reports</h2>
      <div className="grid-2 mb-6">
        <div className="card p-6">
          <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 16 }}>Student Distribution</h4>
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
          <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 16 }}>Subscription Plans</h4>
          {Object.entries(byPlan).length === 0 && <p className="text-muted text-sm">No approved subscriptions yet.</p>}
          {Object.entries(byPlan).map(([plan, count]) => (
            <div key={plan} style={{ marginBottom: 12 }}>
              <div className="flex justify-between text-sm mb-1"><span>{plan}</span><span>{count} subscribers</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${(count / approvedPayments.length) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid-3">
        {[
          { label: "Total Registered", value: users.length, icon: "👥" },
          { label: "Active Subscribers", value: approvedPayments.length, icon: "✅" },
          { label: "Pending Payments", value: payments.filter(p => p.status === "pending").length, icon: "⏳" },
        ].map((s, i) => (
          <div key={i} className="card stat-card text-center">
            <div style={{ fontSize: 32 }}>{s.icon}</div>
            <div className="stat-value mt-2">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuperAdminPanel({ adminLogs, showToast }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ fontSize: 32 }}>👑</div>
        <h2 className="text-gradient" style={{ fontSize: 22 }}>Super Admin Controls</h2>
      </div>
      <div className="card p-6 mb-6" style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
        <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 8 }}>⚡ Supreme Powers Active</div>
        <p className="text-sm text-muted">You have full control over all admin accounts, user data, and system settings. All actions are logged.</p>
      </div>
      <div className="grid-2 mb-6">
        {[
          { icon: "👤", title: "Admin Accounts", desc: "Create, edit, delete admin accounts", action: "Manage Admins" },
          { icon: "🔑", title: "Password Override", desc: "Reset any admin or user password", action: "Override Password" },
          { icon: "📤", title: "Data Export", desc: "Export all user and payment data", action: "Export Data" },
          { icon: "🛡️", title: "Security Logs", desc: "View all system access logs", action: "View Logs" },
        ].map((item, i) => (
          <div key={i} className="card p-5 card-lifted">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700 }}>{item.title}</div>
            <div className="text-sm text-muted mt-1 mb-4">{item.desc}</div>
            <button className="btn btn-outline btn-sm" onClick={() => showToast(`${item.title} — connect to backend for full functionality`, "info")}>{item.action}</button>
          </div>
        ))}
      </div>
      <h4 style={{ fontFamily: "Space Grotesk", marginBottom: 12 }}>📋 Full Admin Activity Log</h4>
      <div className="card">
        {adminLogs.length === 0 && <p className="text-muted p-4">No admin actions recorded yet.</p>}
        {adminLogs.map((log, i) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: i < adminLogs.length - 1 ? "1px solid var(--card-border)" : "none", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span><strong>{log.admin}</strong> — {log.action}</span>
            <span className="text-muted text-xs">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettings({ showToast }) {
  return (
    <div>
      <h2 className="text-gradient mb-6" style={{ fontSize: 22 }}>System Settings</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { title: "📧 Email Configuration", desc: "SMTP settings for automated emails (password reset, OTP, notifications)", btn: "Configure SMTP" },
          { title: "🏫 Faculty & Department List", desc: "Manage LASU faculties and departments in the system", btn: "Edit Faculties" },
          { title: "📜 Terms & Conditions", desc: "Update the Terms & Conditions and User Guidelines", btn: "Edit Terms" },
          { title: "📞 Support Contact Info", desc: "Update WhatsApp, Telegram, and Email contact details", btn: "Update Contacts" },
          { title: "🗄️ Database Backup", desc: "Export a backup of all app data", btn: "Download Backup" },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex justify-between items-center flex-wrap gap-4">
            <div>
              <div style={{ fontFamily: "Space Grotesk", fontWeight: 700 }}>{s.title}</div>
              <div className="text-sm text-muted mt-1">{s.desc}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => showToast(`${s.btn} — requires backend integration`, "info")}>{s.btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
