import pytest
from httpx import AsyncClient
from bson import ObjectId
from datetime import datetime
from unittest.mock import AsyncMock, patch

class TestAIEvaluationEndpoints:
    """Test suite for AI evaluation endpoints."""

    async def test_trigger_evaluation_success(self, client: AsyncClient, auth_headers, clean_db):
        """Test successful AI evaluation trigger."""
        # Create job and submission
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "task": {
                "title": "API Design",
                "description": "Design a REST API",
                "instructions": "Create endpoints for user management"
            },
            "evaluation_criteria": {
                "critical_thinking": 25,
                "problem_solving": 30,
                "creativity": 15,
                "technical_skills": 20,
                "communication": 5,
                "attention_to_detail": 5
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId("60d5ec9af682fbd12a0a38d3"),
            "status": "submitted",
            "submission": {
                "type": "text",
                "content": "Here is my API design with proper REST endpoints..."
            },
            "submitted_at": datetime.now(),
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        # Mock AI evaluation service
        mock_evaluation = {
            "overall_score": 85,
            "criteria_scores": {
                "critical_thinking": 80,
                "problem_solving": 90,
                "creativity": 75,
                "technical_skills": 88,
                "communication": 82,
                "attention_to_detail": 85
            },
            "feedback": "Excellent API design with proper REST conventions.",
            "evaluation_model": "gpt-4",
            "confidence": 0.92
        }
        
        with patch('app.services.ai_evaluation.evaluate_submission', new_callable=AsyncMock) as mock_eval:
            mock_eval.return_value = mock_evaluation
            
            response = await client.post(
                f"/api/ai-evaluation/evaluate/{str(submission_id)}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["overall_score"] == 85
            assert data["criteria_scores"]["problem_solving"] == 90
            assert data["feedback"] == mock_evaluation["feedback"]
            assert "evaluated_at" in data

    async def test_get_evaluation_by_submission(self, client: AsyncClient, auth_headers, clean_db):
        """Test getting evaluation by submission ID."""
        # Create job, submission, and evaluation
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        evaluation_id = ObjectId("60d5ec9af682fbd12a0a38d3")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId(),
            "status": "evaluated",
            "ai_evaluation": {
                "overall_score": 85,
                "criteria_scores": {
                    "critical_thinking": 80,
                    "problem_solving": 90
                },
                "feedback": "Good solution",
                "evaluated_at": datetime.now(),
                "evaluation_model": "gpt-4"
            },
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        response = await client.get(
            f"/api/ai-evaluation/submission/{str(submission_id)}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["overall_score"] == 85
        assert data["criteria_scores"]["problem_solving"] == 90
        assert data["feedback"] == "Good solution"

    async def test_batch_evaluation(self, client: AsyncClient, auth_headers, clean_db):
        """Test batch evaluation of multiple submissions."""
        # Create job and multiple submissions
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "evaluation_criteria": {
                "critical_thinking": 25,
                "problem_solving": 25,
                "creativity": 25,
                "technical_skills": 25,
                "communication": 0,
                "attention_to_detail": 0
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_ids = [ObjectId(), ObjectId(), ObjectId()]
        submissions = []
        for sub_id in submission_ids:
            submission = {
                "_id": sub_id,
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "submitted",
                "submission": {
                    "type": "text",
                    "content": f"Solution for submission {str(sub_id)}"
                },
                "created_at": datetime.now()
            }
            submissions.append(submission)
        
        await clean_db.task_submissions.insert_many(submissions)
        
        # Mock batch evaluation
        mock_evaluations = [
            {"overall_score": 85, "criteria_scores": {"critical_thinking": 80}},
            {"overall_score": 75, "criteria_scores": {"critical_thinking": 70}},
            {"overall_score": 90, "criteria_scores": {"critical_thinking": 95}}
        ]
        
        with patch('app.services.ai_evaluation.batch_evaluate_submissions', new_callable=AsyncMock) as mock_batch:
            mock_batch.return_value = mock_evaluations
            
            batch_data = {
                "submission_ids": [str(sid) for sid in submission_ids]
            }
            
            response = await client.post(
                "/api/ai-evaluation/batch-evaluate",
                json=batch_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert len(data["evaluations"]) == 3
            assert data["evaluations"][0]["overall_score"] == 85
            assert data["evaluations"][2]["overall_score"] == 90

    async def test_evaluation_comparison(self, client: AsyncClient, auth_headers, clean_db):
        """Test comparing evaluations between submissions."""
        # Create job and submissions with evaluations
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission1_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        submission2_id = ObjectId("60d5ec9af682fbd12a0a38d3")
        
        submissions = [
            {
                "_id": submission1_id,
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {
                    "overall_score": 85,
                    "criteria_scores": {
                        "critical_thinking": 80,
                        "problem_solving": 90,
                        "technical_skills": 85
                    }
                },
                "created_at": datetime.now()
            },
            {
                "_id": submission2_id,
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {
                    "overall_score": 75,
                    "criteria_scores": {
                        "critical_thinking": 70,
                        "problem_solving": 80,
                        "technical_skills": 75
                    }
                },
                "created_at": datetime.now()
            }
        ]
        await clean_db.task_submissions.insert_many(submissions)
        
        comparison_data = {
            "submission_ids": [str(submission1_id), str(submission2_id)]
        }
        
        response = await client.post(
            "/api/ai-evaluation/compare",
            json=comparison_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["submissions"]) == 2
        assert data["comparison"]["winner"] == str(submission1_id)
        assert data["comparison"]["score_difference"] == 10
        assert "criteria_comparison" in data["comparison"]

    async def test_evaluation_analytics(self, client: AsyncClient, auth_headers, clean_db):
        """Test evaluation analytics endpoint."""
        # Create job with multiple evaluated submissions
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Create submissions with various scores
        submissions = []
        scores = [95, 85, 75, 65, 90, 80, 70]
        
        for i, score in enumerate(scores):
            submission = {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {
                    "overall_score": score,
                    "criteria_scores": {
                        "critical_thinking": score - 5,
                        "problem_solving": score + 5,
                        "technical_skills": score
                    },
                    "evaluated_at": datetime.now()
                },
                "created_at": datetime.now()
            }
            submissions.append(submission)
        
        await clean_db.task_submissions.insert_many(submissions)
        
        response = await client.get(
            f"/api/ai-evaluation/analytics?job_id={str(job_id)}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_evaluations"] == 7
        assert data["average_score"] == sum(scores) / len(scores)
        assert data["highest_score"] == 95
        assert data["lowest_score"] == 65
        assert "score_distribution" in data
        assert "criteria_averages" in data

    async def test_re_evaluate_submission(self, client: AsyncClient, auth_headers, clean_db):
        """Test re-evaluating an already evaluated submission."""
        # Create job and evaluated submission
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "evaluation_criteria": {
                "critical_thinking": 50,
                "problem_solving": 50,
                "creativity": 0,
                "technical_skills": 0,
                "communication": 0,
                "attention_to_detail": 0
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId(),
            "status": "evaluated",
            "submission": {
                "type": "text",
                "content": "Original solution"
            },
            "ai_evaluation": {
                "overall_score": 75,
                "criteria_scores": {"critical_thinking": 70, "problem_solving": 80},
                "feedback": "Original evaluation",
                "evaluated_at": datetime.now(),
                "evaluation_model": "gpt-3.5"
            },
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        # Mock new evaluation
        new_evaluation = {
            "overall_score": 85,
            "criteria_scores": {"critical_thinking": 80, "problem_solving": 90},
            "feedback": "Updated evaluation with better analysis",
            "evaluation_model": "gpt-4",
            "confidence": 0.95
        }
        
        with patch('app.services.ai_evaluation.evaluate_submission', new_callable=AsyncMock) as mock_eval:
            mock_eval.return_value = new_evaluation
            
            response = await client.post(
                f"/api/ai-evaluation/re-evaluate/{str(submission_id)}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["overall_score"] == 85
            assert data["feedback"] == "Updated evaluation with better analysis"
            assert data["evaluation_model"] == "gpt-4"

    async def test_evaluation_feedback_details(self, client: AsyncClient, auth_headers, clean_db):
        """Test getting detailed feedback for an evaluation."""
        # Create submission with detailed evaluation
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId(),
            "status": "evaluated",
            "ai_evaluation": {
                "overall_score": 85,
                "criteria_scores": {
                    "critical_thinking": 80,
                    "problem_solving": 90,
                    "technical_skills": 85
                },
                "feedback": "Overall excellent solution",
                "detailed_feedback": {
                    "critical_thinking": "Good problem analysis and approach",
                    "problem_solving": "Excellent solution with edge cases covered",
                    "technical_skills": "Clean code with good practices"
                },
                "strengths": [
                    "Clear problem understanding",
                    "Efficient algorithm choice",
                    "Good error handling"
                ],
                "improvements": [
                    "Could add more comments",
                    "Consider performance optimization"
                ],
                "evaluated_at": datetime.now(),
                "evaluation_model": "gpt-4"
            },
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        response = await client.get(
            f"/api/ai-evaluation/feedback/{str(submission_id)}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["overall_feedback"] == "Overall excellent solution"
        assert "critical_thinking" in data["detailed_feedback"]
        assert len(data["strengths"]) == 3
        assert len(data["improvements"]) == 2
        assert data["strengths"][0] == "Clear problem understanding"

    async def test_evaluation_access_control(self, client: AsyncClient, clean_db):
        """Test that recruiters can only access evaluations for their jobs."""
        # Create two recruiters
        recruiter1_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        recruiter2_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        users = [
            {
                "_id": recruiter1_id,
                "email": "recruiter1@example.com",
                "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                "full_name": "Recruiter One",
                "is_active": True
            },
            {
                "_id": recruiter2_id,
                "email": "recruiter2@example.com",
                "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                "full_name": "Recruiter Two",
                "is_active": True
            }
        ]
        await clean_db.users.insert_many(users)
        
        # Get auth headers
        login_data1 = {"username": "recruiter1@example.com", "password": "secret"}
        response1 = await client.post("/api/users/login", data=login_data1)
        headers1 = {"Authorization": f"Bearer {response1.json()['access_token']}"}
        
        login_data2 = {"username": "recruiter2@example.com", "password": "secret"}
        response2 = await client.post("/api/users/login", data=login_data2)
        headers2 = {"Authorization": f"Bearer {response2.json()['access_token']}"}
        
        # Create job for recruiter 1
        job_id = ObjectId("60d5ec9af682fbd12a0a38d3")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d4")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": recruiter1_id
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId(),
            "status": "evaluated",
            "ai_evaluation": {"overall_score": 85},
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        # Recruiter 2 should not access recruiter 1's evaluation
        response = await client.get(
            f"/api/ai-evaluation/submission/{str(submission_id)}",
            headers=headers2
        )
        assert response.status_code == 404
        
        # Recruiter 1 should access their evaluation
        response = await client.get(
            f"/api/ai-evaluation/submission/{str(submission_id)}",
            headers=headers1
        )
        assert response.status_code == 200