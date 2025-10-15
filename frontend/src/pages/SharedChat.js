import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { MessageCircle, ArrowLeft, Globe, Clock, User, Bot, FileText } from 'lucide-react';
// historyService removed as we're using direct fetch

const SharedChat = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedSession();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSharedSession = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Call the shared session endpoint
      const response = await fetch(`/api/shared/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This shared conversation was not found or is no longer public.');
        } else {
          setError('Failed to load shared conversation.');
        }
        return;
      }
      
      const data = await response.json();
      setSession(data.session);
      setMessages(data.messages);
      
    } catch (err) {
      setError('Failed to load shared conversation.');
      console.error('Error loading shared session:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Loading shared conversation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Alert variant="danger" className="text-center">
              <MessageCircle size={48} className="mb-3" />
              <h5>{error}</h5>
              <p className="mb-3">
                The conversation you're looking for might have been made private or doesn't exist.
              </p>
              <Link to="/" className="btn btn-primary">
                Go to Homepage
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white border-bottom">
        <Container>
          <div className="py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Link to="/" className="text-muted me-3">
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h5 className="mb-0 d-flex align-items-center">
                    <Globe size={20} className="text-success me-2" />
                    {session?.title || 'Shared Chat'}
                  </h5>
                  <small className="text-muted">
                    Shared conversation • {session?.message_count} messages
                  </small>
                </div>
              </div>
              <Badge bg="success" className="px-3 py-2">
                <Globe size={14} className="me-1" />
                Public
              </Badge>
            </div>
          </div>
        </Container>
      </div>

      {/* Chat Messages */}
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            {session?.created_at && (
              <div className="text-center mb-4">
                <small className="text-muted">
                  <Clock size={14} className="me-1" />
                  Created on {formatDate(session.created_at)}
                </small>
              </div>
            )}

            <div className="messages-container">
              {messages.length === 0 ? (
                <Card className="text-center py-5">
                  <Card.Body>
                    <MessageCircle size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No messages in this conversation</h6>
                  </Card.Body>
                </Card>
              ) : (
                messages.map((message, index) => (
                  <Card 
                    key={index} 
                    className={`mb-3 ${message.type === 'user' ? 'ms-auto' : 'me-auto'}`}
                    style={{ maxWidth: '85%' }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center mb-2">
                        <div className={`rounded-circle p-2 me-2 ${
                          message.type === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-secondary text-white'
                        }`}>
                          {message.type === 'user' ? (
                            <User size={16} />
                          ) : (
                            <Bot size={16} />
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold">
                            {message.type === 'user' ? 'User' : 'AI Assistant'}
                          </div>
                          <small className="text-muted">
                            {formatTime(message.timestamp)}
                          </small>
                        </div>
                      </div>
                      
                      <div className="message-content">
                        {message.content.split('\n').map((line, lineIndex) => (
                          <div key={lineIndex}>
                            {line}
                            {lineIndex < message.content.split('\n').length - 1 && <br />}
                          </div>
                        ))}
                      </div>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-top">
                          <small className="text-muted d-flex align-items-center">
                            <FileText size={14} className="me-1" />
                            Sources: {message.sources.length} references
                          </small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-5 pt-4 border-top">
              <div className="text-muted">
                <p className="mb-2">
                  <strong>SmartDocQ</strong> - AI Document Assistant
                </p>
                <p className="small mb-0">
                  Want to create your own AI conversations? 
                  <Link to="/register" className="ms-1">Sign up for free</Link>
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SharedChat;
