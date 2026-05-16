import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// StrictMode is intentionally omitted: its dev-only double mount/unmount
// conflicts with the Phaser canvas lifecycle.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
