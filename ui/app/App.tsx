import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "@pages/Home";
import { Setup } from "@pages/Setup";
import { Onboarding } from "@pages/Onboarding";
import { Overview } from "@pages/Overview";
import { TraceCandidates } from "@pages/TraceCandidates";
import { HealthReport } from "@pages/HealthReport";
import { Settings } from "@pages/Settings";

/**
 * Main App Router
 * Sets up application routes and navigation
 */
export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/trace-candidates" element={<TraceCandidates />} />
        <Route path="/health-report" element={<HealthReport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};
