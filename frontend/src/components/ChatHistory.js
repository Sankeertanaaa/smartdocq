import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Badge, Dropdown, Modal, Alert, Spinner } from 'react-bootstrap';
import { 
  History, 
  Search, 
  MessageCircle, 
  Archive, 
  Trash2, 
  Edit3, 
  MoreVertical,
  Plus,
  Clock,
  Tag,
  FileText,
  Share2,
  Globe,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { historyService } from '../services/api';
import { useChat } from '../context/ChatContext';
import { formatRelativeTime, parseUTCTimestamp } from '../utils/timestamp';

const ChatHistory = ({ isVisible, onToggle, onSessionSelect }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSession, setShareSession] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { sessionId, clearChat } = useChat();

  useEffect(() => {
    if (isVisible) {
      loadSessions();
    }
  }, [isVisible, showArchived]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await historyService.listSessions();
      setSessions(response.sessions || []);
    } catch (err) {
      // Handle different types of errors
      if (err.response?.status === 401) {
        console.log('Authentication required - continuing without user sessions');
        setSessions([]);
      } else {
        setError('Failed to load chat history');
        console.error('Error loading sessions:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = async (session) => {
    try {
      // Load session messages
      const response = await historyService.getHistory(session.session_id);
      
      // Convert messages to chat format
      const messages = [];
      const messageMap = new Map();
      
      response.history.forEach(item => {
        if (item.question && !messageMap.has(`user-${item.timestamp}`)) {
          messages.push({
            id: `user-${item.timestamp}`,
            type: 'user',
            content: item.question,
            timestamp: item.timestamp  // Keep as string, don't convert to Date
          });
          messageMap.set(`user-${item.timestamp}`, true);
        }
        
        if (item.answer && !messageMap.has(`ai-${item.timestamp}`)) {
          messages.push({
            id: `ai-${item.timestamp}`,
            type: 'ai',
            content: item.answer,
            sources: item.sources || [],
            timestamp: item.timestamp  // Keep as string, don't convert to Date
          });
          messageMap.set(`ai-${item.timestamp}`, true);
        }
      });
      
      // Sort messages by timestamp (ensure UTC interpretation)
      messages.sort((a, b) => parseUTCTimestamp(a.timestamp) - parseUTCTimestamp(b.timestamp));
      
      // Notify parent component
      onSessionSelect(session, messages);
      
    } catch (err) {
      setError('Failed to load session');
      console.error('Error loading session:', err);
    }
  };

  const handleDeleteSession = async (sessionIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this chat session?')) {
      return;
    }

    try {
      await historyService.deleteSession(sessionIdToDelete);
      await loadSessions();
      
      // If deleted session is current, clear chat
      if (sessionIdToDelete === sessionId) {
        clearChat();
      }
    } catch (err) {
      setError('Failed to delete session');
      console.error('Error deleting session:', err);
    }
  };

  const handleArchiveSession = async (sessionIdToArchive, archive = true) => {
    try {
      if (archive) {
        await historyService.archiveSession(sessionIdToArchive);
      } else {
        await historyService.unarchiveSession(sessionIdToArchive);
      }
      await loadSessions();
    } catch (err) {
      setError(`Failed to ${archive ? 'archive' : 'unarchive'} session`);
      console.error('Error archiving session:', err);
    }
  };

  const handleRenameSession = async () => {
    if (!selectedSession || !newTitle.trim()) return;

    try {
      await historyService.updateSession(selectedSession.session_id, {
        title: newTitle.trim()
      });
      await loadSessions();
      setShowRenameModal(false);
      setNewTitle('');
      setSelectedSession(null);
    } catch (err) {
      setError('Failed to rename session');
      console.error('Error renaming session:', err);
    }
  };

  const handleGenerateTitle = async (sessionIdForTitle) => {
    try {
      await historyService.generateSessionTitle(sessionIdForTitle);
      await loadSessions();
    } catch (err) {
      setError('Failed to generate title');
      console.error('Error generating title:', err);
    }
  };

  const handleMakePublic = async (sessionIdToShare, isPublic) => {
    try {
      await historyService.updateSession(sessionIdToShare, {
        is_public: isPublic
      });
      await loadSessions();
    } catch (err) {
      setError(`Failed to ${isPublic ? 'make public' : 'make private'} session`);
      console.error('Error updating session visibility:', err);
    }
  };

  const handleShareSession = (session) => {
    setShareSession(session);
    setShowShareModal(true);
    setCopiedLink(false);
  };

  const copyShareLink = async () => {
    if (!shareSession) return;
    
    const shareUrl = `${window.location.origin}/shared/${shareSession.session_id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchQuery || 
      session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.session_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesArchived = showArchived ? session.is_archived : !session.is_archived;
    
    return matchesSearch && matchesArchived;
  });

  const formatDate = (dateString) => {
    return formatRelativeTime(dateString);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="chat-history-sidebar bg-white border-end" style={{ width: '320px', height: '100vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0 d-flex align-items-center">
              <History size={20} className="me-2 text-primary" />
              Chat History
            </h5>
            <Button variant="outline-secondary" size="sm" onClick={onToggle}>
              ×
            </Button>
          </div>

          {/* Search */}
          <InputGroup size="sm" className="mb-3">
            <InputGroup.Text>
              <Search size={16} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          {/* Filters */}
          <div className="d-flex align-items-center justify-content-between">
            <Form.Check
              type="switch"
              id="show-archived"
              label="Show archived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="small"
            />
            <Button variant="primary" size="sm" onClick={() => window.location.href = '/chat'}>
              <Plus size={16} className="me-1" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="m-3 mb-0" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Sessions List */}
        <div className="p-3">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <div className="mt-2 small text-muted">Loading sessions...</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-4">
              <MessageCircle size={48} className="text-muted mb-3" />
              <div className="text-muted">
                {searchQuery ? 'No matching conversations' : 'No chat history yet'}
              </div>
              <div className="small text-muted mt-1">
                {searchQuery ? 'Try a different search term' : 'Start a conversation to see it here'}
              </div>
            </div>
          ) : (
            <div className="sessions-list">
              {filteredSessions.map((session) => (
                <Card 
                  key={session.session_id} 
                  className={`mb-2 session-card ${session.session_id === sessionId ? 'border-primary' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-start justify-content-between">
                      <div 
                        className="flex-grow-1"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="d-flex align-items-center mb-1">
                          <h6 className="mb-0 text-truncate" style={{ maxWidth: '180px' }}>
                            {session.title || 'New Chat'}
                          </h6>
                          {session.is_public && (
                            <Badge bg="success" className="ms-2 small">
                              <Globe size={12} className="me-1" />
                              Public
                            </Badge>
                          )}
                          {session.is_archived && (
                            <Badge bg="secondary" className="ms-2 small">
                              <Archive size={12} className="me-1" />
                              Archived
                            </Badge>
                          )}
                        </div>
                        
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <Clock size={12} className="me-1" />
                          {formatDate(session.last_activity)}
                          <span className="mx-2">•</span>
                          <MessageCircle size={12} className="me-1" />
                          {session.message_count} messages
                        </div>

                        {session.summary && (
                          <div className="small text-muted text-truncate" style={{ maxWidth: '220px' }}>
                            {session.summary}
                          </div>
                        )}

                        {session.tags && session.tags.length > 0 && (
                          <div className="mt-2">
                            {session.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1 small">
                                <Tag size={10} className="me-1" />
                                {tag}
                              </Badge>
                            ))}
                            {session.tags.length > 2 && (
                              <Badge bg="light" text="dark" className="small">
                                +{session.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions Dropdown */}
                      <Dropdown align="end">
                        <Dropdown.Toggle 
                          variant="link" 
                          size="sm" 
                          className="text-muted p-0 border-0"
                          style={{ boxShadow: 'none' }}
                        >
                          <MoreVertical size={16} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item 
                            onClick={() => {
                              setSelectedSession(session);
                              setNewTitle(session.title || '');
                              setShowRenameModal(true);
                            }}
                          >
                            <Edit3 size={14} className="me-2" />
                            Rename
                          </Dropdown.Item>
                          
                          {!session.title && (
                            <Dropdown.Item onClick={() => handleGenerateTitle(session.session_id)}>
                              <FileText size={14} className="me-2" />
                              Generate Title
                            </Dropdown.Item>
                          )}
                          
                          <Dropdown.Item 
                            onClick={() => handleMakePublic(session.session_id, !session.is_public)}
                          >
                            <Globe size={14} className="me-2" />
                            {session.is_public ? 'Make Private' : 'Make Public'}
                          </Dropdown.Item>
                          
                          {session.is_public && (
                            <Dropdown.Item onClick={() => handleShareSession(session)}>
                              <Share2 size={14} className="me-2" />
                              Share Link
                            </Dropdown.Item>
                          )}
                          
                          <Dropdown.Item 
                            onClick={() => handleArchiveSession(session.session_id, !session.is_archived)}
                          >
                            <Archive size={14} className="me-2" />
                            {session.is_archived ? 'Unarchive' : 'Archive'}
                          </Dropdown.Item>
                          
                          <Dropdown.Divider />
                          
                          <Dropdown.Item 
                            className="text-danger"
                            onClick={() => handleDeleteSession(session.session_id)}
                          >
                            <Trash2 size={14} className="me-2" />
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rename Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>New Title</Form.Label>
            <Form.Control
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title..."
              maxLength={50}
            />
            <Form.Text className="text-muted">
              {newTitle.length}/50 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRenameModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRenameSession}
            disabled={!newTitle.trim()}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {shareSession && (
            <>
              <div className="mb-3">
                <h6 className="mb-2">
                  <Globe size={16} className="me-2 text-success" />
                  {shareSession.title || 'New Chat'}
                </h6>
                <p className="text-muted small mb-0">
                  This conversation is now public and can be shared with others.
                </p>
              </div>
              
              <Form.Group>
                <Form.Label>Share Link</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={`${window.location.origin}/shared/${shareSession.session_id}`}
                    readOnly
                    className="me-2"
                  />
                  <Button 
                    variant={copiedLink ? "success" : "outline-primary"}
                    onClick={copyShareLink}
                    style={{ minWidth: '100px' }}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={16} className="me-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="me-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Anyone with this link can view this conversation.
                </Form.Text>
              </Form.Group>

              <Alert variant="info" className="mt-3 mb-0">
                <div className="d-flex align-items-start">
                  <Info size={16} className="me-2 mt-1" />
                  <div>
                    <strong>Privacy Notice:</strong> Making a conversation public means anyone with the link can view all messages in this chat. You can make it private again at any time.
                  </div>
                </div>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Close
          </Button>
          {shareSession && (
            <Button 
              variant="outline-danger" 
              onClick={() => {
                handleMakePublic(shareSession.session_id, false);
                setShowShareModal(false);
              }}
            >
              Make Private
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ChatHistory;
