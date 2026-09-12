function Applications() {
  return (
    <div style={{ padding: "30px" }}>
      <h1>Applications</h1>
      <p>Manage registered applications and services.</p>

      <div style={{ marginTop: "25px" }}>
        <div className="card">
          <h3>Payment Service</h3>
          <p>Version: v2.5.0</p>
          <p>Status: Active</p>
        </div>

        <div className="card">
          <h3>Order Service</h3>
          <p>Version: v1.8.2</p>
          <p>Status: Active</p>
        </div>
      </div>
    </div>
  );
}

export default Applications;