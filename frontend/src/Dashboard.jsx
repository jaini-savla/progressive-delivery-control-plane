import { useEffect, useState } from "react";
import API_BASE_URL from "./utils/api";
import "./App.css";

const STORAGE_KEY = "progressiveDeliveryReleases";

const DEFAULT_RELEASES = [
  {
    id: 1,
    application: "Payment Service",
    serviceName: "payment-service",
    currentVersion: "v2.4.1",
    previousVersion: "v2.4.1",
    newVersion: "v2.5.0",
    version: "v2.5.0",
    status: "Canary",
    approval: "Approved",
    traffic: 10,
  },
  {
    id: 2,
    application: "Order Service",
    serviceName: "order-service",
    currentVersion: "v1.7.0",
    previousVersion: "v1.7.0",
    newVersion: "v1.8.0",
    version: "v1.8.0",
    status: "Healthy",
    approval: "Approved",
    traffic: 100,
  },
  {
    id: 3,
    application: "Inventory Service",
    serviceName: "inventory-service",
    currentVersion: "v1.2.0",
    previousVersion: "v1.2.0",
    newVersion: "v1.3.0",
    version: "v1.3.0",
    status: "Healthy",
    approval: "Approved",
    traffic: 100,
  },
];

function Dashboard() {
  const [releases, setReleases] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(true);

  /*
   * IMPORTANT:
   * We start with the last known working values.
   * This prevents the graph from flashing back to "Loading".
   */
  const [latencyMetrics, setLatencyMetrics] = useState({
    stableLatency: 0.08,
    canaryLatency: 0.10,
  });

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");

  const [rollingBack, setRollingBack] = useState(false);

  // ------------------------------------------------------------
  // LOAD RELEASES
  // ------------------------------------------------------------

  useEffect(() => {
    const loadReleases = async () => {
      try {
        setLoadingReleases(true);

        const response = await fetch(
          `${API_BASE_URL}/api/releases`
        );

        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((release) => ({
              ...release,
              application:
                release.application ||
                release.serviceName ||
                "Application",
              version:
                release.version ||
                release.newVersion ||
                release.currentVersion ||
                "N/A",
              status: release.status || "CREATED",
              approval:
                release.approved === true
                  ? "Approved"
                  : release.approval || "Pending",
              traffic:
                typeof release.traffic === "number"
                  ? release.traffic
                  : 0,
            }));

            setReleases(mapped);

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(mapped)
            );

            return;
          }
        }

        loadLocalReleases();
      } catch (error) {
        console.error(
          "Unable to load releases:",
          error
        );

        loadLocalReleases();
      } finally {
        setLoadingReleases(false);
      }
    };

    const loadLocalReleases = () => {
      try {
        const stored =
          localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (
            Array.isArray(parsed) &&
            parsed.length > 0
          ) {
            setReleases(parsed);
            return;
          }
        }
      } catch (error) {
        console.error(
          "Unable to read local releases:",
          error
        );
      }

      setReleases(DEFAULT_RELEASES);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_RELEASES)
      );
    };

    loadReleases();
  }, []);

  // ------------------------------------------------------------
  // PROMETHEUS METRICS
  // ------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const fetchPrometheusMetrics = async () => {
      try {
        /*
         * Do NOT reset the existing graph values here.
         *
         * This was one of the reasons the UI could return
         * to "Waiting for Prometheus metrics".
         */
        setMetricsLoading(true);
        setMetricsError("");

        const response = await fetch(
          `${API_BASE_URL}/api/metrics/prometheus/summary`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Metrics request failed: ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          "Prometheus summary:",
          data
        );

        /*
         * Your backend returns values in SECONDS:
         *
         * stableLatency = 0.08
         * canaryLatency = 0.10
         *
         * We keep them as seconds in state and convert
         * them to milliseconds while displaying.
         */
        const stable = Number(
          data.stableLatency
        );

        const canary = Number(
          data.canaryLatency
        );

        /*
         * Only replace the values when valid values
         * are received.
         *
         * This means a temporary Prometheus failure
         * will NOT make the graph disappear.
         */
        if (
          Number.isFinite(stable) &&
          Number.isFinite(canary) &&
          stable > 0 &&
          canary > 0
        ) {
          if (isMounted) {
            setLatencyMetrics({
              stableLatency: stable,
              canaryLatency: canary,
            });

            setMetricsError("");
          }
        } else {
          console.warn(
            "Prometheus returned invalid latency values:",
            data
          );

          if (isMounted) {
            setMetricsError(
              "Waiting for valid Prometheus values..."
            );
          }
        }
      } catch (error) {
        console.error(
          "Prometheus metrics error:",
          error
        );

        /*
         * IMPORTANT:
         * Do NOT clear latencyMetrics here.
         *
         * The last successful graph remains visible.
         */
        if (isMounted) {
          setMetricsError(
            "Prometheus temporarily unavailable"
          );
        }
      } finally {
        if (isMounted) {
          setMetricsLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchPrometheusMetrics();

    // Refresh every 3 seconds
    const interval = setInterval(
      fetchPrometheusMetrics,
      3000
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ------------------------------------------------------------
  // ROLLBACK
  // ------------------------------------------------------------

  const handleRollback = async () => {
    if (rollingBack) {
      return;
    }

    const currentRelease =
      releases.length > 0
        ? releases[0]
        : null;

    const targetVersion =
      currentRelease?.previousVersion ||
      currentRelease?.currentVersion ||
      "v2.0";

    try {
      setRollingBack(true);

      const response = await fetch(
        `${API_BASE_URL}/api/rollback`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            targetVersion,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Rollback failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Rollback response:", data);

      alert(
        `Rollback successful. Target version: ${targetVersion}`
      );

      // Refresh releases after rollback
      try {
        const releaseResponse =
          await fetch(
            `${API_BASE_URL}/api/releases`
          );

        if (releaseResponse.ok) {
          const updated =
            await releaseResponse.json();

          if (
            Array.isArray(updated) &&
            updated.length > 0
          ) {
            setReleases(updated);

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(updated)
            );
          }
        }
      } catch (error) {
        console.error(
          "Unable to refresh releases:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Rollback error:",
        error
      );

      alert(
        "Rollback failed. Check the backend."
      );
    } finally {
      setRollingBack(false);
    }
  };

  // ------------------------------------------------------------
  // CALCULATED VALUES
  // ------------------------------------------------------------

  const stableLatencyMs =
    latencyMetrics.stableLatency * 1000;

  const canaryLatencyMs =
    latencyMetrics.canaryLatency * 1000;

  const latencyDifferenceMs =
    canaryLatencyMs - stableLatencyMs;

  const maxLatency = Math.max(
    stableLatencyMs,
    canaryLatencyMs,
    1
  );

  const stableWidth =
    (stableLatencyMs / maxLatency) * 100;

  const canaryWidth =
    (canaryLatencyMs / maxLatency) * 100;

  const currentRelease =
    releases.length > 0
      ? releases[0]
      : DEFAULT_RELEASES[0];

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="dashboard-modern-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="applications-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Monitor progressive deployments,
            traffic distribution and application
            performance.
          </p>
        </div>
      </div>

      {/* ======================================================
          STATUS BANNER
      ====================================================== */}

      <div className="status-banner">
        <div className="status-banner-icon">
          ✓
        </div>

        <div>
          <strong>
            All systems operational
          </strong>

          <span>
            Progressive delivery control
            plane is running normally.
          </span>
        </div>
      </div>

      {/* ======================================================
          STABLE VS CANARY LATENCY
      ====================================================== */}

      <div className="dashboard-card latency-overview-card">

        <div className="card-header">
          <div>
            <h2>
              Stable vs Canary Latency
            </h2>

            <p>
              Real-time request latency from
              Prometheus.
            </p>
          </div>

          <div className="metrics-live-indicator">
            <span className="live-dot"></span>

            {metricsLoading
              ? "Updating"
              : "Live"}
          </div>
        </div>

        {/* ERROR MESSAGE IS SMALL AND DOES NOT
            REPLACE THE GRAPH */}

        {metricsError && (
          <div className="metrics-warning">
            {metricsError}
          </div>
        )}

        {/* GRAPH */}

        <div className="latency-chart">

          {/* STABLE */}

          <div className="latency-row">

            <div className="latency-label">
              <span className="latency-dot stable-dot"></span>

              <span>
                Stable
              </span>
            </div>

            <div className="latency-track">

              <div
                className="latency-bar stable-bar"
                style={{
                  width: `${stableWidth}%`,
                }}
              ></div>

            </div>

            <div className="latency-value">
              {stableLatencyMs.toFixed(0)}
              <span> ms</span>
            </div>
          </div>

          {/* CANARY */}

          <div className="latency-row">

            <div className="latency-label">
              <span className="latency-dot canary-dot"></span>

              <span>
                Canary
              </span>
            </div>

            <div className="latency-track">

              <div
                className="latency-bar canary-bar"
                style={{
                  width: `${canaryWidth}%`,
                }}
              ></div>

            </div>

            <div className="latency-value">
              {canaryLatencyMs.toFixed(0)}
              <span> ms</span>
            </div>
          </div>

        </div>

        {/* SUMMARY */}

        <div className="latency-summary">

          <div className="latency-summary-item">

            <span>
              Stable Latency
            </span>

            <strong>
              {stableLatencyMs.toFixed(0)} ms
            </strong>

          </div>

          <div className="latency-summary-item">

            <span>
              Canary Latency
            </span>

            <strong>
              {canaryLatencyMs.toFixed(0)} ms
            </strong>

          </div>

          <div className="latency-summary-item">

            <span>
              Difference
            </span>

            <strong
              className={
                latencyDifferenceMs > 0
                  ? "latency-warning-value"
                  : "latency-good-value"
              }
            >
              {latencyDifferenceMs >= 0
                ? "+"
                : ""}
              {latencyDifferenceMs.toFixed(0)}
              {" ms"}
            </strong>

          </div>

        </div>

      </div>

      {/* ======================================================
          TWO COLUMN SECTION
      ====================================================== */}

      <div className="dashboard-two-column">

        {/* ====================================================
            CURRENT RELEASE
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>
                Current Release
              </h2>

              <p>
                Active deployment campaign.
              </p>
            </div>

            <span className="status-badge status-canary">
              {currentRelease.status ||
                "Canary"}
            </span>

          </div>

          <div className="current-release-content">

            <div className="release-main">

              <div className="service-icon">
                P
              </div>

              <div>
                <h3>
                  {currentRelease.application ||
                    currentRelease.serviceName ||
                    "Payment Service"}
                </h3>

                <p>
                  Version{" "}
                  {currentRelease.version ||
                    currentRelease.newVersion ||
                    "v2.5.0"}
                </p>
              </div>

            </div>

            <div className="release-details">

              <div>
                <span>
                  Approval
                </span>

                <strong>
                  {currentRelease.approval ||
                    "Approved"}
                </strong>
              </div>

              <div>
                <span>
                  Canary Traffic
                </span>

                <strong>
                  {currentRelease.traffic ??
                    10}
                  %
                </strong>
              </div>

            </div>

            <button
              className="rollback-button"
              onClick={handleRollback}
              disabled={rollingBack}
            >
              {rollingBack
                ? "Rolling back..."
                : "Rollback Release"}
            </button>

          </div>
        </div>

        {/* ====================================================
            DEPLOYMENT CAMPAIGN
        ==================================================== */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>
                Deployment Campaign
              </h2>

              <p>
                Progressive delivery stages.
              </p>
            </div>

          </div>

          <div className="campaign-stages">

            <div className="campaign-stage completed">
              <div className="stage-circle">
                ✓
              </div>

              <div>
                <strong>
                  Release Created
                </strong>

                <span>
                  Completed
                </span>
              </div>
            </div>

            <div className="campaign-line"></div>

            <div className="campaign-stage completed">
              <div className="stage-circle">
                ✓
              </div>

              <div>
                <strong>
                  Approval
                </strong>

                <span>
                  Approved
                </span>
              </div>
            </div>

            <div className="campaign-line"></div>

            <div className="campaign-stage active">
              <div className="stage-circle">
                3
              </div>

              <div>
                <strong>
                  Canary
                </strong>

                <span>
                  Monitoring
                </span>
              </div>
            </div>

            <div className="campaign-line"></div>

            <div className="campaign-stage">
              <div className="stage-circle">
                4
              </div>

              <div>
                <strong>
                  Production
                </strong>

                <span>
                  Pending
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ======================================================
          RECENT RELEASES
      ====================================================== */}

      <div className="dashboard-card recent-releases-card">

        <div className="card-header">

          <div>
            <h2>
              Recent Releases
            </h2>

            <p>
              Latest deployment activity.
            </p>
          </div>

          <span className="release-count">
            {releases.length} releases
          </span>

        </div>

        {loadingReleases ? (
          <div className="table-loading">
            Loading releases...
          </div>
        ) : releases.length === 0 ? (
          <div className="table-loading">
            No releases found.
          </div>
        ) : (
          <div className="table-container">

            <table className="releases-table">

              <thead>
                <tr>
                  <th>
                    Application
                  </th>

                  <th>
                    Version
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Approval
                  </th>

                  <th>
                    Traffic
                  </th>
                </tr>
              </thead>

              <tbody>

                {releases
                  .slice(0, 10)
                  .map((release, index) => {

                    const status =
                      release.status ||
                      "CREATED";

                    const statusLower =
                      String(status)
                        .toLowerCase();

                    return (
                      <tr
                        key={
                          release.id ||
                          index
                        }
                      >

                        <td>
                          <div className="application-cell">

                            <div className="table-service-icon">
                              {(release.application ||
                                release.serviceName ||
                                "A")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {release.application ||
                                  release.serviceName ||
                                  "Application"}
                              </strong>

                              <span>
                                {release.serviceName ||
                                  ""}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          {release.version ||
                            release.newVersion ||
                            release.currentVersion ||
                            "N/A"}
                        </td>

                        <td>

                          <span
                            className={`status-badge ${
                              statusLower.includes(
                                "canary"
                              )
                                ? "status-canary"
                                : statusLower.includes(
                                    "approved"
                                  ) ||
                                  statusLower.includes(
                                    "healthy"
                                  )
                                ? "status-healthy"
                                : "status-created"
                            }`}
                          >
                            {status}
                          </span>

                        </td>

                        <td>
                          {release.approved === true ||
                          release.approval ===
                            "Approved"
                            ? "Approved"
                            : release.approval ||
                              "Pending"}
                        </td>

                        <td>
                          {release.traffic ??
                            0}
                          %
                        </td>

                      </tr>
                    );
                  })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Dashboard;