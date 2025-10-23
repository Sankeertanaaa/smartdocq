import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return setError('Full Name is required');
    if (!formData.email.trim()) return setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setError('Enter a valid email');
    if (!formData.password) return setError('Password is required');
    if (!validatePassword(formData.password)) return setError('Password must be at least 8 chars with uppercase, lowercase, number, special char');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      console.log('Submitting registration form:', {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        passwordLength: formData.password.length
      });

      const result = await register(formData);
      console.log('Registration result:', result);

      if (result.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login', {
          state: { message: 'Registration successful! Please sign in to continue.' }
        }), 2000);
      } else {
        console.error('Registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['danger', 'warning', 'info', 'success', 'success'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

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
                     background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                     borderRadius: '24px',
                     transition: 'all 0.3s ease'
                   }}>
                <UserPlus size={48} className="text-white" />
              </div>
              
              <h1 className="display-5 fw-bold text-gradient mb-3">Create Your Account</h1>
              <p className="lead text-muted">Join SmartDoc to explore intelligent document solutions</p>
            </div>

            {/* Registration Form Card */}
            <Card className="glass shadow-strong animate-fade-in-up">
              <Card.Body className="p-5">
                <Form onSubmit={handleSubmit}>
                  {/* Success / Error Alerts */}
                  {successMessage && (
                    <Alert variant="success" className="border-0 rounded-xl mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{width: '32px', height: '32px'}}>
                          <CheckCircle size={16} className="text-white" />
                        </div>
                        <span className="fw-semibold">{successMessage}</span>
                      </div>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="danger" className="border-0 rounded-xl mb-4">
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
                  )}

                  {/* Full Name */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-3">Full Name</Form.Label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                        <User className="text-muted" size={20} />
                      </div>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="ps-5 py-3"
                        style={{borderRadius: '12px', border: '2px solid #e5e7eb'}}
                      />
                    </div>
                  </Form.Group>

                  {/* Email */}
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
                        className="ps-5 py-3"
                        style={{borderRadius: '12px', border: '2px solid #e5e7eb'}}
                      />
                    </div>
                  </Form.Group>

                  {/* Role */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-3">Account Type</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="py-3"
                      style={{borderRadius: '12px', border: '2px solid #e5e7eb'}}
                    >
                      <option value="student">Student</option>
                      <option value="guest">Guest</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Choose the account type that best fits your needs
                    </Form.Text>
                  </Form.Group>

                  {/* Password */}
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
                        placeholder="Create a strong password"
                        autoComplete="new-password"
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
                        {showPassword ? <EyeOff className="text-muted" size={20} /> : <Eye className="text-muted" size={20} />}
                      </Button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">Password Strength</small>
                          <small className={`fw-semibold text-${strengthColors[passwordStrength - 1] || 'muted'}`}>
                            {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                          </small>
                        </div>
                        <ProgressBar 
                          now={(passwordStrength / 5) * 100} 
                          variant={strengthColors[passwordStrength - 1] || 'danger'}
                          className="rounded-pill" 
                          style={{height: '6px'}}
                        />
                        <div className="mt-2">
                          <small className="text-muted">
                            Password must contain: uppercase, lowercase, number, special character (8+ chars)
                          </small>
                        </div>
                      </div>
                    )}
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-dark mb-3">Confirm Password</Form.Label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
                        <Lock className="text-muted" size={20} />
                      </div>
                      <Form.Control
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        className="ps-5 pe-5 py-3"
                        style={{borderRadius: '12px', border: '2px solid #e5e7eb'}}
                      />
                      <Button
                        type="button"
                        variant="link"
                        className="position-absolute top-50 end-0 translate-middle-y me-3 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{border: 'none', background: 'none'}}
                      >
                        {showConfirmPassword ? <EyeOff className="text-muted" size={20} /> : <Eye className="text-muted" size={20} />}
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-100 py-3 fw-semibold border-0 btn-lg mb-4"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
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

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none fw-semibold text-gradient">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Additional Info */}
            <div className="text-center mt-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <p className="text-muted small">
                By creating an account, you agree to our{' '}
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

export default RegisterPage;