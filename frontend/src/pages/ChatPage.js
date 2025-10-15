import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Badge, Alert } from 'react-bootstrap';
import { Send, FileText, MessageCircle, Bot, RefreshCw, History } from 'lucide-react';
import { chatService, feedbackService, historyService } from '../services/api';
import { useChat } from '../context/ChatContext';
import { useSearchParams } from 'react-router-dom';
import ChatMessage from '../components/ChatMessage';
import FeedbackModal from '../components/FeedbackModal';
import ChatHistory from '../components/ChatHistory';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { 
    messages, 
    addMessage, 
    sessionId, 
    currentDocument, 
    setLoading,
    setError: setContextError,
    loadSession,
    startNewSession,
    sessionTitle
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session from URL parameter
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('session');
    
    if (sessionIdFromUrl && sessionIdFromUrl !== sessionId) {
      console.log('🔄 Loading session from URL:', sessionIdFromUrl);
      setLoadingSession(true);
      setError('');
      
      // Fetch session details and messages
      Promise.all([
        historyService.getHistory(sessionIdFromUrl),
        historyService.listSessions()
      ])
        .then(([historyResponse, sessionsResponse]) => {
          console.log('📥 Session data received:', historyResponse);
          const sessionMessages = historyResponse.history || [];
          console.log('📝 Total history items:', sessionMessages.length);
          
          // Find the session to get its title
          const sessions = sessionsResponse.sessions || [];
          const currentSession = sessions.find(s => s.session_id === sessionIdFromUrl);
          const sessionTitle = currentSession?.title || 'Chat Session';
          console.log('📌 Session title:', sessionTitle);
          
          // Convert history format to chat message format
          const chatMessages = [];
          for (const item of sessionMessages) {
            if (item.question) {
              chatMessages.push({
                id: `user-${Date.now()}-${Math.random()}`,
                type: 'user',
                content: item.question,
                timestamp: new Date(item.timestamp)
              });
            }
            if (item.answer) {
              chatMessages.push({
                id: `ai-${Date.now()}-${Math.random()}`,
                type: 'ai',
                content: item.answer,
                sources: item.sources || [],
                timestamp: new Date(item.timestamp)
              });
            }
          }
          
          console.log('💬 Converted to chat messages:', chatMessages.length);
          
          // Load the session with actual title
          loadSession({
            sessionId: sessionIdFromUrl,
            messages: chatMessages,
            title: sessionTitle
          });
          
          console.log('✅ Session loaded successfully');
          setLoadingSession(false);
        })
        .catch(err => {
          console.error('❌ Error loading session:', err);
          setError(`Failed to load session: ${err.message || 'Unknown error'}`);
          setLoadingSession(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('session')]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setLoading(true);
    setError('');

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    try {
      // Send to API
      const response = await chatService.sendMessage(
        question, 
        sessionId, 
        currentDocument?.id
      );

      // Add AI response
      const aiMessage = {
        id: String(response.question_id || (Date.now() + 1)),
        type: 'ai',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(response.timestamp),
        sessionId: response.session_id,
      };
      addMessage(aiMessage);
      setCurrentResponse(aiMessage);

      // Persist to history
      try {
        await historyService.saveHistory({
          session_id: sessionId,
          question: question,
          answer: response.answer,
          timestamp: new Date().toISOString(),
          sources: response.sources || [],
        });
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error.message || 'Failed to get response';
      setError(errorMsg);
      setContextError(errorMsg);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleFeedback = async (rating, comment = '') => {
    if (!currentResponse) return;

    try {
      await feedbackService.submitFeedback({
        session_id: sessionId,
        question_id: String(currentResponse.id),
        rating,
        comment,
      });
      setShowFeedback(false);
      setCurrentResponse(null);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    startNewSession();
  };

  const handleSessionSelect = (session, messages) => {
    loadSession({
      sessionId: session.session_id,
      messages: messages,
      title: session.title
    });
    setShowHistory(false);
  };

  // Only show "no document" screen if there's no document AND no messages (not loading a session)
  if (!currentDocument && messages.length === 0 && !loadingSession) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-pattern">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={8} lg={6}>
              <Card className="glass shadow-strong text-center animate-fade-in-up">
                <Card.Body className="p-5">
                  <div className="bg-primary bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-4" 
                       style={{width: '100px', height: '100px'}}>
                    <FileText size={48} className="text-primary" />
                  </div>
                  <h3 className="fw-bold text-dark mb-3">No Document Uploaded</h3>
                  <p className="text-muted mb-4">
                    Please upload a document first to start asking questions and get AI-powered answers.
                  </p>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => window.location.href = '/upload'}
                    className="px-4"
                  >
                    <FileText size={20} className="me-2" />
                    Upload Document
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-pattern d-flex">
      {/* Chat History Sidebar */}
      <ChatHistory 
        isVisible={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        onSessionSelect={handleSessionSelect}
      />
      
      {/* Main Chat Area */}
      <div className="flex-grow-1">
        <Container fluid className="py-4">
        {/* Document Info Header */}
        <Row className="mb-4">
          <Col>
            <Card className="glass shadow-soft animate-fade-in-down">
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col xs="auto">
                    <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center" 
                         style={{width: '56px', height: '56px'}}>
                      <FileText size={28} className="text-white" />
                    </div>
                  </Col>
                  <Col>
                    <h5 className="fw-bold text-dark mb-1">
                      {sessionTitle || currentDocument?.name || 'Chat Session'}
                    </h5>
                    <p className="text-muted mb-0">
                      {currentDocument ? (
                        `${currentDocument.name} • ${(currentDocument.size / 1024 / 1024).toFixed(2)} MB • Ready for questions`
                      ) : (
                        'Viewing past conversation'
                      )}
                    </p>
                  </Col>
                  <Col xs="auto">
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="success" className="rounded-pill">
                        <div className="bg-white rounded-circle me-1" style={{width: '6px', height: '6px'}}></div>
                        Active
                      </Badge>
                      <Button variant="outline-secondary" size="sm" onClick={() => setShowHistory(true)}>
                        <History size={16} className="me-1" />
                        History
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={clearChat}>
                        <RefreshCw size={16} className="me-1" />
                        New Chat
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Loading Session */}
        {loadingSession && (
          <Row className="mb-4">
            <Col>
              <Card className="glass">
                <Card.Body className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-3 text-muted">Loading session...</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Error Alert */}
        {error && (
          <Row className="mb-4">
            <Col>
              <Alert variant="danger" className="border-0 rounded-xl">
                <div className="d-flex align-items-center">
                  <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-3" 
                       style={{width: '32px', height: '32px'}}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="fw-semibold">{error}</span>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Chat Messages */}
        <Row className="mb-4">
          <Col>
            <Card className="glass shadow-soft animate-fade-in-up" style={{height: '600px'}}>
              <Card.Body className="p-0 d-flex flex-column">
                <div className="flex-grow-1 overflow-auto p-4" style={{maxHeight: '500px'}}>
                  {messages.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="bg-primary bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-4" 
                           style={{width: '100px', height: '100px'}}>
                        <MessageCircle size={48} className="text-primary" />
                      </div>
                      <h4 className="fw-bold text-dark mb-3">Start asking questions</h4>
                      <p className="text-muted">
                        Ask anything about your uploaded document and get AI-powered answers.
                      </p>
                      <div className="mt-4">
                        <Badge bg="primary" className="me-2 mb-2">Try: "What is this document about?"</Badge>
                        <Badge bg="info" className="me-2 mb-2">Try: "Summarize the key points"</Badge>
                        <Badge bg="success" className="mb-2">Try: "What are the main topics?"</Badge>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message) => (
                        <div key={message.id} className="mb-4">
                          <ChatMessage
                            message={message}
                            onFeedback={() => {
                              setCurrentResponse(message);
                              setShowFeedback(true);
                            }}
                            onCopy={() => copyToClipboard(message.content)}
                          />
                        </div>
                      ))}
                      {isLoading && (
                        <div className="d-flex align-items-center p-4 bg-light rounded-xl mb-3 animate-fade-in-up">
                          <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center me-3" 
                               style={{width: '40px', height: '40px'}}>
                            <Bot size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="d-flex align-items-center mb-1">
                              <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                              <span className="fw-semibold text-dark">AI is thinking...</span>
                            </div>
                            <small className="text-muted">Processing your question</small>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Input Form */}
        <Row>
          <Col>
            <Card className="glass shadow-soft animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  <Row className="align-items-end">
                    <Col>
                      <Form.Group>
                        <Form.Control
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Ask a question about your document..."
                          disabled={isLoading}
                          className="py-3"
                          style={{
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            padding: '12px 16px'
                          }}
                        />
                      </Form.Group>
                      <Form.Text className="text-muted">
                        Press Enter to send, or click the send button
                      </Form.Text>
                    </Col>
                    <Col xs="auto">
                      <Button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        variant="primary"
                        size="lg"
                        className="px-4"
                      >
                        {isLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <Send size={20} />
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        </Container>
      </div>

      {/* Feedback Modal */}
      {showFeedback && currentResponse && (
        <FeedbackModal
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedback}
        />
      )}
    </div>
  );
};

export default ChatPage;