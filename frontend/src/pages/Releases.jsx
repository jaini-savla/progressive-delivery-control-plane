import { useEffect, useState } from "react";
import { addAuditLog } from "../utils/auditLogger";
import API_BASE_URL from "../utils/api";

const STORAGE_KEY = "progressiveDeliveryReleases";

function Releases() {
  const [releases, setReleases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    application: "Payment Service",
    previousVersion: "",
    newVersion: "",
    traffic: 10,
    description: "",
  });

  // =========================================================
  // LOAD RELEASES
  // =========================================================

  useEffect(() => {
    const loadReleases = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/releases`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch releases");
        }

        const data = await response.json();

        const formattedReleases = data.map((release) => ({
          id: release.id,
          application: release.serviceName,
          previousVersion: release.previousVersion || "",
          newVersion: release.version,
          traffic:
            release.status === "CANARY" ||
            release.status === "Canary Running"
              ? 10
              : release.status === "COMPLETED" ||
                release.status === "Completed"
              ? 100
              : 0,
          status: formatStatus(release.status),
          approval: release.approved ? "Approved" : "Pending",
          description: release.description || "",
        }));

        setReleases(formattedReleases);
      } catch (error) {
        console.error("Unable to load releases:", error);

        setMessage(
          "Unable to load releases from the backend."
        );
      }
    };

    loadReleases();
  }, []);

  // =========================================================
  // STATUS FORMATTER
  // =========================================================

  const formatStatus = (status) => {
    if (!status) return "Created";

    switch (status.toUpperCase()) {
      case "CREATED":
        return "Created";

      case "APPROVED":
        return "Approved";

      case "CANARY":
        return "Canary Running";

      case "COMPLETED":
        return "Completed";

      case "REJECTED":
        return "Rejected";

      case "ROLLED_BACK":
        return "Rolled Back";

      default:
        return status;
    }
  };

  // =========================================================
  // SAVE LOCAL RELEASES
  // =========================================================

  const saveReleases = (updatedReleases) => {
    setReleases(updatedReleases);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedReleases)
    );
  };

  // =========================================================
  // CREATE RELEASE
  // =========================================================

  const handleCreateRelease = async (e) => {
    e.preventDefault();

    if (
      !formData.application ||
      !formData.newVersion
    ) {
      setMessage(
        "Please enter an application and new version."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/releases`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceName: formData.application,
            version: formData.newVersion,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to create release"
        );
      }

      const createdRelease = await response.json();

      const formattedRelease = {
        id: createdRelease.id,
        application: createdRelease.serviceName,
        previousVersion: formData.previousVersion,
        newVersion: createdRelease.version,
        traffic: 0,
        status: formatStatus(createdRelease.status),
        approval: createdRelease.approved
          ? "Approved"
          : "Pending",
        description: formData.description,
      };

      setReleases((current) => [
        formattedRelease,
        ...current,
      ]);

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
    } catch (error) {
      console.error(
        "Unable to create release:",
        error
      );

      setMessage(
        "Unable to create release. Please try again."
      );
    }
  };

  // =========================================================
  // APPROVE RELEASE
  // =========================================================

  const approveRelease = async (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/releases/${id}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to approve release"
        );
      }

      const updatedRelease =
        await response.json();

      const updatedReleases = releases.map(
        (r) =>
          r.id === id
            ? {
                ...r,
                application:
                  updatedRelease.serviceName,
                newVersion:
                  updatedRelease.version,
                status: formatStatus(
                  updatedRelease.status
                ),
                approval:
                  updatedRelease.approved
                    ? "Approved"
                    : "Pending",
              }
            : r
      );

      setReleases(updatedReleases);

      addAuditLog(
        "Approved Release",
        `${release.application} ${release.newVersion}`,
        "Success",
        "Release Manager"
      );

      setMessage(
        `${release.application} ${release.newVersion} has been approved.`
      );
    } catch (error) {
      console.error(
        "Unable to approve release:",
        error
      );

      setMessage(
        "Unable to approve release. Please try again."
      );
    }
  };

  // =========================================================
  // START CANARY
  // =========================================================

  const startCanary = async (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/releases/${id}/canary`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText || "Failed to start canary"
        );
      }

      const updatedRelease =
        await response.json();

      const updatedReleases = releases.map(
        (r) =>
          r.id === id
            ? {
                ...r,
                status: formatStatus(
                  updatedRelease.status
                ),
                approval:
                  updatedRelease.approved
                    ? "Approved"
                    : "Pending",
                traffic: 10,
              }
            : r
      );

      setReleases(updatedReleases);

      addAuditLog(
        "Started Canary",
        `${release.application} ${release.newVersion}`,
        "Success",
        "System"
      );

      setMessage(
        `${release.application} ${release.newVersion} canary deployment started.`
      );
    } catch (error) {
      console.error(
        "Unable to start canary:",
        error
      );

      setMessage(
        "Unable to start canary. Please try again."
      );
    }
  };

  // =========================================================
  // UPDATE TRAFFIC
  // =========================================================

  const setTraffic = async (
    id,
    canaryTraffic
  ) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    const stableTraffic =
      100 - canaryTraffic;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/traffic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stableTraffic,
            canaryTraffic,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to update traffic"
        );
      }

      const trafficData =
        await response.json();

      const updatedReleases =
        releases.map((r) =>
          r.id === id
            ? {
                ...r,
                traffic:
                  trafficData.canaryTraffic,
                status:
                  trafficData.canaryTraffic ===
                  100
                    ? "Completed"
                    : "Canary Running",
              }
            : r
        );

      setReleases(updatedReleases);

      addAuditLog(
        "Updated Canary Traffic",
        `${release.application} → ${trafficData.canaryTraffic}%`,
        "Success",
        "System"
      );

      setMessage(
        `${release.application} traffic updated to ${trafficData.canaryTraffic}% canary.`
      );
    } catch (error) {
      console.error(
        "Unable to update traffic:",
        error
      );

      setMessage(
        "Unable to update traffic. Please try again."
      );
    }
  };

  // =========================================================
  // REJECT
  // =========================================================

  const rejectRelease = (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    const updatedReleases = releases.map(
      (r) =>
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

  // =========================================================
  // INCREASE TRAFFIC
  // =========================================================

  const increaseTraffic = async (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    let nextTraffic;

    if (release.traffic === 10) {
      nextTraffic = 25;
    } else if (release.traffic === 25) {
      nextTraffic = 50;
    } else {
      nextTraffic = 100;
    }

    await setTraffic(id, nextTraffic);
  };

  // =========================================================
  // ROLLBACK
  // =========================================================

  const rollbackRelease = async (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    const confirmed = window.confirm(
      `Are you sure you want to rollback ${release.application} ${release.newVersion}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rollback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetVersion:
              release.previousVersion ||
              "v1.0",
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to rollback release"
        );
      }

      const rollbackData =
        await response.json();

      const updatedReleases =
        releases.map((r) =>
          r.id === id
            ? {
                ...r,
                traffic: 0,
                status: "Rolled Back",
              }
            : r
        );

      setReleases(updatedReleases);

      addAuditLog(
        "Rolled Back Release",
        `${release.application} ${release.newVersion}`,
        "Warning",
        "System"
      );

      setMessage(
        `${release.application} ${release.newVersion} rolled back to ${rollbackData.currentVersion}.`
      );
    } catch (error) {
      console.error(
        "Unable to rollback release:",
        error
      );

      setMessage(
        "Unable to rollback release. Please try again."
      );
    }
  };

  // =========================================================
  // PROMOTE
  // =========================================================

  const promoteFromAnalytics = (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    if (release.approval !== "Approved") {
      setMessage(
        "Only approved releases can be promoted."
      );
      return;
    }

    const updatedReleases = releases.map(
      (r) =>
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

  // =========================================================
  // ANALYTICS ROLLBACK
  // =========================================================

  const rollbackFromAnalytics = (id) => {
    const release = releases.find(
      (r) => r.id === id
    );

    if (!release) return;

    const updatedReleases = releases.map(
      (r) =>
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

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll("_", "-");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="page-container releases-page">

      {/* HEADER */}
      <div className="page-header">

        <div>
          <h1>Releases</h1>

          <p>
            Manage release approvals, canary
            traffic and rollbacks.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            setShowForm(!showForm)
          }
        >
          {showForm
            ? "× Close"
            : "+ New Release"}
        </button>

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="release-message">

          <span>{message}</span>

          <button
            onClick={() =>
              setMessage("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* CREATE FORM */}
      {showForm && (
        <div className="release-form-card">

          <div className="form-header">

            <div>
              <h2>Create New Release</h2>

              <p>
                Submit a new application version
                for approval.
              </p>
            </div>

            <button
              className="close-form-btn"
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>

          </div>

          <form
            onSubmit={handleCreateRelease}
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Application
                </label>

                <select
                  name="application"
                  value={
                    formData.application
                  }
                  onChange={handleChange}
                >
                  <option>
                    Payment Service
                  </option>

                  <option>
                    Order Service
                  </option>

                  <option>
                    User Service
                  </option>

                  <option>
                    Inventory Service
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label>
                  Previous Version
                </label>

                <input
                  type="text"
                  name="previousVersion"
                  placeholder="e.g. v2.4.1"
                  value={
                    formData.previousVersion
                  }
                  onChange={handleChange}
                />

              </div>

              <div className="form-group">

                <label>
                  New Version *
                </label>

                <input
                  type="text"
                  name="newVersion"
                  placeholder="e.g. v2.5.0"
                  value={
                    formData.newVersion
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Initial Canary Traffic
                </label>

                <select
                  name="traffic"
                  value={formData.traffic}
                  onChange={handleChange}
                >
                  <option value="10">
                    10%
                  </option>

                  <option value="25">
                    25%
                  </option>

                  <option value="50">
                    50%
                  </option>
                </select>

              </div>

              <div className="form-group full-width">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  placeholder="Describe the release..."
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  rows="4"
                />

              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setShowForm(false)
                }
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

      {/* RELEASE PIPELINE */}
      <div className="release-section">

        <div className="section-title">

          <div>
            <h2>Release Pipeline</h2>

            <p>
              Current and recent application
              releases
            </p>
          </div>

          <span className="release-count">
            {releases.length}{" "}
            {releases.length === 1
              ? "Release"
              : "Releases"}
          </span>

        </div>

        <div className="release-list">

          {releases.length === 0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                ◫
              </div>

              <h3>
                No releases found
              </h3>

              <p>
                Create your first release
                to begin.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  setShowForm(true)
                }
              >
                + Create Release
              </button>

            </div>

          ) : (

            releases.map((release) => (

              <div
                className="release-card"
                key={release.id}
              >

                {/* TOP */}
                <div className="release-card-top">

                  <div className="release-main-info">

                    <div className="release-title-row">

                      <h3>
                        {release.application}
                      </h3>

                      <span
                        className={`release-status-badge ${getStatusClass(
                          release.status
                        )}`}
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

                {/* VERSION */}
                <div className="version-flow">

                  <div className="version-box">

                    <span>
                      Current
                    </span>

                    <strong>
                      {release.previousVersion ||
                        "—"}
                    </strong>

                  </div>

                  <div className="version-arrow">
                    →
                  </div>

                  <div className="version-box new-version">

                    <span>
                      New Version
                    </span>

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

                    {[10, 25, 50, 100].map(
                      (stage) => (

                        <button
                          key={stage}
                          type="button"
                          className={
                            release.traffic >=
                            stage
                              ? "active-stage"
                              : ""
                          }
                          onClick={() =>
                            setTraffic(
                              release.id,
                              stage
                            )
                          }
                        >
                          {stage}%
                        </button>

                      )
                    )}

                  </div>

                </div>

                {/* ACTIONS */}
                <div className="release-actions">

                  {release.approval ===
                    "Pending" && (
                    <>
                      <button
                        className="approve-button"
                        onClick={() =>
                          approveRelease(
                            release.id
                          )
                        }
                      >
                        ✓ Approve
                      </button>

                      <button
                        className="reject-button"
                        onClick={() =>
                          rejectRelease(
                            release.id
                          )
                        }
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {release.approval ===
                    "Approved" &&
                    release.status ===
                      "Approved" && (
                      <button
                        className="primary-btn"
                        onClick={() =>
                          startCanary(
                            release.id
                          )
                        }
                      >
                        ▶ Start Canary
                      </button>
                    )}

                  {release.approval ===
                    "Approved" &&
                    release.status ===
                      "Canary Running" &&
                    release.traffic < 100 && (
                      <>
                        <button
                          className="primary-btn"
                          onClick={() =>
                            increaseTraffic(
                              release.id
                            )
                          }
                        >
                          ↑ Increase Traffic
                        </button>

                        <button
                          className="secondary-btn"
                          onClick={() =>
                            promoteFromAnalytics(
                              release.id
                            )
                          }
                        >
                          Promote to 100%
                        </button>
                      </>
                    )}

                  {release.status ===
                    "Canary Running" && (
                    <>
                      <button
                        className="rollback-button"
                        onClick={() =>
                          rollbackRelease(
                            release.id
                          )
                        }
                      >
                        ↩ Rollback
                      </button>

                      <button
                        className="analytics-rollback-btn"
                        onClick={() =>
                          rollbackFromAnalytics(
                            release.id
                          )
                        }
                      >
                        Analytics Rollback
                      </button>
                    </>
                  )}

                  {release.status ===
                    "Completed" && (
                    <span className="completed-text">
                      ✓ Release Completed
                    </span>
                  )}

                  {release.status ===
                    "Rejected" && (
                    <span className="rejected-text">
                      ✕ Release Rejected
                    </span>
                  )}

                  {release.status ===
                    "Rolled Back" && (
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