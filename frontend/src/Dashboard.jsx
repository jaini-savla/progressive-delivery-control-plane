import { useEffect, useState } from "react";
import API_BASE_URL from "./utils/api";

/*
 * --------------------------------------------------
 * STORAGE
 * --------------------------------------------------
 */

const STORAGE_KEY = "progressiveDeliveryReleases";

/*
 * --------------------------------------------------
 * DEFAULT RELEASES
 * --------------------------------------------------
 */

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
    currentVersion: "v1.8.1",
    previousVersion: "v1.8.1",
    newVersion: "v1.8.2",
    version: "v1.8.2",
    status: "Completed",
    approval: "Approved",
    traffic: 100,
  },
  {
    id: 3,
    application: "User Service",
    serviceName: "user-service",
    currentVersion: "v3.0.0",
    previousVersion: "v3.0.0",
    newVersion: "v3.1.0",
    version: "v3.1.0",
    status: "Completed",
    approval: "Approved",
    traffic: 100,
  },
  {
    id: 4,
    application: "Notification Service",
    serviceName: "notification-service",
    currentVersion: "v1.4.2",
    previousVersion: "v1.4.2",
    newVersion: "v1.4.3",
    version: "v1.4.3",
    status: "Rolled Back",
    approval: "Approved",
    traffic: 0,
  },
];

/*
 * --------------------------------------------------
 * AUDIT LOG HELPER
 * --------------------------------------------------
 */

const addAuditLog = (
  action,
  resource,
  status,
  performedBy
) => {
  try {
    const existing =
      JSON.parse(
        localStorage.getItem("auditLogs") || "[]"
      );

    const newLog = {
      id: Date.now(),
      action,
      resource,
      status,
      performedBy,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      "auditLogs",
      JSON.stringify([
        newLog,
        ...existing,
      ])
    );
  } catch (error) {
    console.error(
      "Unable to save audit log:",
      error
    );
  }
};

/*
 * --------------------------------------------------
 * DASHBOARD COMPONENT
 * --------------------------------------------------
 */

