import { useState } from "react";

function FeatureFlags() {
  const [flags, setFlags] = useState([
    {
      id: 1,
      name: "New Payment UI",
      key: "new-payment-ui",
      environment: "Production",
      enabled: true,
      rollout: 25,
    },
    {
      id: 2,
      name: "New Checkout Flow",
      key: "new-checkout-flow",
      environment: "Staging",
      enabled: true,
      rollout: 100,
    },
    {
      id: 3,
      name: "Improved Dashboard",
      key: "improved-dashboard",
      environment: "Development",
      enabled: false,
      rollout: 0,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [newFlag, setNewFlag] = useState({
    name: "",
    key: "",
    environment: "Development",
    rollout: 0,
  });

  const handleChange = (e) => {
    setNewFlag({
      ...newFlag,
      [e.target.name]: e.target.value,
    });
  };

  const toggleFlag = (id) => {
    setFlags(
      flags.map((flag) => {
        if (flag.id !== id) {
          return flag;
        }

        return {
          ...flag,
          enabled: !flag.enabled,
          rollout: !flag.enabled && flag.rollout === 0
            ? 10
            : flag.enabled
            ? 0
            : flag.rollout,
        };
      })
    );
  };

  const changeRollout = (id, value) => {
    setFlags(
      flags.map((flag) => {
        if (flag.id !== id) {
          return flag;
        }

        return {
          ...flag,
          rollout: Number(value),
          enabled: Number(value) > 0,
        };
      })
    );
  };

  const deleteFlag = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this feature flag?"
    );

    if (!confirmed) {
      return;
    }

    setFlags(flags.filter((flag) => flag.id !== id));
  };

  const handleCreateFlag = (e) => {
    e.preventDefault();

    if (
      newFlag.name.trim() === "" ||
      newFlag.key.trim() === ""
    ) {
      alert("Please enter feature name and flag key.");
      return;
    }

    const flag = {
      id: Date.now(),
      name: newFlag.name,
      key: newFlag.key,
      environment: newFlag.environment,
      enabled: Number(newFlag.rollout) > 0,
      rollout: Number(newFlag.rollout),
    };

    setFlags([...flags, flag]);

    setNewFlag({
      name: "",
      key: "",
      environment: "Development",
      rollout: 0,
    });

    setShowForm(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Feature Flags</h1>

          <p>
            Control feature availability and progressive exposure
            across environments.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + Create Feature Flag
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Create Feature Flag</h2>

          <form onSubmit={handleCreateFlag}>
            <div className="form-group">
              <label>Feature Name</label>

              <input
                type="text"
                name="name"
                placeholder="Example: New Search UI"
                value={newFlag.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Flag Key</label>

              <input
                type="text"
                name="key"
                placeholder="Example: new-search-ui"
                value={newFlag.key}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Environment</label>

              <select
                name="environment"
                value={newFlag.environment}
                onChange={handleChange}
              >
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>

            <div className="form-group">
              <label>Initial Rollout (%)</label>

              <select
                name="rollout"
                value={newFlag.rollout}
                onChange={handleChange}
              >
                <option value="0">0%</option>
                <option value="10">10%</option>
                <option value="25">25%</option>
                <option value="50">50%</option>
                <option value="100">100%</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-btn"
              >
                Create Flag
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="feature-flag-list">
        {flags.map((flag) => (
          <div
            className="feature-flag-card"
            key={flag.id}
          >
            <div className="feature-flag-header">
              <div>
                <h2>{flag.name}</h2>

                <p className="flag-key">
                  {flag.key}
                </p>
              </div>

              <span
                className={`flag-status ${
                  flag.enabled
                    ? "flag-enabled"
                    : "flag-disabled"
                }`}
              >
                {flag.enabled ? "ON" : "OFF"}
              </span>
            </div>

            <div className="flag-info">
              <div>
                <span>Environment</span>

                <strong>
                  {flag.environment}
                </strong>
              </div>

              <div>
                <span>Rollout</span>

                <strong>
                  {flag.rollout}%
                </strong>
              </div>
            </div>

            <div className="rollout-section">
              <div className="rollout-header">
                <span>Feature Exposure</span>

                <strong>
                  {flag.rollout}%
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={flag.rollout}
                onChange={(e) =>
                  changeRollout(
                    flag.id,
                    e.target.value
                  )
                }
              />
            </div>

            <div className="flag-actions">
              <button
                className={
                  flag.enabled
                    ? "disable-btn"
                    : "enable-btn"
                }
                onClick={() =>
                  toggleFlag(flag.id)
                }
              >
                {flag.enabled
                  ? "Turn OFF"
                  : "Turn ON"}
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  deleteFlag(flag.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureFlags;