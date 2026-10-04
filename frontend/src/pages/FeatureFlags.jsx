import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://progressive-delivery-backend-vlrw.onrender.com";

const DEFAULT_FLAGS = [
  {
    name: "New Payment UI",
    key: "new-payment-ui",
    description: "Controls the new payment interface.",
    environment: "Production",
    enabled: true,
    rollout: 25,
  },
  {
    name: "New Checkout Flow",
    key: "new-checkout-flow",
    description: "Controls the new checkout experience.",
    environment: "Staging",
    enabled: true,
    rollout: 100,
  },
  {
    name: "Improved Dashboard",
    key: "improved-dashboard",
    description: "Controls the improved dashboard experience.",
    environment: "Development",
    enabled: false,
    rollout: 0,
  },
];

function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [newFlag, setNewFlag] = useState({
    name: "",
    key: "",
    environment: "Development",
    rollout: 0,
  });

  // =====================================================
  // LOAD FLAGS FROM BACKEND
  // =====================================================

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/feature-flags`
      );

      if (!response.ok) {
        throw new Error("Failed to load feature flags");
      }

      const backendFlags = await response.json();

      /*
       * Backend stores:
       * id
       * name
       * description
       * enabled
       *
       * The frontend additionally keeps:
       * key
       * environment
       * rollout
       *
       * Those values are stored in localStorage.
       */

      const savedExtraData = JSON.parse(
        localStorage.getItem("featureFlagExtraData") || "{}"
      );

      const formattedFlags = backendFlags.map((flag) => {
        const extra = savedExtraData[flag.id] || {};

        return {
          id: flag.id,
          name: flag.name,
          key:
            extra.key ||
            flag.name
              .toLowerCase()
              .replace(/\s+/g, "-"),
          description:
            flag.description || "",
          environment:
            extra.environment || "Development",
          enabled: Boolean(flag.enabled),
          rollout:
            extra.rollout !== undefined
              ? Number(extra.rollout)
              : flag.enabled
              ? 100
              : 0,
        };
      });

      setFlags(formattedFlags);
    } catch (error) {
      console.error(
        "Unable to load feature flags:",
        error
      );

      /*
       * Only use localStorage as a fallback when
       * the backend is temporarily unavailable.
       */
      const localFlags = localStorage.getItem(
        "featureFlags"
      );

      if (localFlags) {
        setFlags(JSON.parse(localFlags));
      } else {
        setFlags([]);
      }

      setMessage(
        "Unable to connect to backend. Showing saved local flags."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SAVE EXTRA FRONTEND INFORMATION
  // =====================================================

  const saveExtraData = (updatedFlags) => {
    const existingExtra = JSON.parse(
      localStorage.getItem("featureFlagExtraData") || "{}"
    );

    const updatedExtra = {
      ...existingExtra,
    };

    updatedFlags.forEach((flag) => {
      if (flag.id) {
        updatedExtra[flag.id] = {
          key: flag.key,
          environment: flag.environment,
          rollout: flag.rollout,
        };
      }
    });

    localStorage.setItem(
      "featureFlagExtraData",
      JSON.stringify(updatedExtra)
    );
  };

  // =====================================================
  // UPDATE LOCAL CACHE
  // =====================================================

  const saveLocalFlags = (updatedFlags) => {
    setFlags(updatedFlags);

    localStorage.setItem(
      "featureFlags",
      JSON.stringify(updatedFlags)
    );

    saveExtraData(updatedFlags);
  };

  // =====================================================
  // CHANGE FORM
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setNewFlag((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // TOGGLE FLAG
  // =====================================================

  const toggleFlag = async (flag) => {
    try {
      setSaving(true);
      setMessage("");

      /*
       * IMPORTANT:
       * Do NOT only change React state.
       *
       * Update the backend so the OFF state survives
       * refreshes and navigation.
       */

      const response = await fetch(
        `${API_BASE_URL}/api/feature-flags/${flag.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: flag.name,
            description: flag.description || "",
            enabled: !flag.enabled,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Unable to update feature flag"
        );
      }

      const updatedBackendFlag =
        await response.json();

      const updatedFlags = flags.map((currentFlag) => {
        if (currentFlag.id !== flag.id) {
          return currentFlag;
        }

        return {
          ...currentFlag,
          enabled:
            Boolean(updatedBackendFlag.enabled),
          rollout: updatedBackendFlag.enabled
            ? currentFlag.rollout > 0
              ? currentFlag.rollout
              : 100
            : 0,
        };
      });

      saveLocalFlags(updatedFlags);

      setMessage(
        updatedBackendFlag.enabled
          ? `✓ ${flag.name} is now ON.`
          : `✓ ${flag.name} is now OFF.`
      );
    } catch (error) {
      console.error(
        "Unable to toggle feature flag:",
        error
      );

      setMessage(
        "❌ Unable to update feature flag. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CHANGE ROLLOUT
  // =====================================================

  const changeRollout = async (flag, value) => {
    const rollout = Number(value);
    const enabled = rollout > 0;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/feature-flags/${flag.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: flag.name,
            description: flag.description || "",
            enabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to update rollout"
        );
      }

      const updatedBackendFlag =
        await response.json();

      const updatedFlags = flags.map((currentFlag) => {
        if (currentFlag.id !== flag.id) {
          return currentFlag;
        }

        return {
          ...currentFlag,
          enabled:
            Boolean(updatedBackendFlag.enabled),
          rollout,
        };
      });

      saveLocalFlags(updatedFlags);

      setMessage(
        rollout === 0
          ? `✓ ${flag.name} is OFF.`
          : `✓ ${flag.name} rollout updated to ${rollout}%.`
      );
    } catch (error) {
      console.error(
        "Unable to change rollout:",
        error
      );

      setMessage(
        "❌ Unable to update rollout."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE FLAG
  // =====================================================

  const deleteFlag = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this feature flag?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/feature-flags/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to delete feature flag"
        );
      }

      const updatedFlags = flags.filter(
        (flag) => flag.id !== id
      );

      saveLocalFlags(updatedFlags);

      setMessage(
        "✓ Feature flag deleted successfully."
      );
    } catch (error) {
      console.error(
        "Unable to delete feature flag:",
        error
      );

      setMessage(
        "❌ Unable to delete feature flag."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CREATE FLAG
  // =====================================================

  const handleCreateFlag = async (e) => {
    e.preventDefault();

    if (
      newFlag.name.trim() === "" ||
      newFlag.key.trim() === ""
    ) {
      alert(
        "Please enter feature name and flag key."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const rollout = Number(
        newFlag.rollout
      );

      const response = await fetch(
        `${API_BASE_URL}/api/feature-flags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newFlag.name.trim(),
            description: `${newFlag.key.trim()} | ${newFlag.environment}`,
            enabled: rollout > 0,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Unable to create feature flag"
        );
      }

      const createdFlag =
        await response.json();

      const frontendFlag = {
        id: createdFlag.id,
        name: createdFlag.name,
        key: newFlag.key.trim(),
        description:
          createdFlag.description || "",
        environment:
          newFlag.environment,
        enabled:
          Boolean(createdFlag.enabled),
        rollout,
      };

      const updatedFlags = [
        ...flags,
        frontendFlag,
      ];

      saveLocalFlags(updatedFlags);

      setNewFlag({
        name: "",
        key: "",
        environment: "Development",
        rollout: 0,
      });

      setShowForm(false);

      setMessage(
        "✓ Feature flag created successfully."
      );
    } catch (error) {
      console.error(
        "Unable to create feature flag:",
        error
      );

      setMessage(
        "❌ Unable to create feature flag."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Feature Flags</h1>
            <p>
              Loading feature flags...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="page-content">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>Feature Flags</h1>

          <p>
            Control feature availability and
            progressive exposure across
            environments.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            setShowForm(!showForm)
          }
        >
          + Create Feature Flag
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div className="feature-flag-message">
          {message}
        </div>
      )}

      {/* CREATE FORM */}

      {showForm && (
        <div className="form-card">

          <h2>
            Create Feature Flag
          </h2>

          <form
            onSubmit={handleCreateFlag}
          >

            <div className="form-group">

              <label>
                Feature Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Example: New Search UI"
                value={newFlag.name}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>
                Flag Key
              </label>

              <input
                type="text"
                name="key"
                placeholder="Example: new-search-ui"
                value={newFlag.key}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>
                Environment
              </label>

              <select
                name="environment"
                value={newFlag.environment}
                onChange={handleChange}
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

            <div className="form-group">

              <label>
                Initial Rollout (%)
              </label>

              <select
                name="rollout"
                value={newFlag.rollout}
                onChange={handleChange}
              >
                <option value="0">
                  0%
                </option>

                <option value="10">
                  10%
                </option>

                <option value="25">
                  25%
                </option>

                <option value="50">
                  50%
                </option>

                <option value="100">
                  100%
                </option>
              </select>

            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Create Flag"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* FLAGS */}

      <div className="feature-flag-list">

        {flags.length === 0 ? (
          <div className="form-card">
            <h2>No feature flags</h2>

            <p>
              Create a feature flag to begin
              controlling application features.
            </p>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              className="feature-flag-card"
              key={flag.id}
            >

              {/* FLAG HEADER */}

              <div className="feature-flag-header">

                <div>

                  <h2>
                    {flag.name}
                  </h2>

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
                  {flag.enabled
                    ? "ON"
                    : "OFF"}
                </span>

              </div>

              {/* INFO */}

              <div className="flag-info">

                <div>
                  <span>
                    Environment
                  </span>

                  <strong>
                    {flag.environment}
                  </strong>
                </div>

                <div>
                  <span>
                    Rollout
                  </span>

                  <strong>
                    {flag.rollout}%
                  </strong>
                </div>

              </div>

              {/* ROLLOUT */}

              <div className="rollout-section">

                <div className="rollout-header">

                  <span>
                    Feature Exposure
                  </span>

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
                      flag,
                      e.target.value
                    )
                  }
                  disabled={saving}
                />

              </div>

              {/* ACTIONS */}

              <div className="flag-actions">

                <button
                  className={
                    flag.enabled
                      ? "disable-btn"
                      : "enable-btn"
                  }
                  onClick={() =>
                    toggleFlag(flag)
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : flag.enabled
                    ? "Turn OFF"
                    : "Turn ON"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteFlag(flag.id)
                  }
                  disabled={saving}
                >
                  Delete
                </button>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default FeatureFlags;