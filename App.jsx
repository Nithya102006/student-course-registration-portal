import React from "react";
import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

async function request(path, options = {}, token = "") {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Please try again.");
  return data;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("portalToken") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("portalUser") || "null"); }
    catch { return null; }
  });
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [courses, setCourses] = useState([]);
  const [enrolments, setEnrolments] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState("courses");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function showError(text) { setError(text); setMessage(""); }
  function showMessage(text) { setMessage(text); setError(""); }

  async function loadCourses() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (category !== "All") query.set("category", category);
      setCourses(await request(`/courses?${query.toString()}`));
    } catch (e) { showError(e.message); }
    finally { setLoading(false); }
  }

  async function loadEnrolments(currentToken = token) {
    if (!currentToken) return;
    try { setEnrolments(await request("/enrolments/me", {}, currentToken)); }
    catch (e) { showError(e.message); }
  }

  useEffect(() => { loadCourses(); }, [search, category]);
  useEffect(() => { if (token) loadEnrolments(token); else setEnrolments([]); }, [token]);

  const categories = useMemo(() => ["All", ...new Set(courses.map(c => c.category))], [courses]);

  async function handleAuth(event) {
    event.preventDefault();
    setError(""); setMessage(""); setBusyId("auth");
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const data = await request(endpoint, { method: "POST", body: JSON.stringify(authForm) });
      localStorage.setItem("portalToken", data.token);
      localStorage.setItem("portalUser", JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      showMessage(mode === "register" ? "Account created successfully!" : "Welcome back!");
    } catch (e) { showError(e.message); }
    finally { setBusyId(""); }
  }

  function logout() {
    localStorage.removeItem("portalToken");
    localStorage.removeItem("portalUser");
    setToken(""); setUser(null); setPage("courses");
    showMessage("You have signed out.");
  }

  async function enrol(courseId) {
    if (!token) { setMode("login"); showError("Please sign in before enrolling in a course."); return; }
    setBusyId(courseId); setError(""); setMessage("");
    try {
      const data = await request("/enrolments", { method: "POST", body: JSON.stringify({ courseId }) }, token);
      showMessage(data.message);
      await loadCourses(); await loadEnrolments();
    } catch (e) { showError(e.message); }
    finally { setBusyId(""); }
  }

  async function cancelEnrolment(id) {
    setBusyId(id); setError(""); setMessage("");
    try {
      const data = await request(`/enrolments/${id}`, { method: "DELETE" }, token);
      showMessage(data.message);
      await loadCourses(); await loadEnrolments();
    } catch (e) { showError(e.message); }
    finally { setBusyId(""); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">SC</div>
        <div className="brand-text"><strong>Student Portal</strong><span>Course Registration</span></div>
        <nav>
          <button className={page === "courses" ? "nav active" : "nav"} onClick={() => setPage("courses")}>Courses</button>
          {token && <button className={page === "mine" ? "nav active" : "nav"} onClick={() => setPage("mine")}>My Courses ({enrolments.length})</button>}
        </nav>
        <div className="account">
          {user ? <><span className="welcome">Hi, {user.name}</span><button className="outline small" onClick={logout}>Sign out</button></> :
            <button className="outline small" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}> {mode === "login" ? "Create account" : "Sign in"} </button>}
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">LEARN • GROW • ACHIEVE</p>
            <h1>Find the course<br /><span>that moves you forward.</span></h1>
            <p>Explore courses, reserve your seat, and manage your enrolments in one place.</p>
            <div className="hero-stats"><div><strong>{courses.length}</strong><span>Courses shown</span></div><div><strong>{enrolments.length}</strong><span>Your enrolments</span></div></div>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="art-circle">✦</div><div className="art-card"><span>YOUR NEXT CHAPTER</span><strong>Starts here.</strong><div className="art-lines"><i></i><i></i><i></i></div></div><div className="art-dot dot-one"></div><div className="art-dot dot-two"></div></div>
        </section>

        {error && <div className="notice error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {message && <div className="notice success" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}

        {!token && (
          <section className="auth-panel">
            <div><p className="eyebrow">{mode === "login" ? "STUDENT ACCESS" : "JOIN THE PORTAL"}</p><h2>{mode === "login" ? "Sign in to enrol" : "Create your student account"}</h2><p className="muted">Your account lets you register for courses and manage your enrolments.</p></div>
            <form onSubmit={handleAuth} className="auth-form">
              {mode === "register" && <label>Full name<input value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} minLength="2" maxLength="60" required placeholder="Enter your name" /></label>}
              <label>Email address<input type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required placeholder="student@example.com" /></label>
              <label>Password<input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} minLength="8" required placeholder="At least 8 characters" /></label>
              <button className="primary full" disabled={busyId === "auth"}>{busyId === "auth" ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}</button>
              <p className="form-switch">{mode === "login" ? "New student?" : "Already registered?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
            </form>
          </section>
        )}

        {page === "courses" ? (
          <section className="content-section">
            <div className="section-heading"><div><p className="eyebrow">COURSE DIRECTORY</p><h2>Explore available courses</h2><p className="muted">Search by course name or description, or filter by category.</p></div></div>
            <div className="filters"><div className="search-wrap"><span>⌕</span><input aria-label="Search courses" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." /></div><select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
            {loading ? <div className="empty-state">Loading courses...</div> : courses.length === 0 ? <div className="empty-state"><strong>No courses found</strong><p>Try another keyword or category.</p></div> :
              <div className="course-grid">{courses.map((course, index) => {
                const alreadyEnrolled = enrolments.some(e => e.course?._id === course._id);
                return <article className="course-card" key={course._id}>
                  <div className={`course-art art-${index % 4}`}><span>{course.category}</span><strong>{course.title.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase()}</strong><i>✦</i></div>
                  <div className="course-body"><h3>{course.title}</h3><p>{course.description}</p><div className="course-meta"><span>◷ {course.seatsAvailable} seats left</span><span>{course.seatsAvailable > 0 ? "Open" : "Full"}</span></div>
                    <button className={alreadyEnrolled ? "outline full" : "primary full"} disabled={alreadyEnrolled || course.seatsAvailable < 1 || busyId === course._id} onClick={() => enrol(course._id)}>{busyId === course._id ? "Processing..." : alreadyEnrolled ? "Already enrolled" : course.seatsAvailable < 1 ? "Course full" : "Enrol now →"}</button>
                  </div>
                </article>;
              })}</div>}
          </section>
        ) : (
          <section className="content-section">
            <div className="section-heading"><div><p className="eyebrow">YOUR LEARNING PLAN</p><h2>My enrolled courses</h2><p className="muted">View your current enrolments or cancel a course if your plans change.</p></div></div>
            {!token ? <div className="empty-state">Please sign in to see your courses.</div> : enrolments.length === 0 ? <div className="empty-state"><strong>No enrolments yet</strong><p>Go to Courses and choose a course to get started.</p><button className="primary" onClick={() => setPage("courses")}>Browse courses</button></div> :
              <div className="mine-list">{enrolments.map(item => <article className="mine-card" key={item._id}><div className="mine-icon">✓</div><div className="mine-info"><h3>{item.course?.title || "Course unavailable"}</h3><p>{item.course?.description}</p><span className="pill">{item.course?.category}</span></div><button className="danger" disabled={busyId === item._id} onClick={() => cancelEnrolment(item._id)}>{busyId === item._id ? "Cancelling..." : "Cancel enrolment"}</button></article>)}</div>}
          </section>
        )}
      </main>
      <footer><div className="footer-brand">SC <strong>Student Portal</strong></div><span>Full Stack Development • Assessment Project</span></footer>
    </div>
  );
}
