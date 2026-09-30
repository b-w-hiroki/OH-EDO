import ReactDOM from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles.css";
import "./theme-light.css";
import "./transient-feedback.css";
import "./town-events.css";
import "./result-panels.css";
import "./interaction-polish.css";
import "./scene-cast.css";
import "./header-parity.css";
import "./generated-surfaces.css";
import "./approved-mock-final.css";
import "./scene-detail-art.css";
import "./familiarity-badges.css";
import "./visual-consequence.css";
import "./town-mood-dressing.css";
import "./ambient-town-motion.css";
import "./festival-dressing.css";
import "./character-presence.css";
import "./landscape.css";
import "./nav-parity.css";
import "./mobile-talk-parity.css";
import "./title-viewport.css";

// StrictMode is intentionally omitted: its dev-only double mount/unmount
// conflicts with the Phaser canvas lifecycle.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("OH!EDO service worker registration failed", error);
    });
  });
}
