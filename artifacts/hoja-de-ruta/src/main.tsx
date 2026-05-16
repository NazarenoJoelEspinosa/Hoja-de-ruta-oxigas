import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "../../../../lib/api-client-react/src";

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
