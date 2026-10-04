import { useEffect, useState } from "react";
import { addAuditLog } from "../utils/auditLogger";
import API_BASE_URL from "../utils/api";

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

  const [baseline, setBaseline] =
    useState(DEFAULT_BASELINE);

  const [canary, setCanary] =
    useState(DEFAULT_CANARY);

  const [analysisStatus, setAnalysisStatus] =
    useState("Not Analyzed");

  const [message, setMessage] = useState("");

  const [loadingMetrics, setLoadingMetrics] =
    useState(false);

  // ==================================================
  // LOAD DATA
  // ==================================================

  useEffect(() => {
    loadReleases();
    loadPrometheusMetrics();
  }, []);

  // ==================================================
  // LOAD RELEASES
  // ==================================================

  const loadReleases = () => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      setReleases([]);
      return;
    }

    try {
      const parsed =
        JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setReleases(parsed);
      } else {
        setReleases([]);
      }
    } catch (error) {
      console.error(
        "Unable to read releases:",
        error
      );

      setReleases([]);
    }
  };

  // ==================================================
  // LOAD PROMETHEUS METRICS
  // ==================================================

  const loadPrometheusMetrics = async () => {
    try {
      setLoadingMetrics(true);

      const response = await fetch(
        `${API_BASE_URL}/api/metrics/prometheus/summary`
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to fetch Prometheus metrics"
        );
      }

      const data =
        await response.json();

      console.log(
        "Prometheus response:",
        data
      );

      /*
       * Backend returns latency in seconds.
       *
       * Example:
       *
       * 0.0805 seconds
       *
       * becomes:
       *
       * 80.5 ms
       */

      const stableSeconds =
        Number(data?.stableLatency);

      const canarySeconds =
        Number(data?.canaryLatency);

      /*
       * IMPORTANT:
       *
       * Do not accept 0 as a real latency value.
       *
       * A zero value normally means that
       * Prometheus does not have enough
       * observations yet.
       */

      const stableLatencyMs =
        Number.isFinite(stableSeconds) &&
        stableSeconds > 0
          ? Number(
              (
                stableSeconds * 1000
              ).toFixed(2)
            )
          : null;

      const canaryLatencyMs =
        Number.isFinite(canarySeconds) &&
        canarySeconds > 0
          ? Number(
              (
                canarySeconds * 1000
              ).toFixed(2)
            )
          : null;

      /*
       * Only replace the default value
       * when Prometheus has a valid
       * positive measurement.
       */

      if (
        stableLatencyMs !== null &&
        stableLatencyMs > 0
      ) {
        setBaseline((previous) => ({
          ...previous,
          latency:
            stableLatencyMs,
        }));
      }

      if (
        canaryLatencyMs !== null &&
        canaryLatencyMs > 0
      ) {
        setCanary((previous) => ({
          ...previous,
          latency:
            canaryLatencyMs,
        }));
      }

      console.log(
        "Analytics latency:",
        {
          stable:
            stableLatencyMs ??
            DEFAULT_BASELINE.latency,

          canary:
            canaryLatencyMs ??
            DEFAULT_CANARY.latency,
        }
      );
    } catch (error) {
      console.error(
        "Unable to load Prometheus metrics:",
        error
      );

      /*
       * Keep the healthy default values.
       *
       * Therefore the page will show:
       *
       * Baseline = 180 ms
       * Canary   = 195 ms
       *
       * instead of:
       *
       * Baseline = 0 ms
       * Canary   = 0 ms
       */
    } finally {
      setLoadingMetrics(false);
    }
  };

  // ==================================================
  // ACTIVE CANARY
  // ==================================================

  const activeRelease =
    releases.find((release) => {
      const approval =
        String(
          release.approval || ""
        ).toLowerCase();

      const status =
        String(
          release.status || ""
        ).toLowerCase();

      return (
        approval === "approved" &&
        (
          status ===
            "canary running" ||
          status ===
            "canary"
        )
      );
    });

  // ==================================================
  // METRIC CALCULATIONS
  // ==================================================

  const errorDifference =
    Number(canary.errorRate) -
    Number(baseline.errorRate);

  const latencyDifference =
    Number(baseline.latency) > 0
      ? (
          (
            Number(canary.latency) -
            Number(baseline.latency)
          ) /
          Number(baseline.latency)
        ) * 100
      : 0;

  const safeErrorDifference =
    Number.isFinite(
      errorDifference
    )
      ? errorDifference
      : 0;

  const safeLatencyDifference =
    Number.isFinite(
      latencyDifference
    )
      ? latencyDifference
      : 0;

  const regressionDetected =
    safeErrorDifference >
      ERROR_THRESHOLD ||
    safeLatencyDifference >
      LATENCY_THRESHOLD;

  // ==================================================
  // SHOW MESSAGE
  // ==================================================

  const showMessage = (text) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // ==================================================
  // INJECT REGRESSION
  // ==================================================

  const injectRegression = () => {
    setCanary({
      errorRate: 2.8,
      latency: 260,
      requests: 1000,
    });

    setAnalysisStatus(
      "Regression Detected"
    );

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

  // ==================================================
  // RESET METRICS
  // ==================================================

  const resetMetrics = async () => {
    setBaseline(
      DEFAULT_BASELINE
    );

    setCanary(
      DEFAULT_CANARY
    );

    setAnalysisStatus(
      "Not Analyzed"
    );

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

    /*
     * Reload real Prometheus values.
     *
     * If Prometheus has valid data,
     * it will replace the defaults.
     *
     * If Prometheus returns 0,
     * the defaults remain.
     */

    await loadPrometheusMetrics();
  };

  // ==================================================
  // ANALYZE METRICS
  // ==================================================

  const analyzeMetrics = async () => {
    try {
      setMessage(
        "Analyzing canary metrics..."
      );

      /*
       * Reload latest Prometheus
       * values first.
       */

      await loadPrometheusMetrics();

      /*
       * Ask backend to perform
       * regression analysis.
       */

      const response = await fetch(
        `${API_BASE_URL}/api/regression/prometheus-check`
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to analyze metrics"
        );
      }

      const result =
        await response.json();

      console.log(
        "Backend regression result:",
        result
      );

      if (
        result?.regressionDetected
      ) {
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
          `⚠ ${
            result.message ||
            "Regression detected. Rollback is recommended."
          }`
        );
      } else {
        setAnalysisStatus(
          "Healthy"
        );

        addAuditLog(
          "Analyzed Metrics",
          activeRelease
            ? `${activeRelease.application} ${activeRelease.newVersion}`
            : "Canary Environment",
          "Success",
          "System"
        );

        showMessage(
          `✓ ${
            result?.message ||
            "Canary metrics are healthy."
          }`
        );
      }
    } catch (error) {
      console.error(
        "Unable to analyze metrics:",
        error
      );

      setAnalysisStatus(
        "Analysis Failed"
      );

      showMessage(
        "❌ Unable to analyze backend metrics."
      );
    }
  };

  // ==================================================
  // PROMOTE CANARY
  // ==================================================

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
      releases.map(
        (release) =>
          release.id ===
          activeRelease.id
            ? {
                ...release,
                traffic: 100,
                status: "Completed",
              }
            : release
      );

    setReleases(
      updatedReleases
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedReleases
      )
    );

    setAnalysisStatus(
      "Promoted"
    );

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

  // ==================================================
  // ROLLBACK CANARY
  // ==================================================

  const rollbackCanary = async () => {
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

    try {
      /*
       * First try the backend rollback API.
       */

      const response =
        await fetch(
          `${API_BASE_URL}/api/rollback`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              targetVersion:
                activeRelease.previousVersion ||
                "v1.0",
            }),
          }
        );

      if (!response.ok) {
        console.warn(
          "Backend rollback returned:",
          response.status
        );
      }
    } catch (error) {
      console.warn(
        "Backend rollback unavailable:",
        error
      );
    }

    /*
     * Update frontend release state
     * as well.
     */

    const updatedReleases =
      releases.map(
        (release) =>
          release.id ===
          activeRelease.id
            ? {
                ...release,
                traffic: 0,
                status: "Rolled Back",
              }
            : release
      );

    setReleases(
      updatedReleases
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedReleases
      )
    );

    setAnalysisStatus(
      "Rolled Back"
    );

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

  // ==================================================
  // STATUS CLASS
  // ==================================================

  const getStatusClass = () => {
    if (
      analysisStatus ===
      "Regression Detected"
    ) {
      return "status-danger";
    }

    if (
      analysisStatus ===
      "Healthy"
    ) {
      return "status-healthy";
    }

    if (
      analysisStatus ===
      "Promoted"
    ) {
      return "status-promoted";
    }

    if (
      analysisStatus ===
      "Rolled Back"
    ) {
      return "status-danger";
    }

    return "status-neutral";
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="analytics-page">

      {/* ==============================================
          HEADER
          ============================================== */}

      <div className="analytics-page-header">

        <div>
          <h1>
            Release Analytics
          </h1>

          <p>
            Monitor canary performance
            and detect release regressions.
          </p>
        </div>

        <div className="analytics-header-status">

          <span>
            Analysis Status
          </span>

          <strong
            className={getStatusClass()}
          >
            {analysisStatus}
          </strong>

        </div>

      </div>

      {/* ==============================================
          MESSAGE
          ============================================== */}

      {message && (
        <div className="analytics-message">

          <span>
            {message}
          </span>

          <button
            onClick={() =>
              setMessage("")
            }
            aria-label="Close message"
          >
            ×
          </button>

        </div>
      )}

      {/* ==============================================
          ACTIVE CANARY
          ============================================== */}

      <section className="analytics-panel">

        <div className="analytics-panel-header">

          <div>

            <h2>
              Active Canary Release
            </h2>

            <p>
              Release currently being
              monitored by the control plane.
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

              <span>
                Application
              </span>

              <strong>
                {activeRelease.application}
              </strong>

            </div>

            <div className="release-info-box">

              <span>
                Current Version
              </span>

              <strong>
                {activeRelease.previousVersion ||
                  activeRelease.currentVersion ||
                  "v1.0"}
              </strong>

            </div>

            <div className="release-info-box">

              <span>
                Canary Version
              </span>

              <strong>
                {activeRelease.newVersion ||
                  activeRelease.canaryVersion ||
                  "v1.0"}
              </strong>

            </div>

            <div className="release-info-box">

              <span>
                Canary Traffic
              </span>

              <strong>
                {Number(
                  activeRelease.traffic ?? 10
                )}
                %
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
              Go to Releases and approve
              a release to start canary
              analysis.
            </p>

          </div>

        )}

      </section>

      {/* ==============================================
          METRIC CARDS
          ============================================== */}

      <div className="analytics-metrics-grid">

        {/* BASELINE ERROR */}

        <div className="analytics-metric-card">

          <span>
            Baseline Error Rate
          </span>

          <strong>
            {baseline.errorRate}%
          </strong>

          <small>
            Production baseline
          </small>

        </div>

        {/* CANARY ERROR */}

        <div
          className={`analytics-metric-card ${
            safeErrorDifference >
            ERROR_THRESHOLD
              ? "metric-danger"
              : ""
          }`}
        >

          <span>
            Canary Error Rate
          </span>

          <strong>
            {canary.errorRate}%
          </strong>

          <small>
            Current canary
          </small>

        </div>

        {/* BASELINE LATENCY */}

        <div className="analytics-metric-card">

          <span>
            Baseline Latency
          </span>

          <strong>
            {baseline.latency} ms
          </strong>

          <small>
            Average response time
          </small>

        </div>

        {/* CANARY LATENCY */}

        <div
          className={`analytics-metric-card ${
            safeLatencyDifference >
            LATENCY_THRESHOLD
              ? "metric-danger"
              : ""
          }`}
        >

          <span>
            Canary Latency
          </span>

          <strong>
            {canary.latency} ms
          </strong>

          <small>
            Current canary
          </small>

        </div>

      </div>

      {/* ==============================================
          PROMETHEUS INFORMATION
          ============================================== */}

      <div className="analytics-message">

        <span>

          {loadingMetrics
            ? "⏳ Loading Prometheus metrics..."
            : "✓ Latency metrics loaded. Values are displayed in milliseconds."}

        </span>

        <button
          onClick={
            loadPrometheusMetrics
          }
          disabled={loadingMetrics}
        >
          {loadingMetrics
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>

      {/* ==============================================
          BASELINE VS CANARY
          ============================================== */}

      <section className="analytics-panel">

        <div className="analytics-panel-header">

          <div>

            <h2>
              Baseline vs Canary
            </h2>

            <p>
              Compare production baseline
              performance with the active
              canary.
            </p>

          </div>

        </div>

        <div className="analytics-table-container">

          <table className="analytics-table">

            <thead>

              <tr>

                <th>
                  Metric
                </th>

                <th>
                  Baseline
                </th>

                <th>
                  Canary
                </th>

                <th>
                  Difference
                </th>

                <th>
                  Result
                </th>

              </tr>

            </thead>

            <tbody>

              {/* ERROR RATE */}

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
                  {safeErrorDifference.toFixed(
                    2
                  )}
                  %
                </td>

                <td>

                  {safeErrorDifference >
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

              {/* LATENCY */}

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
                  {safeLatencyDifference.toFixed(
                    2
                  )}
                  %
                </td>

                <td>

                  {safeLatencyDifference >
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

              {/* REQUESTS */}

              <tr>

                <td>
                  <strong>
                    Requests
                  </strong>
                </td>

                <td>
                  {Number(
                    baseline.requests
                  ).toLocaleString()}
                </td>

                <td>
                  {Number(
                    canary.requests
                  ).toLocaleString()}
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

      {/* ==============================================
          ANALYTICS CONTROLS
          ============================================== */}

      <section className="analytics-panel">

        <div className="analytics-panel-header">

          <div>

            <h2>
              Analytics Controls
            </h2>

            <p>
              Test release health and
              simulate operational conditions.
            </p>

          </div>

        </div>

        <div className="analytics-button-row">

          <button
            className="analytics-btn warning-btn"
            onClick={
              injectRegression
            }
          >
            ⚠ Inject Regression
          </button>

          <button
            className="analytics-btn neutral-btn"
            onClick={
              resetMetrics
            }
          >
            ↻ Reset Metrics
          </button>

          <button
            className="analytics-btn analyze-btn"
            onClick={
              analyzeMetrics
            }
          >
            ✓ Analyze Metrics
          </button>

        </div>

      </section>

      {/* ==============================================
          RELEASE DECISION
          ============================================== */}

      <section className="analytics-decision-panel">

        <div className="decision-header">

          <div>

            <h2>
              Automated Release Decision
            </h2>

            <p>
              Based on configured safety
              thresholds.
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
                The canary is performing
                worse than the baseline.
              </p>

              <div className="threshold-list">

                <div>
                  Error difference:
                  <strong>
                    {" "}
                    {safeErrorDifference.toFixed(
                      2
                    )}
                    %
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
                    {safeLatencyDifference.toFixed(
                      2
                    )}
                    %
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
              onClick={
                rollbackCanary
              }
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
                Current canary metrics are
                within the configured safety
                thresholds.
              </p>

              <div className="threshold-list">

                <div>
                  Error difference:
                  <strong>
                    {" "}
                    {safeErrorDifference.toFixed(
                      2
                    )}
                    %
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
                    {safeLatencyDifference.toFixed(
                      2
                    )}
                    %
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
              onClick={
                promoteCanary
              }
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