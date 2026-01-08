import { Handle, Position } from "reactflow";
import { useState, useEffect } from "react";
import { KnowledgeBaseNodeData } from "../../types/node.types";
import { useExecutionStore } from "../../store/executionSlice";
import { api } from "../../services/api";
import "../../styles/Nodes.css";

interface RAGStatus {
  status: string;
  document_chunks: number;
  vector_store: string;
  embedding_service: string;
}

const KnowledgeBaseNode = ({ data, id }: { data: KnowledgeBaseNodeData; id: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [file, setFile] = useState<File | string | null>(data.file || null);
  const [topK, setTopK] = useState(data.topK || 3);
  const [threshold, setThreshold] = useState(data.threshold || 0.7);
  const [enabled, setEnabled] = useState(data.enabled !== false);
  
  // RAG Status
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Execution status
  const { currentExecution } = useExecutionStore();
  const nodeStatus = currentExecution?.nodeStates[id]?.status || 'idle';

  // Fetch RAG status on mount
  useEffect(() => {
    fetchRAGStatus();
  }, []);

  const fetchRAGStatus = async () => {
    try {
      const response = await api.get('/documents/status');
      setRagStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch RAG status:', error);
    }
  };

  const handleUpdate = (updates: Partial<KnowledgeBaseNodeData>) => {
    if (data.onUpdate) {
      data.onUpdate(updates);
    }
  };

  // Upload file to backend
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setUploadMessage(`✅ Uploaded: ${response.data.chunks} chunks`);
        handleUpdate({ file: uploadedFile.name });
        // Refresh RAG status
        fetchRAGStatus();
      } else {
        setUploadError('Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Upload failed';
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Update node data when settings change
  useEffect(() => {
    handleUpdate({ topK, threshold, enabled });
  }, [topK, threshold, enabled]);

  // Status-based styling
  const getStatusClass = () => {
    switch (nodeStatus) {
      case 'running': return 'node-running';
      case 'success': return 'node-success';
      case 'error': return 'node-error';
      default: return '';
    }
  };

  return (
    <div className={`custom-node knowledge-node ${getStatusClass()}`}>
      <div className="node-header knowledge-header">
        <div className="node-title">
          <span className="node-icon">📚</span>
          <span>Knowledge Base</span>
          {nodeStatus === 'running' && <span className="status-indicator running">⏳</span>}
          {nodeStatus === 'success' && <span className="status-indicator success">✅</span>}
          {nodeStatus === 'error' && <span className="status-indicator error">❌</span>}
        </div>
        <button
          className="node-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="node-body">
          <p className="node-description">
            Retrieve relevant context from uploaded documents (RAG)
          </p>

          {/* RAG Status Badge */}
          <div className="rag-status-section">
            <div className={`rag-status-badge ${ragStatus?.document_chunks ? 'active' : 'empty'}`}>
              {ragStatus?.document_chunks ? (
                <>📚 {ragStatus.document_chunks} chunks ready</>
              ) : (
                <>⚠️ No documents uploaded</>
              )}
            </div>
            <button 
              className="refresh-btn"
              onClick={fetchRAGStatus}
              title="Refresh status"
            >
              🔄
            </button>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="toggle-text">Enable RAG Retrieval</span>
            </label>
          </div>

          {enabled && (
            <>
              {/* File Upload */}
              <div className="form-group">
                <label className="form-label-small">Upload Document</label>
                <label className="file-upload-label">
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    disabled={uploading}
                  />
                  <div className={`file-upload-button ${file ? "has-file" : ""} ${uploading ? "uploading" : ""}`}>
                    {uploading ? (
                      <span>⏳ Uploading...</span>
                    ) : file ? (
                      <span>📄 {typeof file === "string" ? file : file.name}</span>
                    ) : (
                      <span>Upload File 📤</span>
                    )}
                  </div>
                </label>
                {uploadMessage && (
                  <div className="upload-success">{uploadMessage}</div>
                )}
                {uploadError && (
                  <div className="upload-error">❌ {uploadError}</div>
                )}
              </div>

              {/* Top K Setting */}
              <div className="form-group">
                <label className="form-label-small">
                  Results to retrieve (Top K)
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="slider"
                  />
                  <span className="slider-value">{topK}</span>
                </div>
              </div>

              {/* Similarity Threshold */}
              <div className="form-group">
                <label className="form-label-small">
                  Similarity Threshold
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={threshold * 100}
                    onChange={(e) => setThreshold(parseInt(e.target.value) / 100)}
                    className="slider"
                  />
                  <span className="slider-value">{(threshold * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* RAG Info */}
              {ragStatus && (
                <div className="rag-info">
                  <div className="info-row">
                    <span>Vector Store:</span>
                    <span className="info-value">{ragStatus.vector_store}</span>
                  </div>
                  <div className="info-row">
                    <span>Embeddings:</span>
                    <span className="info-value">{ragStatus.embedding_service}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {!enabled && (
            <div className="disabled-notice">
              RAG retrieval is disabled. Query will pass through without document context.
            </div>
          )}
        </div>
      )}

      {/* Footer with Handles */}
      <div className="node-footer">
        <div className="footer-handle">
          <span className="footer-handle-label">Query</span>
          <Handle
            type="target"
            position={Position.Bottom}
            id="query"
            className="handle-purple"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
        <div className="footer-handle">
          <span className="footer-handle-label">Context</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="context"
            className="handle-purple"
            style={{ position: "relative", transform: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseNode;