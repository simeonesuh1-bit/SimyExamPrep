const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Handle Quota Error in user listener (around line 5236)
const unsubUsersStart = 'const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {';
const unsubUsersError = `const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {`; // (same for start)

// Look for the error handler at line 5259
const errorStart = '}, (err) => {\n            console.error("[Firestore users]", err?.code, err?.message);\n            setIsUsersLoading(false); // Fix hang on error\n        });';
const errorReplacement = `}, (err) => {\n            console.error("[Firestore users]", err?.code, err?.message);\n            setIsUsersLoading(false); \n            if (err?.code === "resource-exhausted") {\n                console.log("🚨 User DB Quota Exceeded! Bypassing sync hang.");\n            }\n        });`;

if (content.includes(errorStart) && !content.includes('resource-exhausted')) {
    content = content.replace(errorStart, errorReplacement);
}

// 2. Modify LoginScreen button to allow clicking while Syncing (line 6199)
const loginBtnStart = '<button className="btn btn-primary btn-full" onClick={handleLogin} disabled={isSyncing}>';
const loginBtnFixed = '<button className="btn btn-primary btn-full" onClick={handleLogin}>';

if (content.includes(loginBtnStart)) {
    content = content.replace(loginBtnStart, loginBtnFixed);
}

// 3. Add Quota Warning in AdminScreen (around line 7420)
const adminSidebarStart = '<div className="admin-layout">';
const quotaWarning = `
            {/* 🚨 QUOTA EMERGENCY WARNING */}
            <div style={{ position: "fixed", top: 12, right: 12, zIndex: 9999, maxWidth: 300, background: "rgba(220,38,38,0.95)", border: "1px solid #f87171", borderRadius: 12, padding: "12px 16px", color: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.4)", animation: "slideInRight 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28)" }}>
                <div style={{ fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    ⚠️ QUOTA EXCEEDED (READ-ONLY)
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.9 }}>
                    Writing to the database is currently blocked by Firebase. <strong style={{ fontWeight: 700, textDecoration: "underline" }}>You cannot Approve Payments or Edit Users</strong> until you upgrade to the Blaze Plan or the quota resets at midnight.
                </div>
            </div>`;

if (content.includes(adminSidebarStart) && !content.includes('QUOTA EMERGENCY WARNING')) {
    content = content.replace(adminSidebarStart, `<div className="admin-layout">${quotaWarning}`);
}

fs.writeFileSync(appPath, content);
console.log('Successfully injected Admin Login bypass and Quota Warning');
