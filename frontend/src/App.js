import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import UploadPage from './pages/UploadPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminDocuments from './pages/AdminDocuments';
import AdminAnalytics from './pages/AdminAnalytics';
import StudentDashboard from './pages/StudentDashboard';
import StudentDocuments from './pages/StudentDocuments';
import StudyResources from './pages/StudyResources';
import GuestDashboard from './pages/GuestDashboard';
import GuestDemo from './pages/GuestDemo';
import GuestResponses from './pages/GuestResponses';
import GuestHistory from './pages/GuestHistory';
import GuestDocuments from './pages/GuestDocuments';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Component to handle default redirect based on user role
const DefaultRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to appropriate dashboard based on user role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'student':
      return <Navigate to="/student-dashboard" replace />;
    case 'guest':
      return <Navigate to="/guest-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'}}>
            <Header />
            <main className="py-4">
              <Container fluid>
                <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Dashboard Routes */}
                <Route 
                  path="/admin-dashboard" 
                  element={
                    <ProtectedRoute requiredRoles="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student-dashboard" 
                  element={
                    <ProtectedRoute requiredRoles="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest-dashboard" 
                  element={
                    <ProtectedRoute requiredRoles="guest">
                      <GuestDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected Feature Routes */}
                <Route 
                  path="/upload" 
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'student']}>
                      <UploadPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'student', 'guest']}>
                      <ChatPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute requiredRoles={["student", "admin"]}>
                      <HistoryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/documents" 
                  element={
                    <ProtectedRoute requiredRoles={["student", "admin"]}>
                      <StudentDocuments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/resources" 
                  element={
                    <ProtectedRoute requiredRoles={["student", "admin"]}>
                      <StudyResources />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/documents" 
                  element={
                    <ProtectedRoute requiredRoles="admin">
                      <AdminDocuments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedRoute requiredRoles="admin">
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Guest Routes */}
                <Route 
                  path="/guest/responses" 
                  element={
                    <ProtectedRoute requiredRoles="guest">
                      <GuestResponses />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/history" 
                  element={
                    <ProtectedRoute requiredRoles="guest">
                      <GuestHistory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/documents" 
                  element={
                    <ProtectedRoute requiredRoles="guest">
                      <GuestDocuments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/guest/demo" 
                  element={
                    <ProtectedRoute requiredRoles="guest">
                      <GuestDemo />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default Route - Redirect to appropriate dashboard based on auth status */}
                <Route path="/" element={<DefaultRedirect />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Container>
            </main>
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App; 