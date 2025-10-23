import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Card, Button, Collapse, Badge, Alert } from 'react-bootstrap';
import { formatTimeOnly } from '../utils/timestamp';

const ChatMessage = ({ message, onFeedback, onCopy }) => {
  const [showSources, setShowSources] = useState(false);

  const formatTime = (timestamp) => {
    return formatTimeOnly(timestamp);
  };

  const getMessageClass = () => {
    switch (message.type) {
      case 'user':
        return 'chat-message user';
      case 'ai':
        return 'chat-message ai';
      case 'error':
        return 'chat-message bg-red-50 border-red-200 text-red-800';
      default:
        return 'chat-message';
    }
  };

  const renderSources = () => {
    if (!message.sources || message.sources.length === 0) return null;

    return (
      <div className="mt-4">
        <Button
          variant="link"
          onClick={() => setShowSources(!showSources)}
          className="p-0 text-decoration-none d-flex align-items-center"
          style={{color: '#6b7280'}}
        >
          {showSources ? (
            <ChevronUp size={16} className="me-2" />
          ) : (
            <ChevronDown size={16} className="me-2" />
          )}
          <span>Sources ({message.sources.length})</span>
        </Button>
        
        <Collapse in={showSources}>
          <div className="mt-3">
            {message.sources.map((source, index) => (
              <Card key={index} className="mb-2 border-0" style={{
                background: 'rgba(248, 250, 252, 0.8)',
                borderRadius: '12px'
              }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <FileText size={16} className="text-muted me-2" />
                    <span className="fw-medium text-dark me-2">
                      {source.filename}
                    </span>
                    <Badge bg="secondary" className="rounded-pill">
                      Section {source.chunk_index}
                    </Badge>
                  </div>
                  <p className="text-muted lh-base mb-2">
                    {source.text}
                  </p>
                  {source.similarity_score && (
                    <div className="text-muted small">
                      Relevance: {(source.similarity_score * 100).toFixed(1)}%
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        </Collapse>
      </div>
    );
  };

  // Function to parse markdown-style bold text
  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="fw-bold">{boldText}</strong>;
      }
      return part;
    });
  };

  const renderActions = () => {
    if (message.type === 'ai') {
      return (
        <div className="d-flex align-items-center gap-3 mt-3">
          <Button
            variant="link"
            size="sm"
            onClick={() => onFeedback(5)}
            className="p-0 text-decoration-none d-flex align-items-center"
            style={{color: '#6b7280'}}
            title="Rate as helpful"
          >
            <ThumbsUp size={16} className="me-1" />
            <span>Helpful</span>
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => onFeedback(1)}
            className="p-0 text-decoration-none d-flex align-items-center"
            style={{color: '#6b7280'}}
            title="Rate as not helpful"
          >
            <ThumbsDown size={16} className="me-1" />
            <span>Not helpful</span>
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => onCopy(message.content)}
            className="p-0 text-decoration-none d-flex align-items-center"
            style={{color: '#6b7280'}}
            title="Copy to clipboard"
          >
            <Copy size={16} className="me-1" />
            <span>Copy</span>
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`mb-3 border-0 ${getMessageClass()}`} style={{
      background: message.type === 'user' 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))',
      borderRadius: '16px',
      boxShadow: message.type === 'user' 
        ? '0 4px 15px rgba(16, 185, 129, 0.1)'
        : '0 4px 15px rgba(0, 0, 0, 0.05)'
    }}>
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Badge 
            bg={message.type === 'user' ? 'success' : message.type === 'ai' ? 'primary' : 'secondary'}
            className="px-3 py-2 rounded-pill"
          >
            {message.type === 'user' ? 'You' : 
             message.type === 'ai' ? 'AI Assistant' : 'System'}
          </Badge>
          <small className="text-muted">
            {formatTime(message.timestamp)}
          </small>
        </div>
        
        <div className="message-content">
          {message.type === 'ai' && (
            <Alert variant="success" className="border-0 mb-3" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px'
            }}>
              <div className="d-flex align-items-center">
                <span className="me-2">💡</span>
                <span className="fw-medium">Here's what I found in your document:</span>
              </div>
            </Alert>
          )}
          
          <div className="lh-lg">
            {message.content.split('\n').map((line, index) => {
              // Check if line starts with bullet points or numbered lists
              if (line.trim().match(/^[-•*]\s/) || line.trim().match(/^\d+\.\s/)) {
                return (
                  <div key={index} className="d-flex align-items-start mb-2">
                    <span className="me-3 fw-bold" style={{color: '#10b981'}}>•</span>
                    <span className="text-dark">{parseBoldText(line.trim().replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, ''))}</span>
                  </div>
                );
              }
              // Regular paragraph
              return line.trim() ? (
                <p key={index} className="mb-3 text-dark">{parseBoldText(line)}</p>
              ) : (
                <br key={index} />
              );
            })}
          </div>
        </div>
        
        {renderSources()}
        {renderActions()}
      </Card.Body>
    </Card>
  );
};

export default ChatMessage; 