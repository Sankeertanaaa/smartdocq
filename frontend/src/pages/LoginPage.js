import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated() && user) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show success message if redirected from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'student':
        return '/student-dashboard';
      case 'guest':
        return '/guest-dashboard';
      default:
        return '/';
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password);
      
      if (result.success) {
        const redirectPath = getRedirectPath(result.user.role);
        navigate(redirectPath, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-pattern">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            {/* Header Section */}
            <div className="text-center mb-5 animate-fade-in-down">
              {/* Professional Logo */}
              <div className="mx-auto d-flex align-items-center justify-content-center mb-4 shadow-strong hover-scale" 
                   style={{
                     width: '100px', 
                     height: '100px', 
                     background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                     borderRadius: '24px',
                     transition: 'all 0.3s ease'
                   }}>
                <Shield size={48} className="text-white" />
              </div>
              
              <h1 className="display-5 fw-bold text-gradient mb-3">
                Welcome Back
              </h1>
              <p className="lead text-muted">
                Sign in to your SmartDoc account to continue
              </p>
            </div>

            {/* Login Form Card */}
            <Card className="glass shadow-strong animate-fade-in-up">
              <Card.Body className="p-5">
                <Form onSubmit={handleSubmit}>
                  {/* Success Message */}
                  {successMessage && (
                    <Alert variant="success" className="border-0 rounded-xl mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{width: '32px', height: '32px'}}>
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="fw-semibold">{successMessage}</span>
                      </div>
                    </Alert>
                  )}

                  {/* Email Field */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-3">Email Address</Form.Label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                        <Mail className="text-muted" size={20} />
                      </div>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        className="ps-5 py-3"
                        style={{borderRadius: '12px', border: '2px solid #e5e7eb'}}
                      />
                    </div>
                  </Form.Group>

                  {/* Password Field */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-3">Password</Form.Label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                        <Lock className="text-muted" size={20} />
                      </div>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="ps-5 pe-5 py-3"
                        style={{borderRadius: '12px', border: '2px solid #e5e7eb'}}
                      />
                      <Button
                        type="button"
                        variant="link"
                        className="position-absolute top-50 end-0 translate-middle-y me-3 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{border: 'none', background: 'none'}}
                      >
                        {showPassword ? (
                          <EyeOff className="text-muted" size={20} />
                        ) : (
                          <Eye className="text-muted" size={20} />
                        )}
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Error Message */}
                  {error && (
                    <Alert variant="danger" className="border-0 rounded-xl mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{width: '32px', height: '32px'}}>
                          <AlertCircle size={16} className="text-white" />
                        </div>
                        <span className="fw-semibold">{error}</span>
                      </div>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-100 py-3 mb-4 fw-semibold border-0 btn-lg"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={20} className="ms-2" />
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="text-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1 border-top"></div>
                      <span className="px-3 text-muted small">or</span>
                      <div className="flex-grow-1 border-top"></div>
                    </div>
                  </div>

                  {/* Register Link */}
                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Don't have an account?{' '}
                      <Link
                        to="/register"
                        className="text-decoration-none fw-semibold text-gradient"
                      >
                        Create one here
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Additional Info */}
            <div className="text-center mt-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <p className="text-muted small">
                By signing in, you agree to our{' '}
                <Link to="/terms" className="text-decoration-none">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;