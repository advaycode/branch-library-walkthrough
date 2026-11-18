import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Walkthrough } from "./walk/Walkthrough";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Walkthrough />
  </StrictMode>,
);
