import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  Calendar,
  User,
  Target,
  Lightbulb,
  CheckCircle,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PersonalStudyGuide = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user') || user?.id;

  const [studyGuide, setStudyGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load personalized study guide data from API
    const loadStudyGuide = async () => {
      setLoading(true);
      try {
        const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/personal-study-guide`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStudyGuide(result.data);
          } else {
            throw new Error(result.message || 'Failed to load study guide');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error loading study guide:', err);
        setError('Failed to load study guide. Using fallback data.');

        // Fallback to mock data if API fails
        const mockStudyGuide = generateMockStudyGuide();
        setStudyGuide(mockStudyGuide);
      }
      setLoading(false);
    };

    const generateMockStudyGuide = () => {
    return {
      id: userId,
      title: `${user?.fullName || 'Your'} Personal Study Guide`,
      generatedDate: new Date().toISOString().split('T')[0],
      userInfo: {
        name: user?.fullName || 'Student',
        email: user?.email || '',
        joinDate: user?.createdAt || new Date().toISOString().split('T')[0]
      },
      learningProgress: {
        totalDocuments: 8,
        totalSessions: 15,
        averageScore: 82,
        studyStreak: 7
      },
      recommendations: [
        {
          title: 'Document Analysis Skills',
          description: 'Focus on improving your ability to extract key information from complex documents.',
          priority: 'High',
          progress: 65,
          tips: [
            'Read abstracts and conclusions first',
            'Identify key terms and concepts',
            'Practice summarizing main arguments',
            'Ask questions about implications'
          ]
        },
        {
          title: 'Research Question Formulation',
          description: 'Develop stronger research questions to guide your learning process.',
          priority: 'Medium',
          progress: 45,
          tips: [
            'Use the 5W1H method (What, Why, When, Where, Who, How)',
            'Make questions specific and answerable',
            'Consider the scope and feasibility',
            'Align with your learning objectives'
          ]
        },
        {
          title: 'Critical Thinking Development',
          description: 'Enhance your analytical skills and critical evaluation of information.',
          priority: 'Medium',
          progress: 80,
          tips: [
            'Evaluate source credibility',
            'Identify biases and assumptions',
            'Consider alternative perspectives',
            'Draw evidence-based conclusions'
          ]
        }
      ],
      studyPlan: [
        {
          week: 1,
          title: 'Foundation Building',
          topics: ['Document structure analysis', 'Key information extraction', 'Basic summarization'],
          activities: ['Upload 3 new documents', 'Complete 5 chat sessions', 'Create personal summaries']
        },
        {
          week: 2,
          title: 'Skill Development',
          topics: ['Advanced question formulation', 'Critical analysis', 'Source evaluation'],
          activities: ['Practice with complex documents', 'Analyze research papers', 'Compare multiple sources']
        },
        {
          week: 3,
          title: 'Application & Review',
          topics: ['Real-world application', 'Integration of concepts', 'Self-assessment'],
          activities: ['Apply skills to new materials', 'Review progress', 'Plan next steps']
        }
      ],
      resources: [
        {
          title: 'Academic Writing Guide',
          description: 'Improve your academic writing skills',
          type: 'PDF',
          url: '/resources/academic-writing.pdf'
        },
        {
          title: 'Research Methods',
          description: 'Learn essential research methodologies',
          type: 'Interactive',
          url: '/resources/research-methods'
        },
        {
          title: 'Critical Thinking Toolkit',
          description: 'Tools and techniques for better analysis',
          type: 'PDF',
          url: '/resources/critical-thinking.pdf'
        }
      ]
    };
    };

    loadStudyGuide();
  }, [userId]);

  const handleDownload = () => {
    if (!studyGuide) return;

    const content = `
${studyGuide.title}

Generated: ${studyGuide.generatedDate}

=== YOUR LEARNING PROFILE ===

Name: ${studyGuide.userInfo.name}
Email: ${studyGuide.userInfo.email}
Member Since: ${studyGuide.userInfo.joinDate}

=== LEARNING PROGRESS ===

Total Documents Analyzed: ${studyGuide.learningProgress.totalDocuments}
Chat Sessions Completed: ${studyGuide.learningProgress.totalSessions}
Average Performance: ${studyGuide.learningProgress.averageScore}%
Current Study Streak: ${studyGuide.learningProgress.studyStreak} days

=== PERSONALIZED RECOMMENDATIONS ===

${studyGuide.recommendations.map((rec, index) => `
${index + 1}. ${rec.title} (${rec.priority} Priority)
   Progress: ${rec.progress}%
   Description: ${rec.description}

   Tips:
   ${rec.tips.map(tip => `- ${tip}`).join('\n   ')}

`).join('\n')}

=== 3-WEEK STUDY PLAN ===

${studyGuide.studyPlan.map(week => `
Week ${week.week}: ${week.title}
Topics: ${week.topics.join(', ')}
Activities: ${week.activities.map(activity => `- ${activity}`).join('\n           ')}

`).join('\n')}

=== RECOMMENDED RESOURCES ===

${studyGuide.resources.map(resource => `
- ${resource.title}: ${resource.description} (${resource.type})
  Access: ${resource.url}
`).join('\n')}

This personalized study guide will be updated as you continue learning with SmartDocQ.
Keep up the great work!

---
Generated by SmartDocQ AI Assistant
${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${user?.fullName || 'Personal'}_Study_Guide.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-pattern">
        <Container fluid className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h4>Generating Your Personal Study Guide...</h4>
            <p className="text-muted">Analyzing your learning patterns and creating personalized recommendations</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 bg-pattern">
        <Container fluid className="py-5">
          <Card className="text-center py-5">
            <Card.Body>
              <div className="text-danger mb-3">⚠️</div>
              <h5>Error Loading Study Guide</h5>
              <p className="text-muted mb-4">{error}</p>
              <div className="mb-3">
                <p className="text-muted small mb-2">This might be due to:</p>
                <ul className="text-muted small mb-3">
                  <li>Backend server not running</li>
                  <li>Network connectivity issues</li>
                  <li>Authentication token expired</li>
                  <li>AI service configuration issues</li>
                </ul>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <Button variant="primary" onClick={() => window.location.reload()}>
                  🔄 Try Again
                </Button>
                <Link to="/contact">
                  <Button variant="outline-primary">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

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
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Personal Study Guide</h4>
                <small className="text-muted">AI-generated personalized learning plan</small>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={handleDownload}
            >
              <Download size={16} className="me-1" />
              Download
            </Button>
            <div className="d-flex align-items-center bg-primary rounded-xl px-3 py-2">
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
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="mb-1 fw-bold">{studyGuide?.title}</h5>
                    <div className="d-flex align-items-center text-muted small">
                      <Calendar size={14} className="me-1" />
                      Generated on {new Date(studyGuide?.generatedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge bg="success" className="px-3 py-2">
                    <Award size={14} className="me-1" />
                    Personalized
                  </Badge>
                </div>
                <p className="text-muted mb-0">
                  This study guide is tailored specifically for you based on your uploaded documents,
                  chat history, and learning patterns. Follow the recommendations below to enhance your learning journey.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Learning Progress */}
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center">
                  <TrendingUp size={18} className="me-2 text-primary" />
                  Your Learning Progress
                </h6>
                <Row className="g-3">
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="h4 mb-1 text-primary fw-bold">
                        {studyGuide?.learningProgress?.totalDocuments || 0}
                      </div>
                      <small className="text-muted">Documents Analyzed</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="h4 mb-1 text-success fw-bold">
                        {studyGuide?.learningProgress?.totalSessions || 0}
                      </div>
                      <small className="text-muted">Chat Sessions</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="h4 mb-1 text-info fw-bold">
                        {studyGuide?.learningProgress?.averageScore || 0}%
                      </div>
                      <small className="text-muted">Avg Performance</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="h4 mb-1 text-warning fw-bold">
                        {studyGuide?.learningProgress?.studyStreak || 0}
                      </div>
                      <small className="text-muted">Day Streak</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recommendations */}
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center">
                  <Target size={18} className="me-2 text-primary" />
                  Personalized Recommendations
                </h6>
                <Row className="g-4">
                  {studyGuide?.recommendations?.map((rec, index) => (
                    <Col md={4} key={index}>
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-start justify-content-between mb-2">
                            <h6 className="mb-1">{rec.title}</h6>
                            <Badge bg={rec.priority === 'High' ? 'danger' : 'warning'} className="small">
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-muted small mb-3">{rec.description}</p>

                          <div className="mb-3">
                            <div className="d-flex justify-content-between small mb-1">
                              <span>Progress</span>
                              <span>{rec.progress}%</span>
                            </div>
                            <div className="progress" style={{height: '6px'}}>
                              <div
                                className="progress-bar bg-primary"
                                style={{width: `${rec.progress}%`}}
                              />
                            </div>
                          </div>

                          <div>
                            <small className="text-muted fw-semibold">Tips:</small>
                            <ul className="small text-muted mt-1 mb-0">
                              {rec.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Study Plan */}
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center">
                  <Clock size={18} className="me-2 text-primary" />
                  3-Week Study Plan
                </h6>
                <Row className="g-3">
                  {studyGuide?.studyPlan?.map((week, index) => (
                    <Col md={4} key={index}>
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center mb-2">
                            <Badge bg="primary" className="me-2">Week {week.week}</Badge>
                            <h6 className="mb-0">{week.title}</h6>
                          </div>

                          <div className="mb-3">
                            <small className="text-muted fw-semibold">Focus Topics:</small>
                            <div className="mt-1">
                              {week.topics.map((topic, topicIndex) => (
                                <Badge key={topicIndex} bg="light" text="dark" className="small me-1 mb-1">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <small className="text-muted fw-semibold">Activities:</small>
                            <ul className="small text-muted mt-1 mb-0">
                              {week.activities.map((activity, activityIndex) => (
                                <li key={activityIndex} className="d-flex align-items-center">
                                  <CheckCircle size={12} className="me-1 text-success" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Resources */}
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center">
                  <Lightbulb size={18} className="me-2 text-primary" />
                  Recommended Resources
                </h6>
                <Row className="g-3">
                  {studyGuide?.resources?.map((resource, index) => (
                    <Col md={4} key={index}>
                      <Card className="border-0 shadow-sm hover-lift">
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-start justify-content-between mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1 small">{resource.title}</h6>
                              <p className="text-muted small mb-2">{resource.description}</p>
                              <Badge bg="outline-secondary" className="small">
                                <FileText size={12} className="me-1" />
                                {resource.type}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="w-100"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            Access Resource
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Footer */}
        <Row>
          <Col>
            <Card className="bg-primary text-white">
              <Card.Body className="p-4 text-center">
                <h6 className="mb-2">Keep Learning!</h6>
                <p className="mb-0 opacity-90">
                  This study guide is updated regularly based on your progress.
                  Continue uploading documents and engaging with the AI to get even more personalized recommendations.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PersonalStudyGuide;
