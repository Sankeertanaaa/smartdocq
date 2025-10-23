import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, ProgressBar, Badge } from 'react-bootstrap';
import { Upload, FileText, AlertCircle, CheckCircle, MessageCircle, Shield, Cloud, Zap, Lock } from 'lucide-react';
import { uploadService } from '../services/api';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const UploadPage = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setCurrentDocument } = useChat();
  const { isAuthenticated } = useAuth();
  const maxSize = useMemo(() => 20 * 1024 * 1024, []); // 20MB

  const validateFile = useCallback((file) => {
    // Only check file size, let backend handle file type validation
    if (file.size > maxSize) {
      throw new Error('File size exceeds 20MB limit');
    }
    if (file.size === 0) {
      throw new Error('File appears to be empty');
    }
    return true;
  }, [maxSize]);

  const handleUpload = useCallback(async (file) => {
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Check authentication first
      if (!isAuthenticated()) {
        throw new Error('Please log in to upload documents');
      }

      setUploading(true);
      setError(null);
      setUploadStatus({ type: 'uploading', message: 'Uploading document...' });

      validateFile(file);

      const response = await uploadService.uploadDocument(file);
      
      setUploadStatus({ 
        type: 'success', 
        message: 'Document uploaded successfully! Processing...',
        data: response 
      });

      // Set current document in context
      setCurrentDocument({
        id: response.document_id,
        name: response.filename,
        size: response.file_size,
        status: response.status
      });

      // Navigate to chat after a short delay
      setTimeout(() => {
        navigate('/chat');
      }, 2000);

    } catch (err) {
      let msg = err?.response?.data?.detail || err?.message || 'Upload failed';
      
      // Provide more specific error messages
      if (err?.response?.status === 401) {
        msg = 'Authentication required. Please log in to upload documents.';
      } else if (err?.response?.status === 403) {
        msg = 'Permission denied. You do not have permission to upload documents.';
      } else if (err?.response?.status === 413) {
        msg = 'File too large. Please upload a smaller file.';
      } else if (err?.response?.status === 422) {
        msg = err?.response?.data?.detail || 'Document processing failed. Please try a different file or contact support.';
      }
      
      setError(msg);
      setUploadStatus({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  }, [setCurrentDocument, navigate, validateFile, isAuthenticated]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="min-vh-100 bg-pattern">
      <Container fluid className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} lg={10} xl={8}>
            {/* Header Section */}
            <div className="text-center mb-4 animate-fade-in-down">
              <div className="bg-primary rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3 shadow-strong hover-scale" 
                   style={{width: '70px', height: '70px'}}>
                <Cloud size={32} className="text-white" />
              </div>
              <h1 className="h2 fw-bold text-gradient mb-2">
                Upload Your Document
              </h1>
              <p className="text-muted">
                Upload a PDF, DOCX, or TXT file to start asking questions. Our AI will analyze your document and provide intelligent answers.
              </p>
            </div>

            {/* Upload Area */}
            <Card className="glass shadow-strong mb-4 animate-fade-in-up">
              <Card.Body className="p-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 ${
                    isDragOver
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-muted hover:border-primary hover:bg-light'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{minHeight: '280px'}}
                >
                  {uploading ? (
                    <div className="py-4">
                      <div className="bg-primary bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{width: '70px', height: '70px'}}>
                        <Spinner animation="border" variant="primary" />
                      </div>
                      <h5 className="fw-bold text-dark mb-2">
                        {uploadStatus?.message}
                      </h5>
                      <p className="text-muted mb-3">
                        Please wait while we process your document...
                      </p>
                      <ProgressBar 
                        animated 
                        variant="primary" 
                        className="mt-2 rounded-pill" 
                        style={{height: '6px'}}
                      />
                    </div>
                  ) : uploadStatus?.type === 'success' ? (
                    <div className="py-4">
                      <div className="bg-success bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{width: '70px', height: '70px'}}>
                        <CheckCircle size={32} className="text-success" />
                      </div>
                      <h5 className="fw-bold text-dark mb-2">
                        {uploadStatus.message}
                      </h5>
                      <p className="text-muted">
                        Redirecting to chat...
                      </p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="bg-primary bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                           style={{width: '70px', height: '70px'}}>
                        <Upload size={32} className="text-primary" />
                      </div>
                      <h5 className="fw-bold text-dark mb-2">
                        Drop your document here
                      </h5>
                      <p className="text-muted mb-3">
                        or click to browse files
                      </p>
                      
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="d-none"
                        id="file-upload"
                        disabled={uploading}
                      />
                      <Button
                        as="label"
                        htmlFor="file-upload"
                        variant="primary"
                        className="px-4"
                      >
                        <Upload size={18} className="me-2" />
                        Choose File
                      </Button>
                      
                      <div className="mt-3">
                        <div className="d-flex justify-content-center gap-2 mb-2">
                          <Badge bg="primary" className="px-2 py-1">
                            <FileText size={14} className="me-1" />
                            PDF
                          </Badge>
                          <Badge bg="info" className="px-2 py-1">
                            <FileText size={14} className="me-1" />
                            DOCX
                          </Badge>
                          <Badge bg="success" className="px-2 py-1">
                            <FileText size={14} className="me-1" />
                            TXT
                          </Badge>
                        </div>
                        <small className="text-muted">
                          Maximum file size: 20MB
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="danger" className="border-0 rounded-xl mb-5">
                <div className="d-flex align-items-center">
                  <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-3" 
                       style={{width: '32px', height: '32px'}}>
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="fw-bold text-danger">Upload Error</div>
                    <p className="text-danger mb-0">{error}</p>
                  </div>
                </div>
              </Alert>
            )}

            {/* Features */}
            <Row className="g-4">
              <Col md={4}>
                <Card className="h-100 glass shadow-soft text-center hover-lift animate-fade-in-up" 
                      style={{animationDelay: '0.1s'}}>
                  <Card.Body className="p-4">
                    <div className="bg-primary bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                         style={{width: '80px', height: '80px'}}>
                      <FileText size={40} className="text-primary" />
                    </div>
                    <h5 className="fw-bold text-dark mb-3">Multi-Format Support</h5>
                    <p className="text-muted mb-0">
                      Upload PDF, DOCX, and TXT files with ease. Our system supports all major document formats.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="h-100 glass shadow-soft text-center hover-lift animate-fade-in-up" 
                      style={{animationDelay: '0.2s'}}>
                  <Card.Body className="p-4">
                    <div className="bg-success bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                         style={{width: '80px', height: '80px'}}>
                      <MessageCircle size={40} className="text-success" />
                    </div>
                    <h5 className="fw-bold text-dark mb-3">AI-Powered Q&A</h5>
                    <p className="text-muted mb-0">
                      Ask questions and get intelligent answers. Our AI understands context and provides accurate responses.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="h-100 glass shadow-soft text-center hover-lift animate-fade-in-up" 
                      style={{animationDelay: '0.3s'}}>
                  <Card.Body className="p-4">
                    <div className="bg-warning bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center mx-auto mb-3" 
                         style={{width: '80px', height: '80px'}}>
                      <Shield size={40} className="text-warning" />
                    </div>
                    <h5 className="fw-bold text-dark mb-3">Secure Processing</h5>
                    <p className="text-muted mb-0">
                      Your documents are processed securely and privately. We use enterprise-grade security measures.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Additional Features */}
            <Row className="g-4 mt-2">
              <Col md={6}>
                <Card className="glass shadow-soft hover-lift animate-fade-in-up" 
                      style={{animationDelay: '0.4s'}}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center me-3" 
                           style={{width: '60px', height: '60px'}}>
                        <Zap size={30} className="text-info" />
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-1">Fast Processing</h6>
                        <p className="text-muted mb-0 small">Documents are processed in seconds, not minutes</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="glass shadow-soft hover-lift animate-fade-in-up" 
                      style={{animationDelay: '0.5s'}}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-secondary bg-opacity-10 rounded-xl d-flex align-items-center justify-content-center me-3" 
                           style={{width: '60px', height: '60px'}}>
                        <Lock size={30} className="text-secondary" />
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-1">Privacy First</h6>
                        <p className="text-muted mb-0 small">Your documents are never stored permanently</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UploadPage;