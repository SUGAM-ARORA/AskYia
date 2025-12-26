import React from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, addEdge, Connection, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import UserQueryNode from "../nodes/UserQueryNode";
import KnowledgeBaseNode from "../nodes/KnowledgeBaseNode";
import LLMEngineNode from "../nodes/LLMEngineNode";
import OutputNode from "../nodes/OutputNode";
import { useWorkflow } from "../../hooks/useWorkflow";

const nodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llmEngine: LLMEngineNode,
  output: OutputNode,
};

const WorkspacePanel = () => {
  const { nodes, edges, setNodes, setEdges } = useWorkflow();
  const [rfNodes, , onNodesChange] = useNodesState<Node>(nodes);
  const [rfEdges, , onEdgesChange] = useEdgesState<Edge>(edges);

  const onConnect = (connection: Connection) => {
    const updated = addEdge(connection, rfEdges);
    setEdges(updated);
  };

  React.useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  React.useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  return (
    <div style={{ flex: 1, minHeight: 420 }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
};

export default WorkspacePanel;
