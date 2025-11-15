describe('Student User Journeys', () => {
  beforeEach(() => {
    // Login as student
    cy.loginAsStudent()
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  describe('Job Discovery and Application Journey', () => {
    it('should complete full job discovery and application flow', () => {
      // Navigate to student dashboard
      cy.visit('/student-dashboard')
      cy.get('[data-testid="student-dashboard"]').should('be.visible')

      // View available jobs
      cy.get('[data-testid="jobs-list"]').should('be.visible')
      
      // Filter jobs
      cy.get('[data-testid="filter-search"]').type('React Developer')
      cy.get('[data-testid="filter-difficulty"]').select('Easy')
      cy.get('[data-testid="apply-filters"]').click()

      // View job details
      cy.get('[data-testid="job-card"]').first().click()
      cy.get('[data-testid="job-details-modal"]').should('be.visible')
      cy.get('[data-testid="job-title"]').should('be.visible')

      // Enroll in job
      cy.get('[data-testid="enroll-button"]').click()
      cy.get('[data-testid="enrollment-modal"]').should('be.visible')
      cy.get('[data-testid="cover-letter-input"]').type('I am interested in this position')
      cy.get('[data-testid="submit-enrollment"]').click()

      // Verify enrollment success
      cy.get('[data-testid="success-message"]').should('contain', 'Successfully enrolled')
      cy.get('[data-testid="my-applications-link"]').click()

      // Verify application appears in My Applications
      cy.get('[data-testid="applications-list"]').should('be.visible')
      cy.get('[data-testid="application-card"]').should('contain', 'React Developer')
    })
  })

  describe('Task Submission Journey', () => {
    let testJob

    beforeEach(() => {
      // Create a test job and enroll
      cy.createTestJob({
        title: 'E2E Test Job',
        task: {
          title: 'Build a Component',
          description: 'Create a React component',
          instructions: 'Build a reusable button component',
          time_limit: 120,
          submission_format: 'code'
        }
      }).then((job) => {
        testJob = job
        cy.enrollInJob(job.id)
      })
    })

    it('should complete task submission flow', () => {
      // Navigate to My Applications
      cy.visit('/student/applications')
      cy.get('[data-testid="applications-list"]').should('be.visible')

      // Find and open the test job application
      cy.get('[data-testid="application-card"]')
        .contains('E2E Test Job')
        .click()

      // Start working on task
      cy.get('[data-testid="start-work-button"]').click()
      cy.get('[data-testid="task-submission-form"]').should('be.visible')

      // Fill in submission
      cy.get('[data-testid="submission-textarea"]').type('const Button = () => <button>Click me</button>')
      
      // Upload file if needed
      cy.get('[data-testid="file-upload-input"]').attachFile('test-file.zip', { force: true })

      // Track time spent
      cy.wait(2000) // Simulate time spent
      cy.get('[data-testid="time-spent"]').should('be.visible')

      // Submit task
      cy.get('[data-testid="submit-task-button"]').click()
      cy.get('[data-testid="confirm-submit"]').click()

      // Verify submission success
      cy.get('[data-testid="success-message"]').should('contain', 'submitted successfully')
      
      // Verify status updated
      cy.get('[data-testid="application-status"]').should('contain', 'Submitted')
    })
  })

  describe('Application Status Tracking Journey', () => {
    let testApplication

    beforeEach(() => {
      // Create and submit an application
      cy.createTestJob({
        title: 'Status Tracking Job',
        task: {
          title: 'Test Task',
          time_limit: 60,
          submission_format: 'text'
        }
      }).then((job) => {
        cy.enrollInJob(job.id)
        cy.submitTask(job.id, { content: 'Test submission' })
          .then((application) => {
            testApplication = application
          })
      })
    })

    it('should track application status updates', () => {
      // Navigate to My Applications
      cy.visit('/student/applications')
      
      // Filter by status
      cy.get('[data-testid="status-filter"]').select('submitted')
      cy.get('[data-testid="apply-filters"]').click()

      // Verify application appears
      cy.get('[data-testid="application-card"]')
        .contains('Status Tracking Job')
        .should('be.visible')

      // View application details
      cy.get('[data-testid="application-card"]')
        .contains('Status Tracking Job')
        .click()

      // Verify status information
      cy.get('[data-testid="application-status"]').should('contain', 'Submitted')
      cy.get('[data-testid="submission-date"]').should('be.visible')
      cy.get('[data-testid="time-spent-display"]').should('be.visible')

      // Simulate status update (would normally come from backend/WebSocket)
      cy.get('[data-testid="refresh-status"]').click()
    })
  })

  describe('Profile Management Journey', () => {
    it('should complete profile creation and update flow', () => {
      // Navigate to profile page
      cy.visit('/student/profile')
      cy.get('[data-testid="profile-page"]').should('be.visible')

      // Fill in personal information
      cy.get('[data-testid="first-name-input"]').type('John')
      cy.get('[data-testid="last-name-input"]').type('Doe')
      cy.get('[data-testid="email-input"]').type('john.doe@example.com')
      cy.get('[data-testid="phone-input"]').type('+1234567890')

      // Add skills
      cy.get('[data-testid="skills-input"]').type('React, TypeScript, Node.js')
      cy.get('[data-testid="add-skill"]').click()

      // Add experience
      cy.get('[data-testid="experience-section"]').within(() => {
        cy.get('[data-testid="company-input"]').type('Tech Corp')
        cy.get('[data-testid="position-input"]').type('Software Engineer')
        cy.get('[data-testid="duration-input"]').type('2 years')
        cy.get('[data-testid="add-experience"]').click()
      })

      // Set career preferences
      cy.get('[data-testid="preferred-location"]').select('remote')
      cy.get('[data-testid="preferred-employment-type"]').select('full-time')

      // Save profile
      cy.get('[data-testid="save-profile-button"]').click()
      cy.get('[data-testid="success-message"]').should('contain', 'Profile saved')

      // Verify profile completeness
      cy.get('[data-testid="profile-completeness"]').should('be.visible')
      cy.get('[data-testid="completeness-percentage"]').should('contain', '%')
    })
  })

  describe('Analytics and Insights Journey', () => {
    beforeEach(() => {
      // Create multiple applications with different statuses
      cy.createTestJob({ title: 'Job 1' }).then((job) => {
        cy.enrollInJob(job.id)
        cy.submitTask(job.id, { content: 'Submission 1' })
      })
      
      cy.createTestJob({ title: 'Job 2' }).then((job) => {
        cy.enrollInJob(job.id)
      })
    })

    it('should view analytics and insights', () => {
      // Navigate to analytics page
      cy.visit('/student/analytics')
      cy.get('[data-testid="analytics-page"]').should('be.visible')

      // Verify analytics sections
      cy.get('[data-testid="application-stats"]').should('be.visible')
      cy.get('[data-testid="performance-chart"]').should('be.visible')
      cy.get('[data-testid="skill-analysis"]').should('be.visible')

      // Check application statistics
      cy.get('[data-testid="total-applications"]').should('be.visible')
      cy.get('[data-testid="active-applications"]').should('be.visible')
      cy.get('[data-testid="completed-applications"]').should('be.visible')

      // View performance trends
      cy.get('[data-testid="performance-trends"]').should('be.visible')
      
      // View recommendations
      cy.get('[data-testid="recommendations-section"]').should('be.visible')
      cy.get('[data-testid="recommendation-card"]').should('have.length.greaterThan', 0)
    })
  })

  describe('Recommendations Journey', () => {
    beforeEach(() => {
      // Set up student profile with skills
      cy.updateStudentProfile({
        skills: ['React', 'TypeScript', 'Node.js'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Frontend Developer',
            duration: '2 years'
          }
        ]
      })
    })

    it('should view and interact with job recommendations', () => {
      // Navigate to recommendations page
      cy.visit('/student/recommendations')
      cy.get('[data-testid="recommendations-page"]').should('be.visible')

      // Verify recommendations are displayed
      cy.get('[data-testid="recommendation-card"]').should('have.length.greaterThan', 0)

      // View recommendation details
      cy.get('[data-testid="recommendation-card"]').first().click()
      cy.get('[data-testid="recommendation-details"]').should('be.visible')
      cy.get('[data-testid="match-score"]').should('be.visible')
      cy.get('[data-testid="match-reasons"]').should('be.visible')

      // Enroll from recommendation
      cy.get('[data-testid="enroll-from-recommendation"]').click()
      cy.get('[data-testid="enrollment-modal"]').should('be.visible')
      cy.get('[data-testid="submit-enrollment"]').click()

      // Verify enrollment success
      cy.get('[data-testid="success-message"]').should('contain', 'enrolled')
    })
  })

  describe('Accessibility Journey', () => {
    it('should be fully accessible via keyboard navigation', () => {
      cy.visit('/student-dashboard')

      // Tab through main navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'href', '#main-content') // Skip link

      // Continue tabbing through interface
      cy.focused().tab()
      // Verify focus is visible and logical
    })

    it('should work with screen readers', () => {
      cy.visit('/student-dashboard')

      // Verify ARIA labels
      cy.get('[aria-label]').should('have.length.greaterThan', 0)
      cy.get('[role="main"]').should('exist')
      cy.get('[role="navigation"]').should('exist')

      // Verify heading hierarchy
      cy.get('h1').should('exist')
      cy.get('h2').should('exist')
    })
  })

  describe('Mobile Responsiveness Journey', () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport('iphone-x')
    })

    it('should work on mobile devices', () => {
      cy.visit('/student-dashboard')

      // Verify mobile navigation
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-menu"]').should('be.visible')

      // Verify touch targets are large enough
      cy.get('button').each(($btn) => {
        cy.wrap($btn).should('have.css', 'min-height', '44px')
      })

      // Verify content is readable
      cy.get('[data-testid="jobs-list"]').should('be.visible')
    })
  })
})