function Dashboard() {
  const [releases, setReleases] = useState([]);

  const [message, setMessage] =
    useState("");

  const [isRollingBack, setIsRollingBack] =
    useState(false);

  /*
   * ------------------------------------------------
   * REAL PROMETHEUS LATENCY STATE
   * ------------------------------------------------
   */

  const [latencyMetrics, setLatencyMetrics] =
    useState({
      stableLatency: null,
      canaryLatency: null,
      metricsAvailable: false,
    });

  /*
   * ------------------------------------------------
   * LOAD RELEASES
   * ------------------------------------------------
   */

  useEffect(() => {
    loadReleases();

    const handleStorageChange = () => {
      loadReleases();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    const refreshInterval =
      setInterval(() => {
        loadReleases();
      }, 3000);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      clearInterval(
        refreshInterval
      );
    };
  }, []);

  /*
   * ------------------------------------------------
   * LOAD REAL PROMETHEUS METRICS
   * ------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true;

    const loadLatencyMetrics =
      async () => {
        try {
          const response =
            await fetch(
              `${API_BASE_URL}/api/metrics/prometheus/summary`
            );

          if (!response.ok) {
            throw new Error(
              `Metrics request failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          console.log(
            "Prometheus Dashboard metrics:",
            data
          );

          if (!isMounted) {
            return;
          }

          /*
           * Prometheus returns latency
           * in seconds.
           *
           * Convert seconds → milliseconds.
           */

          const stable =
            Number(
              data.stableLatency
            );

          const canary =
            Number(
              data.canaryLatency
            );

          if (
            data.metricsAvailable &&
            Number.isFinite(stable) &&
            Number.isFinite(canary) &&
            stable > 0 &&
            canary > 0
          ) {
            setLatencyMetrics({
              stableLatency:
                stable * 1000,

              canaryLatency:
                canary * 1000,

              metricsAvailable:
                true,
            });
          } else {
            setLatencyMetrics({
              stableLatency: null,
              canaryLatency: null,
              metricsAvailable:
                false,
            });
          }
        } catch (error) {
          console.error(
            "Unable to load Prometheus metrics:",
            error
          );

          if (isMounted) {
            setLatencyMetrics({
              stableLatency: null,
              canaryLatency: null,
              metricsAvailable:
                false,
            });
          }
        }
      };

    /*
     * Load immediately.
     */

    loadLatencyMetrics();

    /*
     * Refresh every 3 seconds.
     */

    const metricsInterval =
      setInterval(
        loadLatencyMetrics,
        3000
      );

    return () => {
      isMounted = false;

      clearInterval(
        metricsInterval
      );
    };
  }, []);

  /*
   * ------------------------------------------------
   * LOAD RELEASE DATA
   * ------------------------------------------------
   */

  const loadReleases = () => {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(parsed)
        ) {
          setReleases(parsed);
          return;
        }
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          DEFAULT_RELEASES
        )
      );

      setReleases(
        DEFAULT_RELEASES
      );
    } catch (error) {
      console.error(
        "Unable to load releases:",
        error
      );

      setReleases(
        DEFAULT_RELEASES
      );
    }
  };

  /*
   * ------------------------------------------------
   * SHOW MESSAGE
   * ------------------------------------------------
   */

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  /*
   * ------------------------------------------------
   * FIND ACTIVE CANARY
   * ------------------------------------------------
   */

  const activeRelease =
    releases.find(
      (release) => {
        const status =
          String(
            release.status || ""
          ).toLowerCase();

        const traffic =
          Number(
            release.traffic || 0
          );

        const approval =
          String(
            release.approval || ""
          ).toLowerCase();

        return (
          (
            status ===
              "canary" ||
            status ===
              "canary running"
          ) &&
          traffic > 0 &&
          approval ===
            "approved"
        );
      }
    ) || null;

  /*
   * ------------------------------------------------
   * CURRENT / CANARY VERSION
   * ------------------------------------------------
   */

  const currentVersion =
    activeRelease?.previousVersion ||
    activeRelease?.currentVersion ||
    "";

  const canaryVersion =
    activeRelease?.newVersion ||
    activeRelease?.version ||
    "";

  const canaryTraffic =
    Number(
      activeRelease?.traffic || 0
    );

  /*
   * ------------------------------------------------
   * LATENCY DIFFERENCE
   * ------------------------------------------------
   */

  const latencyDifference =
    latencyMetrics.metricsAvailable &&
    latencyMetrics.stableLatency >
      0
      ? (
          (
            latencyMetrics.canaryLatency -
            latencyMetrics.stableLatency
          ) /
          latencyMetrics.stableLatency
        ) *
        100
      : null;

  /*
   * ------------------------------------------------
   * GRAPH SCALE
   * ------------------------------------------------
   */

  const maxLatency =
    Math.max(
      latencyMetrics.stableLatency ||
        0,
      latencyMetrics.canaryLatency ||
        0
    );

  const stableBarWidth =
    maxLatency > 0 &&
    latencyMetrics.stableLatency
      ? Math.max(
          5,
          Math.min(
            100,
            (
              latencyMetrics.stableLatency /
              maxLatency
            ) *
              100
          )
        )
      : 0;

  const canaryBarWidth =
    maxLatency > 0 &&
    latencyMetrics.canaryLatency
      ? Math.max(
          5,
          Math.min(
            100,
            (
              latencyMetrics.canaryLatency /
              maxLatency
            ) *
              100
          )
        )
      : 0;

  /*
   * ------------------------------------------------
   * ROLLBACK RELEASE
   * ------------------------------------------------
   */

  const rollbackRelease =
    async () => {
      if (isRollingBack) {
        return;
      }

      if (!activeRelease) {
        showMessage(
          "⚠ No active canary release is available for rollback."
        );

        return;
      }

      const targetVersion =
        activeRelease.previousVersion ||
        activeRelease.currentVersion ||
        activeRelease.oldVersion;

      if (!targetVersion) {
        showMessage(
          "⚠ Previous version could not be determined."
        );

        return;
      }

      const newVersion =
        activeRelease.newVersion ||
        activeRelease.version;

      const confirmed =
        window.confirm(
          `Are you sure you want to rollback ${activeRelease.application} from ${newVersion} to ${targetVersion}?`
        );

      if (!confirmed) {
        return;
      }

      setIsRollingBack(true);

      try {
        /*
         * --------------------------------------------
         * 1. BACKEND ROLLBACK API
         * --------------------------------------------
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
                  targetVersion,
              }),
            }
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            errorText ||
              "Rollback API request failed."
          );
        }

        const rollbackResult =
          await response.json();

        console.log(
          "Rollback API response:",
          rollbackResult
        );

        /*
         * --------------------------------------------
         * 2. UPDATE RELEASE STATE
         * --------------------------------------------
         */

        const updatedReleases =
          releases.map(
            (release) => {
              if (
                release.id !==
                activeRelease.id
              ) {
                return release;
              }

              return {
                ...release,

                currentVersion:
                  targetVersion,

                previousVersion:
                  targetVersion,

                newVersion:
                  newVersion,

                version:
                  targetVersion,

                status:
                  "Rolled Back",

                traffic: 0,

                approval:
                  release.approval ||
                  "Approved",

                rollbackTarget:
                  targetVersion,

                rollbackFrom:
                  newVersion,

                rollbackCompletedAt:
                  new Date().toISOString(),
              };
            }
          );

        /*
         * --------------------------------------------
         * 3. SAVE LOCAL STORAGE
         * --------------------------------------------
         */

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            updatedReleases
          )
        );

        /*
         * --------------------------------------------
         * 4. UPDATE REACT
         * --------------------------------------------
         */

        setReleases(
          updatedReleases
        );

        /*
         * --------------------------------------------
         * 5. AUDIT LOG
         * --------------------------------------------
         */

        addAuditLog(
          "Rollback Release",
          `${activeRelease.application} ${newVersion}`,
          "Success",
          "System"
        );

        /*
         * --------------------------------------------
         * 6. SUCCESS
         * --------------------------------------------
         */

        showMessage(
          `✓ Rollback completed successfully. ${activeRelease.application} is now running ${targetVersion}.`
        );
      } catch (error) {
        console.error(
          "Rollback failed:",
          error
        );

        addAuditLog(
          "Rollback Release",
          `${activeRelease.application} ${newVersion}`,
          "Failed",
          "System"
        );

        showMessage(
          `✕ Rollback failed: ${
            error.message ||
            "Unable to rollback release."
          }`
        );
      } finally {
        setIsRollingBack(false);
      }
    };

  /*
   * ------------------------------------------------
   * DASHBOARD COUNTS
   * ------------------------------------------------
   */

  const applicationsCount =
    releases.length;

  const activeReleasesCount =
    releases.filter(
      (release) => {
        const status =
          String(
            release.status || ""
          ).toLowerCase();

        const approval =
          String(
            release.approval || ""
          ).toLowerCase();

        const traffic =
          Number(
            release.traffic || 0
          );

        return (
          (
            status ===
              "canary" ||
            status ===
              "canary running"
          ) &&
          approval ===
            "approved" &&
          traffic > 0
        );
      }
    ).length;

  const rollbackCount =
    releases.filter(
      (release) =>
        String(
          release.status || ""
        ).toLowerCase() ===
        "rolled back"
    ).length;

  /*
   * ------------------------------------------------
   * RENDER
   * ------------------------------------------------
   */

  return (
    <div className="dashboard-page">

      {/* ================================================
          HEADER
      ================================================= */}

      <div className="top-header">

        <div>
          <h1>
            Release Dashboard
          </h1>

          <p>
            Monitor and manage
            progressive deployments
          </p>
        </div>

      </div>

      {/* ================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div
          className={
            message.startsWith("✓")
              ? "status-message success-message"
              : "status-message error-message"
          }
        >
          {message}
        </div>
      )}

      {/* ================================================
          SYSTEM STATUS
      ================================================= */}

      <div className="status-banner">

        <div className="status-icon">
          ✓
        </div>

        <div>
          <strong>
            All systems operational
          </strong>

          <p>
            Progressive delivery
            control plane is running
            normally.
          </p>
        </div>

        <span className="live-status">
          ● LIVE
        </span>

      </div>

      {/* ================================================
          STATISTICS
      ================================================= */}

      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-top">

            <span>
              Applications
            </span>

            <span className="stat-icon blue">
              ◉
            </span>

          </div>

          <h2>
            {applicationsCount}
          </h2>

          <p>
            Registered services
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-top">

            <span>
              Active Releases
            </span>

            <span className="stat-icon purple">
              ◆
            </span>

          </div>

          <h2>
            {activeReleasesCount}
          </h2>

          <p>
            Currently in canary
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-top">

            <span>
              Canary Traffic
            </span>

            <span className="stat-icon orange">
              %
            </span>

          </div>

          <h2>
            {canaryTraffic}%
          </h2>

          <p>
            Current allocation
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-top">

            <span>
              Rollbacks
            </span>

            <span className="stat-icon red">
              ↩
            </span>

          </div>

          <h2>
            {rollbackCount}
          </h2>

          <p>
            Completed rollbacks
          </p>

        </div>

      </section>

      {/* ================================================
          MAIN DASHBOARD
      ================================================= */}

      <section className="dashboard-grid">

        {/* ==============================================
            REAL PROMETHEUS RELEASE HEALTH
        =============================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Release Health
              </h2>

              <p>
                Stable vs Canary
                application latency
              </p>

            </div>

            <span
              className={
                latencyMetrics.metricsAvailable
                  ? "healthy-badge"
                  : "canary-badge"
              }
            >
              {latencyMetrics.metricsAvailable
                ? "Live Metrics"
                : "Waiting"}
            </span>

          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              border:
                "1px solid #e2e8f0",
              borderRadius: "12px",
              background:
                "#ffffff",
            }}
          >

            {/* GRAPH HEADER */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "22px",
              }}
            >

              <div>

                <strong
                  style={{
                    fontSize:
                      "16px",
                    color:
                      "#172033",
                  }}
                >
                  Stable vs Canary
                  Latency
                </strong>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    fontSize:
                      "13px",
                    color:
                      "#64748b",
                  }}
                >
                  Real-time
                  Prometheus
                  metrics
                </p>

              </div>

              <span
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "600",
                  color:
                    latencyMetrics.metricsAvailable
                      ? "#16a34a"
                      : "#d97706",
                }}
              >
                {latencyMetrics.metricsAvailable
                  ? "● LIVE"
                  : "● WAITING"}
              </span>

            </div>

            {latencyMetrics.metricsAvailable ? (

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "22px",
                }}
              >

                {/* =================================
                    STABLE
                ================================== */}

                <div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom:
                        "8px",
                    }}
                  >

                    <span
                      style={{
                        fontWeight:
                          "600",
                        color:
                          "#172033",
                      }}
                    >
                      Stable
                    </span>

                    <strong
                      style={{
                        color:
                          "#172033",
                      }}
                    >
                      {latencyMetrics.stableLatency.toFixed(
                        2
                      )}{" "}
                      ms
                    </strong>

                  </div>

                  <div
                    style={{
                      height:
                        "28px",
                      background:
                        "#eef2ff",
                      borderRadius:
                        "7px",
                      overflow:
                        "hidden",
                    }}
                  >

                    <div
                      style={{
                        height:
                          "100%",
                        width:
                          `${stableBarWidth}%`,
                        background:
                          "#4f46e5",
                        borderRadius:
                          "7px",
                        transition:
                          "width 0.5s ease",
                      }}
                    />

                  </div>

                </div>

                {/* =================================
                    CANARY
                ================================== */}

                <div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom:
                        "8px",
                    }}
                  >

                    <span
                      style={{
                        fontWeight:
                          "600",
                        color:
                          "#172033",
                      }}
                    >
                      Canary
                    </span>

                    <strong
                      style={{
                        color:
                          "#172033",
                      }}
                    >
                      {latencyMetrics.canaryLatency.toFixed(
                        2
                      )}{" "}
                      ms
                    </strong>

                  </div>

                  <div
                    style={{
                      height:
                        "28px",
                      background:
                        "#f0f9ff",
                      borderRadius:
                        "7px",
                      overflow:
                        "hidden",
                    }}
                  >

                    <div
                      style={{
                        height:
                          "100%",
                        width:
                          `${canaryBarWidth}%`,
                        background:
                          "#0ea5e9",
                        borderRadius:
                          "7px",
                        transition:
                          "width 0.5s ease",
                      }}
                    />

                  </div>

                </div>

                {/* =================================
                    LATENCY DIFFERENCE
                ================================== */}

                <div
                  style={{
                    marginTop:
                      "2px",
                    paddingTop:
                      "15px",
                    borderTop:
                      "1px solid #e2e8f0",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >

                  <span
                    style={{
                      color:
                        "#64748b",
                      fontSize:
                        "13px",
                    }}
                  >
                    Canary latency
                    difference
                  </span>

                  <strong
                    style={{
                      color:
                        latencyDifference !==
                          null &&
                        latencyDifference >
                          20
                          ? "#dc2626"
                          : "#16a34a",
                    }}
                  >
                    {latencyDifference !==
                    null
                      ? `${latencyDifference.toFixed(
                          2
                        )}%`
                      : "N/A"}
                  </strong>

                </div>

              </div>

            ) : (

              <div
                style={{
                  padding:
                    "40px 20px",
                  textAlign:
                    "center",
                  color:
                    "#64748b",
                }}
              >

                <strong>
                  Waiting for Prometheus
                  latency data...
                </strong>

                <p
                  style={{
                    marginTop:
                      "8px",
                    fontSize:
                      "13px",
                  }}
                >
                  Make sure the local
                  backend and Prometheus
                  server are running.
                </p>

              </div>

            )}

          </div>

        </div>

        {/* ==============================================
            CURRENT RELEASE
        =============================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Current Release
              </h2>

              <p>
                {activeRelease
                  ? activeRelease.application
                  : "Payment Service"}
              </p>

            </div>

            <span
              className={
                activeRelease
                  ? "canary-badge"
                  : "healthy-badge"
              }
            >
              {activeRelease
                ? "Canary"
                : "No Canary"}
            </span>

          </div>

          {activeRelease ? (

            <>

              {/* VERSION */}

              <div className="release-version">

                <span>
                  {currentVersion}
                </span>

                <span>
                  →
                </span>

                <strong>
                  {canaryVersion}
                </strong>

              </div>

              {/* TRAFFIC */}

              <div className="traffic-section">

                <div className="traffic-header">

                  <span>
                    Canary Traffic
                  </span>

                  <strong>
                    {canaryTraffic}%
                  </strong>

                </div>

                <div className="traffic-bar">

                  <div
                    className="traffic-progress"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          canaryTraffic
                        )
                      )}%`,
                    }}
                  />

                </div>

              </div>

              {/* RELEASE DETAILS */}

              <div className="release-details">

                <div>

                  <small>
                    Current Version
                  </small>

                  <strong>
                    {currentVersion ||
                      "N/A"}
                  </strong>

                </div>

                <div>

                  <small>
                    Canary Version
                  </small>

                  <strong>
                    {canaryVersion ||
                      "N/A"}
                  </strong>

                </div>

                <div>

                  <small>
                    Status
                  </small>

                  <strong>
                    {activeRelease.status ||
                      "N/A"}
                  </strong>

                </div>

              </div>

              {/* ROLLBACK */}

              <button
                type="button"
                className="rollback-button"
                onClick={
                  rollbackRelease
                }
                disabled={
                  isRollingBack
                }
              >
                {isRollingBack
                  ? "Rolling Back..."
                  : "Rollback Release"}
              </button>

            </>

          ) : (

            <div className="release-info">

              <h3>
                No Active Canary
              </h3>

              <p className="version">
                There is currently no
                approved canary release.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* ================================================
          RECENT RELEASES
      ================================================= */}

      <section className="panel recent-panel">

        <div className="panel-header">

          <div>

            <h2>
              Recent Releases
            </h2>

            <p>
              Latest progressive
              delivery activity
            </p>

          </div>

        </div>

        <div className="release-table">

          <div className="table-row table-heading">

            <span>
              Application
            </span>

            <span>
              Version
            </span>

            <span>
              Status
            </span>

            <span>
              Traffic
            </span>

            <span>
              Approval
            </span>

          </div>

          {releases.length ===
          0 ? (

            <div className="table-row">

              <span>
                No releases
              </span>

            </div>

          ) : (

            releases
              .slice()
              .reverse()
              .slice(0, 10)
              .map(
                (release) => {

                  const status =
                    String(
                      release.status ||
                        ""
                    );

                  const statusLower =
                    status.toLowerCase();

                  let statusClass =
                    "status";

                  if (
                    statusLower ===
                    "completed"
                  ) {
                    statusClass =
                      "status healthy";
                  } else if (
                    statusLower ===
                      "canary" ||
                    statusLower ===
                      "canary running"
                  ) {
                    statusClass =
                      "status testing";
                  } else if (
                    statusLower ===
                    "rolled back"
                  ) {
                    statusClass =
                      "status rollback-status";
                  }

                  return (
                    <div
                      className="table-row"
                      key={
                        release.id
                      }
                    >

                      <strong>
                        {
                          release.application ||
                          release.serviceName ||
                          "Payment Service"
                        }
                      </strong>

                      <span>
                        {
                          release.newVersion ||
                          release.version ||
                          "N/A"
                        }
                      </span>

                      <span
                        className={
                          statusClass
                        }
                      >
                        {status ||
                          "Created"}
                      </span>

                      <span>
                        {Number(
                          release.traffic ||
                            0
                        )}
                        %
                      </span>

                      <span>
                        {
                          release.approval ||
                          "Pending"
                        }
                      </span>

                    </div>
                  );
                }
              )

          )}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;