import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY =
  "progressive_delivery_applications";

const DEFAULT_APPLICATIONS = [
  {
    id: 1,
    name: "Payment Service",
    environment: "Production",
    version: "v2.4.1",
    status: "Healthy",
    owner: "Payments Team",
    lastDeploy: "a day ago",
    level: "Gold",
  },
  {
    id: 2,
    name: "Order Service",
    environment: "Production",
    version: "v1.8.2",
    status: "Healthy",
    owner: "Orders Team",
    lastDeploy: "2 days ago",
    level: "Silver",
  },
  {
    id: 3,
    name: "Inventory Service",
    environment: "Staging",
    version: "v1.3.0",
    status: "Healthy",
    owner: "Inventory Team",
    lastDeploy: "3 days ago",
    level: "Silver",
  },
];

function Applications() {
  /* =========================================================
     STATE
     ========================================================= */

  const [applications, setApplications] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  const [filters, setFilters] = useState({
    status: "All",
    environment: "All",
    level: "All",
  });

  const applicationsListRef =
    useRef(null);

  const applicationFormRef =
    useRef(null);

  const [newApplication, setNewApplication] =
    useState({
      name: "",
      environment: "Development",
      version: "",
      owner: "",
    });

  /* =========================================================
     LOAD APPLICATIONS
     ========================================================= */

  useEffect(() => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setApplications(parsed);
        } else {
          setApplications(
            DEFAULT_APPLICATIONS
          );
        }
      } catch (error) {
        console.error(
          "Error loading applications:",
          error
        );

        setApplications(
          DEFAULT_APPLICATIONS
        );
      }
    } else {
      setApplications(
        DEFAULT_APPLICATIONS
      );
    }
  }, []);

  /* =========================================================
     SAVE APPLICATIONS
     ========================================================= */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(applications)
    );
  }, [applications]);

  /* =========================================================
     OPEN ADD APPLICATION FORM
     ========================================================= */

  const openAddApplicationForm = () => {
    setShowForm(true);

    setTimeout(() => {
      applicationFormRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "center",
        }
      );
    }, 100);
  };

  /* =========================================================
     CLOSE FORM
     ========================================================= */

  const closeAddApplicationForm = () => {
    setShowForm(false);

    setNewApplication({
      name: "",
      environment: "Development",
      version: "",
      owner: "",
    });
  };

  /* =========================================================
     FORM INPUT
     ========================================================= */

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setNewApplication((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     ADD APPLICATION
     ========================================================= */

  const handleAddApplication = (
    event
  ) => {
    event.preventDefault();

    const name =
      newApplication.name.trim();

    const version =
      newApplication.version.trim();

    const owner =
      newApplication.owner.trim();

    if (!name) {
      alert(
        "Please enter application name."
      );
      return;
    }

    if (!version) {
      alert(
        "Please enter application version."
      );
      return;
    }

    const application = {
      id: Date.now(),
      name,
      environment:
        newApplication.environment,
      version,
      status: "Healthy",
      owner:
        owner || "Platform Team",
      lastDeploy: "Just now",
      level: "Silver",
    };

    setApplications((previous) => [
      ...previous,
      application,
    ]);

    setNewApplication({
      name: "",
      environment: "Development",
      version: "",
      owner: "",
    });

    setShowForm(false);

    alert(
      `"${name}" has been added successfully.`
    );
  };

  /* =========================================================
     DELETE APPLICATION
     ========================================================= */

  const deleteApplication = (id) => {
    const application =
      applications.find(
        (item) => item.id === id
      );

    if (!application) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${application.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setApplications((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );
  };

  /* =========================================================
     SEARCH + FILTER
     ========================================================= */

  const filteredApplications = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return applications.filter(
      (application) => {
        const matchesSearch =
          !searchValue ||
          [
            application.name,
            application.environment,
            application.version,
            application.status,
            application.owner,
            application.level,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          filters.status === "All" ||
          application.status ===
            filters.status;

        const matchesEnvironment =
          filters.environment === "All" ||
          application.environment ===
            filters.environment;

        const matchesLevel =
          filters.level === "All" ||
          application.level ===
            filters.level;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesEnvironment &&
          matchesLevel
        );
      }
    );
  }, [
    applications,
    search,
    filters,
  ]);

  /* =========================================================
     FILTER CHANGE
     ========================================================= */

  const handleFilterChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     CLEAR FILTERS
     ========================================================= */

  const clearFilters = () => {
    setFilters({
      status: "All",
      environment: "All",
      level: "All",
    });

    setSearch("");
  };

  const hasActiveFilters =
    filters.status !== "All" ||
    filters.environment !== "All" ||
    filters.level !== "All" ||
    search.trim() !== "";

  /* =========================================================
     STATISTICS
     ========================================================= */

  const totalApplications =
    applications.length;

  const healthyApplications =
    applications.filter(
      (application) =>
        application.status === "Healthy"
    ).length;

  const productionApplications =
    applications.filter(
      (application) =>
        application.environment ===
        "Production"
    ).length;

  /* =========================================================
     VIEW ALL
     ========================================================= */

  const handleViewAll = () => {
    applicationsListRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "start",
      }
    );
  };

  /* =========================================================
     VIEW APPLICATION
     ========================================================= */

  const viewApplication = (
    application
  ) => {
    alert(
      `Application Details\n\n` +
        `Name: ${application.name}\n` +
        `Version: ${application.version}\n` +
        `Environment: ${application.environment}\n` +
        `Status: ${application.status}\n` +
        `Owner: ${application.owner}\n` +
        `Level: ${application.level}\n` +
        `Last Deploy: ${application.lastDeploy}`
    );
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="applications-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <header className="applications-header">

        <div>
          <p className="applications-welcome">
            Manage your services
          </p>

          <h1>
            Applications
          </h1>

          <p className="applications-description">
            Manage and monitor your registered
            applications and deployment
            environments.
          </p>
        </div>

        <div className="applications-header-actions">

          <button
            type="button"
            className="new-release-btn"
            onClick={
              showForm
                ? closeAddApplicationForm
                : openAddApplicationForm
            }
          >
            {showForm
              ? "× Close"
              : "+ Add Application"}
          </button>

        </div>

      </header>

      {/* =====================================================
          SYSTEM STATUS
          ===================================================== */}

      <section className="status-banner">

        <div className="status-left">

          <span className="status-dot"></span>

          <div>

            <strong>
              All applications operational
            </strong>

            <p>
              {healthyApplications} of{" "}
              {totalApplications} registered
              applications are currently
              healthy.
            </p>

          </div>

        </div>

        <span className="status-time">
          Updated just now
        </span>

      </section>

      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-card-top">

            <span className="stat-label">
              Applications
            </span>

            <div className="stat-icon purple">
              ◈
            </div>

          </div>

          <h2>
            {totalApplications}
          </h2>

          <p>
            Registered services
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-card-top">

            <span className="stat-label">
              Healthy
            </span>

            <div className="stat-icon green">
              ✓
            </div>

          </div>

          <h2>
            {healthyApplications}
          </h2>

          <p className="stat-positive">
            ● All systems operational
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-card-top">

            <span className="stat-label">
              Production
            </span>

            <div className="stat-icon blue">
              ◉
            </div>

          </div>

          <h2>
            {productionApplications}
          </h2>

          <p>
            Production services
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-card-top">

            <span className="stat-label">
              Deployments
            </span>

            <div className="stat-icon orange">
              ↗
            </div>

          </div>

          <h2>
            147
          </h2>

          <p className="stat-positive">
            ↗ 8% this month
          </p>

        </div>

      </section>

      {/* =====================================================
          DEPLOYMENT CAMPAIGNS
          ===================================================== */}

      <section className="dashboard-card applications-campaign-card">

        <div className="card-header">

          <div>
            <h2>
              Deployment Campaigns
            </h2>

            <p>
              Monitor active progressive
              delivery campaigns.
            </p>
          </div>

          <button
            type="button"
            className="view-all-btn"
            onClick={handleViewAll}
          >
            View all →
          </button>

        </div>

        {/* ===================================================
            CAMPAIGN CARDS
            =================================================== */}

        <div className="deployment-campaign-grid">

          {/* =================================================
              PAYMENT SERVICE
              ================================================= */}

          <div className="deployment-campaign-card">

            <div className="deployment-campaign-top">

              <div className="deployment-campaign-service">

                <div className="deployment-service-icon payment-icon">
                  P
                </div>

                <div className="deployment-service-content">

                  <h3>
                    Payment Service
                  </h3>

                  <p>
                    Production deployment
                  </p>

                </div>

              </div>

              <span className="deployment-campaign-status status-canary">
                Canary
              </span>

            </div>

            <div className="deployment-campaign-progress">

              <div
                className="deployment-progress-fill progress-payment"
                style={{
                  width: "80%",
                }}
              ></div>

            </div>

            <div className="deployment-campaign-footer">

              <span>
                80% Stable
              </span>

              <strong>
                20% Canary
              </strong>

            </div>

          </div>

          {/* =================================================
              ORDER SERVICE
              ================================================= */}

          <div className="deployment-campaign-card">

            <div className="deployment-campaign-top">

              <div className="deployment-campaign-service">

                <div className="deployment-service-icon order-icon">
                  O
                </div>

                <div className="deployment-service-content">

                  <h3>
                    Order Service
                  </h3>

                  <p>
                    Release v1.8.2
                  </p>

                </div>

              </div>

              <span className="deployment-campaign-status status-healthy">
                Healthy
              </span>

            </div>

            <div className="deployment-campaign-progress">

              <div
                className="deployment-progress-fill progress-order"
                style={{
                  width: "92%",
                }}
              ></div>

            </div>

            <div className="deployment-campaign-footer">

              <span>
                92% Healthy
              </span>

              <strong>
                8% Monitoring
              </strong>

            </div>

          </div>

          {/* =================================================
              INVENTORY SERVICE
              ================================================= */}

          <div className="deployment-campaign-card">

            <div className="deployment-campaign-top">

              <div className="deployment-campaign-service">

                <div className="deployment-service-icon inventory-icon">
                  I
                </div>

                <div className="deployment-service-content">

                  <h3>
                    Inventory Service
                  </h3>

                  <p>
                    Release v1.3.0
                  </p>

                </div>

              </div>

              <span className="deployment-campaign-status status-staging">
                Staging
              </span>

            </div>

            <div className="deployment-campaign-progress">

              <div
                className="deployment-progress-fill progress-inventory"
                style={{
                  width: "48%",
                }}
              ></div>

            </div>

            <div className="deployment-campaign-footer">

              <span>
                48% Complete
              </span>

              <strong>
                Testing
              </strong>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          APPLICATIONS LIST
          ===================================================== */}

      <section
        ref={applicationsListRef}
        id="applications-list"
        className="dashboard-card applications-list-card"
      >

        <div className="card-header">

          <div>

            <h2>

              Applications

              <span className="count-badge">
                {totalApplications}
              </span>

            </h2>

            <p>
              Registered services and
              deployment information.
            </p>

          </div>

        </div>

        {/* ===================================================
            ADD APPLICATION FORM
            =================================================== */}

        {showForm && (

          <form
            ref={applicationFormRef}
            className="application-form"
            onSubmit={
              handleAddApplication
            }
          >

            <div className="form-field">

              <label>
                Application Name
              </label>

              <input
                type="text"
                name="name"
                value={
                  newApplication.name
                }
                onChange={
                  handleChange
                }
                placeholder="Payment Service"
                autoComplete="off"
              />

            </div>

            <div className="form-field">

              <label>
                Environment
              </label>

              <select
                name="environment"
                value={
                  newApplication.environment
                }
                onChange={
                  handleChange
                }
              >

                <option value="Development">
                  Development
                </option>

                <option value="Staging">
                  Staging
                </option>

                <option value="Production">
                  Production
                </option>

              </select>

            </div>

            <div className="form-field">

              <label>
                Version
              </label>

              <input
                type="text"
                name="version"
                value={
                  newApplication.version
                }
                onChange={
                  handleChange
                }
                placeholder="v1.0.0"
                autoComplete="off"
              />

            </div>

            <div className="form-field">

              <label>
                Owner
              </label>

              <input
                type="text"
                name="owner"
                value={
                  newApplication.owner
                }
                onChange={
                  handleChange
                }
                placeholder="Platform Team"
                autoComplete="off"
              />

            </div>

            <div className="form-buttons">

              <button
                type="submit"
                className="primary-button"
              >
                Save Application
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeAddApplicationForm
                }
              >
                Cancel
              </button>

            </div>

          </form>

        )}

        {/* ===================================================
            SEARCH + FILTER
            =================================================== */}

        <div className="applications-tools">

          <div className="applications-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search applications..."
            />

          </div>

          <button
            type="button"
            className={
              hasActiveFilters
                ? "secondary-button filter-active"
                : "secondary-button"
            }
            onClick={() =>
              setShowFilters(
                (previous) =>
                  !previous
              )
            }
          >
            {showFilters
              ? "Hide Filters ▲"
              : "Filter ▾"}
          </button>

        </div>

        {/* ===================================================
            FILTER PANEL
            =================================================== */}

        {showFilters && (

          <div className="application-filter-panel">

            <div className="filter-field">

              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  filters.status
                }
                onChange={
                  handleFilterChange
                }
              >

                <option value="All">
                  All Statuses
                </option>

                <option value="Healthy">
                  Healthy
                </option>

                <option value="Unhealthy">
                  Unhealthy
                </option>

                <option value="Canary">
                  Canary
                </option>

              </select>

            </div>

            <div className="filter-field">

              <label>
                Environment
              </label>

              <select
                name="environment"
                value={
                  filters.environment
                }
                onChange={
                  handleFilterChange
                }
              >

                <option value="All">
                  All Environments
                </option>

                <option value="Production">
                  Production
                </option>

                <option value="Staging">
                  Staging
                </option>

                <option value="Development">
                  Development
                </option>

              </select>

            </div>

            <div className="filter-field">

              <label>
                Level
              </label>

              <select
                name="level"
                value={
                  filters.level
                }
                onChange={
                  handleFilterChange
                }
              >

                <option value="All">
                  All Levels
                </option>

                <option value="Gold">
                  Gold
                </option>

                <option value="Silver">
                  Silver
                </option>

              </select>

            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        )}

        {/* ===================================================
            FILTER RESULT
            =================================================== */}

        {hasActiveFilters && (

          <div className="filter-result-info">

            <span>
              Showing{" "}
              <strong>
                {
                  filteredApplications.length
                }
              </strong>{" "}
              of{" "}
              <strong>
                {applications.length}
              </strong>{" "}
              applications
            </span>

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear all
            </button>

          </div>

        )}

        {/* ===================================================
            APPLICATION TABLE
            =================================================== */}

        <div className="applications-table-wrapper">

          <table className="applications-table">

            <thead>

              <tr>

                <th>
                  LEVEL
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  NAME
                </th>

                <th>
                  VERSION
                </th>

                <th>
                  ENVIRONMENT
                </th>

                <th>
                  LAST DEPLOY
                </th>

                <th>
                  OWNER
                </th>

                <th>
                  ACTIONS
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredApplications.map(
                (application) => (

                  <tr
                    key={
                      application.id
                    }
                  >

                    <td>

                      <span
                        className={`application-level ${application.level.toLowerCase()}`}
                      >
                        {
                          application.level
                        }
                      </span>

                    </td>

                    <td>

                      <span
                        className={
                          application.status ===
                          "Healthy"
                            ? "application-status healthy"
                            : "application-status"
                        }
                      >
                        ●{" "}
                        {
                          application.status
                        }
                      </span>

                    </td>

                    <td>

                      <div className="application-name-cell">

                        <span className="service-icon purple">
                          {
                            application.name
                              .charAt(0)
                              .toUpperCase()
                          }
                        </span>

                        <strong>
                          {
                            application.name
                          }
                        </strong>

                      </div>

                    </td>

                    <td>

                      <span className="application-version">
                        {
                          application.version
                        }
                      </span>

                    </td>

                    <td>

                      <span
                        className={`environment-badge ${application.environment.toLowerCase()}`}
                      >
                        {
                          application.environment
                        }
                      </span>

                    </td>

                    <td className="application-last-deploy">

                      {
                        application.lastDeploy
                      }

                    </td>

                    <td>

                      <span className="application-owner">

                        {
                          application.owner
                        }

                      </span>

                    </td>

                    <td>

                      <div className="application-actions">

                        <button
                          type="button"
                          title="View application"
                          onClick={() =>
                            viewApplication(
                              application
                            )
                          }
                        >
                          →
                        </button>

                        <button
                          type="button"
                          title="Delete application"
                          className="application-delete"
                          onClick={() =>
                            deleteApplication(
                              application.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

          {filteredApplications.length ===
            0 && (

            <div className="no-results">

              <strong>
                No applications found
              </strong>

              <p>
                Try changing your search
                or filters.
              </p>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default Applications;