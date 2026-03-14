import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BreakOverlay } from "./BreakOverlay";
import "../../src/globals.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BreakOverlay />
    </StrictMode>,
  );
}
