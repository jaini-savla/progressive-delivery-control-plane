function AuditLogs() {
  return (
    <div style={{ padding: "30px" }}>
      <h1>Audit Logs</h1>
      <p>Track important release and system activities.</p>

      <div className="card" style={{ marginTop: "25px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px" }}>
                Time
              </th>

              <th style={{ textAlign: "left", padding: "12px" }}>
                User
              </th>

              <th style={{ textAlign: "left", padding: "12px" }}>
                Action
              </th>

              <th style={{ textAlign: "left", padding: "12px" }}>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={{ padding: "12px" }}>10:30 AM</td>
              <td style={{ padding: "12px" }}>Admin</td>
              <td style={{ padding: "12px" }}>
                Canary deployment started
              </td>
              <td style={{ padding: "12px" }}>Success</td>
            </tr>

            <tr>
              <td style={{ padding: "12px" }}>10:15 AM</td>
              <td style={{ padding: "12px" }}>Release Manager</td>
              <td style={{ padding: "12px" }}>
                Release v2.5.0 approved
              </td>
              <td style={{ padding: "12px" }}>Success</td>
            </tr>

            <tr>
              <td style={{ padding: "12px" }}>09:50 AM</td>
              <td style={{ padding: "12px" }}>Admin</td>
              <td style={{ padding: "12px" }}>
                Feature flag enabled
              </td>
              <td style={{ padding: "12px" }}>Success</td>
            </tr>

            <tr>
              <td style={{ padding: "12px" }}>09:30 AM</td>
              <td style={{ padding: "12px" }}>Release Manager</td>
              <td style={{ padding: "12px" }}>
                Release manifest created
              </td>
              <td style={{ padding: "12px" }}>Success</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;