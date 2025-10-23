import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FileText, MessageSquare, Users, Eye } from 'lucide-react';
import { publicService } from '../services/api';

const PublicDashboard = () => {
  const [stats, setStats] = useState({
    public_responses: 0,
    public_documents: 0,
    topics_covered: 0,
    total_public_sessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPublicStats = async () => {
      try {
        const data = await publicService.getPublicStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load public stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPublicStats();
  }, []);

  return (
    <div className="min-vh-100 bg-pattern">
      <Container fluid className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-gradient mb-3">Public Knowledge Base</h1>
          <p className="lead text-muted">
            Explore publicly shared documents and conversations from the community
          </p>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-5">
          <Col md={6} lg={3}>
            <Card className="h-100 hover-lift text-center">
              <Card.Body className="p-4">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{
                       width: '64px',
                       height: '64px',
                       background: 'linear-gradient(135deg, #10b981, #059669)'
                     }}>
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h3 className="display-5 fw-bold text-dark mb-2">
                  {loading ? '...' : stats.public_responses.toLocaleString()}
                </h3>
                <p className="text-muted fw-semibold mb-0">AI Responses</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="h-100 hover-lift text-center">
              <Card.Body className="p-4">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{
                       width: '64px',
                       height: '64px',
                       background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                     }}>
                  <FileText size={32} className="text-white" />
                </div>
                <h3 className="display-5 fw-bold text-dark mb-2">
                  {loading ? '...' : stats.public_documents.toLocaleString()}
                </h3>
                <p className="text-muted fw-semibold mb-0">Public Documents</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="h-100 hover-lift text-center">
              <Card.Body className="p-4">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{
                       width: '64px',
                       height: '64px',
                       background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                     }}>
                  <Users size={32} className="text-white" />
                </div>
                <h3 className="display-5 fw-bold text-dark mb-2">
                  {loading ? '...' : stats.topics_covered.toLocaleString()}
                </h3>
                <p className="text-muted fw-semibold mb-0">Topics Covered</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="h-100 hover-lift text-center">
              <Card.Body className="p-4">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{
                       width: '64px',
                       height: '64px',
                       background: 'linear-gradient(135deg, #f59e0b, #d97706)'
                     }}>
                  <Eye size={32} className="text-white" />
                </div>
                <h3 className="display-5 fw-bold text-dark mb-2">
                  {loading ? '...' : stats.total_public_sessions.toLocaleString()}
                </h3>
                <p className="text-muted fw-semibold mb-0">Public Sessions</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Public Features */}
        <Row className="g-4">
          <Col md={6}>
            <Card className="h-100">
              <Card.Body className="p-4 text-center">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{
                       width: '56px',
                       height: '56px',
                       background: 'linear-gradient(135deg, #10b981, #059669)'
                     }}>
                  <FileText size={28} className="text-white" />
                </div>
                <h5 className="fw-bold text-dark mb-3">Browse Public Documents</h5>
                <p className="text-muted mb-4">
                  Access documents that have been shared publicly by the community.
                  Ask questions and get AI-powered answers based on this shared knowledge.
                </p>
                <Badge bg="success" className="rounded-pill">
                  Coming Soon
                </Badge>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100">
              <Card.Body className="p-4 text-center">
                <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{
                       width: '56px',
                       height: '56px',
                       background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                     }}>
                  <MessageSquare size={28} className="text-white" />
                </div>
                <h5 className="fw-bold text-dark mb-3">View Public Conversations</h5>
                <p className="text-muted mb-4">
                  Read through public chat sessions to see how others have used the AI
                  assistant and discover new ways to interact with the documents.
                </p>
                <Badge bg="success" className="rounded-pill">
                  Coming Soon
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Disclaimer */}
        <Card className="mt-5 border-info">
          <Card.Body className="text-center py-4">
            <div className="text-info mb-3">
              <Eye size={32} />
            </div>
            <h6 className="fw-bold text-info mb-2">Public Access</h6>
            <p className="text-muted mb-0 small">
              This public dashboard shows only content that has been explicitly shared by users.
              All private documents and conversations remain secure and accessible only to their owners.
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default PublicDashboard;
