import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  History, 
  FileText, 
  Eye,
  LogOut,
  Info,
  TrendingUp,
  Clock,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { historyService, uploadService } from '../services/api';

const GuestDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    publicResponses: 0,
    publicDocuments: 0,
    topicsCovered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch public statistics from dedicated endpoint
      const response = await fetch('/api/public/stats');
      
      if (response.ok) {
        const publicStats = await response.json();
        setStats({
          publicResponses: publicStats.public_responses || 0,
          publicDocuments: publicStats.public_documents || 0,
          topicsCovered: publicStats.topics_covered || 0
        });
      } else {
        // Fallback to old method if new endpoint not available
        const historyData = await historyService.getHistory();
        const documentsData = await uploadService.listDocuments();
        
        const allHistory = historyData.history || [];
        const aiResponses = allHistory.filter(item => item.role === 'assistant' || item.message_type === 'ai');
        const publicResponses = aiResponses.length;
        const publicDocuments = documentsData.total_documents || documentsData.documents?.length || 0;
        const uniqueSessions = new Set(allHistory.map(item => item.session_id));
        const topicsCovered = uniqueSessions.size;
        
        setStats({
          publicResponses,
          publicDocuments,
          topicsCovered
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback values on error
      setStats({
        publicResponses: 0,
        publicDocuments: 0,
        topicsCovered: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const features = [
    {
      title: 'Public History',
      description: 'View public chat history and conversations',
      icon: History,
      link: '/guest/history',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      title: 'Browse Documents',
      description: 'View publicly available documents',
      icon: FileText,
      link: '/guest/documents',
      color: 'info',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      title: 'Interactive Demo',
      description: 'Try with sample docs (3 free questions)',
      icon: Eye,
      link: '/guest/demo',
      color: 'success',
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    }
  ];

  const statsData = [
    {
      title: 'Public Responses',
      value: stats.publicResponses,
      icon: Eye,
      color: 'secondary',
      progress: Math.min(100, Math.max(10, stats.publicResponses * 2)),
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      title: 'Public Documents',
      value: stats.publicDocuments,
      icon: FileText,
      color: 'info',
      progress: Math.min(100, Math.max(10, stats.publicDocuments * 10)),
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      title: 'Topics Covered',
      value: stats.topicsCovered,
      icon: MessageSquare,
      color: 'success',
      progress: Math.min(100, Math.max(10, stats.topicsCovered * 5)),
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    }
  ];

  const [recentResponses, setRecentResponses] = useState([]);

  const fetchRecentResponses = useCallback(async () => {
    try {
      const historyData = await historyService.getHistory();
      
      const publicResponses = [];
      const sessionMap = new Map();
      
      historyData.history.forEach(item => {
        if (!sessionMap.has(item.session_id)) {
          sessionMap.set(item.session_id, {
            session_id: item.session_id,
            messages: [],
            last_activity: item.timestamp
          });
        }
        sessionMap.get(item.session_id).messages.push(item);
      });
      
      sessionMap.forEach(session => {
        const messages = session.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        for (let i = 0; i < messages.length; i += 2) {
          if (i + 1 < messages.length) {
            const question = messages[i];
            const answer = messages[i + 1];
            
            if (question.role === 'user' && answer.role === 'assistant') {
              publicResponses.push({
                id: `${session.session_id}_${i}`,
                question: question.content,
                answer: answer.content,
                document: question.sources?.[0]?.document || 'Unknown Document',
                date: formatTimeAgo(question.timestamp)
              });
            }
          }
        }
      });
      
      publicResponses.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentResponses(publicResponses.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recent responses:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecentResponses();
  }, [fetchRecentResponses]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const responseTime = new Date(timestamp);
    const diffInHours = Math.floor((now - responseTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return responseTime.toLocaleDateString();
  };

  return (
    <div className="min-vh-100 bg-pattern">
      {/* Professional Header */}
      <nav className="navbar navbar-expand-lg glass shadow-soft">
        <Container fluid>
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-4">
              <div className="bg-secondary rounded-xl d-flex align-items-center justify-content-center me-3" 
                   style={{width: '48px', height: '48px'}}>
                <Eye size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Guest Dashboard</h4>
                <small className="text-muted">Public Access</small>
              </div>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center bg-secondary rounded-xl px-3 py-2 me-3">
              <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-2" 
                   style={{width: '32px', height: '32px'}}>
                <span className="text-white fw-bold">{user?.fullName?.charAt(0) || 'G'}</span>
              </div>
              <div>
                <div className="text-white fw-semibold small">{user?.fullName || 'Guest'}</div>
                <div className="text-white-50 small">Guest User</div>
              </div>
            </div>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleLogout}
              className="d-flex align-items-center"
            >
              <LogOut size={18} className="me-2" />
              Logout
            </Button>
          </div>
        </Container>
      </nav>

      {/* Main Content */}
      <Container fluid className="py-5">
        {/* Guest Notice */}
        <Row className="mb-5">
          <Col>
            <Alert variant="info" className="border-0 rounded-xl animate-fade-in-down">
              <div className="d-flex align-items-start">
                <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style={{width: '48px', height: '48px'}}>
                  <Info size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="fw-bold text-info mb-2">Guest Access</h5>
                  <p className="text-info mb-0">
                    As a guest, you can view public responses and browse available documents. 
                    To upload documents or start new chat sessions, please register as a student.
                  </p>
                </div>
              </div>
            </Alert>
          </Col>
        </Row>

        {/* Welcome Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center animate-fade-in-down" style={{animationDelay: '0.1s'}}>
              <h1 className="display-5 fw-bold text-gradient mb-3">
                Welcome, {user?.fullName || 'Guest'}
              </h1>
              <p className="lead text-muted">
                Explore public content and discover the power of AI-powered document analysis
              </p>
            </div>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="g-4 mb-5">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Col xs={12} sm={6} lg={4} key={index}>
                <Card className="h-100 hover-lift animate-fade-in-up" 
                      style={{animationDelay: `${(index + 2) * 0.1}s`}}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="rounded-xl d-flex align-items-center justify-content-center" 
                           style={{
                             width: '56px', 
                             height: '56px', 
                             background: stat.gradient
                           }}>
                        <IconComponent size={28} className="text-white" />
                      </div>
                      <Badge bg={stat.color} className="rounded-pill">
                        <TrendingUp size={12} className="me-1" />
                        +8%
                      </Badge>
                    </div>
                    <h3 className="display-6 fw-bold text-dark mb-2">
                      {loading ? <Spinner animation="border" size="sm" /> : stat.value}
                    </h3>
                    <p className="text-muted fw-semibold mb-3">{stat.title}</p>
                    <ProgressBar 
                      now={stat.progress} 
                      variant={stat.color}
                      className="rounded-pill" 
                      style={{height: '8px'}}
                    />
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Features Grid */}
        <Row className="g-4 mb-5">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Col xs={12} sm={6} lg={4} key={index}>
                <Card 
                  as={Link} 
                  to={feature.link}
                  className="h-100 text-decoration-none text-dark hover-lift animate-fade-in-up"
                  style={{animationDelay: `${(index + 5) * 0.1}s`}}
                >
                  <Card.Body className="p-4 text-center">
                    <div className="rounded-xl d-flex align-items-center justify-content-center mx-auto mb-4" 
                         style={{
                           width: '80px', 
                           height: '80px', 
                           background: feature.gradient
                         }}>
                      <IconComponent size={40} className="text-white" />
                    </div>
                    <h5 className="fw-bold text-dark mb-3">{feature.title}</h5>
                    <p className="text-muted mb-4">{feature.description}</p>
                    <div className="d-flex justify-content-center">
                      <div className="rounded-pill" 
                           style={{
                             width: '40px', 
                             height: '4px', 
                             background: feature.gradient
                           }}></div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Recent Public Responses */}
        <Row className="mb-5">
          <Col>
            <Card className="animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <Card.Header className="bg-transparent border-bottom-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="bg-secondary rounded-xl d-flex align-items-center justify-content-center me-3" 
                         style={{width: '48px', height: '48px'}}>
                      <MessageSquare size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-0">Recent Public Responses</h4>
                      <p className="text-muted mb-0">Browse questions and answers from the community</p>
                    </div>
                  </div>
                  <Badge bg="secondary" className="rounded-pill">
                    {recentResponses.length} responses
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {recentResponses.length === 0 ? (
                  <div className="text-center py-5">
                    <MessageSquare size={64} className="text-muted mb-3" />
                    <p className="text-muted fw-medium">No public responses available yet</p>
                    <small className="text-muted">Public responses will appear here as users share their conversations</small>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentResponses.map((response, index) => (
                      <div key={response.id} 
                           className="p-4 border rounded-xl bg-light bg-opacity-50 mb-3 hover-lift">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h6 className="fw-bold text-dark mb-0">{response.question}</h6>
                          <Badge bg="secondary" className="rounded-pill small">
                            <Clock size={12} className="me-1" />
                            {response.date}
                          </Badge>
                        </div>
                        <p className="text-muted mb-3">{response.answer}</p>
                        <div className="d-flex align-items-center text-muted small">
                          <FileText size={14} className="me-2" />
                          <span>From: {response.document}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <Button 
                    as={Link} 
                    to="/guest/responses"
                    variant="secondary"
                    className="px-4"
                  >
                    View All Public Responses
                    <ArrowRight size={16} className="ms-2" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Upgrade Notice */}
        <Row>
          <Col>
            <Card className="border-0 text-white animate-fade-in-up" 
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed, #3b82f6)',
                    animationDelay: '0.9s'
                  }}>
              <Card.Body className="p-5">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h3 className="fw-bold mb-2">Want to do more?</h3>
                    <p className="mb-0 opacity-90">
                      Register as a student to upload documents and start your own chat sessions.
                    </p>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <Button 
                      as={Link} 
                      to="/register"
                      variant="light"
                      size="lg"
                      className="px-4"
                    >
                      <UserPlus size={20} className="me-2" />
                      Register as Student
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default GuestDashboard;