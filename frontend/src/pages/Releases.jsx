import { useEffect, useState } from "react";
import { addAuditLog } from "../utils/auditLogger";

const STORAGE_KEY = "progressiveDeliveryReleases";

const initialReleases = [
  {
    id: 1,
    application: "Payment Service",
    previousVersion: "v2.4.1",
    newVersion: "v2.5.0",
    traffic: 10,
    status: "Canary Running",
    approval: "Approved",
    description: "New payment processing improvements",
  },
  {
    id: 2,
    application: "Order Service",
    previousVersion: "v1.8.1",
    newVersion: "v1.8.2",
    traffic: 100,
    status: "Completed",
    approval: "Approved",
    description: "Bug fixes and order improvements",
  },
];

function Releases() {
  const [releases, setReleases] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    application: "Payment Service",
    previousVersion: "",
    newVersion: "",
    traffic: 10,
    description: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedReleases = localStorage.getItem(STORAGE_KEY);

    if (savedReleases) {
      setReleases(JSON.parse(savedReleases));
    } else {
      setReleases(initialReleases);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initialReleases)
      );
    }
  }, []);

  const saveReleases = (updatedReleases) => {
    setReleases(updatedReleases);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedReleases)
    );
  };

  // --------------------------------------------------
  // CREATE RELEASE
  // --------------------------------------------------

  const handleCreateRelease = (e) => {
    e.preventDefault();

    if (
      !formData.application ||
      !formData.previousVersion ||
      !formData.newVersion
    ) {
      setMessage("Please fill all required fields.");
      return;
    }

    const newRelease = {
      id: Date.now(),
      application: formData.application,
      previousVersion: formData.previousVersion,
      newVersion: formData.newVersion,
      traffic: Number(formData.traffic),
      status: "Pending Approval",
      approval: "Pending",
      description: formData.description,
    };

    const updatedReleases = [
      newRelease,
      ...releases,
    ];

    saveReleases(updatedReleases);

    addAuditLog(
      "Created Release",
      `${formData.application} ${formData.newVersion}`,
      "Success",
      "Admin"
    );

    setMessage(
      `Release ${formData.newVersion} created and sent for approval.`
    );

    setFormData({
      application: "Payment Service",
      previousVersion: "",
      newVersion: "",
      traffic: 10,
      description: "",
    });

    setShowForm(false);
  };

  // --------------------------------------------------
  // APPROVE RELEASE
  // --------------------------------------------------

  const approveRelease = (id) => {
    const release = releases.find((r) => r.id === id);

    if (!release) return;

    const updatedReleases = releases.map((r) =>
      r.id === id
        ? {
            ...r,
            approval: "Approved",
            status: "Canary Running",
          }
        : r
    );

    saveReleases(updatedReleases);

    addAuditLog(
      "Approved Release",
      `${release.application} ${release.newVersion}`,
      "Success",
      "Release Manager"
    );

    setMessage(
      `${release.application} ${release.newVersion} has been approved.`
    );
  };

  // --------------------------------------------------
  // REJECT RELEASE
  // --------------------------------------------------

  const rejectRelease = (id) => {
    const release = releases.find((r) => r.id === id);

    if (!release) return;

    const updatedReleases = releases.map((r) =>
      r.id === id
        ? {
            ...r,
            approval: "Rejected",
            status: "Rejected",
            traffic: 0,
          }
        : r
    );

    saveReleases(updatedReleases);

    addAuditLog(
      "Rejected Release",
      `${release.application} ${release.newVersion}`,
      "Warning",
      "Release Manager"
    );

    setMessage(
      `${release.application} ${release.newVersion} has been rejected.`
    );
  };

  // --------------------------------------------------
  // INCREASE CANARY TRAFFIC
  // --------------------------------------------------

  const increaseTraffic = (id) => {
    const release = releases.find((r) => r.id === id);

    if (!release) return;

    let nextTraffic;

    if (release.traffic === 10) {
      nextTraffic = 25;
    } else if (release.traffic === 25) {
      nextTraffic = 50;
    } else {
      nextTraffic = 100;
    }

    const updatedReleases = releases.map((r) =>
      r.id === id
        ? {
            ...r,
            traffic: nextTraffic,
            status:
              nextTraffic === 100
                ? "Completed"
                : "Canary Running",
          }
        : r
    );

    saveReleases(updatedReleases);

    addAuditLog(
      "Increased Canary Traffic",
      `${release.application} → ${nextTraffic}%`,
      "Success",
      "System"
    );

    if (nextTraffic === 100) {
      setMessage(
        `${release.application} promoted to 100% traffic. Release completed.`
      );
    } else {
      setMessage(
        `${release.application} canary traffic increased to ${nextTraffic}%.`
      );
    }
  };

  // --------------------------------------------------
  // ROLLBACK RELEASE
  // --------------------------------------------------

  const rollbackRelease = (id) => {
    const release = releases.find((r) => r.id === id);

    if (!release) return;

    const confirmed = window.confirm(
      `Are you sure you want to rollback ${release.application} ${release.newVersion}?`
    );

    if (!confirmed) return;

    const updatedReleases = releases.map((r) =>
      r.id === id
        ? {
            ...r,
            traffic: 0,
            status: "Rolled Back",
          }
        : r
    );

    saveReleases(updatedReleases);

    addAuditLog(
      "Rolled Back Release",
      `${release.application} ${release.newVersion}`,
      "Warning",
      "System"
    );

    setMessage(
      `${release.application} ${release.newVersion} has been rolled back.`
    );
  };

  // --------------------------------------------------
  // PROMOTE FROM ANALYTICS
  // --------------------------------------------------

  const promoteFromAnalytics = (id) => {
    const release = releases.find((r) => r.id === id);

    if (!release) return;

    if (release.approval !== "Approved") {
      setMessage(
        "Only approved releases can be promoted."
      );
      return;
    }

    const updatedReleases = releases.map((r) =>
      r.id === id
        ? {
            ...r,
            traffic: 100,
            status: "Completed",
          }
        : r
    );

    saveReleases(updatedReleases);

    addAuditLog(
      "Promoted Canary",
      `${release.application} ${release.newVersion}`,
      "Success",
      "System"
    );

    setMessage(
      `${release.application} promoted successfully to 100%.`
    );
  };

  // --------------------------------------------------
  // ROLLBACK FROM ANALYTICS
  // --------------------------------------------------

  const rollbackFromAnalytics = (id) => {
    const release = releases.find((r) => r.id === id);

    if (!release) return;

    const updatedReleases = releases.map((r) =>
      r.id === id
        ? {
            ...r,
            traffic: 0,
            status: "Rolled Back",
          }
        : r
    );

    saveReleases(updatedReleases);

    addAuditLog(
      "Analytics Rollback",
      `${release.application} ${release.newVersion}`,
      "Warning",
      "System"
    );

    setMessage(
      `${release.application} was rolled back by analytics control.`
    );
  };

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="page-container">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Releases</h1>
          <p>
            Manage release approvals, canary traffic and rollbacks.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + New Release
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="success-message">
          {message}
          <button
            onClick={() => setMessage("")}
            className="message-close"
          >
            ×
          </button>
        </div>
      )}

      {/* CREATE RELEASE FORM */}
      {showForm && (
        <div className="release-form-card">

          <div className="form-header">
            <div>
              <h2>Create New Release</h2>
              <p>
                Submit a new application version for approval.
              </p>
            </div>

            <button
              className="close-form-btn"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleCreateRelease}>

            <div className="form-grid">

              <div className="form-group">
                <label>Application</label>

                <select
                  name="application"
                  value={formData.application}
                  onChange={handleChange}
                >
                  <option>Payment Service</option>
                  <option>Order Service</option>
                  <option>User Service</option>
                  <option>Inventory Service</option>
                </select>
              </div>

              <div className="form-group">
                <label>Previous Version</label>

                <input
                  type="text"
                  name="previousVersion"
                  placeholder="e.g. v2.4.1"
                  value={formData.previousVersion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>New Version</label>

                <input
                  type="text"
                  name="newVersion"
                  placeholder="e.g. v2.5.0"
                  value={formData.newVersion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Initial Canary Traffic</label>

                <select
                  name="traffic"
                  value={formData.traffic}
                  onChange={handleChange}
                >
                  <option value="10">10%</option>
                  <option value="25">25%</option>
                  <option value="50">50%</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Description</label>

                <textarea
                  name="description"
                  placeholder="Describe the release..."
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn"
              >
                Create Release
              </button>

            </div>

          </form>
        </div>
      )}

      {/* RELEASE LIST */}
      <div className="release-section">

        <div className="section-title">
          <div>
            <h2>Release Pipeline</h2>
            <p>
              Current and recent application releases
            </p>
          </div>

          <span className="release-count">
            {releases.length} Releases
          </span>
        </div>

        <div className="release-list">

          {releases.length === 0 ? (
            <div className="empty-state">
              <h3>No releases found</h3>
              <p>Create your first release to begin.</p>
            </div>
          ) : (
            releases.map((release) => (

              <div
                className="release-card"
                key={release.id}
              >

                {/* RELEASE TOP */}
                <div className="release-card-top">

                  <div>

                    <div className="release-title-row">

                      <h3>
                        {release.application}
                      </h3>

                      <span
                        className={`status-badge ${
                          release.status
                            .toLowerCase()
                            .replaceAll(" ", "-")
                        }`}
                      >
                        {release.status}
                      </span>

                    </div>

                    <p className="release-description">
                      {release.description ||
                        "No description provided."}
                    </p>

                  </div>

                  <div className="approval-area">

                    <span className="approval-label">
                      Approval
                    </span>

                    <span
                      className={`approval-badge ${release.approval.toLowerCase()}`}
                    >
                      {release.approval}
                    </span>

                  </div>

                </div>

                {/* VERSION FLOW */}
                <div className="version-flow">

                  <div className="version-box">
                    <span>Current</span>
                    <strong>
                      {release.previousVersion}
                    </strong>
                  </div>

                  <div className="version-arrow">
                    →
                  </div>

                  <div className="version-box new-version">
                    <span>New Version</span>
                    <strong>
                      {release.newVersion}
                    </strong>
                  </div>

                </div>

                {/* TRAFFIC */}
                <div className="traffic-section">

                  <div className="traffic-header">

                    <span>
                      Canary Traffic
                    </span>

                    <strong>
                      {release.traffic}%
                    </strong>

                  </div>

                  <div className="traffic-bar">

                    <div
                      className="traffic-fill"
                      style={{
                        width: `${release.traffic}%`,
                      }}
                    />

                  </div>

                  <div className="traffic-stages">

                    <span
                      className={
                        release.traffic >= 10
                          ? "active-stage"
                          : ""
                      }
                    >
                      10%
                    </span>

                    <span
                      className={
                        release.traffic >= 25
                          ? "active-stage"
                          : ""
                      }
                    >
                      25%
                    </span>

                    <span
                      className={
                        release.traffic >= 50
                          ? "active-stage"
                          : ""
                      }
                    >
                      50%
                    </span>

                    <span
                      className={
                        release.traffic >= 100
                          ? "active-stage"
                          : ""
                      }
                    >
                      100%
                    </span>

                  </div>

                </div>

                {/* ACTIONS */}
                <div className="release-actions">

                  {/* APPROVAL ACTIONS */}
                  {release.approval === "Pending" && (
                    <>
                      <button
                        className="approve-btn"
                        onClick={() =>
                          approveRelease(release.id)
                        }
                      >
                        ✓ Approve
                      </button>

                      <button
                        className="reject-btn"
                        onClick={() =>
                          rejectRelease(release.id)
                        }
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {/* CANARY ACTION */}
                  {release.approval === "Approved" &&
                    release.status === "Canary Running" &&
                    release.traffic < 100 && (
                      <button
                        className="primary-btn"
                        onClick={() =>
                          increaseTraffic(release.id)
                        }
                      >
                        ↑ Increase Traffic
                      </button>
                    )}

                  {/* PROMOTE */}
                  {release.approval === "Approved" &&
                    release.status === "Canary Running" &&
                    release.traffic < 100 && (
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          promoteFromAnalytics(release.id)
                        }
                      >
                        Promote to 100%
                      </button>
                    )}

                  {/* ROLLBACK */}
                  {release.status === "Canary Running" && (
                    <button
                      className="rollback-btn"
                      onClick={() =>
                        rollbackRelease(release.id)
                      }
                    >
                      ↩ Rollback
                    </button>
                  )}

                  {/* ANALYTICS ROLLBACK */}
                  {release.status === "Canary Running" && (
                    <button
                      className="analytics-rollback-btn"
                      onClick={() =>
                        rollbackFromAnalytics(release.id)
                      }
                    >
                      Analytics Rollback
                    </button>
                  )}

                  {/* COMPLETED */}
                  {release.status === "Completed" && (
                    <span className="completed-text">
                      ✓ Release Completed
                    </span>
                  )}

                  {/* REJECTED */}
                  {release.status === "Rejected" && (
                    <span className="rejected-text">
                      ✕ Release Rejected
                    </span>
                  )}

                  {/* ROLLED BACK */}
                  {release.status === "Rolled Back" && (
                    <span className="rolled-back-text">
                      ↩ Release Rolled Back
                    </span>
                  )}

                </div>

              </div>

            ))
          )}

        </div>

      </div>

    </div>
  );
}

export default Releases;