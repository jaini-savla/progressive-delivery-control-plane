import { useState } from "react";

function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoRollback, setAutoRollback] = useState(true);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Settings</h1>
      <p>Configure progressive delivery control settings.</p>

      <div className="card" style={{ marginTop: "25px" }}>
        <h3>General Settings</h3>

        <div style={{ marginTop: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />

            {" "}Enable Notifications
          </label>
        </div>

        <div style={{ marginTop: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={autoRollback}
              onChange={() => setAutoRollback(!autoRollback)}
            />

            {" "}Enable Automatic Rollback
          </label>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Canary Policy</h3>

        <p>Initial Traffic: 10%</p>
        <p>Second Stage: 25%</p>
        <p>Third Stage: 50%</p>
        <p>Final Stage: 100%</p>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>System Information</h3>

        <p>Environment: Development</p>
        <p>Monitoring: Prometheus</p>
        <p>Visualization: Grafana</p>
        <p>Database: PostgreSQL</p>
      </div>
    </div>
  );
}

export default Settings;