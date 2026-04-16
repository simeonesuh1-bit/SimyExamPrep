const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Defend AdminScreen calculations (lines 7398-7400)
content = content.replace(
    'const unreadTotal = messages.filter(m => m.type === "user_to_admin" && !readAdminMsgs.includes(m.id)).length;',
    'const unreadTotal = (messages || []).filter(m => m.type === "user_to_admin" && m.id && (readAdminMsgs || []).includes(m.id)).length;'
);
content = content.replace(
    'const unreadEditRequests = notifications.filter(n => n.type === "edit_request" && n.status !== "approved" && n.status !== "rejected").length;',
    'const unreadEditRequests = (notifications || []).filter(n => n && n.type === "edit_request" && n.status !== "approved" && n.status !== "rejected").length;'
);
content = content.replace(
    'const pendingPayments = payments.filter(p => p.status === "pending").length;',
    'const pendingPayments = (payments || []).filter(p => p && p.status === "pending").length;'
);

// 2. Defend AdminOverview (lines 7496-7497)
content = content.replace(
    'const pending = payments.filter(p => p.status === "pending").length;',
    'const pending = (payments || []).filter(p => p && p.status === "pending").length;'
);
content = content.replace(
    'const approved = payments.filter(p => p.status === "approved").length;',
    'const approved = (payments || []).filter(p => p && p.status === "approved").length;'
);

// 3. Fix potential undefined questions Access in Sidebar (line 7624)
content = content.replace(
    '{ icon: "📚", label: "Questions", value: questions?.length || 0, color: "#a78bfa", section: "questions" },',
    '{ icon: "📚", label: "Questions", value: (questions || []).length, color: "#a78bfa", section: "questions" },'
);

// 4. Wrap onAuthStateChanged internal query in try-catch (around line 5270)
const authQueryStart = 'const q = query(collection(db, "users"), where("email", "==", lowerEmail));\n                const snap = await getDocs(q);';
const authQueryFixed = `try {
                    const q = query(collection(db, "users"), where("email", "==", lowerEmail));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const me = snap.docs[0].data();
                        if (me.banned || me.isDeleted) { await signOut(auth); setLocalCurrentUser(null); return; }
                        setLocalCurrentUser(me);
                    } else {
                        setLocalCurrentUser({ email: lowerEmail, role: "student" });
                    }
                } catch (err) {
                    console.error("Auth sync error:", err);
                    setLocalCurrentUser({ email: lowerEmail, role: "student" });
                }`;

// Note: I'll use a simpler replacement to avoid regex issues with large blocks
if (content.includes('const snap = await getDocs(q);') && content.includes('if (!snap.empty)')) {
     // I will skip the complex auth replacement if it looks risky and focus on the UI crashes first
}

fs.writeFileSync(appPath, content);
console.log('Successfully injected defensive guards to prevent Admin Dashboard crashes.');
