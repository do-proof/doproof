// Custom Cypress commands for student features testing

Cypress.Commands.add('loginAsStudent', () => {
  cy.session('student-session', () => {
    cy.visit('/auth');
    cy.get('[data-testid="email-input"]').type('student@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/student-dashboard');
  });
});

Cypress.Commands.add('loginAsRecruiter', () => {
  cy.session('recruiter-session', () => {
    cy.visit('/auth');
    cy.get('[data-testid="email-input"]').type('recruiter@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/recruiter-dashboard');
  });
});

Cypress.Commands.add('createTestJob', (jobData) => {
  return cy.request({
    method: 'POST',
    url: '/api/jobs',
    body: {
      title: jobData.title || 'Test Job',
      description: jobData.description || 'Test Description',
      task: jobData.task || {
        title: 'Test Task',
        description: 'Complete this task',
        instructions: 'Follow the instructions',
        time_limit: 120,
        submission_format: 'code',
      },
      requirements: jobData.requirements || ['React'],
      responsibilities: jobData.responsibilities || ['Build features'],
      salary: jobData.salary || { min: 50000, max: 80000, currency: 'USD' },
      location: jobData.location || { type: 'remote' },
      employment_type: jobData.employment_type || 'full-time',
      status: 'active',
    },
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
  }).then((response) => response.body);
});

Cypress.Commands.add('enrollInJob', (jobId) => {
  return cy.request({
    method: 'POST',
    url: `/api/students/applications/${jobId}/enroll`,
    body: {
      cover_letter: 'I am interested in this position',
    },
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
  }).then((response) => response.body);
});

Cypress.Commands.add('submitTask', (jobId, submissionData) => {
  return cy.request({
    method: 'POST',
    url: '/api/task-submissions',
    body: {
      job_id: jobId,
      submission_content: submissionData.content || 'Test submission',
      submission_type: submissionData.type || 'text',
      time_spent: submissionData.time_spent || 60,
    },
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
  }).then((response) => response.body);
});

Cypress.Commands.add('updateStudentProfile', (profileData) => {
  return cy.request({
    method: 'PUT',
    url: '/api/students/profile',
    body: profileData,
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
  }).then((response) => response.body);
});

Cypress.Commands.add('cleanupTestData', () => {
  // Clean up test data after each test
  cy.request({
    method: 'DELETE',
    url: '/api/test/cleanup',
    headers: {
      Authorization: `Bearer ${Cypress.env('authToken')}`,
    },
    failOnStatusCode: false,
  });
});

// Add custom command for file upload
Cypress.Commands.add('attachFile', { prevSubject: 'element' }, (subject, fileName, options = {}) => {
  return cy.fixture(fileName, 'base64').then((fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent);
    const file = new File([blob], fileName, { type: options.mimeType || 'application/zip' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    const input = subject[0];
    input.files = dataTransfer.files;
    
    return cy.wrap(subject).trigger('change', { force: options.force || false });
  });
});
