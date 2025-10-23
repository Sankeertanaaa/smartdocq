import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Accordion, Button, Badge } from 'react-bootstrap';
import {
  ArrowLeft,
  HelpCircle,
  Search,
  Upload,
  MessageCircle,
  BookOpen,
  User,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FAQ = () => {
  const { user } = useAuth();
  const [openItems, setOpenItems] = useState({});

  const toggleAccordion = (itemId) => {
    setOpenItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: <User size={20} className="text-primary" />,
      questions: [
        {
          id: 'getting-started-1',
          question: 'How do I create an account?',
          answer: 'You can create an account by clicking the "Register" button on the login page. Fill in your details including your full name, email address, and password. You can register as either a Student or request Admin access.'
        },
        {
          id: 'getting-started-2',
          question: 'What types of documents can I upload?',
          answer: 'SmartDocQ supports various document formats including PDF, DOCX, DOC, TXT, and other text-based files. We recommend PDF format for best results as it preserves formatting and structure.'
        },
        {
          id: 'getting-started-3',
          question: 'How do I upload my first document?',
          answer: 'After logging in, navigate to the "Upload" section from your dashboard. Click the upload area or drag and drop your document. The system will automatically process and analyze your document using AI.'
        }
      ]
    },
    {
      title: 'AI Chat & Analysis',
      icon: <MessageCircle size={20} className="text-success" />,
      questions: [
        {
          id: 'ai-chat-1',
          question: 'How does the AI chat feature work?',
          answer: 'Our AI uses advanced natural language processing to understand your questions about uploaded documents. Simply ask questions in plain English, and the AI will provide accurate answers based on the content of your documents with source citations.'
        },
        {
          id: 'ai-chat-2',
          question: 'What types of questions can I ask?',
          answer: 'You can ask any question related to your documents including: "What is the main topic?", "Explain this concept", "What are the key findings?", "Compare these two sections", or "What does this data show?"'
        },
        {
          id: 'ai-chat-3',
          question: 'How accurate are the AI responses?',
          answer: 'Our AI provides highly accurate responses based on the actual content of your documents. All answers include source citations so you can verify the information. The system continuously learns and improves from user interactions.'
        }
      ]
    },
    {
      title: 'Study Resources & Personalization',
      icon: <BookOpen size={20} className="text-info" />,
      questions: [
        {
          id: 'resources-1',
          question: 'What is the Personal Study Guide?',
          answer: 'The Personal Study Guide is an AI-generated learning plan tailored specifically to you. It analyzes your uploaded documents, chat history, and learning patterns to create personalized recommendations, study plans, and resource suggestions.'
        },
        {
          id: 'resources-2',
          question: 'How often is my Personal Study Guide updated?',
          answer: 'Your study guide updates automatically as you upload new documents, engage in chat sessions, and use the platform. The AI continuously analyzes your learning progress and adjusts recommendations accordingly.'
        },
        {
          id: 'resources-3',
          question: 'What is the Document Summary feature?',
          answer: 'The Document Summary feature analyzes all your uploaded documents and creates a comprehensive overview including key topics, themes, gaps in knowledge, and personalized study recommendations based on your materials.'
        }
      ]
    },
    {
      title: 'Account & Privacy',
      icon: <Shield size={20} className="text-warning" />,
      questions: [
        {
          id: 'privacy-1',
          question: 'Is my data secure and private?',
          answer: 'Yes, your privacy is our top priority. All documents are encrypted and stored securely. We use industry-standard security measures and do not share your personal information or document content with third parties.'
        },
        {
          id: 'privacy-2',
          question: 'Can I delete my account and data?',
          answer: 'Yes, you can request account deletion at any time. This will permanently remove all your documents, chat history, and personal data from our systems. Contact support for assistance with account deletion.'
        },
        {
          id: 'privacy-3',
          question: 'Who can see my uploaded documents?',
          answer: 'Only you can access your uploaded documents. Admin users can see document metadata for system management but cannot view document content without explicit permission.'
        }
      ]
    },
    {
      title: 'Technical Support',
      icon: <HelpCircle size={20} className="text-danger" />,
      questions: [
        {
          id: 'support-1',
          question: 'How do I reset my password?',
          answer: 'Click the "Forgot Password" link on the login page. Enter your email address and you\'ll receive instructions to reset your password. If you don\'t receive the email, check your spam folder.'
        },
        {
          id: 'support-2',
          question: 'Why can\'t I upload a document?',
          answer: 'Common issues include: file size too large (limit is 50MB), unsupported file format, or network connectivity problems. Try using PDF format and ensure your file is under the size limit.'
        },
        {
          id: 'support-3',
          question: 'How do I contact technical support?',
          answer: 'Use the Contact Us page or click the "Contact Support" option in the help modal. You can also email us directly at support@smartdocq.com. We typically respond within 24 hours.'
        }
      ]
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', link: '/getting-started', icon: <BookOpen size={16} /> },
    { title: 'Upload Best Practices', link: '/upload-guide', icon: <Upload size={16} /> },
    { title: 'AI Chat Tips', link: '/chat-tips', icon: <MessageCircle size={16} /> },
    { title: 'Privacy Policy', link: '/privacy', icon: <Shield size={16} /> }
  ];

  return (
    <div className="min-vh-100 bg-pattern">
      {/* Header */}
      <nav className="navbar navbar-expand-lg glass shadow-soft">
        <Container fluid>
          <div className="d-flex align-items-center">
            <Link
              to="/resources"
              className="d-flex align-items-center text-muted hover-text-dark me-4"
            >
              <ArrowLeft size={20} className="me-2" />
              <span>Back to Resources</span>
            </Link>
            <div className="d-flex align-items-center">
              <div className="bg-info rounded-xl d-flex align-items-center justify-content-center me-3"
                   style={{width: '48px', height: '48px'}}>
                <HelpCircle size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Frequently Asked Questions</h4>
                <small className="text-muted">Find answers to common questions</small>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center bg-info rounded-xl px-3 py-2">
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
        {/* Hero Section */}
        <Row className="mb-5">
          <Col>
            <Card className="glass text-center py-5">
              <Card.Body>
                <HelpCircle size={64} className="text-primary mb-3" />
                <h2 className="mb-3">How can we help you today?</h2>
                <p className="text-muted mb-4 lead">
                  Find quick answers to common questions about SmartDocQ features, account management, and technical support.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to="/contact">
                    <Button variant="primary" size="lg">
                      Contact Support
                    </Button>
                  </Link>
                  <Link to="/getting-started">
                    <Button variant="outline-primary" size="lg">
                      Getting Started Guide
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Links */}
        <Row className="mb-5">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h5 className="mb-3 d-flex align-items-center">
                  <Search size={20} className="me-2 text-primary" />
                  Quick Links
                </h5>
                <Row className="g-3">
                  {quickLinks.map((link, index) => (
                    <Col md={3} key={index}>
                      <Link
                        to={link.link}
                        className="text-decoration-none"
                      >
                        <Card className="h-100 hover-lift border-0">
                          <Card.Body className="text-center p-3">
                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                                 style={{width: '40px', height: '40px'}}>
                              <span className="text-primary">{link.icon}</span>
                            </div>
                            <h6 className="mb-0 text-dark">{link.title}</h6>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* FAQ Categories */}
        <Row className="mb-5">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h5 className="mb-4">Browse by Category</h5>
                <Accordion>
                  {faqCategories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="mb-3">
                      <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                        {category.icon}
                        <h6 className="mb-0 ms-2">{category.title}</h6>
                        <Badge bg="primary" className="ms-auto">
                          {category.questions.length} questions
                        </Badge>
                      </div>

                      {category.questions.map((faq, faqIndex) => (
                        <Card key={faq.id} className="mb-2 border-0 shadow-sm">
                          <Card.Header className="bg-white border-0">
                            <div
                              className="d-flex align-items-center justify-content-between cursor-pointer"
                              onClick={() => toggleAccordion(faq.id)}
                              style={{cursor: 'pointer'}}
                            >
                              <h6 className="mb-0 text-primary">{faq.question}</h6>
                              {openItems[faq.id] ?
                                <ChevronUp size={20} className="text-muted" /> :
                                <ChevronDown size={20} className="text-muted" />
                              }
                            </div>
                          </Card.Header>
                          {openItems[faq.id] && (
                            <Card.Body className="pt-0">
                              <p className="mb-0 text-muted">{faq.answer}</p>
                            </Card.Body>
                          )}
                        </Card>
                      ))}
                    </div>
                  ))}
                </Accordion>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Still Need Help */}
        <Row>
          <Col>
            <Card className="bg-primary text-white text-center">
              <Card.Body className="p-4">
                <HelpCircle size={48} className="mb-3 opacity-75" />
                <h5 className="mb-3">Still need help?</h5>
                <p className="mb-4 opacity-90">
                  Can't find the answer you're looking for? Our support team is here to help you get the most out of SmartDocQ.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to="/contact">
                    <Button variant="light" size="lg">
                      Contact Support
                    </Button>
                  </Link>
                  <Button variant="outline-light" size="lg">
                    Browse Documentation
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

export default FAQ;
