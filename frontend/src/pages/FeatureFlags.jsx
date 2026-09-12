import { useState } from "react";

function FeatureFlags() {
  const [paymentFlag, setPaymentFlag] = useState(true);
  const [checkoutFlag, setCheckoutFlag] = useState(false);
  const [newUIFlag, setNewUIFlag] = useState(true);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Feature Flags</h1>
      <p>Control features without redeploying the application.</p>

      <div style={{ marginTop: "25px" }}>

        <div className="card">
          <h3>New Payment UI</h3>
          <p>Application: Payment Service</p>
          <p>Status: {paymentFlag ? "Enabled" : "Disabled"}</p>

          <button
            onClick={() => setPaymentFlag(!paymentFlag)}
            style={{
              padding: "10px 20px",
              marginTop: "10px",
              cursor: "pointer"
            }}
          >
            {paymentFlag ? "Turn OFF" : "Turn ON"}
          </button>
        </div>

        <div className="card">
          <h3>New Checkout Flow</h3>
          <p>Application: Order Service</p>
          <p>Status: {checkoutFlag ? "Enabled" : "Disabled"}</p>

          <button
            onClick={() => setCheckoutFlag(!checkoutFlag)}
            style={{
              padding: "10px 20px",
              marginTop: "10px",
              cursor: "pointer"
            }}
          >
            {checkoutFlag ? "Turn OFF" : "Turn ON"}
          </button>
        </div>

        <div className="card">
          <h3>Improved Dashboard</h3>
          <p>Application: Admin Portal</p>
          <p>Status: {newUIFlag ? "Enabled" : "Disabled"}</p>

          <button
            onClick={() => setNewUIFlag(!newUIFlag)}
            style={{
              padding: "10px 20px",
              marginTop: "10px",
              cursor: "pointer"
            }}
          >
            {newUIFlag ? "Turn OFF" : "Turn ON"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default FeatureFlags;