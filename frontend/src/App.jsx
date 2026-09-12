import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./Layout";
import Dashboard from "./Dashboard";

import Applications from "./pages/Applications";
import Releases from "./pages/Releases";
import FeatureFlags from "./pages/FeatureFlags";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route element={<Layout />}>

          <Route path="/" element={<Dashboard />} />

          <Route
            path="/applications"
            element={<Applications />}
          />

          <Route
            path="/releases"
            element={<Releases />}
          />

          <Route
            path="/feature-flags"
            element={<FeatureFlags />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/audit-logs"
            element={<AuditLogs />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;