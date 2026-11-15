
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import api from "../services/api";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const StudentResults = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Build a self-contained HTML file from the loaded results and let
  // the browser save it — no server round trip, no extra libraries.
  const handleDownload = () => {
    const rows = results
      .map(
        (result) => `
      <tr>
        <td>${escapeHtml(result.exam?.title)}</td>
        <td>${escapeHtml(result.exam?.subject?.name)} (${escapeHtml(result.exam?.subject?.subjectCode)})</td>
        <td>${result.marksObtained} / ${result.exam?.totalMarks}</td>
        <td>${result.percentage}%</td>
        <td>${escapeHtml(result.grade)}</td>
        <td>${escapeHtml(result.status)}</td>
      </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Results - ${escapeHtml(user?.name)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
  h1 { margin-bottom: 4px; }
  p.meta { color: #64748b; margin-top: 0; }
  table { border-collapse: collapse; width: 100%; margin-top: 16px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 14px; }
  th { background: #f1f5f9; }
</style>
</head>
<body>
<h1>Student Result Management System</h1>
<p class="meta">${escapeHtml(user?.name)}${user?.rollNumber ? ` - Roll ${escapeHtml(user.rollNumber)}` : ""} - Generated ${new Date().toLocaleDateString()}</p>
<table>
  <thead>
    <tr><th>Examination</th><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Status</th></tr>
  </thead>
  <tbody>${rows}
  </tbody>
</table>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `results-${(user?.rollNumber || user?.name || "student").replace(/\s+/g, "-").toLowerCase()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchMyResults = async () => {
      try {
        const response = await api.get("/results/my-results");
        setResults(response.data.results);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch your results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyResults();
  }, []);

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>ResultHub</h2>
            <span>STUDENT PORTAL</span>
          </div>
        </div>

        <div className="sidebar-section-label">STUDENT MENU</div>

        <nav className="sidebar-nav">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">▦</span>
            My Dashboard
          </NavLink>

          <NavLink
            to="/student/results"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">◈</span>
            My Results
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            <span>Student</span>
          </div>
        </div>
      </aside>

      <div className="student-main">
        <header className="admin-topbar">
          <div>
            <span className="topbar-label">STUDENT PORTAL</span>
            <h2>My Examination Results</h2>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="logout-button"
              onClick={() => navigate("/change-password")}
            >
              Change Password
            </button>

            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="student-content">
          <section className="welcome-section">
            <div>
              <h1>My Results</h1>
              <p>View your examination performance and academic grades.</p>
            </div>
            <span className="admin-status">
              <span className="status-dot"></span>
              Student Account
            </span>
          </section>

          <section className="student-results-section">
            <div className="section-heading">
              <h2>Examination Records</h2>
              <p>Your published examination results</p>
            </div>

            {!loading && results.length > 0 && (
              <button
                type="button"
                onClick={handleDownload}
                style={{ marginBottom: "16px" }}
              >
                Download Results
              </button>
            )}

            {loading && <p>Loading your results...</p>}

            {error && <p className="error-message">{error}</p>}

            {!loading && !error && results.length === 0 && (
              <div className="student-empty-state">
                <div className="empty-icon">◈</div>
                <h3>No Results Available</h3>
                <p>
                  Your examination results will appear here once
                  they are published.
                </p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Examination</th>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((result) => (
                      <tr key={result._id}>
                        <td>{result.exam?.title}</td>
                        <td>{result.exam?.subject?.name}</td>
                        <td>
                          {result.marksObtained} / {result.exam?.totalMarks}
                        </td>
                        <td>{result.percentage}%</td>
                        <td><strong>{result.grade}</strong></td>
                        <td>
                          <span
                            className={
                              result.status === "Pass"
                                ? "result-status pass"
                                : "result-status fail"
                            }
                          >
                            {result.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentResults;
