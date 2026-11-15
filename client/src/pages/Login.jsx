
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role selector options — icon glyphs match the sidebar icon style
const ROLES = [
  { id: "admin", label: "Admin", icon: "⚙" },
  { id: "student", label: "Student", icon: "◉" },
  { id: "teacher", label: "Teacher", icon: "✎" }
];

const emailLabel = {
  admin: "Admin Email",
  student: "Student Email",
  teacher: "Teacher Email"
};

const emailPlaceholder = {
  admin: "Enter your admin email",
  student: "Enter your student email",
  teacher: "Enter your teacher email"
};

const Login = () => {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(email, password);

      // The selected role must match the account's real role
      if (user.role !== role) {
        logout();
        setError(
          `This account is not a ${ROLES.find((r) => r.id === role)?.label}. Select the correct role and try again.`
        );
        return;
      }

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Student Result Management System</h1>
        <p>Sign in to continue</p>

        {/* Three-role selector */}
        <div className="role-selector" role="tablist" aria-label="Select role">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={role === r.id}
              className={role === r.id ? "role-option active" : "role-option"}
              onClick={() => {
                setRole(r.id);
                setError("");
              }}
            >
              <span className="role-icon" aria-hidden="true">{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>

        {error && <p className="error-message">{error}</p>}

        <label htmlFor="email">{emailLabel[role]}</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder[role]}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
