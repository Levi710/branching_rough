import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import "./index.css";

// Ensure your index.html contains a <div id="root"></div> element for React to mount the app.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);
