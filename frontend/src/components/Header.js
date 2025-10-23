import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { FileText, MessageCircle, History, Upload, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!isAuthenticated()) {
      return [];
    }

    const baseItems = [
      { path: '/chat', label: 'Chat', icon: MessageCircle, roles: ['admin', 'student', 'guest'] },
      { path: '/history', label: 'History', icon: History, roles: ['admin', 'student', 'guest'] },
    ];

    if (hasRole('admin') || hasRole('student')) {
      baseItems.unshift({ path: '/upload', label: 'Upload', icon: Upload, roles: ['admin', 'student'] });
    }

    return baseItems.filter(item => item.roles.includes(user?.role));
  };

  const navItems = getNavItems();

  // Don't show header on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  // Don't show header on dashboard pages (they have their own headers)
  if (location.pathname.includes('-dashboard')) {
    return null;
  }

  return (
    <Navbar 
      bg="white" 
      expand="lg" 
      className="shadow-sm border-bottom"
      style={{borderColor: '#e2e8f0'}}
    >
      <Container fluid>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <div 
            className="bg-primary p-2 rounded-3 me-3"
            style={{background: 'linear-gradient(135deg, #10b981, #0d9488)'}}
          >
            <FileText size={24} className="text-white" />
          </div>
          <div className="d-none d-sm-block">
            <h5 className="mb-0 fw-bold text-dark">SmartDocQ</h5>
            <small className="text-muted d-block">AI Document Assistant</small>
          </div>
          <div className="d-sm-none">
            <h6 className="mb-0 fw-bold text-dark">SmartDocQ</h6>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Navigation */}
          {isAuthenticated() && (
            <Nav className="me-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className={`d-flex align-items-center px-3 py-2 rounded-3 me-2 ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-dark hover-bg-light'
                    }`}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #10b981, #0d9488)' : 'transparent',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Icon size={18} className="me-2" />
                    <span className="d-none d-sm-inline">{item.label}</span>
                    <span className="d-sm-none">{item.label.charAt(0)}</span>
                  </Nav.Link>
                );
              })}
            </Nav>
          )}

          {/* Right side - User menu */}
          <Nav className="ms-auto">
            {isAuthenticated() ? (
              <>
                <NavDropdown
                  title={
                    <div className="d-flex align-items-center">
                      <div 
                        className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                        style={{width: '32px', height: '32px', background: 'linear-gradient(135deg, #10b981, #0d9488)'}}
                      >
                        <span className="text-white fw-bold" style={{fontSize: '0.8rem'}}>
                          {user?.fullName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="d-none d-md-inline">{user?.fullName || 'User'}</span>
                      <span className="d-md-none">{user?.fullName?.split(' ')[0] || 'User'}</span>
                    </div>
                  }
                  id="user-dropdown"
                  className="user-dropdown"
                >
                  <NavDropdown.Header>
                    <div>
                      <div className="fw-bold text-dark">{user?.fullName}</div>
                      <small className="text-muted text-capitalize">{user?.role}</small>
                    </div>
                  </NavDropdown.Header>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item onClick={handleLogout}>
                    <LogOut size={16} className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Button 
                  variant="outline-primary" 
                  as={Link} 
                  to="/login"
                  className="px-3"
                >
                  Login
                </Button>
                <Button 
                  variant="primary" 
                  as={Link} 
                  to="/register"
                  className="px-3"
                  style={{background: 'linear-gradient(135deg, #10b981, #0d9488)', border: 'none'}}
                >
                  Register
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 