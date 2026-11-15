import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import navigationItems from "../navigationItems";

const roleLabels = {
  admin: "Administrator",
  teacher: "Teacher",
};

const AdminLayout = ({ title, sectionLabel = "ADMINISTRATION", navItems = navigationItems, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>ResultHub</h2>
            <span>RESULT MANAGEMENT</span>
          </div>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-avatar">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            <span>{roleLabels[user?.role] || user?.role || ""}</span>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="topbar-label">{sectionLabel}</span>
            <h2>{title}</h2>
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

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
