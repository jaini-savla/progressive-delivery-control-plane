import { useState } from "react";

function Applications() {
  const [applications, setApplications] = useState([
    {
      id: 1,
      name: "Payment Service",
      environment: "Production",
      version: "v2.4.1",
      status: "Healthy",
    },
    {
      id: 2,
      name: "Order Service",
      environment: "Production",
      version: "v1.8.2",
      status: "Healthy",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [newApplication, setNewApplication] = useState({
    name: "",
    environment: "Development",
    version: "",
  });

  const handleChange = (e) => {
    setNewApplication({
      ...newApplication,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddApplication = (e) => {
    e.preventDefault();

    if (
      newApplication.name.trim() === "" ||
      newApplication.version.trim() === ""
    ) {
      alert("Please enter application name and version.");
      return;
    }

    const application = {
      id: Date.now(),
      name: newApplication.name,
      environment: newApplication.environment,
      version: newApplication.version,
      status: "Healthy",
    };

    setApplications([...applications, application]);

    setNewApplication({
      name: "",
      environment: "Development",
      version: "",
    });

    setShowForm(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p>Manage applications registered in the control plane.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + Add Application
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Add New Application</h2>

          <form onSubmit={handleAddApplication}>
            <div className="form-group">
              <label>Application Name</label>

              <input
                type="text"
                name="name"
                placeholder="Example: Inventory Service"
                value={newApplication.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Environment</label>

              <select
                name="environment"
                value={newApplication.environment}
                onChange={handleChange}
              >
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>

            <div className="form-group">
              <label>Current Version</label>

              <input
                type="text"
                name="version"
                placeholder="Example: v1.0.0"
                value={newApplication.version}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                Add Application
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

      <div className="application-grid">
        {applications.map((application) => (
          <div className="application-card" key={application.id}>
            <div className="application-card-header">
              <div>
                <h2>{application.name}</h2>
                <p>{application.environment}</p>
              </div>

              <span className="status-badge">
                ● {application.status}
              </span>
            </div>

            <div className="application-details">
              <div>
                <span>Current Version</span>
                <strong>{application.version}</strong>
              </div>

              <div>
                <span>Environment</span>
                <strong>{application.environment}</strong>
              </div>
            </div>

            <button className="view-btn">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Applications;