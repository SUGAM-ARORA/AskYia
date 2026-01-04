import { ReactNode } from 'react';
import { useExecutionStore } from '../../store/executionSlice';
import { NodeStatus } from '../../types/execution.types';
import '../../styles/Execution.css';

interface NodeStatusWrapperProps {
  nodeId: string;
  children: ReactNode;
}

const NodeStatusWrapper = ({ nodeId, children }: NodeStatusWrapperProps) => {
  const { currentExecution } = useExecutionStore();
  
  const status: NodeStatus = currentExecution?.nodeStates[nodeId]?.status || 'idle';
  const nodeState = currentExecution?.nodeStates[nodeId];

  const getStatusClass = () => {
    switch (status) {
      case 'pending': return 'node-status-pending';
      case 'running': return 'node-status-running';
      case 'success': return 'node-status-success';
      case 'error': return 'node-status-error';
      case 'skipped': return 'node-status-skipped';
      default: return '';
    }
  };

  return (
    <div className={`node-status-wrapper ${getStatusClass()}`}>
      {children}
      
      {/* Status Badge */}
      {status !== 'idle' && (
        <div className={`node-status-badge ${status}`}>
          {status === 'running' && <span className="status-spinner"></span>}
          {status === 'success' && '✓'}
          {status === 'error' && '✕'}
          {status === 'pending' && '⏳'}
          {status === 'skipped' && '⏭'}
        </div>
      )}

      {/* Duration Badge */}
      {nodeState?.duration && (
        <div className="node-duration-badge">
          {nodeState.duration < 1000 
            ? `${nodeState.duration}ms`
            : `${(nodeState.duration / 1000).toFixed(1)}s`
          }
        </div>
      )}

      {/* Running Animation Overlay */}
      {status === 'running' && (
        <div className="node-running-overlay">
          <div className="running-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default NodeStatusWrapper;