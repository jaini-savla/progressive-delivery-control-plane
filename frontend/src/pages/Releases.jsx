function Releases() {
  return (
    <div style={{ padding: "30px" }}>
      <h1>Releases</h1>
      <p>Manage application releases and deployment progress.</p>

      <div style={{ marginTop: "25px" }}>
        <div className="card">
          <h3>Payment Service</h3>
          <p>Current Version: v2.4.1</p>
          <p>New Version: v2.5.0</p>
          <p>Release Status: Canary Running</p>
          <p>Canary Traffic: 10%</p>
        </div>

        <div className="card">
          <h3>Order Service</h3>
          <p>Current Version: v1.8.1</p>
          <p>New Version: v1.8.2</p>
          <p>Release Status: Completed</p>
          <p>Traffic: 100%</p>
        </div>
      </div>
    </div>
  );
}

export default Releases;