import { NavLink, Outlet } from "react-router-dom";
import "./App.css";

function Layout() {
  return (
    <div className="app-container">

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-box">PD</div>
          <div>
            <h2>Progressive</h2>
            <span>Delivery</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>▣</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>▤</span>
            Applications
          </NavLink>

          <NavLink
            to="/releases"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>↗</span>
            Releases
          </NavLink>

          <NavLink
            to="/feature-flags"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>⚑</span>
            Feature Flags
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>◔</span>
            Analytics
          </NavLink>

          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>☷</span>
            Audit Logs
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>⚙</span>
            Settings
          </NavLink>

        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">AU</div>

          <div className="user-info">
            <strong>Admin User</strong>
            <span>Release Manager</span>
          </div>
        </div>

      </aside>

      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}

export default Layout;