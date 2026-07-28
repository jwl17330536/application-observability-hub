/**
 * Application Observability Hub - Main Entry Point
 * Bootstraps the React app and renders to DOM
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/App";

const root = ReactDOM.createRoot(
  document.getElementById("root") || document.body
);

root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
