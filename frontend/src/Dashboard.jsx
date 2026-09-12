import "./App.css";

function Dashboard() {
  return (
    <>

      {/* ================= HEADER ================= */}
      <header className="top-header">

        <div>
          <p className="welcome-text">Welcome back</p>
          <h1>Release Dashboard</h1>
        </div>

        <button className="new-release-btn">
          + New Release
        </button>

      </header>


      {/* ================= STATUS ================= */}
      <div className="status-banner">

        <div className="status-left">
          <span className="status-dot"></span>

          <div>
            <strong>All systems operational</strong>
            <p>
              Progressive delivery pipeline is running normally.
            </p>
          </div>
        </div>

        <span className="status-time">
          Updated just now
        </span>

      </div>


      {/* ================= STATISTICS ================= */}
      <section className="stats-grid">

        <div className="stat-card">
          <span className="stat-label">Applications</span>
          <h2>8</h2>
          <p className="stat-positive">↑ 2 this month</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Releases</span>
          <h2>5</h2>
          <p className="stat-positive">↑ 1 today</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Canary Traffic</span>
          <h2>10%</h2>
          <p>Current allocation</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Rollbacks</span>
          <h2>2</h2>
          <p className="stat-negative">↓ 1 this week</p>
        </div>

      </section>


      {/* ================= RELEASE DASHBOARD ================= */}
      <section className="dashboard-grid">


        {/* Release Health */}
        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Release Health</h2>
              <p>Current release performance</p>
            </div>

            <span className="healthy-badge">
              Healthy
            </span>

          </div>


          <div className="chart">

            <div className="chart-line line-1"></div>
            <div className="chart-line line-2"></div>
            <div className="chart-line line-3"></div>

            <div className="chart-bars">

              <div style={{ height: "45%" }}></div>
              <div style={{ height: "60%" }}></div>
              <div style={{ height: "50%" }}></div>
              <div style={{ height: "72%" }}></div>
              <div style={{ height: "65%" }}></div>
              <div style={{ height: "82%" }}></div>
              <div style={{ height: "76%" }}></div>
              <div style={{ height: "90%" }}></div>

            </div>

          </div>

        </div>


        {/* Current Release */}
        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Current Release</h2>
              <p>Payment Service</p>
            </div>

            <span className="canary-badge">
              Canary
            </span>

          </div>


          <div className="release-version">

            <span>v2.4.1</span>

            <span>→</span>

            <strong>v2.5.0</strong>

          </div>


          <div className="traffic-section">

            <div className="traffic-header">

              <span>Canary Traffic</span>

              <strong>10%</strong>

            </div>


            <div className="traffic-bar">

              <div
                className="traffic-progress"
                style={{ width: "10%" }}
              ></div>

            </div>

          </div>


          <button className="rollback-btn">
            Rollback Release
          </button>

        </div>

      </section>


      {/* ================= RECENT RELEASES ================= */}
      <section className="dashboard-card recent-releases">

        <div className="card-header">

          <div>
            <h2>Recent Releases</h2>
            <p>Latest progressive delivery activity</p>
          </div>

        </div>


        <div className="release-table">

          <div className="table-header">

            <span>Application</span>
            <span>Version</span>
            <span>Status</span>
            <span>Traffic</span>

          </div>


          <div className="table-row">

            <span>Payment Service</span>

            <span>v2.5.0</span>

            <span className="table-status canary-status">
              Canary
            </span>

            <span>10%</span>

          </div>


          <div className="table-row">

            <span>Order Service</span>

            <span>v1.8.2</span>

            <span className="table-status success-status">
              Completed
            </span>

            <span>100%</span>

          </div>


          <div className="table-row">

            <span>User Service</span>

            <span>v3.1.0</span>

            <span className="table-status success-status">
              Completed
            </span>

            <span>100%</span>

          </div>


          <div className="table-row">

            <span>Notification Service</span>

            <span>v1.4.3</span>

            <span className="table-status rollback-status">
              Rolled Back
            </span>

            <span>0%</span>

          </div>

        </div>

      </section>

    </>
  );
}

export default Dashboard;