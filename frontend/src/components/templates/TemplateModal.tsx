
import { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  WORKFLOW_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  TemplateCategory,
  WorkflowTemplate,
  getFeaturedTemplates,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateCountByCategory,
} from '../../data/templates';
import { NODE_DEFINITIONS } from '../../data/nodeDefinitions';
import '../../styles/Templates.css';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (nodes: any[], edges: any[]) => void;
}

const TemplateModal = ({ isOpen, onClose, onLoadTemplate }: TemplateModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all' | 'featured'>('featured');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const categoryCounts = useMemo(() => getTemplateCountByCategory(), []);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let templates: WorkflowTemplate[] = [];

    if (selectedCategory === 'featured') {
      templates = getFeaturedTemplates();
    } else if (selectedCategory === 'all') {
      templates = WORKFLOW_TEMPLATES;
    } else {
      templates = getTemplatesByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      const searchResults = searchTemplates(searchQuery);
      templates = templates.filter(t => searchResults.some(sr => sr.id === t.id));
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  // Get node icon from definitions
  const getNodeIcon = useCallback((nodeType: string): string => {
    const nodeDef = NODE_DEFINITIONS.find(n => n.type === nodeType);
    return nodeDef?.icon || '📦';
  }, []);

  // Load template into workflow
  const handleLoadTemplate = useCallback((template: WorkflowTemplate) => {
    // Create new node IDs to avoid conflicts
    const nodeIdMap: Record<string, string> = {};
    
    const newNodes = template.nodes.map(node => {
      const newId = uuidv4();
      nodeIdMap[node.id] = newId;
      
      return {
        ...node,
        id: newId,
        data: {
          ...node.data,
        },
      };
    });

    // Update edge references with new IDs
    const newEdges = template.edges.map(edge => ({
      ...edge,
      id: uuidv4(),
      source: nodeIdMap[edge.source] || edge.source,
      target: nodeIdMap[edge.target] || edge.target,
      animated: true,
    }));

    onLoadTemplate(newNodes, newEdges);
    onClose();
  }, [onLoadTemplate, onClose]);

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Get difficulty icon
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  // Get category info
  const getCategoryInfo = (category: TemplateCategory) => {
    return TEMPLATE_CATEGORIES[category] || { label: category, icon: '📁', color: '#6B7280' };
  };

  if (!isOpen) return null;

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="template-modal-header">
          <div className="header-title">
            <span className="header-icon">📋</span>
            <h2>Workflow Templates</h2>
            <span className="template-count">{WORKFLOW_TEMPLATES.length} templates</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Search and Controls */}
        <div className="template-controls">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="template-search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Grid View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
              aria-label="List View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="3" rx="1"/>
                <rect x="1" y="7" width="14" height="3" rx="1"/>
                <rect x="1" y="12" width="14" height="3" rx="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          <button
            className={`category-tab ${selectedCategory === 'featured' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('featured')}
          >
            <span className="tab-icon">⭐</span>
            <span>Featured</span>
          </button>
          <button
            className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span className="tab-icon">📦</span>
            <span>All</span>
            <span className="tab-count">{WORKFLOW_TEMPLATES.length}</span>
          </button>
          {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((category) => {
            const categoryInfo = TEMPLATE_CATEGORIES[category];
            return (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
                style={{
                  '--tab-color': categoryInfo.color,
                } as React.CSSProperties}
              >
                <span className="tab-icon">{categoryInfo.icon}</span>
                <span>{categoryInfo.label}</span>
                <span className="tab-count">{categoryCounts[category] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="template-content">
          {/* Template List/Grid */}
          <div className={`template-list ${viewMode}`}>
            {filteredTemplates.length === 0 ? (
              <div className="no-templates">
                <span className="no-templates-icon">🔍</span>
                <h3>No templates found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button 
                  className="reset-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const categoryInfo = getCategoryInfo(template.category);
                const isSelected = selectedTemplate?.id === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`template-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                    style={{
                      '--card-color': categoryInfo.color,
                    } as React.CSSProperties}
                  >
                    {/* Card Header */}
                    <div className="card-header">
                      <span className="card-icon">{template.icon}</span>
                      <div className="card-badges">
                        {template.featured && (
                          <span className="badge featured">⭐ Featured</span>
                        )}
                        <span 
                          className="badge difficulty"
                          style={{ background: getDifficultyColor(template.difficulty) }}
                        >
                          {getDifficultyIcon(template.difficulty)} {template.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body">
                      <h3 className="card-title">{template.name}</h3>
                      <p className="card-description">{template.description}</p>
                    </div>

                    {/* Card Meta */}
                    <div className="card-meta">
                      <span className="meta-item category" style={{ color: categoryInfo.color }}>
                        {categoryInfo.icon} {categoryInfo.label}
                      </span>
                      <span className="meta-item time">
                        ⏱️ {template.estimatedTime}
                      </span>
                      <span className="meta-item nodes">
                        🔷 {template.nodes.length} nodes
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="card-tags">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">
                          #{tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="tag more">+{template.tags.length - 3}</span>
                      )}
                    </div>

                    {/* Quick Action */}
                    <button
                      className="use-template-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadTemplate(template);
                      }}
                    >
                      <span>Use Template</span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Template Preview Panel */}
          {selectedTemplate && (
            <div className="template-preview">
              <div className="preview-header">
                <div className="preview-title">
                  <span className="preview-icon">{selectedTemplate.icon}</span>
                  <div>
                    <h3>{selectedTemplate.name}</h3>
                    <span className="preview-author">by {selectedTemplate.author}</span>
                  </div>
                </div>
                <button 
                  className="close-preview-btn"
                  onClick={() => setSelectedTemplate(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>

              <div className="preview-content">
                {/* Description */}
                <div className="preview-section">
                  <h4>📝 Description</h4>
                  <p>{selectedTemplate.description}</p>
                </div>

                {/* Details */}
                <div className="preview-section">
                  <h4>📊 Details</h4>
                  <div className="preview-details">
                    <div className="detail-item">
                      <span className="detail-label">Category</span>
                      <span 
                        className="detail-value"
                        style={{ color: getCategoryInfo(selectedTemplate.category).color }}
                      >
                        {getCategoryInfo(selectedTemplate.category).icon}{' '}
                        {getCategoryInfo(selectedTemplate.category).label}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Difficulty</span>
                      <span 
                        className="detail-value difficulty-value"
                        style={{ color: getDifficultyColor(selectedTemplate.difficulty) }}
                      >
                        {getDifficultyIcon(selectedTemplate.difficulty)}{' '}
                        {selectedTemplate.difficulty.charAt(0).toUpperCase() + selectedTemplate.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Setup Time</span>
                      <span className="detail-value">⏱️ {selectedTemplate.estimatedTime}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Nodes</span>
                      <span className="detail-value">🔷 {selectedTemplate.nodes.length} nodes</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Connections</span>
                      <span className="detail-value">🔗 {selectedTemplate.edges.length} edges</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Preview */}
                <div className="preview-section">
                  <h4>🔄 Workflow Structure</h4>
                  <div className="workflow-preview">
                    {selectedTemplate.nodes.map((node, index) => {
                      const nodeIcon = getNodeIcon(node.type);
                      return (
                        <div key={node.id} className="preview-node">
                          <span className="node-number">{index + 1}</span>
                          <span className="node-icon-preview">{nodeIcon}</span>
                          <div className="node-info">
                            <span className="node-type">{node.type}</span>
                            <span className="node-label">{node.data.label || node.type}</span>
                          </div>
                          {index < selectedTemplate.nodes.length - 1 && (
                            <span className="node-connector">
                              <svg width="12" height="20" viewBox="0 0 12 20">
                                <path d="M6 0 L6 14 M2 10 L6 14 L10 10" stroke="currentColor" strokeWidth="2" fill="none"/>
                              </svg>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="preview-section">
                  <h4>🏷️ Tags</h4>
                  <div className="preview-tags">
                    {selectedTemplate.tags.map((tag) => (
                      <span key={tag} className="preview-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Actions */}
              <div className="preview-actions">
                <button
                  className="preview-btn secondary"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </button>
                <button
                  className="preview-btn primary"
                  onClick={() => handleLoadTemplate(selectedTemplate)}
                >
                  <span>Use This Template</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;