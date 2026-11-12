
import { useLocation } from "react-router-dom";

export default function ModulePlaceholder() {
  const location = useLocation();

  const moduleName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Module";

  return (
    <div className="placeholder-page">
      <span className="eyebrow">NOVA HMS DEVELOPMENT</span>
      <h1>{moduleName}</h1>
      <p>
        This module is planned for the next development phase.
        Its forms, API endpoints, database operations and permissions
        will be implemented before it is enabled for hospital users.
      </p>
      <span className="phase-label">Coming in the next phase</span>
    </div>
  );
}
