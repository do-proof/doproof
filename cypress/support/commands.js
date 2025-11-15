// Custom commands for DoProof E2E tests

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/auth')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('not.include', '/auth')
})

// Login as recruiter
Cypress.Commands.add('loginAsRecruiter', () => {
  cy.login('recruiter@example.com', 'password123')
  cy.url().should('include', '/recruiter')
})

// Login as student
Cypress.Commands.add('loginAsStudent', () => {
  cy.login('student@example.com', 'password123')
  cy.url().should('include', '/student')
})

// Enroll in a job
Cypress.Commands.add('enrollInJob', (jobId, enrollmentData = {}) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/students/applications/${jobId}/enroll`,
    body: {
      cover_letter: 'Test cover letter',
      ...enrollmentData
    },
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Submit a task
Cypress.Commands.add('submitTask', (jobId, submissionData = {}) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/task-submissions`,
    body: {
      job_id: jobId,
      submission: {
        type: 'text',
        content: 'Test submission content',
        ...submissionData
      }
    },
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Update student profile
Cypress.Commands.add('updateStudentProfile', (profileData) => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/students/profile`,
    body: profileData,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(200)
    return response.body
  })
})

// Create a test job
Cypress.Commands.add('createTestJob', (jobData = {}) => {
  const defaultJobData = {
    title: 'Test Software Engineer Position',
    description: 'A test job for E2E testing',
    requirements: ['JavaScript', 'React', 'Node.js'],
    responsibilities: ['Develop features', 'Write tests', 'Code reviews'],
    salary: { min: 70000, max: 100000, currency: 'USD' },
    location: { type: 'remote' },
    employment_type: 'full-time',
    task: {
      title: 'Coding Challenge',
      description: 'Implement a simple REST API',
      instructions: 'Create endpoints for user management',
      time_limit: 120,
      submission_format: 'text'
    },
    evaluation_criteria: {
      critical_thinking: 25,
      problem_solving: 25,
      creativity: 25,
      technical_skills: 25,
      communication: 0,
      attention_to_detail: 0
    },
    ...jobData
  }

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/jobs`,
    body: defaultJobData,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Create test submission
Cypress.Commands.add('createTestSubmission', (jobId, submissionData = {}) => {
  const defaultSubmissionData = {
    job_id: jobId,
    submission: {
      type: 'text',
      content: 'This is a test submission for E2E testing. Here is my solution to the coding challenge...'
    },
    time_spent: 90,
    ...submissionData
  }

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/task-submissions`,
    body: defaultSubmissionData,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Wait for element to be visible and interactable
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible').should('not.be.disabled')
})

// Navigate to recruiter page
Cypress.Commands.add('navigateToRecruiterPage', (page) => {
  cy.get(`[data-testid="nav-${page}"]`).click()
  cy.url().should('include', `/recruiter/${page}`)
})

// Check accessibility
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.injectAxe()
  cy.checkA11y(context, options)
})

// Mock API response
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  })
})

// Clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically clean up test data from the database
  // For now, we'll just clear localStorage
  cy.clearLocalStorage()
})

// Type in rich text editor
Cypress.Commands.add('typeInEditor', (selector, text) => {
  cy.get(selector).click().clear().type(text)
})

// Upload file
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'text/plain') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('Test file content'),
    fileName: fileName,
    mimeType: fileType
  })
})

// Wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
})

// Check toast notification
Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`).should('contain.text', message)
});