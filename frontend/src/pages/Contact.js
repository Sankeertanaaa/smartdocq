import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Send,
  CheckCircle,
  Users,
  BookOpen,
  Shield,
  Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitStatus('success');
      setFormData({
        ...formData,
        subject: '',
        category: 'general',
        priority: 'medium',
        message: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'account', label: 'Account Issues' },
    { value: 'billing', label: 'Billing & Subscription' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' }
  ];

  const contactMethods = [
    {
      icon: <Mail size={24} className="text-primary" />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@smartdocq.com',
      responseTime: 'Within 24 hours'
    },
    {
      icon: <MessageCircle size={24} className="text-success" />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Available in-app',
      responseTime: 'Instant during business hours'
    },
    {
      icon: <Phone size={24} className="text-warning" />,
      title: 'Phone Support',
      description: 'Speak with a specialist',
      contact: '+1 (555) 123-4567',
      responseTime: 'Business hours only'
    }
  ];

  const businessHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' }
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
              <div className="bg-success rounded-xl d-flex align-items-center justify-content-center me-3"
                   style={{width: '48px', height: '48px'}}>
                <Headphones size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Contact Us</h4>
                <small className="text-muted">Get help from our support team</small>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center bg-success rounded-xl px-3 py-2">
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
                <Headphones size={64} className="text-success mb-3" />
                <h2 className="mb-3">We're here to help!</h2>
                <p className="text-muted mb-4 lead">
                  Have a question or need assistance? Our support team is ready to help you make the most of SmartDocQ.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to="/faq">
                    <Button variant="outline-primary" size="lg">
                      Browse FAQ
                    </Button>
                  </Link>
                  <Button variant="success" size="lg" href="mailto:support@smartdocq.com">
                    <Mail size={18} className="me-2" />
                    Email Support
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-5">
          {/* Contact Form */}
          <Col lg={8}>
            <Card className="glass">
              <Card.Body className="p-4">
                <h5 className="mb-4">Send us a message</h5>

                {submitStatus === 'success' && (
                  <Alert variant="success" className="mb-4">
                    <CheckCircle size={18} className="me-2" />
                    Thank you for contacting us! We'll respond to your message within 24 hours.
                  </Alert>
                )}

                {submitStatus === 'error' && (
                  <Alert variant="danger" className="mb-4">
                    Sorry, there was an error sending your message. Please try again or contact us directly at support@smartdocq.com.
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your email address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          {supportCategories.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Priority</Form.Label>
                        <Form.Select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="Brief description of your inquiry"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Please provide detailed information about your question or issue..."
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-100"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="me-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Contact Information */}
          <Col lg={4}>
            <Card className="glass mb-4">
              <Card.Body className="p-4">
                <h6 className="mb-3">Contact Information</h6>
                {contactMethods.map((method, index) => (
                  <div key={index} className="d-flex align-items-start mb-4">
                    <div className="flex-shrink-0 me-3 mt-1">
                      {method.icon}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{method.title}</h6>
                      <p className="text-muted small mb-1">{method.description}</p>
                      <div className="fw-semibold small">{method.contact}</div>
                      <div className="text-muted small">
                        <Clock size={12} className="me-1" />
                        {method.responseTime}
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>

            <Card className="glass mb-4">
              <Card.Body className="p-4">
                <h6 className="mb-3">Business Hours</h6>
                {businessHours.map((schedule, index) => (
                  <div key={index} className="d-flex justify-content-between py-2">
                    <span className="text-muted">{schedule.day}</span>
                    <span className="fw-semibold">{schedule.hours}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-top">
                  <small className="text-muted">
                    For urgent issues outside business hours, please email us and we'll respond as soon as possible.
                  </small>
                </div>
              </Card.Body>
            </Card>

            <Card className="glass">
              <Card.Body className="p-4 text-center">
                <Users size={48} className="text-primary mb-3" />
                <h6 className="mb-2">Need immediate help?</h6>
                <p className="text-muted small mb-3">
                  Check out our comprehensive FAQ section for instant answers to common questions.
                </p>
                <Link to="/faq">
                  <Button variant="outline-primary" size="sm">
                    Browse FAQ
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Additional Resources */}
        <Row>
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h6 className="mb-3">Additional Resources</h6>
                <Row className="g-3">
                  <Col md={3}>
                    <Link to="/getting-started" className="text-decoration-none">
                      <Card className="text-center hover-lift h-100 border-0">
                        <Card.Body className="p-3">
                          <BookOpen size={32} className="text-primary mb-2" />
                          <h6 className="mb-1">Getting Started</h6>
                          <small className="text-muted">Learn the basics</small>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col md={3}>
                    <Link to="/personal-study-guide" className="text-decoration-none">
                      <Card className="text-center hover-lift h-100 border-0">
                        <Card.Body className="p-3">
                          <MessageCircle size={32} className="text-success mb-2" />
                          <h6 className="mb-1">Study Guide</h6>
                          <small className="text-muted">AI-powered learning</small>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col md={3}>
                    <Link to="/documents" className="text-decoration-none">
                      <Card className="text-center hover-lift h-100 border-0">
                        <Card.Body className="p-3">
                          <Shield size={32} className="text-warning mb-2" />
                          <h6 className="mb-1">Your Documents</h6>
                          <small className="text-muted">Manage uploads</small>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col md={3}>
                    <Link to="/faq" className="text-decoration-none">
                      <Card className="text-center hover-lift h-100 border-0">
                        <Card.Body className="p-3">
                          <Headphones size={32} className="text-info mb-2" />
                          <h6 className="mb-1">Help Center</h6>
                          <small className="text-muted">FAQ & Support</small>
                        </Card.Body>
                      </Card>
                    </Link>
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

export default Contact;
