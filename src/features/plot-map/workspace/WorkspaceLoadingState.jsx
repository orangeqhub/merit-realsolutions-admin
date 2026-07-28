import { memo } from 'react';
import { motion } from 'framer-motion';
import { FiMap } from 'react-icons/fi';

function WorkspaceLoadingState({ label = 'Loading map workspace…' }) {
  return (
    <motion.div
      className="ws-p1-loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="ws-p1-loading__card">
        <span className="ws-p1-loading__icon">
          <FiMap aria-hidden />
        </span>
        <div className="ws-p1-loading__bars" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p>{label}</p>
      </div>
    </motion.div>
  );
}

export default memo(WorkspaceLoadingState);
