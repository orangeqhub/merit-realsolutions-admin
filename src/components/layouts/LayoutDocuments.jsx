import { FiFileText, FiDownload } from "react-icons/fi";
import EmptyState from "../layout/EmptyState";
import "./LayoutSections.css";

export default function LayoutDocuments({ documents = [] }) {
  if (!documents.length) {
    return (
      <EmptyState
        icon={<FiFileText />}
        title="No documents"
        description="Approval certificates and legal documents will appear here."
        compact
      />
    );
  }
  return (
    <div className="layout-docs">
      {documents.map((doc) => (
        <article key={doc.id} className="layout-docs__card">
          <span className="layout-docs__icon">
            <FiFileText />
          </span>
          <div className="layout-docs__info">
            <h4>{doc.name}</h4>
            <p>
              {doc.size} · {doc.date}
            </p>
          </div>
          <button type="button" className="layout-docs__download" aria-label={`Download ${doc.name}`}>
            <FiDownload />
          </button>
        </article>
      ))}
    </div>
  );
}
