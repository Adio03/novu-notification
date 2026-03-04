import React, { useState, useEffect } from "react";
import { Inbox } from "@novu/react";
import { registerPushToken, onForegroundMessage } from "./firebase";

const APP_IDENTIFIER = "P2IfsvF9QVrf";
const SUBSCRIBER_ID  = "BUS-J872IVFJ7HH5U1IK20KA6";
const BACKEND_URL    = "http://localhost:8080";

export default function App() {
  const [tab, setTab]       = useState("home");
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (banner) {
      const timer = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  useEffect(() => {
    // Register this browser as a push notification device on app load.
    // Pass your JWT here if your /api/notifications/fcm-token endpoint requires auth.
    // For testing you can pass an empty string if the endpoint is open.
    const jwtToken = localStorage.getItem("jwt") || "";
    registerPushToken(SUBSCRIBER_ID, jwtToken);

    // Show a banner when a push arrives while the tab is open (foreground)
    onForegroundMessage((payload) => {
      setBanner({
        type:    "success",
        message: `📬 ${payload.notification?.title}: ${payload.notification?.body}`
      });
    });
  }, []);

  return (
      <div style={styles.root}>
        {banner && (
            <div style={{
              ...styles.banner,
              backgroundColor: banner.type === "success" ? "#22c55e" : "#ef4444"
            }}>
              {banner.message}
            </div>
        )}

        {/* ── Top Nav ── */}
        <header style={styles.header}>
          <span style={styles.logo}>⚡ NotifyApp</span>

          <nav style={styles.nav}>
            {["home", "orders", "settings"].map((t) => (
                <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      ...styles.navBtn,
                      ...(tab === t ? styles.navBtnActive : {}),
                    }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
            ))}
          </nav>

          {/* Novu Inbox — Real-time in-app notifications */}
          <Inbox
              applicationIdentifier={APP_IDENTIFIER}
              subscriberId={SUBSCRIBER_ID}
              socketUrl="wss://socket.novu.co"
              appearance={{
                colorScheme: "light",
                variables: {
                  colorPrimary:    "#DD2450",
                  colorBackground: "#ffffff",
                },
              }}
              styles={{
                root: { width: "100%", maxWidth: "400px" },
              }}
          />
        </header>

        {/* ── Page Body ── */}
        <main style={styles.main}>
          {tab === "home"     && <HomePage setBanner={setBanner} />}
          {tab === "orders"   && <OrdersPage />}
          {tab === "settings" && <SettingsPage />}
        </main>
      </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────

function HomePage({ setBanner }) {
  return (
      <section>
        <h2 style={styles.pageTitle}>Welcome back 👋</h2>
        <p style={styles.prose}>
          This mini-app is wired up to <strong>Novu Cloud</strong>. Any workflow your
          backend triggers will appear in the Inbox above in real time, and as a
          browser push notification on this device.
        </p>

        <div style={styles.grid}>
          <InfoCard emoji="🔌" title="WebSocket Real-time"    body="Instant notification delivery via secure WebSocket connection." />
          <InfoCard emoji="📥" title="Modern Inbox Component" body="Full notification history with read/unread status and rich actions." />
          <InfoCard emoji="🔔" title="Browser Push"           body="Firebase push notifications delivered to this browser even when the tab is closed." />
        </div>

        <div style={styles.callout}>
          <strong>✅ Setup Complete!</strong>
          <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
            <li>Subscriber ID: <code style={styles.code}>{SUBSCRIBER_ID}</code></li>
            <li>WebSocket connected to <strong>wss://socket.novu.co</strong></li>
            <li>Firebase push notifications registered for this browser</li>
            <li>Ready to receive real-time notifications from your backend!</li>
          </ul>
        </div>

        <TestNotificationsPanel setBanner={setBanner} />
      </section>
  );
}

// ── Test Panel ────────────────────────────────────────────────────────────────

function TestNotificationsPanel({ setBanner }) {
  const [formData, setFormData] = useState({
    subscriberId: SUBSCRIBER_ID,
    fcmToken:     "",
    title:        "",
    message:      ""
  });
  const [loading, setLoading] = useState({ register: false, send: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterFCM = async () => {
    if (!formData.subscriberId || !formData.fcmToken) {
      setBanner({ type: "error", message: "Subscriber ID and FCM Token are required." });
      return;
    }
    setLoading({ ...loading, register: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/fcm-token`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          subscriberId: formData.subscriberId,
          fcmToken:     formData.fcmToken
        })
      });
      if (res.ok) {
        setBanner({ type: "success", message: "FCM token registered successfully." });
      } else {
        setBanner({ type: "error", message: `Registration failed: ${await res.text()}` });
      }
    } catch (err) {
      setBanner({ type: "error", message: `Registration failed: ${err.message}` });
    } finally {
      setLoading({ ...loading, register: false });
    }
  };

  const handleSendNotification = async () => {
    if (!formData.subscriberId || !formData.title || !formData.message) {
      setBanner({ type: "error", message: "Subscriber ID, Title and Message are required." });
      return;
    }
    setLoading({ ...loading, send: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/test/push`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          businessID: formData.subscriberId,
          title:      formData.title,
          message:    formData.message
        })
      });
      if (res.ok) {
        setBanner({ type: "success", message: "Push notification triggered successfully!" });
      } else {
        setBanner({ type: "error", message: `Failed: ${await res.text()}` });
      }
    } catch (err) {
      setBanner({ type: "error", message: `Failed: ${err.message}` });
    } finally {
      setLoading({ ...loading, send: false });
    }
  };

  return (
      <div style={styles.testPanel}>
        <h3 style={styles.cardTitle}>🧪 Test Notifications</h3>
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Subscriber ID</label>
            <input name="subscriberId" value={formData.subscriberId} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>FCM Token (manual override)</label>
            <input name="fcmToken" value={formData.fcmToken} onChange={handleChange} style={styles.input} placeholder="Auto-registered on load — or paste a token to override" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Notification Title</label>
            <input name="title" value={formData.title} onChange={handleChange} style={styles.input} placeholder="e.g. Reconciliation Pipelines" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Notification Message</label>
            <textarea name="message" value={formData.message} onChange={handleChange} style={{ ...styles.input, height: "80px", resize: "vertical" }} placeholder="Enter notification message..." />
          </div>
          <div style={styles.buttonGroup}>
            <button onClick={handleRegisterFCM} disabled={loading.register} style={{ ...styles.button, backgroundColor: "#22c55e" }}>
              {loading.register ? <Spinner /> : "Register FCM Token"}
            </button>
            <button onClick={handleSendNotification} disabled={loading.send} style={{ ...styles.button, backgroundColor: "#5566ff" }}>
              {loading.send ? <Spinner /> : "Send Push Notification"}
            </button>
          </div>
        </div>
      </div>
  );
}

// ── Other Pages ───────────────────────────────────────────────────────────────

function OrdersPage() {
  const orders = [
    { id: "#1042", status: "Shipped",    date: "Feb 20" },
    { id: "#1041", status: "Delivered",  date: "Feb 17" },
    { id: "#1039", status: "Processing", date: "Feb 14" },
  ];
  return (
      <section>
        <h2 style={styles.pageTitle}>Your Orders</h2>
        <p style={styles.prose}>Backend triggers order workflows for these.</p>
        <table style={styles.table}>
          <thead>
          <tr>{["Order", "Status", "Date"].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
          {orders.map((o) => (
              <tr key={o.id} style={styles.tr}>
                <td style={styles.td}>{o.id}</td>
                <td style={styles.td}><span style={{ ...styles.badge, ...badgeColor(o.status) }}>{o.status}</span></td>
                <td style={styles.td}>{o.date}</td>
              </tr>
          ))}
          </tbody>
        </table>
      </section>
  );
}

function SettingsPage() {
  return (
      <section>
        <h2 style={styles.pageTitle}>Settings</h2>
        <p style={styles.prose}>Novu lets users manage their own notification preferences via the bell icon.</p>
        <div style={styles.callout}>Open the bell → click <strong>"Notification settings"</strong> to manage channels per workflow.</div>
      </section>
  );
}

function InfoCard({ emoji, title, body }) {
  return (
      <div style={styles.card}>
        <div style={styles.cardEmoji}>{emoji}</div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardBody}>{body}</p>
      </div>
  );
}

function Spinner() {
  return <div style={styles.spinner}></div>;
}

function badgeColor(status) {
  const map = {
    Shipped:    { background: "#dbeafe", color: "#1d4ed8" },
    Delivered:  { background: "#dcfce7", color: "#16a34a" },
    Processing: { background: "#fef9c3", color: "#ca8a04" },
  };
  return map[status] || {};
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root:        { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f4f4f5", minHeight: "100vh", color: "#18181b" },
  header:      { display: "flex", alignItems: "center", gap: "16px", padding: "0 32px", height: "60px", background: "#ffffff", borderBottom: "1px solid #e4e4e7", position: "sticky", top: 0, zIndex: 100 },
  logo:        { fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em", marginRight: "auto" },
  nav:         { display: "flex", gap: "4px" },
  navBtn:      { padding: "6px 14px", borderRadius: "6px", border: "none", background: "transparent", color: "#52525b", fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" },
  navBtnActive:{ background: "#f4f4f5", color: "#18181b" },
  main:        { maxWidth: "820px", margin: "0 auto", padding: "36px 24px" },
  pageTitle:   { fontSize: "1.5rem", fontWeight: 700, margin: "0 0 10px" },
  prose:       { color: "#52525b", lineHeight: 1.7, marginBottom: "24px" },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" },
  card:        { background: "#fff", borderRadius: "10px", padding: "20px", border: "1px solid #e4e4e7" },
  cardEmoji:   { fontSize: "1.6rem", marginBottom: "10px" },
  cardTitle:   { fontWeight: 600, margin: "0 0 6px", fontSize: "0.95rem" },
  cardBody:    { color: "#71717a", fontSize: "0.875rem", margin: 0, lineHeight: 1.6 },
  callout:     { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "16px", color: "#1e40af", fontSize: "0.9rem", lineHeight: 1.6 },
  code:        { fontFamily: "monospace", background: "#dbeafe", padding: "2px 6px", borderRadius: "4px" },
  table:       { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "10px", overflow: "hidden", border: "1px solid #e4e4e7" },
  th:          { textAlign: "left", padding: "12px 16px", background: "#fafafa", fontSize: "0.8rem", fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" },
  tr:          { borderTop: "1px solid #f4f4f5" },
  td:          { padding: "12px 16px", fontSize: "0.9rem" },
  badge:       { padding: "3px 10px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 500 },
  banner:      { position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: "8px", color: "#fff", fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  testPanel:   { background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginTop: "24px" },
  form:        { display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" },
  formGroup:   { display: "flex", flexDirection: "column", gap: "6px" },
  label:       { fontSize: "0.85rem", fontWeight: 600, color: "#52525b" },
  input:       { padding: "10px 14px", borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" },
  buttonGroup: { display: "flex", gap: "12px", marginTop: "8px" },
  button:      { flex: 1, padding: "12px", borderRadius: "8px", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  spinner:     { width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
