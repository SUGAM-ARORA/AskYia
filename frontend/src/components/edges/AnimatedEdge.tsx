import { FC, useMemo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { useExecutionStore } from '../../store/executionSlice';
import '../../styles/Execution.css';

const AnimatedEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const { currentExecution } = useExecutionStore();
  
  const edgeStatus = useMemo(() => {
    return currentExecution?.edgeStates[id]?.status || 'idle';
  }, [currentExecution, id]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine edge styling based on status
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: 2,
      stroke: '#9CA3AF',
      ...style,
    };

    switch (edgeStatus) {
      case 'active':
        return {
          ...baseStyle,
          stroke: '#10B981',
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))',
        };
      case 'completed':
        return {
          ...baseStyle,
          stroke: '#10B981',
          strokeWidth: 2,
        };
      default:
        return baseStyle;
    }
  };

  const edgeStyle = getEdgeStyle();
  const isActive = edgeStatus === 'active';

  return (
    <>
      {/* Background path */}
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...edgeStyle,
          opacity: 0.3,
        }}
      />
      
      {/* Main edge path */}
      <path
        id={id}
        className={`react-flow__edge-path ${isActive ? 'edge-active' : ''}`}
        d={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      
      {/* Animated particles for active edges */}
      {isActive && (
        <>
          <circle r="4" fill="#10B981" className="edge-particle">
            <animateMotion dur="1s" repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          <circle r="4" fill="#10B981" className="edge-particle" style={{ animationDelay: '0.33s' }}>
            <animateMotion dur="1s" repeatCount="indefinite" begin="0.33s">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          <circle r="4" fill="#10B981" className="edge-particle" style={{ animationDelay: '0.66s' }}>
            <animateMotion dur="1s" repeatCount="indefinite" begin="0.66s">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        </>
      )}
      
      {/* Status indicator */}
      {edgeStatus === 'completed' && (
        <EdgeLabelRenderer>
          <div
            className="edge-status-indicator completed"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            ✓
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default AnimatedEdge;