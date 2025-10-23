import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { 
  FileText, 
  Search,
  ArrowLeft,
  RefreshCw,
  Eye,
  File,
  MessageSquare,
  Upload
} from 'lucide-react';
import { uploadService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const userId = user?.id || user?._id;

      if (!userId) {
        setDocuments([]);
        setStats({ totalDocuments: 0 });
        return;
      }

      // Get documents - backend already filters by user
      const documentsData = await uploadService.listDocuments();
      const userDocuments = documentsData.documents || [];

      setDocuments(userDocuments);
      setStats({
        totalDocuments: userDocuments.length,
        publicDocuments: userDocuments.filter(doc => doc.is_public).length
      });
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.public_title && doc.public_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.public_description && doc.public_description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'md':
        return '📋';
      default:
        return '📄';
    }
  };

  const getFileType = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'txt':
        return 'Text File';
      case 'md':
        return 'Markdown File';
      default:
        return 'Document';
    }
  };

  return (
    <div className="min-vh-100 bg-pattern">
      {/* Header */}
      <nav className="navbar navbar-expand-lg glass shadow-soft">
        <Container fluid>
          <div className="d-flex align-items-center">
            <Link
              to="/student-dashboard"
              className="d-flex align-items-center text-muted hover-text-dark me-4"
            >
              <ArrowLeft size={20} className="me-2" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="d-flex align-items-center">
              <div className="bg-success rounded-xl d-flex align-items-center justify-content-center me-3" 
                   style={{width: '48px', height: '48px'}}>
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Document Library</h4>
                <small className="text-muted">Browse available documents</small>
              </div>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center bg-primary rounded-xl px-3 py-2">
              <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-2" 
                   style={{width: '32px', height: '32px'}}>
                <span className="text-white fw-bold">{user?.fullName?.charAt(0) || 'S'}</span>
              </div>
              <div>
                <div className="text-white fw-semibold small">{user?.fullName || 'Student'}</div>
                <div className="text-white-50 small">Student</div>
              </div>
            </div>
          </div>
        </Container>
      </nav>

      {/* Main Content */}
      <Container fluid className="py-5">
        {/* Stats Cards - Simplified for Students */}
        <Row className="g-4 mb-5">
          <Col md={6} lg={4}>
            <Card className="h-100 hover-lift">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-xl d-flex align-items-center justify-content-center" 
                       style={{
                         width: '56px', 
                         height: '56px', 
                         background: 'linear-gradient(135deg, #10b981, #059669)'
                       }}>
                    <FileText size={28} className="text-white" />
                  </div>
                  <Badge bg="success" className="rounded-pill">Available</Badge>
                </div>
                <h3 className="display-6 fw-bold text-dark mb-2">
                  {loading ? <Spinner animation="border" size="sm" /> : stats.totalDocuments}
                </h3>
                <p className="text-muted fw-semibold mb-0">Available Documents</p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={4}>
            <Card className="h-100 hover-lift">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-xl d-flex align-items-center justify-content-center" 
                       style={{
                         width: '56px', 
                         height: '56px', 
                         background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                       }}>
                    <MessageSquare size={28} className="text-white" />
                  </div>
                  <Badge bg="secondary" className="rounded-pill">Community</Badge>
                </div>
                <h3 className="display-6 fw-bold text-dark mb-2">
                  {loading ? <Spinner animation="border" size="sm" /> : (stats.publicDocuments || 0)}
                </h3>
                <p className="text-muted fw-semibold mb-0">Public Documents</p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={12} lg={4}>
            <Card className="h-100 hover-lift">
              <Card.Body className="p-4 text-center">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                     style={{
                       width: '56px', 
                       height: '56px', 
                       background: 'linear-gradient(135deg, #f59e0b, #d97706)'
                     }}>
                  <Upload size={28} className="text-white" />
                </div>
                <h6 className="fw-bold text-dark mb-2">Need to upload?</h6>
                <Button 
                  as={Link} 
                  to="/upload" 
                  variant="warning" 
                  size="sm"
                  className="px-3"
                >
                  Upload Document
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search and Actions */}
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="position-relative">
                      <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
                      <Form.Control
                        type="text"
                        placeholder="Search documents by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-5 border-0 bg-light"
                        style={{paddingLeft: '3rem'}}
                      />
                    </div>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <div className="d-flex align-items-center justify-content-md-end gap-3">
                      <span className="text-muted small">
                        Showing {filteredDocuments.length} of {documents.length}
                      </span>
                      <Button
                        onClick={fetchDocuments}
                        disabled={loading}
                        variant="outline-primary"
                        size="sm"
                        className="d-flex align-items-center"
                      >
                        <RefreshCw size={16} className={`me-1 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Loading State */}
        {loading && (
          <Row>
            <Col>
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-3 text-muted">Loading documents...</div>
              </div>
            </Col>
          </Row>
        )}

        {/* Error State */}
        {error && (
          <Row>
            <Col>
              <Card className="border-danger">
                <Card.Body className="text-center py-5">
                  <div className="text-danger mb-3">
                    <FileText size={48} />
                  </div>
                  <h5 className="text-danger">{error}</h5>
                  <Button 
                    onClick={fetchDocuments} 
                    variant="outline-danger" 
                    size="sm"
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Documents Grid */}
        {!loading && !error && (
          <Row className="g-4">
            {filteredDocuments.length === 0 ? (
              <Col>
                <Card className="text-center py-5">
                  <Card.Body>
                    <FileText size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No documents found</h5>
                    <p className="text-muted mb-4">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No documents are available yet.'}
                    </p>
                    {!searchTerm && (
                      <Button as={Link} to="/upload" variant="primary">
                        <Upload size={16} className="me-2" />
                        Upload First Document
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              filteredDocuments.map((document) => (
                <Col xs={12} sm={6} lg={4} key={document.document_id}>
                  <Card className="h-100 hover-lift">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-start mb-3">
                        <div className="flex-shrink-0 me-3">
                          <div className="bg-light rounded-lg d-flex align-items-center justify-content-center" 
                               style={{width: '48px', height: '48px'}}>
                            <span style={{fontSize: '24px'}}>{getFileIcon(document.filename)}</span>
                          </div>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center mb-1">
                            <h6 className="fw-bold text-dark mb-0 text-truncate">
                              {document.public_title || document.filename}
                            </h6>
                            {document.is_public && (
                              <Badge bg="success" className="ms-2 rounded-pill" style={{fontSize: '0.7rem'}}>
                                Public
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted small mb-0">
                            {document.public_description || getFileType(document.filename)}
                          </p>
                          {!document.public_title && (
                            <p className="text-muted small mb-0">
                              {getFileType(document.filename)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <Eye size={14} className="me-2" />
                          <span>Available for chat</span>
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                          <File size={14} className="me-2" />
                          <span>Ready to use</span>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <Button 
                          as={Link} 
                          to={`/chat?doc=${document.document_id}`}
                          variant="primary" 
                          size="sm"
                          className="flex-grow-1"
                        >
                          <MessageSquare size={14} className="me-1" />
                          Chat
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => {
                            // Could add document preview functionality
                            console.log('Preview:', document.filename);
                          }}
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default StudentDocuments;
