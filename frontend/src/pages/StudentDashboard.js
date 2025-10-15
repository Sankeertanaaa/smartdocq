import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { historyService } from '../services/api';
import { 
  MessageSquare, 
  History, 
  FileText, 
  BookOpen,
  Search,
  LogOut,
  TrendingUp,
  Clock,
  ArrowRight,
  Upload,
  Brain
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };
  const [chatSessions, setChatSessions] = useState(0);
  const [documentsAccessed, setDocumentsAccessed] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
  };

  const features = [
    {
      title: 'Chat with Documents',
      description: 'Ask questions about uploaded documents',
      icon: MessageSquare,
      link: '/chat',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    {
      title: 'View History',
      description: 'Review your previous chat sessions',
      icon: History,
      link: '/history',
      color: 'info',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      title: 'Browse Documents',
      description: 'View available documents in the system',
      icon: FileText,
      link: '/documents',
      color: 'success',
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      title: 'Study Resources',
      description: 'Access learning materials and guides',
      icon: BookOpen,
      link: '/resources',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    }
  ];

  useEffect(() => {
    const loadStats = async () => {
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Load chat sessions - try user-specific endpoint first, fallback to general
        let sessions = [];
        
        try {
          const sessionsResp = await historyService.listUserSessions(userId);
          sessions = sessionsResp.sessions || [];
        } catch (userSessionError) {
          // Fallback to general sessions and filter by user
          try {
            const allSessionsResp = await historyService.listSessions();
            const allSessions = allSessionsResp.sessions || [];
            // Filter sessions for current user (try both ID and email)
            sessions = allSessions.filter(session => 
              session.user_id === userId || 
              session.user_id === user?.email ||
              session.user_id === user?.id
            );
          } catch (generalError) {
            console.error('Failed to load user sessions:', generalError);
            sessions = [];
          }
        }
        setChatSessions(sessions.length);
        
        // Calculate total questions asked from all sessions
        let totalQuestions = 0;
        const uniqueDocuments = new Set();
        
        for (const session of sessions) {
          // Count messages where message_type is 'user' (questions)
          totalQuestions += Math.floor(session.message_count / 2) || 0; // Assuming roughly half are user messages
          
          // Count unique documents accessed
          if (session.document_ids && session.document_ids.length > 0) {
            session.document_ids.forEach(docId => uniqueDocuments.add(docId));
          }
        }
        
        setQuestionsAsked(totalQuestions);
        setDocumentsAccessed(uniqueDocuments.size);
        
        // Format recent sessions for display (last 3)
        const formattedSessions = sessions.slice(0, 3).map(session => ({
          id: session.session_id,
          title: session.title || 'Untitled Chat',
          document: session.document_ids?.length > 0 ? `${session.document_ids.length} documents` : 'No documents',
          date: formatRelativeTime(session.last_activity),
          questions: Math.floor(session.message_count / 2) || 0
        }));
        setRecentSessions(formattedSessions);
        
      } catch (error) {
        console.error('Error loading user stats:', error);
        setChatSessions(0);
        setDocumentsAccessed(0);
        setQuestionsAsked(0);
        setRecentSessions([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadStats();
      
      // Auto-refresh every 30 seconds to keep dashboard updated
      const interval = setInterval(() => {
        if (user) {
          loadStats();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const stats = [
    {
      title: 'Chat Sessions',
      value: chatSessions,
      icon: MessageSquare,
      color: 'success',
      progress: Math.min(100, chatSessions * 10) || 0,
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    {
      title: 'Documents Accessed',
      value: documentsAccessed,
      icon: FileText,
      color: 'info',
      progress: Math.min(100, documentsAccessed * 10) || 0,
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      title: 'Questions Asked',
      value: questionsAsked,
      icon: Search,
      color: 'secondary',
      progress: Math.min(100, questionsAsked * 2) || 0,
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    }
  ];

  // Recent sessions loaded from API

  return (
    <div className="min-vh-100 bg-pattern">
      {/* Professional Header */}
      <nav className="navbar navbar-expand-lg glass shadow-soft">
        <Container fluid>
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-4">
              <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center me-3" 
                   style={{width: '48px', height: '48px'}}>
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Student Dashboard</h4>
                <small className="text-muted">Learning & Research</small>
              </div>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center bg-primary rounded-xl px-3 py-2 me-3">
              <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-2" 
                   style={{width: '32px', height: '32px'}}>
                <span className="text-white fw-bold">{user?.fullName?.charAt(0) || 'S'}</span>
              </div>
              <div>
                <div className="text-white fw-semibold small">{user?.fullName || 'Student'}</div>
                <div className="text-white-50 small">Student</div>
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
        {/* Welcome Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center animate-fade-in-down">
              <h1 className="display-5 fw-bold text-gradient mb-3">
                Welcome back, {user?.fullName || 'Student'}
              </h1>
              <p className="lead text-muted">
                Continue your learning journey with AI-powered document analysis
              </p>
            </div>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="g-4 mb-5">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Col xs={12} sm={6} lg={4} key={index}>
                <Card className="h-100 hover-lift animate-fade-in-up" 
                      style={{animationDelay: `${index * 0.1}s`}}>
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
                        +15%
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
              <Col xs={12} sm={6} lg={3} key={index}>
                <Card 
                  as={Link} 
                  to={feature.link}
                  className="h-100 text-decoration-none text-dark hover-lift animate-fade-in-up"
                  style={{animationDelay: `${(index + 3) * 0.1}s`}}
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

        {/* Main Content Row */}
        <Row className="g-4">
          {/* Recent Sessions */}
          <Col lg={8}>
            <Card className="animate-fade-in-up" style={{animationDelay: '0.7s'}}>
              <Card.Header className="bg-transparent border-bottom-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center me-3" 
                         style={{width: '48px', height: '48px'}}>
                      <History size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-0">Recent Chat Sessions</h4>
                      <p className="text-muted mb-0">Continue your learning conversations</p>
                    </div>
                  </div>
                  <Badge bg="primary" className="rounded-pill">
                    {recentSessions.length} sessions
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="space-y-3">
                  {recentSessions.length > 0 ? recentSessions.map((session, index) => (
                    <div key={session.id} 
                         className="d-flex align-items-center p-3 border rounded-xl bg-light bg-opacity-50 mb-3 hover-lift">
                      <div className="bg-primary rounded-circle me-3" 
                           style={{width: '12px', height: '12px'}}></div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold text-dark mb-1">{session.title}</h6>
                        <p className="text-muted mb-1 small">{session.document}</p>
                        <div className="d-flex align-items-center gap-3">
                          <Badge bg="info" className="rounded-pill small">
                            {session.questions} questions
                          </Badge>
                          <small className="text-muted">
                            <Clock size={12} className="me-1" />
                            {session.date}
                          </small>
                        </div>
                      </div>
                      <Button 
                        as={Link} 
                        to={`/chat?session=${session.id}`}
                        variant="primary" 
                        size="sm"
                        className="d-flex align-items-center"
                      >
                        Continue
                        <ArrowRight size={16} className="ms-1" />
                      </Button>
                    </div>
                  )) : (
                    <div className="text-center py-5">
                      <MessageSquare size={48} className="text-muted mb-3" />
                      <h6 className="text-muted">No chat sessions yet</h6>
                      <p className="text-muted small mb-3">Start your first conversation to see it here</p>
                      <Button as={Link} to="/chat" variant="primary" size="sm">
                        Start New Chat
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col lg={4}>
            <Card className="animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <Card.Header className="bg-transparent border-bottom-0">
                <div className="d-flex align-items-center">
                  <div className="bg-success rounded-xl d-flex align-items-center justify-content-center me-3" 
                       style={{width: '48px', height: '48px'}}>
                    <MessageSquare size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="fw-bold text-dark mb-0">Quick Actions</h4>
                    <p className="text-muted mb-0">Get started quickly</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="space-y-3">
                  <Button 
                    as={Link} 
                    to="/upload"
                    variant="primary" 
                    className="w-100 d-flex align-items-center justify-content-between p-3"
                  >
                    <div className="d-flex align-items-center">
                      <Upload size={20} className="me-3" />
                      <div className="text-start">
                        <div className="fw-semibold">Upload Document</div>
                        <small className="opacity-75">Start a new analysis</small>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </Button>
                  
                  <Button 
                    as={Link} 
                    to="/chat"
                    variant="outline-primary" 
                    className="w-100 d-flex align-items-center justify-content-between p-3"
                  >
                    <div className="d-flex align-items-center">
                      <MessageSquare size={20} className="me-3" />
                      <div className="text-start">
                        <div className="fw-semibold">Start New Chat</div>
                        <small className="opacity-75">Ask questions about documents</small>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </Button>
                  
                  <Button 
                    as={Link} 
                    to="/history"
                    variant="outline-secondary" 
                    className="w-100 d-flex align-items-center justify-content-between p-3"
                  >
                    <div className="d-flex align-items-center">
                      <History size={20} className="me-3" />
                      <div className="text-start">
                        <div className="fw-semibold">View History</div>
                        <small className="opacity-75">Review past conversations</small>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentDashboard;