import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ProgressBar, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, 
  MessageSquare, 
  History, 
  Users, 
  FileText, 
  BarChart3,
  LogOut,
  Clock,
  TrendingUp,
  Shield,
  Star,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { historyService, feedbackService, uploadService, authService } from '../services/api';

const AdminDashboard = () => {
  const { user, token, loading, logout } = useAuth();
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({});
  const [uploadStats, setUploadStats] = useState({ total_documents: 0 });
  const [userCount, setUserCount] = useState(5);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoadingActivity(true);
        const sessionsResp = await historyService.listSessions();
        const sessions = (sessionsResp.sessions || []).slice(0, 5);
        setRecentSessions(sessions);
        
        const fb = await feedbackService.getFeedbackStats();
        setRecentFeedback((fb.recent_feedback || []).slice().reverse());
        setFeedbackStats(fb);
        
        // Count new feedback (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newFeedback = (fb.recent_feedback || []).filter(f => 
          new Date(f.timestamp) > oneDayAgo
        );
        setNewFeedbackCount(newFeedback.length);
        
        try {
          const up = await uploadService.listDocuments();
          setUploadStats({ total_documents: up.total_documents || up.total_chunks || 0 });
        } catch (_) {}
        
        if (token && user?.role === 'admin') {
          try {
            const users = await authService.getAllUsers();
            setUserCount(users.length || 5);
          } catch (_) {
            setUserCount(5);
          }
        } else {
          setUserCount(5);
        }
      } finally {
        setLoadingActivity(false);
      }
    };
    if (loading) {
      return;
    }
    if (!user || !token) {
      setLoadingActivity(false);
      return;
    }
    loadActivity();
  }, [user, token, loading]);

  const features = [
    {
      title: 'Upload Documents',
      description: 'Upload and manage documents for the system',
      icon: Upload,
      link: '/upload',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    {
      title: 'Chat Interface',
      description: 'Interact with documents using AI-powered chat',
      icon: MessageSquare,
      link: '/chat',
      color: 'info',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      title: 'View History',
      description: 'Review chat history and user interactions',
      icon: History,
      link: '/history',
      color: 'success',
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      title: 'Document Library',
      description: 'Browse and manage all uploaded documents',
      icon: FileText,
      link: '/admin/documents',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      title: 'Analytics',
      description: 'View system analytics and usage statistics',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    }
  ];

  const stats = [
    {
      title: 'Total Documents',
      value: uploadStats.total_documents,
      icon: FileText,
      color: 'primary',
      progress: 60,
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    {
      title: 'Active Users',
      value: userCount,
      icon: Users,
      color: 'info',
      progress: 85,
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      title: 'User Feedback',
      value: feedbackStats.total_feedback || 0,
      icon: Star,
      color: 'warning',
      progress: Math.min((feedbackStats.average_rating || 0) * 20, 100),
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      subtitle: feedbackStats.average_rating ? `Avg: ${feedbackStats.average_rating}★` : 'No ratings yet'
    },
    {
      title: 'Recent Sessions',
      value: recentSessions.length,
      icon: MessageSquare,
      color: 'success',
      progress: 70,
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    }
  ];

  return (
    <div className="min-vh-100 bg-pattern">
      {/* Professional Header */}
      <nav className="navbar navbar-expand-lg glass shadow-soft">
        <Container fluid>
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-4">
              <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center me-3" 
                   style={{width: '48px', height: '48px'}}>
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Admin Dashboard</h4>
                <small className="text-muted">System Administration</small>
              </div>
            </div>
            
            {/* Feedback Notification */}
            {newFeedbackCount > 0 && (
              <div className="d-flex align-items-center ms-4">
                <div className="bg-warning rounded-xl px-3 py-2 d-flex align-items-center">
                  <Star size={16} className="text-white me-2" />
                  <span className="text-white fw-semibold small">
                    {newFeedbackCount} New Feedback
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center bg-primary rounded-xl px-3 py-2 me-3">
              <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-2" 
                   style={{width: '32px', height: '32px'}}>
                <span className="text-white fw-bold">{user?.fullName?.charAt(0) || 'A'}</span>
              </div>
              <div>
                <div className="text-white fw-semibold small">{user?.fullName || 'Admin'}</div>
                <div className="text-white-50 small">Administrator</div>
              </div>
            </div>
            <Button 
              variant="outline-danger" 
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
                Welcome back, {user?.fullName || 'Administrator'}
              </h1>
              <p className="lead text-muted">
                Here's what's happening with your SmartDoc system today
              </p>
            </div>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="g-4 mb-5">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Col xs={12} sm={6} lg={3} key={index}>
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
                        +12%
                      </Badge>
                    </div>
                    <h3 className="display-6 fw-bold text-dark mb-2">{stat.value}</h3>
                    <p className={`text-muted fw-semibold ${stat.subtitle ? 'mb-1' : 'mb-3'}`}>{stat.title}</p>
                    {stat.subtitle && (
                      <p className="text-muted small mb-3">{stat.subtitle}</p>
                    )}
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
                  style={{animationDelay: `${(index + 4) * 0.1}s`}}
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

        {/* Feedback Analytics Section */}
        {feedbackStats.total_feedback > 0 && (
          <Row className="mb-5">
            <Col>
              <Card className="glass shadow-strong animate-fade-in-up">
                <Card.Header className="bg-transparent border-0 pb-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning rounded-xl d-flex align-items-center justify-content-center me-3" 
                           style={{width: '48px', height: '48px'}}>
                        <Star size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-gradient">Feedback Analytics</h4>
                        <small className="text-muted">User satisfaction metrics</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="info" className="px-3 py-2">
                        <MessageSquare size={14} className="me-1" />
                        {feedbackStats.total_feedback} Total
                      </Badge>
                      <Badge bg="warning" className="px-3 py-2">
                        <Star size={14} className="me-1" />
                        {feedbackStats.average_rating}★ Average
                      </Badge>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="pt-4">
                  <Row className="g-4">
                    {/* Rating Distribution */}
                    <Col md={6}>
                      <h6 className="fw-bold text-dark mb-3">Rating Distribution</h6>
                      {feedbackStats.rating_distribution && Object.entries(feedbackStats.rating_distribution).map(([rating, count]) => (
                        <div key={rating} className="d-flex align-items-center mb-2">
                          <div className="d-flex align-items-center me-3" style={{minWidth: '80px'}}>
                            <span className="me-2">{rating}</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                size={12} 
                                className={star <= parseInt(rating) ? 'text-warning' : 'text-muted'}
                                fill={star <= parseInt(rating) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <div className="flex-grow-1">
                            <ProgressBar 
                              now={(count / feedbackStats.total_feedback) * 100} 
                              variant={parseInt(rating) >= 4 ? 'success' : parseInt(rating) >= 3 ? 'warning' : 'danger'}
                              className="rounded-pill" 
                              style={{height: '8px'}}
                            />
                          </div>
                          <span className="ms-2 small text-muted">{count}</span>
                        </div>
                      ))}
                    </Col>

                    {/* Feedback Summary */}
                    <Col md={6}>
                      <h6 className="fw-bold text-dark mb-3">Summary</h6>
                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-xl mb-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-success rounded-circle me-3 d-flex align-items-center justify-content-center" 
                               style={{width: '32px', height: '32px'}}>
                            <ThumbsUp size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="fw-bold text-dark mb-0">Positive Feedback</p>
                            <small className="text-muted">4-5 star ratings</small>
                          </div>
                        </div>
                        <Badge bg="success" className="rounded-pill">
                          {feedbackStats.rating_distribution ? 
                            ((feedbackStats.rating_distribution[4] || 0) + (feedbackStats.rating_distribution[5] || 0)) : 0}
                        </Badge>
                      </div>

                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-xl mb-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-warning rounded-circle me-3 d-flex align-items-center justify-content-center" 
                               style={{width: '32px', height: '32px'}}>
                            <Star size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="fw-bold text-dark mb-0">Neutral Feedback</p>
                            <small className="text-muted">3 star ratings</small>
                          </div>
                        </div>
                        <Badge bg="warning" className="rounded-pill">
                          {feedbackStats.rating_distribution ? (feedbackStats.rating_distribution[3] || 0) : 0}
                        </Badge>
                      </div>

                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-xl">
                        <div className="d-flex align-items-center">
                          <div className="bg-danger rounded-circle me-3 d-flex align-items-center justify-content-center" 
                               style={{width: '32px', height: '32px'}}>
                            <ThumbsDown size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="fw-bold text-dark mb-0">Negative Feedback</p>
                            <small className="text-muted">1-2 star ratings</small>
                          </div>
                        </div>
                        <Badge bg="danger" className="rounded-pill">
                          {feedbackStats.rating_distribution ? 
                            ((feedbackStats.rating_distribution[1] || 0) + (feedbackStats.rating_distribution[2] || 0)) : 0}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Detailed Feedback Management */}
        {recentFeedback.length > 0 && (
          <Row className="mb-5">
            <Col>
              <Card className="glass shadow-strong animate-fade-in-up">
                <Card.Header className="bg-transparent border-0 pb-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="bg-info rounded-xl d-flex align-items-center justify-content-center me-3" 
                           style={{width: '48px', height: '48px'}}>
                        <MessageSquare size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-gradient">Recent Feedback</h4>
                        <small className="text-muted">Latest user feedback and comments</small>
                      </div>
                    </div>
                    <Badge bg="info" className="px-3 py-2">
                      <Star size={14} className="me-1" />
                      {recentFeedback.length} Recent
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="pt-4">
                  <div className="feedback-list">
                    {recentFeedback.slice(0, 5).map((feedback, idx) => (
                      <div key={idx} className="feedback-item p-4 border rounded-xl mb-3 bg-light bg-opacity-30">
                        <div className="d-flex align-items-start">
                          <div className="me-3">
                            <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                              feedback.rating >= 4 ? 'bg-success' : feedback.rating >= 3 ? 'bg-warning' : 'bg-danger'
                            }`} style={{width: '40px', height: '40px'}}>
                              {feedback.rating >= 4 ? (
                                <ThumbsUp size={20} className="text-white" />
                              ) : feedback.rating >= 3 ? (
                                <Star size={20} className="text-white" />
                              ) : (
                                <ThumbsDown size={20} className="text-white" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center">
                                <h6 className="mb-0 fw-bold text-dark me-2">
                                  {feedback.user_name || 'Anonymous User'}
                                </h6>
                                {feedback.user_role && (
                                  <Badge bg={
                                    feedback.user_role === 'admin' ? 'danger' : 
                                    feedback.user_role === 'student' ? 'primary' : 'secondary'
                                  } className="small">
                                    {feedback.user_role}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="d-flex align-items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star}
                                    size={14} 
                                    className={star <= feedback.rating ? 'text-warning' : 'text-muted'}
                                    fill={star <= feedback.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                                <span className="ms-2 fw-bold text-dark">
                                  {feedback.rating}/5
                                </span>
                              </div>
                            </div>
                            
                            {feedback.comment && (
                              <div className="bg-white rounded-lg p-3 mb-3 border-start border-4 border-primary">
                                <p className="mb-0 text-dark fst-italic">
                                  "{feedback.comment}"
                                </p>
                              </div>
                            )}
                            
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center text-muted small">
                                <Clock size={14} className="me-1" />
                                {new Date(feedback.timestamp).toLocaleString()}
                                {feedback.session_id && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <MessageSquare size={14} className="me-1" />
                                    Session: {feedback.session_id.slice(-8)}
                                  </>
                                )}
                              </div>
                              
                              <div className="d-flex align-items-center gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to session or show more details
                                    console.log('View session:', feedback.session_id);
                                  }}
                                >
                                  <MessageSquare size={14} className="me-1" />
                                  View Chat
                                </Button>
                                {feedback.rating <= 2 && (
                                  <Button 
                                    variant="outline-warning" 
                                    size="sm"
                                    onClick={() => {
                                      // Flag for follow-up
                                      console.log('Flag feedback:', feedback);
                                    }}
                                  >
                                    <Star size={14} className="me-1" />
                                    Follow Up
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {recentFeedback.length > 5 && (
                    <div className="text-center mt-4">
                      <Button variant="outline-primary">
                        <MessageSquare size={16} className="me-2" />
                        View All Feedback ({recentFeedback.length})
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Recent Activity */}
        <Row>
          <Col>
            <Card className="animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <Card.Header className="bg-transparent border-bottom-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center me-3" 
                         style={{width: '48px', height: '48px'}}>
                      <BarChart3 size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-0">Recent Activity</h4>
                      <p className="text-muted mb-0">Latest system interactions</p>
                    </div>
                  </div>
                  <Badge bg="primary" className="rounded-pill">
                    {recentSessions.length + recentFeedback.length} items
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {loadingActivity ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p className="text-muted fw-medium">Loading recent activity...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((s, index) => (
                      <div key={s.session_id} 
                           className="d-flex align-items-center p-3 border rounded-xl bg-light bg-opacity-50 mb-3 hover-lift">
                        <div className="bg-primary rounded-circle me-3" 
                             style={{width: '12px', height: '12px'}}></div>
                        <div className="flex-grow-1">
                          <p className="fw-bold text-dark mb-1">
                            Chat session updated · {s.message_count} messages
                          </p>
                          <small className="text-muted">
                            <Clock size={14} className="me-1" />
                            {new Date(s.last_activity).toLocaleString()}
                          </small>
                        </div>
                        <Badge bg="success" className="rounded-pill">Active</Badge>
                      </div>
                    ))}
                    {recentFeedback.map((f, idx) => (
                      <div key={idx} 
                           className="d-flex align-items-start p-3 border rounded-xl bg-light bg-opacity-50 mb-3 hover-lift">
                        <div className="bg-warning rounded-circle me-3 d-flex align-items-center justify-content-center" 
                             style={{width: '32px', height: '32px', minWidth: '32px'}}>
                          <Star size={16} className="text-white" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="d-flex align-items-center">
                              <p className="fw-bold text-dark mb-0 me-2">
                                {f.user_name || 'Anonymous User'}
                              </p>
                              {f.user_role && (
                                <Badge bg={f.user_role === 'admin' ? 'danger' : f.user_role === 'student' ? 'primary' : 'secondary'} 
                                       className="small me-2">
                                  {f.user_role}
                                </Badge>
                              )}
                            </div>
                            <div className="d-flex align-items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  size={12} 
                                  className={star <= f.rating ? 'text-warning' : 'text-muted'}
                                  fill={star <= f.rating ? 'currentColor' : 'none'}
                                />
                              ))}
                              <span className="ms-1 small text-muted">({f.rating}/5)</span>
                            </div>
                          </div>
                          {f.comment && (
                            <div className="bg-white rounded p-2 mb-2 border-start border-warning border-3">
                              <p className="text-dark small mb-0 fst-italic">"{f.comment}"</p>
                            </div>
                          )}
                          <div className="d-flex align-items-center text-muted small">
                            <Clock size={12} className="me-1" />
                            {new Date(f.timestamp).toLocaleString()}
                            {f.session_id && (
                              <>
                                <span className="mx-2">•</span>
                                <MessageSquare size={12} className="me-1" />
                                Session: {f.session_id.slice(-8)}
                              </>
                            )}
                          </div>
                        </div>
                        <Badge bg={f.rating >= 4 ? "success" : f.rating >= 3 ? "warning" : "danger"} className="rounded-pill">
                          {f.rating >= 4 ? <ThumbsUp size={12} /> : f.rating >= 3 ? <Star size={12} /> : <ThumbsDown size={12} />}
                        </Badge>
                      </div>
                    ))}
                    {recentSessions.length === 0 && recentFeedback.length === 0 && (
                      <div className="text-center py-5">
                        <BarChart3 size={64} className="text-muted mb-3" />
                        <p className="text-muted fw-medium">No recent activity</p>
                        <small className="text-muted">Activity will appear here as users interact with the system</small>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;