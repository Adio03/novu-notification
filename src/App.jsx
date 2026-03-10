import React, { useState, useEffect } from "react";
import { Inbox } from "@novu/react";
import { registerPushToken, onForegroundMessage } from "./firebase";
import Select from 'react-select';

const APP_IDENTIFIER = "P2IfsvF9QVrf";
const BACKEND_URL    = "http://localhost:801";
const SUBSCRIBER_ID   = "BUS-SVAIC212UZ03E6TM1GYMU";

export default function App() {
  const [auth, setAuth]     = useState(null);
  const [tab, setTab]       = useState("home");
  const [banner, setBanner] = useState(null);


  useEffect(() => {
    if (banner) {
      const timer = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  useEffect(() => {
    if (!auth) return;

    // FCM token generated automatically after login
    // Sends POST /api/notifications/fcm-token with real device token
    registerPushToken(SUBSCRIBER_ID, auth.jwt).then(() => console.log("fcm token generated"));

    // Show banner when push arrives while tab is open (foreground)
    // Novu may send title/body in payload.notification OR payload.data
    onForegroundMessage((payload) => {
      console.log("🔔 Foreground push received:", payload);

      const title = payload.notification?.title
          || payload.data?.title
          || payload.data?.subject
          || "New Notification";

      const body  = payload.notification?.body
          || payload.data?.body
          || payload.data?.message
          || "";

      setBanner({
        type:    "success",
        message: `📬 ${title}${body ? ": " + body : ""}`
      });
    });
  }, [auth]);



  if (!auth) {
    return <LoginPage onLogin={setAuth} setBanner={setBanner} banner={banner} />;
  }

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
            {["home","settings"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                        style={{ ...styles.navBtn, ...(tab === t ? styles.navBtnActive : {}) }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
            ))}
          </nav>

          {/* User info + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "0.85rem", color: "#52525b" }}>{auth.email}</span>
            <button onClick={() => {
              localStorage.removeItem("fcmToken");
              setAuth(null);
            }} style={styles.logoutBtn}>
              Logout
            </button>
          </div>

          <Inbox
              applicationIdentifier={APP_IDENTIFIER}
              subscriberId={SUBSCRIBER_ID}
              socketUrl="wss://socket.novu.co"
              appearance={{ colorScheme: "light", variables: { colorPrimary: "#DD2450", colorBackground: "#ffffff" } }}
              styles={{ root: { width: "100%", maxWidth: "400px" } }}
          />
        </header>

        {/* ── Page Body ── */}
        <main style={styles.main}>
          {tab === "home"     && <HomePage setBanner={setBanner} auth={auth} />}
          {tab === "settings" && <SettingsPage />}
        </main>
      </div>
  );
}

function LoginPage({ onLogin, setBanner, banner }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();

        // Extract JWT and subscriberId from your login response
        // Update these field names to match your actual API response
        const jwt          = data.token || data.accessToken || data.jwt;
        const subscriberId = data.businessID || data.subscriberId || data.userId;

        if (!jwt) {
          setError("Login succeeded but no token returned. Check API response fields.");
          return;
        }

        // Store in localStorage for persistence across refreshes
        localStorage.setItem("jwt", jwt);
        localStorage.setItem("subscriberId", subscriberId);
        localStorage.setItem("email", email);

        // Set auth state — triggers FCM registration automatically via useEffect
        onLogin({ jwt, subscriberId, email });

        setBanner({ type: "success", message: `Welcome back, ${email}!` });
      } else {
        const text = await res.text();
        setError(`Login failed: ${text}`);
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div style={styles.loginRoot}>
        {banner && (
            <div style={{
              ...styles.banner,
              backgroundColor: banner.type === "success" ? "#22c55e" : "#ef4444"
            }}>
              {banner.message}
            </div>
        )}

        <div style={styles.loginCard}>
          <div style={styles.loginLogo}>⚡ NotifyApp</div>
          <h2 style={styles.loginTitle}>Sign in to your account</h2>
          <p style={styles.loginSubtitle}>Push notifications will be registered automatically after login</p>

          {error && (
              <div style={styles.errorBox}>{error}</div>
          )}

          <div style={styles.loginForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={styles.input}
                  placeholder="you@example.com"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={styles.input}
                  placeholder="••••••••"
              />
            </div>

            <button onClick={handleLogin} disabled={loading}
                    style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Spinner /> : "Sign In"}
            </button>
          </div>

          <div style={styles.loginNote}>
            🔔 After signing in, your browser will ask for notification permission.
            Click <strong>Allow</strong> to enable push notifications on this device.
          </div>
        </div>
      </div>
  );
}

function HomePage({ setBanner, auth }) {
  const [showModal, setShowModal] = useState(false);

  return (
      <section>
        <h2 style={styles.pageTitle}>Welcome back 👋</h2>
        <p style={styles.prose}>
          Logged in as <strong>{auth.email}</strong>. Push notifications are active on this device.
          Any workflow your backend triggers will appear in the Inbox above in real time.
        </p>
        <div style={styles.grid}>
          <InfoCard emoji="🔌" title="WebSocket Real-time"    body="Instant notification delivery via secure WebSocket connection." />
          <InfoCard emoji="📥" title="Modern Inbox Component" body="Full notification history with read/unread status and rich actions." />
          <InfoCard emoji="🔔" title="Browser Push"           body="Firebase push notifications delivered to this browser even when the tab is closed." />
        </div>
        <div style={styles.callout}>
          <strong>✅ Setup Complete!</strong>
          <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
            <li>Subscriber ID: <code style={styles.code}>{auth.subscriberId}</code></li>
            <li>FCM token auto-registered after login</li>
            <li>WebSocket connected to <strong>wss://socket.novu.co</strong></li>
            <li>Ready to receive real-time and push notifications!</li>
          </ul>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <button onClick={() => setShowModal(true)} style={{ ...styles.button, backgroundColor: "#10b981" }}>Connect Database</button>
        </div>
        <PipelinesPanel setBanner={setBanner} auth={auth} />
        {showModal && <DatabaseModal onClose={() => setShowModal(false)} auth={auth} setBanner={setBanner} />}
      </section>
  );
}



function PipelinesPanel({ setBanner, auth }) {
  const [pipelines, setPipelines]       = useState([]);
  const [responseMeta, setResponseMeta] = useState({ message: "", success: false });
  const [fcmStatus, setFcmStatus]       = useState("checking...");
  const [loading, setLoading]           = useState({ pipelines: false, push: false, inapp: false });

  // Poll localStorage for FCM token — set by firebase.js after login
  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem("fcmToken");
      if (token) {
        setFcmStatus(`Registered (${token.substring(0, 20)}...)`);
      } else {
        setFcmStatus("⏳ Waiting for browser permission...");
      }
    };
    check();
    const interval = setInterval(() => {
      const token = localStorage.getItem("fcmToken");
      if (token) {
        setFcmStatus(`Registered (${token.substring(0, 20)}...)`);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${auth.jwt}`
  };


  const handleFetchPipelines = async () => {
    setLoading((l) => ({ ...l, pipelines: true }));
    try {
      const res = await fetch(
          `${BACKEND_URL}/reconciliation/pipelines?businessID=BUS-SVAIC212UZ03E6TM1GYMU&settingID=RC-MT2C6348BMA6WNHK2ZE0MB2FTV`,
          { method: "GET", headers }
      );
      if (res.ok) {
        const data = await res.json();
        setPipelines(data.reconciliationPipelines || []);
        setResponseMeta({ message: data.message || "Retrieved successfully", success: !!data.success });
        setBanner({ type: "success", message: "Pipelines retrieved successfully!" });
      } else {
        const text = await res.text();
        setResponseMeta({ message: text || "Failed", success: false });
        setBanner({ type: "error", message: `Failed: ${text}` });
      }
    } catch (err) {
      setBanner({ type: "error", message: `Failed: ${err.message}` });
    } finally {
      setLoading((l) => ({ ...l, pipelines: false }));
    }
  };
  return (
      <div style={styles.testPanel}>
        <h3 style={styles.cardTitle}>📊 Reconciliation Pipelines</h3>

        {/* FCM Status */}
        <div style={styles.fcmStatus}>
          <span style={styles.label}>Push Notification Status</span>
          <span style={{ fontSize: "0.85rem", color: fcmStatus.startsWith("✅") ? "#16a34a" : "#ca8a04" }}>
          {fcmStatus}
        </span>
        </div>

        <div style={styles.form}>
          <div style={styles.buttonGroup}>
            <button onClick={handleFetchPipelines} disabled={loading.pipelines}
                    style={{ ...styles.button, backgroundColor: "#5566ff" }}>
              {loading.pipelines ? <Spinner /> : "📋 Fetch Pipelines"}
            </button>
          </div>
        </div>

        {/* Response metadata */}
        {responseMeta.message && (
            <div style={{ marginTop: 18, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>{responseMeta.message}</div>
              <div style={{
                padding: "4px 8px", borderRadius: 8, fontSize: "0.85rem",
                background: responseMeta.success ? "#dcfce7" : "#fee2e2",
                color: responseMeta.success ? "#166534" : "#991b1b"
              }}>
                {responseMeta.success ? "Success" : "Error"}
              </div>
              <div style={{ marginLeft: "auto", color: "#6b7280" }}>{pipelines.length} pipeline(s)</div>
            </div>
        )}

        {/* Pipeline cards */}
        {pipelines.length > 0 && (
            <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {pipelines.map((p) => (
                  <div key={p.id} style={{ ...styles.card, padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ padding: "4px 8px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, ...badgeColor(p.type) }}>
                        {({ TRANSACTION: "Transaction", SETTLEMENT: "Settlement" }[p.type] || p.type)}
                      </div>
                    </div>
                    <div style={{ marginTop: 8,  fontSize: "0.85rem", color: "#374151" }}>Ref: <span style={{ color: "#6b7280", fontWeight: 600 }}>{p.reference}</span></div>
                    <div style={{ marginTop: 6,  fontSize: "0.8rem",  color: "#6b7280" }}>ID: {p.id}</div>
                    <div style={{ marginTop: 6,  fontSize: "0.8rem",  color: "#6b7280" }}>Created: {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</div>
                    <div style={{ marginTop: 6,  fontSize: "0.8rem",  color: "#6b7280" }}>Created by: {p.createdBy || "—"}</div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

function SettingsPage() {
  return (
      <section>
        <h2 style={styles.pageTitle}>Settings</h2>
        <p style={styles.prose}>Novu lets users manage their own notification preferences via the bell icon.</p>
        <div style={styles.callout}>
          Open the bell → click <strong>"Notification settings"</strong> to manage channels per workflow.
        </div>
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
    Shipped:     { background: "#dbeafe", color: "#1d4ed8" },
    Delivered:   { background: "#dcfce7", color: "#16a34a" },
    Processing:  { background: "#fef9c3", color: "#ca8a04" },
    TRANSACTION: { background: "#eef2ff", color: "#3730a3" },
    SETTLEMENT:  { background: "#ecfeff", color: "#0f766e" },
  };
  return map[status] || { background: "#f3f4f6", color: "#374151" };
}

const styles = {
  root:         { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f4f4f5", minHeight: "100vh", color: "#18181b" },
  header:       { display: "flex", alignItems: "center", gap: "16px", padding: "0 32px", height: "60px", background: "#ffffff", borderBottom: "1px solid #e4e4e7", position: "sticky", top: 0, zIndex: 100 },
  logo:         { fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em", marginRight: "auto" },
  nav:          { display: "flex", gap: "4px" },
  navBtn:       { padding: "6px 14px", borderRadius: "6px", border: "none", background: "transparent", color: "#52525b", fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" },
  navBtnActive: { background: "#f4f4f5", color: "#18181b" },
  logoutBtn:    { padding: "6px 14px", borderRadius: "6px", border: "1px solid #e4e4e7", background: "#fff", color: "#ef4444", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" },
  main:         { maxWidth: "820px", margin: "0 auto", padding: "36px 24px" },
  pageTitle:    { fontSize: "1.5rem", fontWeight: 700, margin: "0 0 10px" },
  prose:        { color: "#52525b", lineHeight: 1.7, marginBottom: "24px" },
  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" },
  card:         { background: "#fff", borderRadius: "10px", padding: "20px", border: "1px solid #e4e4e7" },
  cardEmoji:    { fontSize: "1.6rem", marginBottom: "10px" },
  cardTitle:    { fontWeight: 600, margin: "0 0 6px", fontSize: "0.95rem" },
  cardBody:     { color: "#71717a", fontSize: "0.875rem", margin: 0, lineHeight: 1.6 },
  callout:      { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "16px", color: "#1e40af", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "24px" },
  code:         { fontFamily: "monospace", background: "#dbeafe", padding: "2px 6px", borderRadius: "4px" },
  table:        { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "10px", overflow: "hidden", border: "1px solid #e4e4e7" },
  th:           { textAlign: "left", padding: "12px 16px", background: "#fafafa", fontSize: "0.8rem", fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" },
  tr:           { borderTop: "1px solid #f4f4f5" },
  td:           { padding: "12px 16px", fontSize: "0.9rem" },
  badge:        { padding: "3px 10px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 500 },
  banner:       { position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: "8px", color: "#fff", fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  testPanel:    { background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginTop: "24px" },
  fcmStatus:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e4e4e7", marginTop: "12px" },
  form:         { display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" },
  formGroup:    { display: "flex", flexDirection: "column", gap: "6px" },
  label:        { fontSize: "0.85rem", fontWeight: 600, color: "#52525b" },
  input:        { padding: "10px 14px", borderRadius: "8px", border: "1px solid #e4e4e7", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" },
  buttonGroup:  { display: "flex", gap: "12px" },
  button:       { flex: 1, padding: "12px", borderRadius: "8px", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  spinner:      { width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Login styles
  loginRoot:     { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f4f4f5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  loginCard:     { background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid #e4e4e7" },
  loginLogo:     { fontWeight: 700, fontSize: "1.3rem", marginBottom: "24px", color: "#18181b" },
  loginTitle:    { fontSize: "1.4rem", fontWeight: 700, margin: "0 0 8px" },
  loginSubtitle: { fontSize: "0.875rem", color: "#71717a", marginBottom: "28px" },
  loginForm:     { display: "flex", flexDirection: "column", gap: "16px" },
  loginBtn:      { padding: "12px", borderRadius: "8px", border: "none", background: "#5566ff", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "8px" },
  loginNote:     { marginTop: "24px", padding: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.8rem", color: "#92400e", lineHeight: 1.6 },
  errorBox:      { padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", color: "#991b1b", fontSize: "0.875rem", marginBottom: "8px" },

  // Modal styles
  modalOverlay:  { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent:  { background: "#fff", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" },
  modalTitle:    { fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px", color: "#18181b" },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);


function DatabaseModal({ onClose, auth, setBanner }) {
  const [form, setForm] = useState({
    databaseType: "postgresql",
    host: "",
    port: 5432,
    databaseName: "",
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [error, setError] = useState("");

  const buildJdbcUrl = () => `jdbc:${form.databaseType}://${form.host}:${form.port}/${form.databaseName}`;

  const handleTestConnection = async () => {
    if (!form.host || !form.databaseName || !form.username) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      console.log("Testing connection with:", {
        databaseType: form.databaseType,
        host: form.host,
        port: form.port,
        databaseName: form.databaseName,
        username: form.username,
        businessID: auth.subscriberId
      });

      const res = await fetch(`${BACKEND_URL}/database/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.jwt}`
        },
        body: JSON.stringify({
          databaseType: form.databaseType,
          host: form.host,
          port: form.port,
          databaseName: form.databaseName,
          username: form.username,
          password: form.password,
          businessID: SUBSCRIBER_ID
        })
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (data.success) {
        setTables(data.data || []);
        setBanner({ type: "success", message: data.message || "Connection successful" });
      } else {
        setError(data.message || "Connection failed");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Unable to test connection");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedTables.length === 0) {
      setError("Please select at least one table.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/database/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.jwt}`
        },
        body: JSON.stringify({
          databaseType: form.databaseType,
          host: buildJdbcUrl(),
          port: form.port,
          databaseName: form.databaseName,
          username: form.username,
          password: form.password,
          businessID: SUBSCRIBER_ID,
          selectedTables
        })
      });

      if (!res.ok) throw new Error("Failed to save connection");
      const data = await res.json();

      if (data.success) {
        setBanner({ type: "success", message: "Connection saved successfully" });
        onClose();
      } else {
        setError(data.message || "Save failed");
      }
    } catch (err) {
      setError(err.message || "Unable to save connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Connect External Database</h2>
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Database Type</label>
            <select
              value={form.databaseType}
              onChange={(e) => setForm({ ...form, databaseType: e.target.value })}
              style={styles.input}
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Host</label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              style={styles.input}
              placeholder="e.g., localhost"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Port</label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Database Name</label>
            <input
              type="text"
              value={form.databaseName}
              onChange={(e) => setForm({ ...form, databaseName: e.target.value })}
              style={styles.input}
              placeholder="e.g., mydb"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={styles.input}
              placeholder="e.g., postgres"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>
          <button onClick={handleTestConnection} disabled={loading}
                  style={{ ...styles.button, backgroundColor: "#f59e0b" }}>
            {loading ? <Spinner /> : "Test Connection"}
          </button>
          {error && <div style={styles.errorBox}>{error}</div>}
          {tables.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Tables</label>
              <Select
                isMulti
                options={tables.map(t => ({ value: t, label: t }))}
                value={selectedTables.map(t => ({ value: t, label: t }))}
                onChange={(selected) => setSelectedTables(selected.map(s => s.value))}
                placeholder="Select tables..."
              />
            </div>
          )}
          <div style={styles.buttonGroup}>
            <button onClick={onClose} style={{ ...styles.button, backgroundColor: "#6b7280" }}>Cancel</button>
            <button onClick={handleSave} disabled={tables.length === 0 || selectedTables.length === 0 || loading}
                    style={{ ...styles.button, backgroundColor: "#10b981", opacity: (tables.length === 0 || selectedTables.length === 0) ? 0.5 : 1 }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
