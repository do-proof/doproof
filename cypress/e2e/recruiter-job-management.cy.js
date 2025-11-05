describe('Recruiter Job Management', () => {
  beforeEach(() => {
    cy.loginAsRecruiter()
    cy.navigateToRecruiterPage('jobs')
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  it('should display job postings page', () => {
    cy.get('[data-testid="job-postings-page"]').should('be.visible')
    cy.get('[data-testid="create-job-button"]').should('be.visible')
    cy.get('[data-testid="job-search-input"]').should('be.visible')
    cy.get('[data-testid="job-filters"]').should('be.visible')
  })

  it('should create a new job posting', () => {
    // Click create job button
    cy.get('[data-testid="create-job-button"]').click()
    cy.url().should('include', '/recruiter/jobs/new')

    // Fill basic job information
    cy.get('[data-testid="job-title-input"]').type('Senior React Developer')
    cy.get('[data-testid="job-description-textarea"]').type('We are looking for an experienced React developer to join our team.')
    
    // Add requirements
    cy.get('[data-testid="add-requirement-button"]').click()
    cy.get('[data-testid="requirement-input-0"]').type('5+ years React experience')
    cy.get('[data-testid="add-requirement-button"]').click()
    cy.get('[data-testid="requirement-input-1"]').type('TypeScript proficiency')

    // Add responsibilities
    cy.get('[data-testid="add-responsibility-button"]').click()
    cy.get('[data-testid="responsibility-input-0"]').type('Develop user interfaces')
    cy.get('[data-testid="add-responsibility-button"]').click()
    cy.get('[data-testid="responsibility-input-1"]').type('Code reviews and mentoring')

    // Set salary range
    cy.get('[data-testid="salary-min-input"]').type('80000')
    cy.get('[data-testid="salary-max-input"]').type('120000')
    cy.get('[data-testid="salary-currency-select"]').select('USD')

    // Set location
    cy.get('[data-testid="location-type-select"]').select('hybrid')
    cy.get('[data-testid="location-city-input"]').type('San Francisco')
    cy.get('[data-testid="location-country-input"]').type('USA')

    // Set employment type
    cy.get('[data-testid="employment-type-select"]').select('full-time')

    // Go to next step (Task Definition)
    cy.get('[data-testid="next-step-button"]').click()

    // Fill task information
    cy.get('[data-testid="task-title-input"]').type('React Component Challenge')
    cy.get('[data-testid="task-description-textarea"]').type('Build a reusable React component with proper TypeScript types')
    cy.get('[data-testid="task-instructions-textarea"]').type('Create a data table component with sorting and filtering capabilities')
    cy.get('[data-testid="task-time-limit-input"]').type('180')
    cy.get('[data-testid="submission-format-select"]').select('text')

    // Go to next step (Evaluation Criteria)
    cy.get('[data-testid="next-step-button"]').click()

    // Set evaluation criteria weights
    cy.get('[data-testid="criteria-critical-thinking-slider"]').invoke('val', 20).trigger('input')
    cy.get('[data-testid="criteria-problem-solving-slider"]').invoke('val', 30).trigger('input')
    cy.get('[data-testid="criteria-creativity-slider"]').invoke('val', 15).trigger('input')
    cy.get('[data-testid="criteria-technical-skills-slider"]').invoke('val', 25).trigger('input')
    cy.get('[data-testid="criteria-communication-slider"]').invoke('val', 5).trigger('input')
    cy.get('[data-testid="criteria-attention-to-detail-slider"]').invoke('val', 5).trigger('input')

    // Submit the job
    cy.get('[data-testid="create-job-submit-button"]').click()

    // Verify job was created
    cy.checkToast('Job created successfully')
    cy.url().should('include', '/recruiter/jobs')
    cy.get('[data-testid="job-card"]').should('contain.text', 'Senior React Developer')
  })

  it('should edit an existing job', () => {
    // Create a test job first
    cy.createTestJob().then((job) => {
      cy.visit('/recruiter/jobs')
      
      // Find and edit the job
      cy.get(`[data-testid="job-card-${job.id}"]`).within(() => {
        cy.get('[data-testid="edit-job-button"]').click()
      })

      cy.url().should('include', `/recruiter/jobs/${job.id}/edit`)

      // Update job title
      cy.get('[data-testid="job-title-input"]').clear().type('Updated Job Title')
      
      // Update description
      cy.get('[data-testid="job-description-textarea"]').clear().type('Updated job description')

      // Save changes
      cy.get('[data-testid="save-job-button"]').click()

      // Verify changes
      cy.checkToast('Job updated successfully')
      cy.get('[data-testid="job-card"]').should('contain.text', 'Updated Job Title')
    })
  })

  it('should filter jobs by status', () => {
    // Create jobs with different statuses
    cy.createTestJob({ title: 'Active Job' }).then((activeJob) => {
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/jobs/${activeJob.id}/status`,
        body: { status: 'active' },
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
        }
      })
    })

    cy.createTestJob({ title: 'Draft Job' }) // Remains in draft

    cy.visit('/recruiter/jobs')

    // Filter by active status
    cy.get('[data-testid="status-filter-select"]').select('active')
    cy.waitForLoading()

    // Should only show active jobs
    cy.get('[data-testid="job-card"]').should('have.length', 1)
    cy.get('[data-testid="job-card"]').should('contain.text', 'Active Job')

    // Filter by draft status
    cy.get('[data-testid="status-filter-select"]').select('draft')
    cy.waitForLoading()

    // Should only show draft jobs
    cy.get('[data-testid="job-card"]').should('have.length', 1)
    cy.get('[data-testid="job-card"]').should('contain.text', 'Draft Job')
  })

  it('should search jobs by title', () => {
    // Create test jobs
    cy.createTestJob({ title: 'Frontend Developer' })
    cy.createTestJob({ title: 'Backend Engineer' })

    cy.visit('/recruiter/jobs')

    // Search for frontend
    cy.get('[data-testid="job-search-input"]').type('Frontend')
    cy.get('[data-testid="search-button"]').click()
    cy.waitForLoading()

    // Should only show matching job
    cy.get('[data-testid="job-card"]').should('have.length', 1)
    cy.get('[data-testid="job-card"]').should('contain.text', 'Frontend Developer')
  })

  it('should change job status', () => {
    cy.createTestJob({ title: 'Status Test Job' }).then((job) => {
      cy.visit('/recruiter/jobs')

      // Change status to active
      cy.get(`[data-testid="job-card-${job.id}"]`).within(() => {
        cy.get('[data-testid="job-status-select"]').select('active')
      })

      // Verify status change
      cy.checkToast('Job status updated')
      cy.get(`[data-testid="job-card-${job.id}"]`).within(() => {
        cy.get('[data-testid="job-status-badge"]').should('contain.text', 'Active')
      })
    })
  })

  it('should delete a job', () => {
    cy.createTestJob({ title: 'Job to Delete' }).then((job) => {
      cy.visit('/recruiter/jobs')

      // Delete the job
      cy.get(`[data-testid="job-card-${job.id}"]`).within(() => {
        cy.get('[data-testid="delete-job-button"]').click()
      })

      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click()

      // Verify job was deleted
      cy.checkToast('Job deleted successfully')
      cy.get(`[data-testid="job-card-${job.id}"]`).should('not.exist')
    })
  })

  it('should display job metrics', () => {
    cy.createTestJob({ title: 'Metrics Test Job' }).then((job) => {
      // Mock some metrics data
      cy.mockApiResponse('GET', `**/jobs/${job.id}/metrics`, {
        job_id: job.id,
        view_count: 150,
        application_count: 25,
        submission_count: 20,
        view_to_application_rate: 16.7,
        application_to_submission_rate: 80.0,
        days_active: 7
      })

      cy.visit('/recruiter/jobs')

      // View job metrics
      cy.get(`[data-testid="job-card-${job.id}"]`).within(() => {
        cy.get('[data-testid="view-metrics-button"]').click()
      })

      // Verify metrics display
      cy.get('[data-testid="metrics-modal"]').should('be.visible')
      cy.get('[data-testid="view-count"]').should('contain.text', '150')
      cy.get('[data-testid="application-count"]').should('contain.text', '25')
      cy.get('[data-testid="submission-count"]').should('contain.text', '20')
      cy.get('[data-testid="conversion-rate"]').should('contain.text', '16.7%')
    })
  })

  it('should handle pagination', () => {
    // Create multiple jobs to test pagination
    const jobPromises = []
    for (let i = 1; i <= 15; i++) {
      jobPromises.push(cy.createTestJob({ title: `Job ${i}` }))
    }

    Promise.all(jobPromises).then(() => {
      cy.visit('/recruiter/jobs')

      // Should show first page
      cy.get('[data-testid="job-card"]').should('have.length', 10)
      cy.get('[data-testid="pagination-info"]').should('contain.text', 'Page 1 of 2')

      // Go to next page
      cy.get('[data-testid="next-page-button"]').click()
      cy.waitForLoading()

      // Should show second page
      cy.get('[data-testid="job-card"]').should('have.length', 5)
      cy.get('[data-testid="pagination-info"]').should('contain.text', 'Page 2 of 2')
    })
  })

  it('should validate job form inputs', () => {
    cy.get('[data-testid="create-job-button"]').click()

    // Try to submit without required fields
    cy.get('[data-testid="create-job-submit-button"]').click()

    // Should show validation errors
    cy.get('[data-testid="title-error"]').should('contain.text', 'Title is required')
    cy.get('[data-testid="description-error"]').should('contain.text', 'Description is required')

    // Fill title but leave description empty
    cy.get('[data-testid="job-title-input"]').type('Test Job')
    cy.get('[data-testid="create-job-submit-button"]').click()

    // Should still show description error
    cy.get('[data-testid="description-error"]').should('be.visible')
    cy.get('[data-testid="title-error"]').should('not.exist')
  })
});