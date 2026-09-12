function Analytics() {
  return (
    <div style={{ padding: "30px" }}>
      <h1>Analytics</h1>
      <p>Monitor release health and compare baseline with canary performance.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          marginTop: "25px"
        }}
      >
        <div className="card">
          <h3>Baseline</h3>
          <p>Version: v2.4.1</p>
          <p>Error Rate: 1.2%</p>
          <p>Latency: 180 ms</p>
          <p>Success Rate: 98.8%</p>
        </div>

        <div className="card">
          <h3>Canary</h3>
          <p>Version: v2.5.0</p>
          <p>Error Rate: 0.9%</p>
          <p>Latency: 165 ms</p>
          <p>Success Rate: 99.1%</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Release Analysis</h3>
        <p>Canary performance is currently better than the baseline.</p>
        <p>Regression Status: No Regression Detected</p>
        <p>Recommendation: Continue Canary Rollout</p>
      </div>
    </div>
  );
}

export default Analytics;