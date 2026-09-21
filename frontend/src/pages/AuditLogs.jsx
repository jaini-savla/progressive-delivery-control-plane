import { useEffect, useState } from "react";
import "../App.css";

const AUDIT_KEY = "progressiveDeliveryAuditLogs";

const defaultLogs = [
  {
    id: 1,
    time: "10:30 AM",
    user: "Admin",
    action: "Created Release",
    resource: "Payment Service v2.5.0",
    result: "Success",
  },
  {
    id: 2,
    time: "10:32 AM",
    user: "Release Manager",
    action: "Approved Release",
    resource: "Payment Service v2.5.0",
    result: "Success",
  },
  {
    id: 3,
    time: "10:35 AM",
    user: "System",
    action: "Started Canary",
    resource: "Payment Service — 10%",
    result: "Success",
  },
];

function AuditLogs() {
  const [logs, setLogs] = useState(() => {
    const savedLogs =
      localStorage.getItem(AUDIT_KEY);

    if (savedLogs) {
      return JSON.parse(savedLogs);
    }

    return defaultLogs;
  });

  const [filter, setFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem(
      AUDIT_KEY,
      JSON.stringify(logs)
    );
  }, [logs]);

  const clearLogs = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all audit logs?"
    );

    if (confirmClear) {
      setLogs([]);
    }
  };

  const filteredLogs =
    filter === "All"
      ? logs
      : logs.filter(
          (log) => log.result === filter
        );

  return (
    <div className="audit-page">

      {/* Header */}
      <div className="page-header">

        <div>
          <h1>Audit Logs</h1>

          <p>
            Track release, approval, deployment and
            rollback activities.
          </p>
        </div>

        <button
          className="clear-audit-button"
          onClick={clearLogs}
        >
          Clear Logs
        </button>

      </div>

      {/* Summary */}
      <div className="audit-summary">

        <div className="audit-summary-card">
          <span>Total Events</span>
          <strong>{logs.length}</strong>
        </div>

        <div className="audit-summary-card">
          <span>Successful</span>

          <strong>
            {
              logs.filter(
                (log) => log.result === "Success"
              ).length
            }
          </strong>
        </div>

        <div className="audit-summary-card">
          <span>Warnings</span>

          <strong>
            {
              logs.filter(
                (log) => log.result === "Warning"
              ).length
            }
          </strong>
        </div>

        <div className="audit-summary-card">
          <span>Failures</span>

          <strong>
            {
              logs.filter(
                (log) => log.result === "Failed"
              ).length
            }
          </strong>
        </div>

      </div>

      {/* Filters */}
      <div className="audit-filter-section">

        <span>Filter:</span>

        <button
          className={
            filter === "All"
              ? "active-filter"
              : ""
          }
          onClick={() => setFilter("All")}
        >
          All
        </button>

        <button
          className={
            filter === "Success"
              ? "active-filter"
              : ""
          }
          onClick={() => setFilter("Success")}
        >
          Success
        </button>

        <button
          className={
            filter === "Warning"
              ? "active-filter"
              : ""
          }
          onClick={() => setFilter("Warning")}
        >
          Warning
        </button>

        <button
          className={
            filter === "Failed"
              ? "active-filter"
              : ""
          }
          onClick={() => setFilter("Failed")}
        >
          Failed
        </button>

      </div>

      {/* Audit Table */}
      <div className="audit-card">

        <div className="audit-table">

          <div className="audit-row audit-header">

            <span>Time</span>
            <span>User</span>
            <span>Action</span>
            <span>Resource</span>
            <span>Result</span>

          </div>

          {filteredLogs.length === 0 ? (

            <div className="empty-audit">
              No audit events found.
            </div>

          ) : (

            filteredLogs.map((log) => (

              <div
                className="audit-row"
                key={log.id}
              >

                <span className="audit-time">
                  {log.time}
                </span>

                <span>
                  {log.user}
                </span>

                <span className="audit-action">
                  {log.action}
                </span>

                <span className="audit-resource">
                  {log.resource}
                </span>

                <span>
                  <span
                    className={`audit-result ${log.result.toLowerCase()}`}
                  >
                    {log.result}
                  </span>
                </span>

              </div>

            ))

          )}

        </div>

      </div>

      {/* Timeline */}
      <div className="audit-card">

        <div className="audit-section-title">
          <h2>Release Activity Timeline</h2>

          <p>
            Recent operational events
          </p>
        </div>

        <div className="audit-timeline">

          {filteredLogs.slice(0, 5).map(
            (log, index) => (

              <div
                className="timeline-item"
                key={log.id}
              >

                <div className="timeline-line">

                  <div className="timeline-dot">
                    {index + 1}
                  </div>

                </div>

                <div className="timeline-content">

                  <strong>
                    {log.action}
                  </strong>

                  <span>
                    {log.resource}
                  </span>

                  <small>
                    {log.user} • {log.time}
                  </small>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
}

export default AuditLogs;