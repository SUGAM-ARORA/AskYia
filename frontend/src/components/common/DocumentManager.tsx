import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import '../../styles/DocumentManager.css';

interface RAGStatus {
  status: string;
  document_chunks: number;
  vector_store: string;
  embedding_service: string;
  embedding_dimension: number;
}

interface UploadResult {
  success: boolean;
  filename: string;
  chunks?: number;
  error?: string;
}

interface SearchResult {
  text: string;
  score: number;
  metadata: {
    filename?: string;
    chunk_index?: number;
  };
}

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentManager = ({ isOpen, onClose }: DocumentManagerProps) => {
  const [status, setStatus] = useState<RAGStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/documents/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, fetchStatus]);

  const handleUpload = async (files: FileList | File[]) => {
    if (!files.length) return;

    setUploading(true);
    setUploadResults([]);

    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        results.push({
          success: true,
          filename: file.name,
          chunks: response.data.chunks
        });
      } catch (error: any) {
        results.push({
          success: false,
          filename: file.name,
          error: error.response?.data?.detail || error.message
        });
      }
    }

    setUploadResults(results);
    setUploading(false);
    setUploadProgress('');
    fetchStatus();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await api.post('/documents/search', {
        query: searchQuery,
        top_k: 5
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all documents? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/documents/clear');
      fetchStatus();
      setSearchResults([]);
      setUploadResults([]);
    } catch (error) {
      console.error('Failed to clear documents:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="document-manager-overlay" onClick={onClose}>
      <div className="document-manager" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dm-header">
          <h2>📚 Document Manager</h2>
          <button className="dm-close" onClick={onClose}>✕</button>
        </div>

        {/* Status Section */}
        <div className="dm-status">
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Status</span>
              <span className={`status-value ${status?.document_chunks ? 'ready' : 'empty'}`}>
                {status?.document_chunks ? '🟢 Ready' : '🟡 Empty'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Chunks</span>
              <span className="status-value">{status?.document_chunks || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Store</span>
              <span className="status-value">{status?.vector_store || 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Embeddings</span>
              <span className="status-value">{status?.embedding_service || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dm-tabs">
          <button 
            className={`dm-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload
          </button>
          <button 
            className={`dm-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Test Search
          </button>
        </div>

        {/* Tab Content */}
        <div className="dm-content">
          {activeTab === 'upload' && (
            <div className="dm-section">
              <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="upload-progress">
                    <div className="spinner"></div>
                    <p>{uploadProgress}</p>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📄</div>
                    <p>Drag & drop files here or click to browse</p>
                    <p className="upload-hint">Supports: PDF, TXT, MD, DOC, DOCX</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md,.doc,.docx"
                      onChange={handleFileInput}
                      className="file-input"
                    />
                  </>
                )}
              </div>

              {uploadResults.length > 0 && (
                <div className="upload-results">
                  <h4>Upload Results</h4>
                  {uploadResults.map((result, i) => (
                    <div key={i} className={`upload-result ${result.success ? 'success' : 'error'}`}>
                      <span className="result-icon">{result.success ? '✅' : '❌'}</span>
                      <span className="result-filename">{result.filename}</span>
                      {result.success ? (
                        <span className="result-info">{result.chunks} chunks</span>
                      ) : (
                        <span className="result-error">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="dm-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Enter a query to test document retrieval..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                  {searching ? '...' : '🔍'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, i) => (
                    <div key={i} className="search-result">
                      <div className="result-header">
                        <span className="result-score">
                          {(result.score * 100).toFixed(1)}% match
                        </span>
                        <span className="result-source">
                          {result.message_metadata?.filename || 'Unknown'}
                        </span>
                      </div>
                      <p className="result-text">
                        {result.text.length > 300 
                          ? result.text.slice(0, 300) + '...' 
                          : result.text
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searching && (
                <div className="no-results">
                  No results found. Try a different query or upload more documents.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="dm-actions">
          <button className="btn-secondary" onClick={fetchStatus}>
            🔄 Refresh
          </button>
          <button 
            className="btn-danger" 
            onClick={handleClearAll}
            disabled={!status?.document_chunks}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;