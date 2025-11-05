describe('Task Submission Management', () => {
  let testJob

  beforeEach(() => {
    cy.loginAsRecruiter()
    
    // Create a test job for submissions
    cy.createTestJob({
      title: 'Submission Test Job',
      task: {
        title: 'React Component Challenge',
        description: 'Build a reusable component',
        instructions: 'Create a data table with sorting',
        time_limit: 120,
        submission_format: 'text'
      }
    }).then((job) => {
      testJob = job
    })
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  it('should display task submissions page', () => {
    cy.navigateToRecruiterPage('submissions')
    
    cy.get('[data-testid="task-submissions-page"]').should('be.visible')
    cy.get('[data-testid="submissions-kanban-board"]').should('be.visible')
    cy.get('[data-testid="submissions-filters"]').should('be.visible')
  })

  it('should show submissions in kanban board', () => {
    // Create test submissions with different statuses
    cy.createTestSubmission(testJob.id, { 
      submission: { type: 'text', content: 'In progress submission' },
      status: 'in_progress'
    })
    
    cy.createTestSubmission(testJob.id, { 
      submission: { type: 'text', content: 'Submitted solution' },
      status: 'submitted'
    })

    cy.navigateToRecruiterPage('submissions')

    // Check kanban columns
    cy.get('[data-testid="kanban-column-in_progress"]').should('be.visible')
    cy.get('[data-testid="kanban-column-submitted"]').should('be.visible')
    cy.get('[data-testid="kanban-column-evaluated"]').should('be.visible')
    cy.get('[data-testid="kanban-column-reviewed"]').should('be.visible')

    // Check submission cards
    cy.get('[data-testid="submission-card"]').should('have.length', 2)
  })

  it('should view submission details', () => {
    cy.createTestSubmission(testJob.id, {
      submission: {
        type: 'text',
        content: 'Here is my detailed solution to the React component challenge...'
      },
      time_spent: 95
    }).then((submission) => {
      cy.navigateToRecruiterPage('submissions')

      // Click on submission card to view details
      cy.get(`[data-testid="submission-card-${submission.id}"]`).click()

      // Verify submission details modal
      cy.get('[data-testid="submission-details-modal"]').should('be.visible')
      cy.get('[data-testid="submission-content"]').should('contain.text', 'Here is my detailed solution')
      cy.get('[data-testid="time-spent"]').should('contain.text', '95 minutes')
      cy.get('[data-testid="candidate-info"]').should('be.visible')
    })
  })

  it('should filter submissions by job', () => {
    // Create another job and submission
    cy.createTestJob({ title: 'Another Job' }).then((anotherJob) => {
      cy.createTestSubmission(testJob.id, { 
        submission: { type: 'text', content: 'First job submission' }
      })
      
      cy.createTestSubmission(anotherJob.id, { 
        submission: { type: 'text', content: 'Second job submission' }
      })

      cy.navigateToRecruiterPage('submissions')

      // Filter by first job
      cy.get('[data-testid="job-filter-select"]').select(testJob.title)
      cy.waitForLoading()

      // Should only show submissions for selected job
      cy.get('[data-testid="submission-card"]').should('have.length', 1)
      cy.get('[data-testid="submission-card"]').should('contain.text', testJob.title)
    })
  })

  it('should filter submissions by AI score range', () => {
    // Create submissions with different AI scores
    cy.createTestSubmission(testJob.id, {
      ai_evaluation: {
        overall_score: 95,
        criteria_scores: { critical_thinking: 90, problem_solving: 100 },
        feedback: 'Excellent solution'
      },
      status: 'evaluated'
    })

    cy.createTestSubmission(testJob.id, {
      ai_evaluation: {
        overall_score: 65,
        criteria_scores: { critical_thinking: 60, problem_solving: 70 },
        feedback: 'Needs improvement'
      },
      status: 'evaluated'
    })

    cy.navigateToRecruiterPage('submissions')

    // Filter by high scores (80+)
    cy.get('[data-testid="min-score-input"]').type('80')
    cy.get('[data-testid="apply-filters-button"]').click()
    cy.waitForLoading()

    // Should only show high-scoring submission
    cy.get('[data-testid="submission-card"]').should('have.length', 1)
    cy.get('[data-testid="ai-score-display"]').should('contain.text', '95')
  })

  it('should update submission status', () => {
    cy.createTestSubmission(testJob.id, {
      status: 'evaluated',
      ai_evaluation: {
        overall_score: 85,
        criteria_scores: { critical_thinking: 80, problem_solving: 90 }
      }
    }).then((submission) => {
      cy.navigateToRecruiterPage('submissions')

      // Change status to shortlisted
      cy.get(`[data-testid="submission-card-${submission.id}"]`).within(() => {
        cy.get('[data-testid="status-select"]').select('shortlisted')
      })

      // Verify status change
      cy.checkToast('Submission status updated')
      
      // Check that submission moved to correct column
      cy.get('[data-testid="kanban-column-shortlisted"]').within(() => {
        cy.get(`[data-testid="submission-card-${submission.id}"]`).should('exist')
      })
    })
  })

  it('should add recruiter review', () => {
    cy.createTestSubmission(testJob.id, {
      status: 'evaluated',
      ai_evaluation: {
        overall_score: 85,
        criteria_scores: { critical_thinking: 80, problem_solving: 90 },
        feedback: 'Good technical solution'
      }
    }).then((submission) => {
      cy.navigateToRecruiterPage('submissions')

      // Open submission details
      cy.get(`[data-testid="submission-card-${submission.id}"]`).click()

      // Add recruiter review
      cy.get('[data-testid="add-review-button"]').click()
      cy.get('[data-testid="review-rating-5"]').click() // 5-star rating
      cy.get('[data-testid="review-notes-textarea"]').type('Excellent problem-solving approach. Clean and well-structured code.')
      cy.get('[data-testid="review-decision-select"]').select('shortlist')
      cy.get('[data-testid="submit-review-button"]').click()

      // Verify review was added
      cy.checkToast('Review added successfully')
      cy.get('[data-testid="recruiter-review"]').should('be.visible')
      cy.get('[data-testid="review-rating"]').should('contain.text', '5')
      cy.get('[data-testid="review-notes"]').should('contain.text', 'Excellent problem-solving approach')
    })
  })

  it('should compare multiple submissions', () => {
    // Create multiple submissions for comparison
    const submissions = []
    
    cy.createTestSubmission(testJob.id, {
      ai_evaluation: {
        overall_score: 90,
        criteria_scores: { critical_thinking: 85, problem_solving: 95, technical_skills: 90 }
      },
      status: 'evaluated'
    }).then((sub1) => {
      submissions.push(sub1)
      
      cy.createTestSubmission(testJob.id, {
        ai_evaluation: {
          overall_score: 75,
          criteria_scores: { critical_thinking: 70, problem_solving: 80, technical_skills: 75 }
        },
        status: 'evaluated'
      }).then((sub2) => {
        submissions.push(sub2)

        cy.navigateToRecruiterPage('submissions')

        // Select submissions for comparison
        cy.get(`[data-testid="submission-checkbox-${sub1.id}"]`).check()
        cy.get(`[data-testid="submission-checkbox-${sub2.id}"]`).check()
        
        // Open comparison view
        cy.get('[data-testid="compare-selected-button"]').click()

        // Verify comparison modal
        cy.get('[data-testid="comparison-modal"]').should('be.visible')
        cy.get('[data-testid="comparison-chart"]').should('be.visible')
        cy.get('[data-testid="score-comparison"]').should('contain.text', '90')
        cy.get('[data-testid="score-comparison"]').should('contain.text', '75')
      })
    })
  })

  it('should perform bulk actions on submissions', () => {
    // Create multiple submissions
    const submissionPromises = []
    for (let i = 0; i < 3; i++) {
      submissionPromises.push(
        cy.createTestSubmission(testJob.id, {
          status: 'evaluated',
          ai_evaluation: { overall_score: 80 + i * 5 }
        })
      )
    }

    Promise.all(submissionPromises).then((submissions) => {
      cy.navigateToRecruiterPage('submissions')

      // Select multiple submissions
      submissions.forEach((submission) => {
        cy.get(`[data-testid="submission-checkbox-${submission.id}"]`).check()
      })

      // Perform bulk status update
      cy.get('[data-testid="bulk-actions-dropdown"]').click()
      cy.get('[data-testid="bulk-status-shortlisted"]').click()

      // Confirm bulk action
      cy.get('[data-testid="confirm-bulk-action"]').click()

      // Verify bulk update
      cy.checkToast('3 submissions updated')
      
      // Check that all submissions moved to shortlisted column
      cy.get('[data-testid="kanban-column-shortlisted"]').within(() => {
        cy.get('[data-testid="submission-card"]').should('have.length', 3)
      })
    })
  })

  it('should display AI evaluation details', () => {
    cy.createTestSubmission(testJob.id, {
      status: 'evaluated',
      ai_evaluation: {
        overall_score: 88,
        criteria_scores: {
          critical_thinking: 85,
          problem_solving: 92,
          creativity: 80,
          technical_skills: 90,
          communication: 85,
          attention_to_detail: 88
        },
        feedback: 'Strong technical implementation with good problem-solving approach. Code is clean and well-documented.',
        detailed_feedback: {
          critical_thinking: 'Good analysis of the problem requirements',
          problem_solving: 'Excellent algorithm choice and implementation',
          technical_skills: 'Clean code with proper error handling'
        },
        strengths: [
          'Clear problem understanding',
          'Efficient solution',
          'Good code structure'
        ],
        improvements: [
          'Could add more edge case handling',
          'Consider performance optimization'
        ],
        evaluated_at: new Date().toISOString(),
        evaluation_model: 'gpt-4'
      }
    }).then((submission) => {
      cy.navigateToRecruiterPage('submissions')

      // View AI evaluation details
      cy.get(`[data-testid="submission-card-${submission.id}"]`).within(() => {
        cy.get('[data-testid="view-ai-evaluation-button"]').click()
      })

      // Verify AI evaluation modal
      cy.get('[data-testid="ai-evaluation-modal"]').should('be.visible')
      cy.get('[data-testid="overall-score"]').should('contain.text', '88')
      cy.get('[data-testid="criteria-breakdown"]').should('be.visible')
      cy.get('[data-testid="ai-feedback"]').should('contain.text', 'Strong technical implementation')
      cy.get('[data-testid="detailed-feedback"]').should('be.visible')
      cy.get('[data-testid="strengths-list"]').should('contain.text', 'Clear problem understanding')
      cy.get('[data-testid="improvements-list"]').should('contain.text', 'Could add more edge case handling')
    })
  })

  it('should handle file submissions', () => {
    // Create job that accepts file submissions
    cy.createTestJob({
      title: 'File Submission Job',
      task: {
        submission_format: 'file',
        allowed_file_types: ['pdf', 'txt', 'zip'],
        max_file_size: 5242880 // 5MB
      }
    }).then((fileJob) => {
      cy.createTestSubmission(fileJob.id, {
        submission: {
          type: 'file',
          file_name: 'solution.zip',
          file_size: 1024000,
          file_url: 'https://example.com/submissions/solution.zip'
        }
      }).then((submission) => {
        cy.navigateToRecruiterPage('submissions')

        // View file submission
        cy.get(`[data-testid="submission-card-${submission.id}"]`).click()

        // Verify file submission display
        cy.get('[data-testid="file-submission-info"]').should('be.visible')
        cy.get('[data-testid="file-name"]').should('contain.text', 'solution.zip')
        cy.get('[data-testid="file-size"]').should('contain.text', '1.0 MB')
        cy.get('[data-testid="download-file-button"]').should('be.visible')
      })
    })
  })

  it('should export submission data', () => {
    cy.createTestSubmission(testJob.id, {
      status: 'evaluated',
      ai_evaluation: { overall_score: 85 }
    })

    cy.navigateToRecruiterPage('submissions')

    // Export submissions
    cy.get('[data-testid="export-dropdown"]').click()
    cy.get('[data-testid="export-csv"]').click()

    // Verify export initiated
    cy.checkToast('Export started')
    
    // Note: In a real test, you might verify the downloaded file
    // For now, we just check that the export action was triggered
  })
});