import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { 
  BookOpen, 
  Search,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Video,
  Link2,
  Star,
  Clock,
  Users,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudyResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Generate personalized study resources based on user's documents and activity
  const generatePersonalizedResources = () => {
    const baseResources = [
    {
      id: 1,
      title: 'Machine Learning Fundamentals',
      description: 'Comprehensive guide to machine learning concepts, algorithms, and practical applications.',
      category: 'AI/ML',
      type: 'PDF',
      size: '2.5 MB',
      downloads: 1250,
      rating: 4.8,
      author: 'Dr. Sarah Johnson',
      lastUpdated: '2024-01-15',
      tags: ['machine learning', 'algorithms', 'data science'],
      url: '/resources/ml-fundamentals.pdf',
      thumbnail: '📚'
    },
    {
      id: 2,
      title: 'Data Structures & Algorithms',
      description: 'Essential data structures and algorithms every computer science student should know.',
      category: 'Computer Science',
      type: 'PDF',
      size: '3.1 MB',
      downloads: 2100,
      rating: 4.9,
      author: 'Prof. Michael Chen',
      lastUpdated: '2024-02-01',
      tags: ['data structures', 'algorithms', 'programming'],
      url: '/resources/dsa-guide.pdf',
      thumbnail: '🔢'
    },
    {
      id: 3,
      title: 'Web Development Bootcamp',
      description: 'Complete web development course covering HTML, CSS, JavaScript, and modern frameworks.',
      category: 'Web Development',
      type: 'Video Series',
      size: '1.2 GB',
      downloads: 850,
      rating: 4.7,
      author: 'Alex Rodriguez',
      lastUpdated: '2024-01-20',
      tags: ['web development', 'javascript', 'react', 'html', 'css'],
      url: '/resources/web-dev-bootcamp',
      thumbnail: '🌐'
    },
    {
      id: 4,
      title: 'Database Design Principles',
      description: 'Learn database design, normalization, and SQL optimization techniques.',
      category: 'Database',
      type: 'PDF',
      size: '1.8 MB',
      downloads: 950,
      rating: 4.6,
      author: 'Dr. Emily Watson',
      lastUpdated: '2024-01-10',
      tags: ['database', 'sql', 'design', 'normalization'],
      url: '/resources/database-design.pdf',
      thumbnail: '🗄️'
    },
    {
      id: 5,
      title: 'Python Programming Guide',
      description: 'From basics to advanced Python programming concepts with practical examples.',
      category: 'Programming',
      type: 'Interactive',
      size: '500 KB',
      downloads: 1800,
      rating: 4.8,
      author: 'Lisa Park',
      lastUpdated: '2024-02-05',
      tags: ['python', 'programming', 'coding'],
      url: '/resources/python-guide',
      thumbnail: '🐍'
    },
    {
      id: 6,
      title: 'Research Methodology',
      description: 'Academic research methods, citation styles, and paper writing guidelines.',
      category: 'Academic',
      type: 'PDF',
      size: '2.0 MB',
      downloads: 720,
      rating: 4.5,
      author: 'Prof. David Kumar',
      lastUpdated: '2024-01-25',
      tags: ['research', 'academic writing', 'methodology'],
      url: '/resources/research-methodology.pdf',
      thumbnail: '📖'
    }
    ];

    // Add personalized resources based on user's name/preferences
    const personalizedResources = [
      {
        id: 100,
        title: `${user?.fullName || 'Your'} Personal Study Guide`,
        description: 'Customized study materials based on your uploaded documents and learning progress.',
        category: 'Personal',
        type: 'Interactive',
        size: '1.0 MB',
        downloads: 1,
        rating: 5.0,
        author: 'SmartDocQ AI',
        lastUpdated: new Date().toISOString().split('T')[0],
        tags: ['personalized', 'study guide', 'custom'],
        url: '/resources/personal-guide',
        thumbnail: '👤'
      },
      {
        id: 101,
        title: 'Your Document Summary',
        description: 'AI-generated summaries of all your uploaded documents for quick review.',
        category: 'Personal',
        type: 'PDF',
        size: '500 KB',
        downloads: 1,
        rating: 4.9,
        author: 'SmartDocQ AI',
        lastUpdated: new Date().toISOString().split('T')[0],
        tags: ['summary', 'documents', 'review'],
        url: '/resources/document-summary',
        thumbnail: '📋'
      }
    ];

    return [...baseResources, ...personalizedResources];
  };

  const categories = ['all', 'Personal', 'AI/ML', 'Computer Science', 'Web Development', 'Database', 'Programming', 'Academic'];

  useEffect(() => {
    // Generate personalized resources
    setLoading(true);
    setTimeout(() => {
      const personalizedData = generatePersonalizedResources();
      setResources(personalizedData);
      setFilteredResources(personalizedData);
      setLoading(false);
    }, 1000);
  }, [user, generatePersonalizedResources]);

  useEffect(() => {
    filterResources();
  }, [searchTerm, selectedCategory, resources, filterResources]);

  const filterResources = () => {
    let filtered = resources;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredResources(filtered);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FileText size={16} className="text-red-500" />;
      case 'Video Series':
        return <Video size={16} className="text-blue-500" />;
      case 'Interactive':
        return <Link2 size={16} className="text-green-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PDF':
        return 'danger';
      case 'Video Series':
        return 'primary';
      case 'Interactive':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleResourceAccess = (resource, event) => {
    // Show loading feedback
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Opening...';
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
    
    // Handle different types of resources
    if (resource.type === 'Interactive') {
      // For interactive resources, open in new tab or modal
      if (resource.id === 100) {
        // Personal Study Guide - redirect to a personalized page
        window.open(`/personal-study-guide?user=${user?.id}`, '_blank');
      } else {
        // Other interactive resources
        window.open(resource.url, '_blank');
      }
    } else if (resource.type === 'Video Series') {
      // For video resources, open video player or external link
      window.open(resource.url, '_blank');
    } else if (resource.type === 'PDF') {
      // For PDF resources, open in new tab
      if (resource.id === 101) {
        // Personal document summary - generate and show
        generatePersonalDocumentSummary();
      } else {
        // Regular PDF resources
        const pdfUrl = getPdfResourceUrl(resource);
        window.open(pdfUrl, '_blank');
      }
    }
  };

  const handleResourceDownload = (resource, event) => {
    // Show loading feedback
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Downloading...';
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 1500);
    
    // Create download functionality
    if (resource.id === 100 || resource.id === 101) {
      // Personal resources - generate and download
      generatePersonalResourceDownload(resource);
    } else {
      // Regular resources - direct download
      const downloadUrl = getResourceDownloadUrl(resource);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${resource.title}.${getFileExtension(resource.type)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPdfResourceUrl = (resource) => {
    // Return actual PDF URLs for different resources
    const pdfUrls = {
      1: 'https://arxiv.org/pdf/1706.03762.pdf', // Machine Learning paper
      2: 'https://web.stanford.edu/class/cs161/schedule.html', // Data Structures
      4: 'https://db.cs.cmu.edu/papers/2016/pavlo-newsql-sigmodrec2016.pdf', // Database Design
      6: 'https://www.scribbr.com/category/methodology/' // Research Methodology
    };
    
    return pdfUrls[resource.id] || `data:application/pdf;base64,${generateSamplePdf(resource)}`;
  };

  const getResourceDownloadUrl = (resource) => {
    // For demo purposes, create blob URLs for downloads
    return getPdfResourceUrl(resource);
  };

  const getFileExtension = (type) => {
    switch (type) {
      case 'PDF':
        return 'pdf';
      case 'Video Series':
        return 'mp4';
      case 'Interactive':
        return 'html';
      default:
        return 'pdf';
    }
  };

  const generatePersonalDocumentSummary = () => {
    // Create a personalized document summary
    const summaryContent = `
      Personal Document Summary for ${user?.fullName || 'Student'}
      
      Generated on: ${new Date().toLocaleDateString()}
      
      This is your personalized document summary based on your uploaded materials.
      
      Documents Analyzed:
      - Your uploaded documents will be summarized here
      - Key concepts and topics will be extracted
      - Important points will be highlighted
      
      Study Recommendations:
      - Focus areas based on your document content
      - Suggested additional resources
      - Practice questions and exercises
      
      This feature will be enhanced to analyze your actual uploaded documents.
    `;
    
    // Create and open a new window with the summary
    const summaryWindow = window.open('', '_blank');
    summaryWindow.document.write(`
      <html>
        <head>
          <title>Personal Document Summary - ${user?.fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .highlight { background: #fef3c7; padding: 2px 4px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Personal Document Summary</h1>
          <div class="summary">
            <pre>${summaryContent}</pre>
          </div>
          <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
            Print Summary
          </button>
        </body>
      </html>
    `);
  };

  const generatePersonalResourceDownload = (resource) => {
    let content = '';
    let filename = '';
    
    if (resource.id === 100) {
      // Personal Study Guide
      content = `
Personal Study Guide for ${user?.fullName || 'Student'}

Generated: ${new Date().toLocaleDateString()}

=== YOUR LEARNING JOURNEY ===

This personalized study guide is created specifically for you based on:
- Your uploaded documents
- Your chat history and questions
- Your learning patterns and interests

=== STUDY RECOMMENDATIONS ===

1. Review your uploaded documents regularly
2. Practice with the AI chat feature
3. Explore related topics in the resource library
4. Track your progress through the dashboard

=== PERSONALIZED RESOURCES ===

Based on your activity, we recommend focusing on:
- Document analysis techniques
- Question formulation strategies
- Research methodology
- Academic writing skills

=== NEXT STEPS ===

1. Upload more documents to expand your knowledge base
2. Engage in more chat sessions to deepen understanding
3. Explore advanced features as you progress
4. Share your sessions when you want feedback

This guide will be updated as you continue learning!
      `;
      filename = `${user?.fullName || 'Personal'}_Study_Guide.txt`;
    } else if (resource.id === 101) {
      // Document Summary
      content = `
Document Summary Report for ${user?.fullName || 'Student'}

Generated: ${new Date().toLocaleDateString()}

=== YOUR DOCUMENTS ===

This report summarizes all documents you've uploaded to SmartDocQ.

[Note: This is a demo version. The actual implementation will analyze your real uploaded documents]

=== ANALYSIS OVERVIEW ===

Total Documents: [Will show actual count]
Total Pages: [Will calculate from your documents]
Key Topics: [Will extract from your content]
Difficulty Level: [Will assess based on content]

=== DOCUMENT BREAKDOWN ===

1. [Document 1 Name]
   - Summary: [AI-generated summary]
   - Key Points: [Extracted key concepts]
   - Questions Generated: [Suggested study questions]

2. [Document 2 Name]
   - Summary: [AI-generated summary]
   - Key Points: [Extracted key concepts]
   - Questions Generated: [Suggested study questions]

=== STUDY RECOMMENDATIONS ===

Based on your documents, we recommend:
- Focus areas for deeper study
- Related topics to explore
- Practice questions and exercises
- Additional resources

This summary will be enhanced to analyze your actual uploaded documents.
      `;
      filename = `${user?.fullName || 'Personal'}_Document_Summary.txt`;
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateSamplePdf = (resource) => {
    // This is a placeholder - in a real implementation, you'd have actual PDF files
    return 'JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJzLSM3IyFFwzy/KSU9NzMnPS1WwUsjNTUnMzFGwUUjOyS9NScwr0XFxdQ9x9ncJjvRzB4kGAFBuDKUKZW5kc3RyZWFtCmVuZG9iagoKMyAwIG9iago5OQplbmRvYmoKCjUgMCBvYmoKPDwKL0xlbmd0aCA2IDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQovTGVuZ3RoMSA1NDQKL0xlbmd0aDIgMzY4Ci9MZW5ndGgzIDAKPj4Kc3RyZWFtCnic';
  };

  return (
    <div className="min-vh-100 bg-pattern">
      {/* Header */}
      <nav className="navbar navbar-expand-lg glass shadow-soft">
        <Container fluid>
          <div className="d-flex align-items-center">
            <Link
              to="/student-dashboard"
              className="d-flex align-items-center text-muted hover-text-dark me-4"
            >
              <ArrowLeft size={20} className="me-2" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="d-flex align-items-center">
              <div className="bg-warning rounded-xl d-flex align-items-center justify-content-center me-3" 
                   style={{width: '48px', height: '48px'}}>
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-gradient">Study Resources</h4>
                <small className="text-muted">Access learning materials and guides</small>
              </div>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
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
        {/* Search and Filter Section */}
        <Row className="mb-4">
          <Col>
            <Card className="glass">
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light border-0">
                        <Search size={20} className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search resources by title, description, or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 bg-light"
                      />
                    </InputGroup>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border-0 bg-light"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2} className="text-end">
                    <Badge bg="primary" className="px-3 py-2">
                      <Filter size={14} className="me-1" />
                      {filteredResources.length} Resources
                    </Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Resources Grid */}
        {loading ? (
          <Row>
            <Col>
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-3 text-muted">Loading study resources...</div>
              </div>
            </Col>
          </Row>
        ) : filteredResources.length === 0 ? (
          <Row>
            <Col>
              <Card className="text-center py-5">
                <Card.Body>
                  <BookOpen size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No resources found</h5>
                  <p className="text-muted mb-4">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Try adjusting your search terms or filters.' 
                      : 'No study resources are available yet.'}
                  </p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row className="g-4">
            {filteredResources.map((resource) => (
              <Col xs={12} md={6} lg={4} key={resource.id}>
                <Card className="h-100 hover-lift">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start mb-3">
                      <div className="flex-shrink-0 me-3">
                        <div className="bg-light rounded-lg d-flex align-items-center justify-content-center" 
                             style={{width: '48px', height: '48px', fontSize: '24px'}}>
                          {resource.thumbnail}
                        </div>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="fw-bold text-dark mb-1 text-truncate">
                          {resource.title}
                        </h6>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Badge bg={getTypeColor(resource.type)} className="small">
                            {getTypeIcon(resource.type)}
                            <span className="ms-1">{resource.type}</span>
                          </Badge>
                          <Badge bg="outline-secondary" className="small">
                            {resource.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted small mb-3" style={{fontSize: '0.85rem'}}>
                      {resource.description}
                    </p>
                    
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between text-muted small mb-1">
                        <span>
                          <Users size={12} className="me-1" />
                          {resource.downloads} downloads
                        </span>
                        <div className="d-flex align-items-center">
                          <Star size={12} className="text-warning me-1" fill="currentColor" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between text-muted small">
                        <span>Size: {resource.size}</span>
                        <span>
                          <Clock size={12} className="me-1" />
                          {formatDate(resource.lastUpdated)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} bg="light" text="dark" className="small">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge bg="light" text="muted" className="small">
                            +{resource.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="flex-grow-1"
                        onClick={(e) => handleResourceAccess(resource, e)}
                      >
                        <ExternalLink size={14} className="me-1" />
                        Access
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={(e) => handleResourceDownload(resource, e)}
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                    
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted">
                        By {resource.author}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Help Section */}
        <Row className="mt-5">
          <Col>
            <Card className="bg-primary text-white">
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h5 className="fw-bold mb-2">Need help finding resources?</h5>
                    <p className="mb-0 opacity-90">
                      Can't find what you're looking for? Contact our support team or browse our FAQ section.
                    </p>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <Button variant="light" className="px-4">
                      Get Help
                    </Button>
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

export default StudyResources;
