import { useEffect, useState } from "react";
import { addAuditLog } from "./utils/auditLogger";
import API_BASE_URL from "./utils/api";

const STORAGE_KEY = "progressiveDeliveryReleases";

/*
 * Default release shown when no release exists
 * in localStorage.
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

function Dashboard() {
  const [releases, setReleases] = useState([]);
  const [message, setMessage] = useState("");
  const [isRollingBack, setIsRollingBack] = useState(false);

  // --------------------------------------------------
  // LOAD RELEASES
  // --------------------------------------------------

  useEffect(() => {
    loadReleases();

    /*
     * Listen for release changes made by
     * another page/component.
     */
    const handleStorageChange = () => {
      loadReleases();
    };

    window.addEventListener("storage", handleStorageChange);

    /*
     * Refresh dashboard data periodically so that
     * changes made by Releases / other components
     * appear without manually refreshing the page.
     */
    const refreshInterval = setInterval(() => {
      loadReleases();
    }, 3000);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      clearInterval(refreshInterval);
    };
  }, []);

  // --------------------------------------------------
  // LOAD RELEASE DATA
  // --------------------------------------------------

  const loadReleases = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setReleases(parsed);
          return;
        }
      }

      /*
       * If there is no localStorage data,
       * initialize it with demo releases.
       */
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_RELEASES)
      );

      setReleases(DEFAULT_RELEASES);
    } catch (error) {
      console.error(
        "Unable to load releases:",
        error
      );

      setReleases(DEFAULT_RELEASES);
    }
  };

  // --------------------------------------------------
  // SHOW MESSAGE
  // --------------------------------------------------

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  // --------------------------------------------------
  // FIND ACTIVE CANARY
  // --------------------------------------------------

  const activeRelease =
    releases.find((release) => {
      const status =
        String(release.status || "").toLowerCase();

      const traffic =
        Number(release.traffic || 0);

      const approval =
        String(release.approval || "").toLowerCase();

      return (
        (
          status === "canary" ||
          status === "canary running"
        ) &&
        traffic > 0 &&
        approval === "approved"
      );
    }) || null;

  // --------------------------------------------------
  // CURRENT / CANARY VERSION
  // --------------------------------------------------

  /*
   * IMPORTANT:
   *
   * previousVersion = stable/current production version
   * newVersion      = active canary version
   *
   * Example:
   *
   * v2.4.1 → v2.5.0
   *
   * Current Version = v2.4.1
   * Canary Version  = v2.5.0
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
    Number(activeRelease?.traffic || 0);

  // --------------------------------------------------
  // ROLLBACK RELEASE
  // --------------------------------------------------

  const rollbackRelease = async () => {
    if (isRollingBack) {
      return;
    }

    if (!activeRelease) {
      showMessage(
        "⚠ No active canary release is available for rollback."
      );

      return;
    }

    /*
     * Rollback MUST target the previous stable version.
     *
     * Example:
     *
     * Current stable: v2.4.1
     * Canary:         v2.5.0
     *
     * Rollback target = v2.4.1
     */

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
      // ------------------------------------------------
      // 1. CALL BACKEND ROLLBACK API
      // ------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/api/rollback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetVersion: targetVersion,
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

      // ------------------------------------------------
      // 2. UPDATE FRONTEND RELEASE STATE
      // ------------------------------------------------

      const updatedReleases =
        releases.map((release) => {
          if (
            release.id !==
            activeRelease.id
          ) {
            return release;
          }

          return {
            ...release,

            /*
             * Stable version becomes current.
             */
            currentVersion:
              targetVersion,

            /*
             * Keep previousVersion for
             * rollback/history.
             */
            previousVersion:
              targetVersion,

            /*
             * Keep the attempted canary
             * version for history.
             */
            newVersion:
              newVersion,

            /*
             * After rollback, the active
             * version is the stable version.
             */
            version:
              targetVersion,

            /*
             * Rollback state.
             */
            status:
              "Rolled Back",

            /*
             * Canary receives no traffic.
             */
            traffic: 0,

            /*
             * Keep approval information.
             */
            approval:
              release.approval ||
              "Approved",

            /*
             * Store rollback information
             * for UI/history.
             */
            rollbackTarget:
              targetVersion,

            rollbackFrom:
              newVersion,

            rollbackCompletedAt:
              new Date().toISOString(),
          };
        });

      // ------------------------------------------------
      // 3. SAVE TO LOCAL STORAGE
      // ------------------------------------------------

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          updatedReleases
        )
      );

      // ------------------------------------------------
      // 4. UPDATE REACT STATE
      // ------------------------------------------------

      setReleases(
        updatedReleases
      );

      // ------------------------------------------------
      // 5. AUDIT LOG
      // ------------------------------------------------

      addAuditLog(
        "Rollback Release",
        `${activeRelease.application} ${newVersion}`,
        "Success",
        "System"
      );

      // ------------------------------------------------
      // 6. SUCCESS MESSAGE
      // ------------------------------------------------

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

  // --------------------------------------------------
  // CALCULATE DASHBOARD VALUES
  // --------------------------------------------------

  const applicationsCount =
    releases.length;

  const activeReleasesCount =
    releases.filter((release) => {
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
          status === "canary" ||
          status === "canary running"
        ) &&
        approval === "approved" &&
        traffic > 0
      );
    }).length;

  const rollbackCount =
    releases.filter(
      (release) =>
        String(
          release.status || ""
        ).toLowerCase() ===
        "rolled back"
    ).length;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="dashboard-page">

      {/* =================================================
          PAGE HEADER
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

      {/* =================================================
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

      {/* =================================================
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

      {/* =================================================
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

      {/* =================================================
          MAIN DASHBOARD
      ================================================= */}

      <section className="dashboard-grid">

        {/* =================================================
            RELEASE HEALTH
        ================================================= */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Release Health
              </h2>

              <p>
                Current release
                performance
              </p>
            </div>

            <span className="healthy-badge">
              Healthy
            </span>

          </div>

          <div className="health-chart">

            <div className="chart-y">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            <div className="chart-area">

              <div className="grid-line line1" />
              <div className="grid-line line2" />
              <div className="grid-line line3" />
              <div className="grid-line line4" />

              <div className="chart-line" />

            </div>

          </div>

        </div>

        {/* =================================================
            CURRENT RELEASE
        ================================================= */}

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

              {/* ROLLBACK BUTTON */}

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

      {/* =================================================
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

          {releases.length === 0 ? (

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
              .map((release) => {

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
              })

          )}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;