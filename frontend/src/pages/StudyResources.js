import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Modal } from 'react-bootstrap';
import { formatRelativeTime } from '../utils/timestamp';
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
  Help
} from 'lucide-react';
  const { user } = useAuth();
  const [showHelpModal, setShowHelpModal] = useState(false);

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
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
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
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/personal-study-guide`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/document-summary`, {
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
                      Can't find what you're looking for? Contact our support team or browse our FAQ section.
                    </p>
                  </Col>
                  <Col md={4} className="text-md-end">
                    <Button variant="light" className="px-4" onClick={() => setShowHelpModal(true)}>
                      Get Help
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Help Modal */}
      <Modal show={showHelpModal} onHide={() => setShowHelpModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Help & Support</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                 style={{width: '60px', height: '60px'}}>
              <BookOpen size={30} className="text-white" />
            </div>
            <h5>How can we help you today?</h5>
            <p className="text-muted">Choose from the options below to get the assistance you need.</p>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Card className="text-center hover-lift h-100">
                <Card.Body className="p-3">
                  <div className="bg-info rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                       style={{width: '40px', height: '40px'}}>
                    <Search size={20} className="text-white" />
                  </div>
                  <h6 className="mb-2">Browse FAQ</h6>
                  <p className="text-muted small mb-3">
                    Find answers to common questions about using SmartDocQ features.
                  </p>
                  <Link to="/faq" className="text-decoration-none">
                    <Button variant="outline-info" size="sm" className="w-100">
                      View FAQ
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="text-center hover-lift h-100">
                <Card.Body className="p-3">
                  <div className="bg-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                       style={{width: '40px', height: '40px'}}>
                    <Users size={20} className="text-white" />
                  </div>
                  <h6 className="mb-2">Contact Support</h6>
                  <p className="text-muted small mb-3">
                    Get in touch with our support team for personalized assistance.
                  </p>
                  <Link to="/contact" className="text-decoration-none">
                    <Button variant="outline-success" size="sm" className="w-100">
                      Contact Us
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="text-center hover-lift h-100">
                <Card.Body className="p-3">
                  <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                       style={{width: '40px', height: '40px'}}>
                    <FileText size={20} className="text-white" />
                  </div>
                  <h6 className="mb-2">Documentation</h6>
                  <p className="text-muted small mb-3">
                    Read detailed guides and tutorials on using SmartDocQ effectively.
                  </p>
                  <Link to="/faq" className="text-decoration-none">
                    <Button variant="outline-warning" size="sm" className="w-100">
                      Read Docs
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="text-center hover-lift h-100">
                <Card.Body className="p-3">
                  <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                       style={{width: '40px', height: '40px'}}>
                    <Link2 size={20} className="text-white" />
                  </div>
                  <h6 className="mb-2">Community</h6>
                  <p className="text-muted small mb-3">
                    Connect with other users and share your learning experiences.
                  </p>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="w-100"
                    href="mailto:community@smartdocq.com?subject=Community Interest"
                  >
                    Join Community
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="mt-4 p-3 bg-light rounded">
            <h6 className="mb-2">Quick Tips</h6>
            <ul className="small text-muted mb-0">
              <li>Upload documents in PDF, DOCX, or TXT format for best results</li>
              <li>Use specific questions when chatting with the AI for more accurate answers</li>
              <li>Check the Study Resources section regularly for personalized recommendations</li>
              <li>Review your chat history to track your learning progress</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHelpModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudyResources;
