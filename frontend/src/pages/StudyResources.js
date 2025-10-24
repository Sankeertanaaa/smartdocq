import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Modal } from 'react-bootstrap';
import { Accordion } from 'react-bootstrap';
import { formatRelativeTime } from '../utils/timestamp';
import { useAuth } from '../context/AuthContext';
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
  Filter,
  Help,
  Headphones,
  Upload,
  Send,
  Mail,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

const StudyResources = () => {
  const { user } = useAuth();
  const [showHelpSections, setShowHelpSections] = useState(false);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    // In a real implementation, this would send the form data to the backend
    alert('Thank you for contacting us! We\'ll respond within 24 hours.');
    setContactForm({ subject: '', category: 'general', message: '' });
  };

  // Generate personalized study resources based on user's documents and activity
  const generatePersonalizedResources = useCallback(() => {
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
  }, [user]);

  const categories = ['all', 'Personal', 'AI/ML', 'Computer Science', 'Web Development', 'Database', 'Programming', 'Academic'];

  const filterResources = useCallback(() => {
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
  }, [searchTerm, selectedCategory, resources]);

  useEffect(() => {
    // Generate personalized resources
    setLoading(true);
    setTimeout(() => {
      const personalizedData = generatePersonalizedResources();
      setResources(personalizedData);
      setFilteredResources(personalizedData);
      setLoading(false);
    }, 1000);
  }, [generatePersonalizedResources]);

  useEffect(() => {
    filterResources();
  }, [filterResources]);

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

  const formatDate = useCallback((dateString) => {
    return formatRelativeTime(dateString);
  }, []);

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

  const generatePersonalDocumentSummary = async () => {
    try {
      // Show loading state
      const summaryWindow = window.open('', '_blank');
      summaryWindow.document.write(`
        <html>
          <head>
            <title>Generating Document Summary - ${user?.fullName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2563eb;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2 style="margin-top: 20px; color: #2563eb;">Generating Your Document Summary...</h2>
            <p>Analyzing your uploaded documents and creating personalized insights.</p>
          </body>
        </html>
      `);

      // Fetch document summary from API
      const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      console.log('API URL:', apiUrl);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');

      const response = await fetch(`${apiUrl}/api/document-summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const summaryData = result.data;

          // Update the window with the real summary
          summaryWindow.document.write(`
            <html>
              <head>
                <title>Personal Document Summary - ${user?.fullName}</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                  h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                  .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .highlight { background: #fef3c7; padding: 2px 4px; border-radius: 4px; }
                  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
                  .stat-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; }
                  .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
                  .topics { display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; }
                  .topic-tag { background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
                </style>
              </head>
              <body>
                <h1>Personal Document Summary</h1>
                <div class="summary">
                  <p><strong>Generated:</strong> ${new Date(result.generated_at).toLocaleDateString()}</p>
                  <p><strong>Total Documents:</strong> ${summaryData.total_documents}</p>

                  <h3>Summary</h3>
                  <p>${summaryData.summary}</p>

                  ${summaryData.key_topics && summaryData.key_topics.length > 0 ? `
                    <h3>Key Topics</h3>
                    <div class="topics">
                      ${summaryData.key_topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                    </div>
                  ` : ''}

                  ${summaryData.content_analysis ? `
                    <h3>Content Analysis</h3>
                    <div class="stats">
                      ${summaryData.content_analysis.main_themes ? `
                        <div class="stat-card">
                          <div class="stat-number">${summaryData.content_analysis.main_themes.length}</div>
                          <div>Main Themes</div>
                        </div>
                      ` : ''}
                      ${summaryData.content_analysis.complexity_level ? `
                        <div class="stat-card">
                          <div class="stat-number">${summaryData.content_analysis.complexity_level}</div>
                          <div>Complexity Level</div>
                        </div>
                      ` : ''}
                    </div>
                    ${summaryData.content_analysis.gaps ? `
                      <p><strong>Knowledge Gaps:</strong> ${summaryData.content_analysis.gaps.join(', ')}</p>
                    ` : ''}
                  ` : ''}

                  ${summaryData.recommendations && summaryData.recommendations.length > 0 ? `
                    <h3>Study Recommendations</h3>
                    <ul>
                      ${summaryData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
                <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
                  Print Summary
                </button>
              </body>
            </html>
          `);
        } else {
          throw new Error(result.message || 'Failed to generate summary');
        }
      } else {
        console.error('API Response failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error generating document summary:', err);
      console.error('Error details:', err.message);

      // Show fallback summary
      const summaryContent = `
        Personal Document Summary for ${user?.fullName || 'Student'}

        Generated on: ${new Date().toLocaleDateString()}

        ${user?.fullName ? `Hello ${user.fullName}! ` : ''}This is your personalized document summary based on your uploaded materials and learning activity.

        Current Status:
        - Documents uploaded: ${user?.fullName ? 'Analyzing your document collection' : 'Please upload documents to see analysis'}
        - Learning sessions: Tracking your progress
        - Study streak: Building consistent learning habits

        Document Analysis:
        - Key concepts and topics will be extracted from your materials
        - Important themes and patterns will be identified
        - Personalized recommendations will be generated

        Study Recommendations:
        - Areas for focused improvement based on your content
        - Suggested learning pathways
        - Practice questions and exercises tailored to your needs

        To get the most accurate summary:
        1. Upload your study materials (PDF, DOCX, TXT)
        2. Engage in AI chat sessions about your documents
        3. Review your learning progress regularly

        This feature analyzes your actual uploaded documents and provides AI-powered insights.
        ${err ? `\n\nNote: Backend API connection failed (${err.message}). Using enhanced fallback content.` : ''}
      `;

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
              .notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>Personal Document Summary</h1>
            <div class="summary">
              <div class="notice">
                <strong>Note:</strong> Using fallback data. Connect to the backend for enhanced analysis.
                ${err ? `<br><br><strong>API Error:</strong> ${err.message}` : ''}
                <br><br>
                <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                  🔄 Try Again
                </button>
              </div>
              <pre>${summaryContent}</pre>
            </div>
            <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
              Print Summary
            </button>
          </body>
        </html>
      `);
    }
  };

  const generatePersonalResourceDownload = async (resource) => {
    if (resource.id === 100) {
      // Personal Study Guide - use backend API
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
            const studyGuide = result.data;

            const content = `
Personal Study Guide for ${user?.fullName || 'Student'}

Generated: ${new Date().toLocaleDateString()}

=== LEARNING PROFILE ===

Name: ${studyGuide.user_info?.name || user?.fullName || 'Student'}
Total Documents: ${studyGuide.learning_progress?.total_documents || 0}
Study Sessions: ${studyGuide.learning_progress?.total_sessions || 0}
Study Streak: ${studyGuide.learning_progress?.study_streak || 0} days

=== PERSONALIZED RECOMMENDATIONS ===

${studyGuide.recommendations?.map((rec, index) => `
${index + 1}. ${rec.title} (${rec.priority} Priority)
   Progress: ${rec.progress}%
   ${rec.description}

   Tips:
   ${rec.tips?.map(tip => `- ${tip}`).join('\n   ')}

`).join('\n') || 'No recommendations available yet.'}

=== 3-WEEK STUDY PLAN ===

${studyGuide.study_plan?.map(week => `
Week ${week.week}: ${week.title}
Topics: ${week.topics?.join(', ') || 'No topics specified'}
Activities: ${week.activities?.map(activity => `- ${activity}`).join('\n           ')}

`).join('\n') || 'No study plan available yet.'}

=== RECOMMENDED RESOURCES ===

${studyGuide.resources?.map(resource => `
- ${resource.title}: ${resource.description} (${resource.type})
`).join('\n') || 'No resources recommended yet.'}

This personalized study guide is generated based on your actual learning activity and will be updated as you continue using SmartDocQ.
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
            return;
          }
        }
      } catch (err) {
        console.error('Error downloading study guide:', err);
      }
    }

    if (resource.id === 101) {
      // Document Summary - use backend API
      try {
        const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/document-summary`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const summaryData = result.data;

            const content = `
Document Summary Report for ${user?.fullName || 'Student'}

Generated: ${new Date().toLocaleDateString()}

=== DOCUMENT OVERVIEW ===

Total Documents Analyzed: ${summaryData.total_documents || 0}
Generated: ${new Date(result.generated_at).toLocaleDateString()}

=== SUMMARY ===

${summaryData.summary || 'No summary available yet.'}

=== KEY TOPICS ===

${summaryData.key_topics?.map(topic => `- ${topic}`).join('\n') || 'No topics identified yet.'}

=== CONTENT ANALYSIS ===

${summaryData.content_analysis ? `
Main Themes: ${summaryData.content_analysis.main_themes?.join(', ') || 'None identified'}
Complexity Level: ${summaryData.content_analysis.complexity_level || 'Not assessed'}
Knowledge Gaps: ${summaryData.content_analysis.gaps?.join(', ') || 'None identified'}
` : 'No content analysis available yet.'}

=== STUDY RECOMMENDATIONS ===

${summaryData.recommendations?.map(rec => `- ${rec}`).join('\n') || 'No recommendations available yet.'}

This summary is generated based on your actual uploaded documents and will be enhanced as you upload more materials.
            `;

            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${user?.fullName || 'Personal'}_Document_Summary.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
          }
        }
      } catch (err) {
        console.error('Error downloading document summary:', err);
      }
    }

    // Fallback to original implementation if API fails
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

[Note: Connect to backend API for enhanced analysis]

=== ANALYSIS OVERVIEW ===

Total Documents: [Analyzing your collection]
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
                      Can't find what you're looking for? Browse our FAQ or contact our support team.
                    </p>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <Button 
                      variant="light" 
                      className="px-4" 
                      onClick={() => {
                        console.log('Get Help button clicked! Current state:', showHelpSections);
                        setShowHelpSections(!showHelpSections);
                        console.log('New state should be:', !showHelpSections);
                      }}
                    >
                      {showHelpSections ? 'Hide Help' : 'Get Help'}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Inline Help Sections */}
        {showHelpSections && (
          <>
            {/* FAQ Section */}
            <Row className="mt-4">
              <Col>
                <Card className="glass">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{width: '48px', height: '48px'}}>
                        <HelpCircle size={24} className="text-white" />
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold">Frequently Asked Questions</h5>
                        <small className="text-muted">Find quick answers to common questions</small>
                      </div>
                    </div>

                    <Accordion>
                      <Accordion.Item eventKey="getting-started">
                        <Accordion.Header>
                          <strong>Getting Started</strong>
                        </Accordion.Header>
                        <Accordion.Body>
                          <div className="mb-3">
                            <h6>How do I create an account?</h6>
                            <p className="text-muted small mb-2">You can create an account by clicking the "Register" button on the login page. Fill in your details including your full name, email address, and password. You can register as either a Student or request Admin access.</p>
                          </div>
                          <div className="mb-3">
                            <h6>What types of documents can I upload?</h6>
                            <p className="text-muted small mb-2">SmartDocQ supports various document formats including PDF, DOCX, DOC, TXT, and other text-based files. We recommend PDF format for best results as it preserves formatting and structure.</p>
                          </div>
                          <div>
                            <h6>How do I upload my first document?</h6>
                            <p className="text-muted small mb-0">After logging in, navigate to the "Upload" section from your dashboard. Click the upload area or drag and drop your document. The system will automatically process and analyze your document using AI.</p>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="ai-features">
                        <Accordion.Header>
                          <strong>AI Chat & Analysis</strong>
                        </Accordion.Header>
                        <Accordion.Body>
                          <div className="mb-3">
                            <h6>How does the AI chat feature work?</h6>
                            <p className="text-muted small mb-2">Our AI uses advanced natural language processing to understand your questions about uploaded documents. Simply ask questions in plain English, and the AI will provide accurate answers based on the content of your documents with source citations.</p>
                          </div>
                          <div className="mb-3">
                            <h6>What types of questions can I ask?</h6>
                            <p className="text-muted small mb-2">You can ask any question related to your documents including: "What is the main topic?", "Explain this concept", "What are the key findings?", "Compare these two sections", or "What does this data show?"</p>
                          </div>
                          <div>
                            <h6>How accurate are the AI responses?</h6>
                            <p className="text-muted small mb-0">Our AI provides highly accurate responses based on the actual content of your documents. All answers include source citations so you can verify the information. The system continuously learns and improves from user interactions.</p>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="study-resources">
                        <Accordion.Header>
                          <strong>Study Resources & Personalization</strong>
                        </Accordion.Header>
                        <Accordion.Body>
                          <div className="mb-3">
                            <h6>What is the Personal Study Guide?</h6>
                            <p className="text-muted small mb-2">The Personal Study Guide is an AI-generated learning plan tailored specifically to you. It analyzes your uploaded documents, chat history, and learning patterns to create personalized recommendations, study plans, and resource suggestions.</p>
                          </div>
                          <div className="mb-3">
                            <h6>How often is my Personal Study Guide updated?</h6>
                            <p className="text-muted small mb-2">Your study guide updates automatically as you upload new documents, engage in chat sessions, and use the platform. The AI continuously analyzes your learning progress and adjusts recommendations accordingly.</p>
                          </div>
                          <div>
                            <h6>What is the Document Summary feature?</h6>
                            <p className="text-muted small mb-0">The Document Summary feature analyzes all your uploaded documents and creates a comprehensive overview including key topics, themes, gaps in knowledge, and personalized study recommendations based on your materials.</p>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Contact Section */}
            <Row className="mt-4">
              <Col>
                <Card className="glass">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{width: '48px', height: '48px'}}>
                        <Headphones size={24} className="text-white" />
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold">Contact Support</h5>
                        <small className="text-muted">Get personalized help from our team</small>
                      </div>
                    </div>

                    <Row className="mb-4">
                      <Col md={8}>
                        <Form onSubmit={handleContactSubmit}>
                          <Row className="mb-3">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={user?.fullName || ''}
                                  readOnly
                                  className="bg-light"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                  type="email"
                                  value={user?.email || ''}
                                  readOnly
                                  className="bg-light"
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-3">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Brief description of your inquiry"
                              value={contactForm.subject}
                              onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                              value={contactForm.category}
                              onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                            >
                              <option value="general">General Inquiry</option>
                              <option value="technical">Technical Support</option>
                              <option value="account">Account Issues</option>
                              <option value="feature">Feature Request</option>
                              <option value="bug">Bug Report</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              placeholder="Please describe your question or issue in detail..."
                              value={contactForm.message}
                              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                              required
                            />
                          </Form.Group>

                          <Button type="submit" variant="primary">
                            <Send size={16} className="me-2" />
                            Send Message
                          </Button>
                        </Form>
                      </Col>

                      <Col md={4}>
                        <div className="bg-light p-4 rounded">
                          <h6 className="mb-3">Contact Information</h6>

                          <div className="d-flex align-items-start mb-3">
                            <Mail size={16} className="text-primary me-2 mt-1" />
                            <div>
                              <div className="fw-semibold small">Email Support</div>
                              <div className="text-muted small">support@smartdocq.com</div>
                              <div className="text-muted small">Response within 24 hours</div>
                            </div>
                          </div>

                          <div className="d-flex align-items-start mb-3">
                            <MessageCircle size={16} className="text-success me-2 mt-1" />
                            <div>
                              <div className="fw-semibold small">Live Chat</div>
                              <div className="text-muted small">Available in-app</div>
                              <div className="text-muted small">Instant during business hours</div>
                            </div>
                          </div>

                          <div className="d-flex align-items-start">
                            <Clock size={16} className="text-warning me-2 mt-1" />
                            <div>
                              <div className="fw-semibold small">Business Hours</div>
                              <div className="text-muted small">Mon-Fri: 9AM-6PM EST</div>
                              <div className="text-muted small">Sat: 10AM-4PM EST</div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick Links */}
            <Row className="mt-4">
              <Col>
                <Card className="glass">
                  <Card.Body className="p-4">
                    <h6 className="mb-3">Quick Links</h6>
                    <Row className="g-3">
                      <Col md={3}>
                        <Link to="/personal-study-guide" className="text-decoration-none">
                          <Card className="text-center hover-lift h-100 border-0">
                            <Card.Body className="p-3">
                              <BookOpen size={32} className="text-primary mb-2" />
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
                              <Upload size={32} className="text-success mb-2" />
                              <h6 className="mb-1">Upload</h6>
                              <small className="text-muted">Add documents</small>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                      <Col md={3}>
                        <Link to="/chat" className="text-decoration-none">
                          <Card className="text-center hover-lift h-100 border-0">
                            <Card.Body className="p-3">
                              <MessageCircle size={32} className="text-info mb-2" />
                              <h6 className="mb-1">AI Chat</h6>
                              <small className="text-muted">Ask questions</small>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                      <Col md={3}>
                        <Link to="/history" className="text-decoration-none">
                          <Card className="text-center hover-lift h-100 border-0">
                            <Card.Body className="p-3">
                              <Clock size={32} className="text-warning mb-2" />
                              <h6 className="mb-1">History</h6>
                              <small className="text-muted">View progress</small>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default StudyResources;
