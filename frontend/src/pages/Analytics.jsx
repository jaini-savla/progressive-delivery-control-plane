import { useEffect, useState } from "react";
import { addAuditLog } from "../utils/auditLogger";

const STORAGE_KEY = "progressiveDeliveryReleases";

const ERROR_THRESHOLD = 1.0;
const LATENCY_THRESHOLD = 20;

const DEFAULT_BASELINE = {
  errorRate: 0.5,
  latency: 180,
  requests: 10000,
};

const DEFAULT_CANARY = {
  errorRate: 0.7,
  latency: 195,
  requests: 1000,
};

function Analytics() {
  const [releases, setReleases] = useState([]);

  const [baseline, setBaseline] = useState(DEFAULT_BASELINE);

  const [canary, setCanary] = useState(DEFAULT_CANARY);

  const [analysisStatus, setAnalysisStatus] =
    useState("Not Analyzed");

  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // LOAD RELEASES
  // --------------------------------------------------

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = () => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setReleases(JSON.parse(saved));
      } catch (error) {
        console.error(
          "Unable to read releases:",
          error
        );

        setReleases([]);
      }
    }
  };

  // --------------------------------------------------
  // ACTIVE CANARY
  // --------------------------------------------------

  const activeRelease = releases.find(
    (release) =>
      release.approval === "Approved" &&
      release.status === "Canary Running"
  );

  // --------------------------------------------------
  // METRIC CALCULATIONS
  // --------------------------------------------------

  const errorDifference =
    canary.errorRate - baseline.errorRate;

  const latencyDifference =
    ((canary.latency - baseline.latency) /
      baseline.latency) *
    100;

  const regressionDetected =
    errorDifference > ERROR_THRESHOLD ||
    latencyDifference > LATENCY_THRESHOLD;

  // --------------------------------------------------
  // SHOW MESSAGE
  // --------------------------------------------------

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // --------------------------------------------------
  // INJECT REGRESSION
  // --------------------------------------------------

  const injectRegression = () => {
    setCanary({
      errorRate: 2.8,
      latency: 260,
      requests: 1000,
    });

    setAnalysisStatus("Regression Detected");

    addAuditLog(
      "Injected Regression",
      activeRelease
        ? `${activeRelease.application} ${activeRelease.newVersion}`
        : "Canary Environment",
      "Warning",
      "System"
    );

    showMessage(
      "⚠ Regression injected. Canary metrics are now unhealthy."
    );
  };

  // --------------------------------------------------
  // RESET METRICS
  // --------------------------------------------------

  const resetMetrics = () => {
    setBaseline(DEFAULT_BASELINE);
    setCanary(DEFAULT_CANARY);

    setAnalysisStatus("Not Analyzed");

    addAuditLog(
      "Reset Metrics",
      activeRelease
        ? `${activeRelease.application} ${activeRelease.newVersion}`
        : "Canary Environment",
      "Success",
      "System"
    );

    showMessage(
      "✓ Metrics reset to healthy values."
    );
  };

  // --------------------------------------------------
  // ANALYZE METRICS
  // --------------------------------------------------

  const analyzeMetrics = () => {
    const currentErrorDifference =
      canary.errorRate - baseline.errorRate;

    const currentLatencyDifference =
      ((canary.latency - baseline.latency) /
        baseline.latency) *
      100;

    const hasRegression =
      currentErrorDifference >
        ERROR_THRESHOLD ||
      currentLatencyDifference >
        LATENCY_THRESHOLD;

    if (hasRegression) {
      setAnalysisStatus(
        "Regression Detected"
      );

      addAuditLog(
        "Analyzed Metrics",
        activeRelease
          ? `${activeRelease.application} ${activeRelease.newVersion}`
          : "Canary Environment",
        "Warning",
        "System"
      );

      showMessage(
        "⚠ Regression detected. Rollback is recommended."
      );
    } else {
      setAnalysisStatus("Healthy");

      addAuditLog(
        "Analyzed Metrics",
        activeRelease
          ? `${activeRelease.application} ${activeRelease.newVersion}`
          : "Canary Environment",
        "Success",
        "System"
      );

      showMessage(
        "✓ Canary metrics are healthy. Promotion is safe."
      );
    }
  };

  // --------------------------------------------------
  // PROMOTE CANARY
  // --------------------------------------------------

  const promoteCanary = () => {
    if (!activeRelease) {
      showMessage(
        "⚠ No active approved canary release found."
      );
      return;
    }

    if (regressionDetected) {
      addAuditLog(
        "Promotion Blocked",
        `${activeRelease.application} ${activeRelease.newVersion}`,
        "Warning",
        "System"
      );

      showMessage(
        "⚠ Promotion blocked because regression was detected."
      );

      return;
    }

    const updatedReleases =
      releases.map((release) =>
        release.id === activeRelease.id
          ? {
              ...release,
              traffic: 100,
              status: "Completed",
            }
          : release
      );

    setReleases(updatedReleases);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedReleases)
    );

    setAnalysisStatus("Promoted");

    addAuditLog(
      "Promoted Canary",
      `${activeRelease.application} ${activeRelease.newVersion}`,
      "Success",
      "System"
    );

    showMessage(
      `✓ ${activeRelease.application} promoted to 100% traffic.`
    );
  };

  // --------------------------------------------------
  // ROLLBACK CANARY
  // --------------------------------------------------

  const rollbackCanary = () => {
    if (!activeRelease) {
      showMessage(
        "⚠ No active canary release found. Go to Releases and approve a release first."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to rollback ${activeRelease.application} ${activeRelease.newVersion}?`
      );

    if (!confirmed) {
      return;
    }

    const updatedReleases =
      releases.map((release) =>
        release.id === activeRelease.id
          ? {
              ...release,
              traffic: 0,
              status: "Rolled Back",
            }
          : release
      );

    setReleases(updatedReleases);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedReleases)
    );

    setAnalysisStatus("Rolled Back");

    addAuditLog(
      "Rolled Back Canary",
      `${activeRelease.application} ${activeRelease.newVersion}`,
      "Warning",
      "System"
    );

    showMessage(
      `↩ ${activeRelease.application} ${activeRelease.newVersion} has been rolled back successfully.`
    );
  };

  return (
    <div className="analytics-page">

      {/* HEADER */}
      <div className="analytics-page-header">

        <div>
          <h1>Release Analytics</h1>

          <p>
            Monitor canary performance and detect
            release regressions.
          </p>
        </div>

        <div className="analytics-header-status">
          <span>Analysis Status</span>

          <strong
            className={
              analysisStatus ===
              "Regression Detected"
                ? "status-danger"
                : analysisStatus === "Healthy"
                ? "status-healthy"
                : analysisStatus === "Promoted"
                ? "status-promoted"
                : analysisStatus ===
                  "Rolled Back"
                ? "status-danger"
                : "status-neutral"
            }
          >
            {analysisStatus}
          </strong>
        </div>

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="analytics-message">
          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ACTIVE RELEASE */}
      <section className="analytics-panel">

        <div className="analytics-panel-header">

          <div>
            <h2>Active Canary Release</h2>

            <p>
              Release currently being monitored
            </p>
          </div>

          {activeRelease ? (
            <span className="canary-status">
              ● CANARY RUNNING
            </span>
          ) : (
            <span className="no-canary-status">
              NO ACTIVE CANARY
            </span>
          )}

        </div>

        {activeRelease ? (

          <div className="active-release-grid">

            <div className="release-info-box">
              <span>Application</span>

              <strong>
                {activeRelease.application}
              </strong>
            </div>

            <div className="release-info-box">
              <span>Current Version</span>

              <strong>
                {activeRelease.previousVersion}
              </strong>
            </div>

            <div className="release-info-box">
              <span>Canary Version</span>

              <strong>
                {activeRelease.newVersion}
              </strong>
            </div>

            <div className="release-info-box">
              <span>Canary Traffic</span>

              <strong>
                {activeRelease.traffic}%
              </strong>
            </div>

          </div>

        ) : (

          <div className="analytics-empty">
            <div className="empty-icon">
              !
            </div>

            <h3>
              No Active Canary Release
            </h3>

            <p>
              Go to the Releases page and approve
              a release to start canary analysis.
            </p>
          </div>

        )}

      </section>

      {/* METRICS */}
      <div className="analytics-metrics-grid">

        <div className="analytics-metric-card">
          <span>Baseline Error Rate</span>

          <strong>
            {baseline.errorRate}%
          </strong>

          <small>
            Production baseline
          </small>
        </div>

        <div
          className={`analytics-metric-card ${
            errorDifference >
            ERROR_THRESHOLD
              ? "metric-danger"
              : ""
          }`}
        >
          <span>Canary Error Rate</span>

          <strong>
            {canary.errorRate}%
          </strong>

          <small>
            Current canary
          </small>
        </div>

        <div className="analytics-metric-card">
          <span>Baseline Latency</span>

          <strong>
            {baseline.latency} ms
          </strong>

          <small>
            Average response time
          </small>
        </div>

        <div
          className={`analytics-metric-card ${
            latencyDifference >
            LATENCY_THRESHOLD
              ? "metric-danger"
              : ""
          }`}
        >
          <span>Canary Latency</span>

          <strong>
            {canary.latency} ms
          </strong>

          <small>
            Current canary
          </small>
        </div>

      </div>

      {/* COMPARISON */}
      <section className="analytics-panel">

        <div className="analytics-panel-header">

          <div>
            <h2>
              Baseline vs Canary
            </h2>

            <p>
              Performance comparison
            </p>
          </div>

        </div>

        <div className="analytics-table-container">

          <table className="analytics-table">

            <thead>
              <tr>
                <th>Metric</th>
                <th>Baseline</th>
                <th>Canary</th>
                <th>Difference</th>
                <th>Result</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td>
                  <strong>
                    Error Rate
                  </strong>
                </td>

                <td>
                  {baseline.errorRate}%
                </td>

                <td>
                  {canary.errorRate}%
                </td>

                <td>
                  {errorDifference.toFixed(2)}%
                </td>

                <td>
                  {errorDifference >
                  ERROR_THRESHOLD ? (
                    <span className="table-danger">
                      ● Regression
                    </span>
                  ) : (
                    <span className="table-healthy">
                      ● Healthy
                    </span>
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    Latency
                  </strong>
                </td>

                <td>
                  {baseline.latency} ms
                </td>

                <td>
                  {canary.latency} ms
                </td>

                <td>
                  {latencyDifference.toFixed(2)}%
                </td>

                <td>
                  {latencyDifference >
                  LATENCY_THRESHOLD ? (
                    <span className="table-danger">
                      ● Regression
                    </span>
                  ) : (
                    <span className="table-healthy">
                      ● Healthy
                    </span>
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    Requests
                  </strong>
                </td>

                <td>
                  {baseline.requests.toLocaleString()}
                </td>

                <td>
                  {canary.requests.toLocaleString()}
                </td>

                <td>
                  -
                </td>

                <td>
                  <span className="table-healthy">
                    ● Active
                  </span>
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </section>

      {/* CONTROLS */}
      <section className="analytics-panel">

        <div className="analytics-panel-header">

          <div>
            <h2>
              Analytics Controls
            </h2>

            <p>
              Test release health and simulate
              operational conditions.
            </p>
          </div>

        </div>

        <div className="analytics-button-row">

          <button
            className="analytics-btn warning-btn"
            onClick={injectRegression}
          >
            ⚠ Inject Regression
          </button>

          <button
            className="analytics-btn neutral-btn"
            onClick={resetMetrics}
          >
            ↻ Reset Metrics
          </button>

          <button
            className="analytics-btn analyze-btn"
            onClick={analyzeMetrics}
          >
            ✓ Analyze Metrics
          </button>

        </div>

      </section>

      {/* DECISION */}
      <section className="analytics-decision-panel">

        <div className="decision-header">

          <div>
            <h2>
              Automated Release Decision
            </h2>

            <p>
              Based on configured safety thresholds
            </p>
          </div>

          {regressionDetected ? (
            <span className="decision-pill danger-pill">
              REGRESSION DETECTED
            </span>
          ) : (
            <span className="decision-pill healthy-pill">
              HEALTHY
            </span>
          )}

        </div>

        {regressionDetected ? (

          <div className="decision-body danger-decision">

            <div>
              <h3>
                ⚠ Rollback Recommended
              </h3>

              <p>
                The canary is performing worse than
                the baseline.
              </p>

              <div className="threshold-list">

                <div>
                  Error difference:
                  <strong>
                    {" "}
                    {errorDifference.toFixed(2)}%
                  </strong>
                </div>

                <div>
                  Allowed error threshold:
                  <strong>
                    {" "}
                    {ERROR_THRESHOLD}%
                  </strong>
                </div>

                <div>
                  Latency difference:
                  <strong>
                    {" "}
                    {latencyDifference.toFixed(2)}%
                  </strong>
                </div>

                <div>
                  Allowed latency threshold:
                  <strong>
                    {" "}
                    {LATENCY_THRESHOLD}%
                  </strong>
                </div>

              </div>
            </div>

            <button
              className="analytics-btn rollback-large-btn"
              onClick={rollbackCanary}
              disabled={!activeRelease}
            >
              ↩ Rollback Canary
            </button>

          </div>

        ) : (

          <div className="decision-body healthy-decision">

            <div>
              <h3>
                ✓ Canary Looks Healthy
              </h3>

              <p>
                Current canary metrics are within
                the configured safety thresholds.
              </p>

              <div className="threshold-list">

                <div>
                  Error difference:
                  <strong>
                    {" "}
                    {errorDifference.toFixed(2)}%
                  </strong>
                </div>

                <div>
                  Allowed error threshold:
                  <strong>
                    {" "}
                    {ERROR_THRESHOLD}%
                  </strong>
                </div>

                <div>
                  Latency difference:
                  <strong>
                    {" "}
                    {latencyDifference.toFixed(2)}%
                  </strong>
                </div>

                <div>
                  Allowed latency threshold:
                  <strong>
                    {" "}
                    {LATENCY_THRESHOLD}%
                  </strong>
                </div>

              </div>
            </div>

            <button
              className="analytics-btn promote-large-btn"
              onClick={promoteCanary}
              disabled={!activeRelease}
            >
              ↑ Promote to 100%
            </button>

          </div>

        )}

      </section>

    </div>
  );
}

export default Analytics;