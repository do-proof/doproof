import pytest
import asyncio
import time
from httpx import AsyncClient
from bson import ObjectId
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
import statistics

class TestPerformance:
    """Performance tests for DoProof API endpoints."""

    async def test_job_creation_performance(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test job creation performance under load."""
        
        async def create_job():
            start_time = time.time()
            response = await client.post(
                "/api/jobs",
                json=sample_job_data,
                headers=auth_headers
            )
            end_time = time.time()
            return response.status_code, end_time - start_time

        # Test single job creation
        status_code, duration = await create_job()
        assert status_code == 201
        assert duration < 1.0  # Should complete within 1 second

        # Test concurrent job creation
        tasks = [create_job() for _ in range(10)]
        results = await asyncio.gather(*tasks)
        
        durations = [result[1] for result in results]
        status_codes = [result[0] for result in results]
        
        # All requests should succeed
        assert all(code == 201 for code in status_codes)
        
        # Average response time should be reasonable
        avg_duration = statistics.mean(durations)
        assert avg_duration < 2.0
        
        # 95th percentile should be acceptable
        p95_duration = statistics.quantiles(durations, n=20)[18]  # 95th percentile
        assert p95_duration < 3.0

    async def test_job_listing_performance_with_large_dataset(self, client: AsyncClient, auth_headers, clean_db):
        """Test job listing performance with large number of jobs."""
        
        # Create a large number of jobs
        jobs_data = []
        for i in range(1000):
            job = {
                "_id": ObjectId(),
                "title": f"Software Engineer {i}",
                "description": f"Job description {i}",
                "requirements": ["Python", "FastAPI", "MongoDB"],
                "responsibilities": ["Develop", "Test", "Deploy"],
                "salary": {"min": 70000 + i, "max": 120000 + i, "currency": "USD"},
                "location": {"type": "remote"},
                "employment_type": "full-time",
                "status": "active" if i % 2 == 0 else "draft",
                "task": {
                    "title": f"Task {i}",
                    "description": f"Task description {i}",
                    "time_limit": 120,
                    "submission_format": "text"
                },
                "evaluation_criteria": {
                    "critical_thinking": 25,
                    "problem_solving": 25,
                    "creativity": 25,
                    "technical_skills": 25,
                    "communication": 0,
                    "attention_to_detail": 0
                },
                "application_count": i % 50,
                "submission_count": i % 30,
                "view_count": i * 10,
                "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6"),
                "created_at": datetime.now() - timedelta(days=i % 30),
                "updated_at": datetime.now()
            }
            jobs_data.append(job)
        
        await clean_db.jobs.insert_many(jobs_data)

        # Test pagination performance
        start_time = time.time()
        response = await client.get("/api/jobs?page=1&per_page=50", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 0.5  # Should complete within 500ms
        
        data = response.json()
        assert len(data["jobs"]) == 50
        assert data["total"] == 1000

        # Test filtering performance
        start_time = time.time()
        response = await client.get("/api/jobs?status=active&per_page=100", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 1.0  # Filtering should be fast
        
        # Test search performance
        start_time = time.time()
        response = await client.get("/api/jobs?search=Engineer&per_page=100", headers=auth_headers)
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 1.0  # Search should be fast

    async def test_submission_processing_performance(self, client: AsyncClient, auth_headers, clean_db):
        """Test task submission processing performance."""
        
        # Create a job
        job_data = {
            "_id": ObjectId("60d5ec9af682fbd12a0a38d1"),
            "title": "Performance Test Job",
            "status": "active",
            "task": {
                "title": "Coding Challenge",
                "time_limit": 120,
                "submission_format": "text"
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)

        # Test concurrent submission creation
        async def create_submission(index):
            submission_data = {
                "job_id": str(job_data["_id"]),
                "submission": {
                    "type": "text",
                    "content": f"Submission content {index}. " * 100  # Large content
                },
                "time_spent": 90 + index
            }
            
            start_time = time.time()
            response = await client.post(
                "/api/task-submissions",
                json=submission_data,
                headers=auth_headers
            )
            end_time = time.time()
            
            return response.status_code, end_time - start_time

        # Create multiple submissions concurrently
        tasks = [create_submission(i) for i in range(50)]
        results = await asyncio.gather(*tasks)
        
        durations = [result[1] for result in results]
        status_codes = [result[0] for result in results]
        
        # All submissions should be created successfully
        assert all(code == 201 for code in status_codes)
        
        # Performance should be acceptable
        avg_duration = statistics.mean(durations)
        assert avg_duration < 2.0
        
        max_duration = max(durations)
        assert max_duration < 5.0

    async def test_bulk_operations_performance(self, client: AsyncClient, auth_headers, clean_db):
        """Test bulk operations performance."""
        
        # Create job and submissions for bulk operations
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Bulk Test Job",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Create many submissions
        submissions = []
        for i in range(500):
            submission = {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {"overall_score": 70 + (i % 30)},
                "created_at": datetime.now()
            }
            submissions.append(submission)
        
        await clean_db.task_submissions.insert_many(submissions)
        
        # Test bulk status update performance
        submission_ids = [str(sub["_id"]) for sub in submissions[:100]]
        bulk_data = {
            "submission_ids": submission_ids,
            "status": "shortlisted"
        }
        
        start_time = time.time()
        response = await client.patch(
            "/api/task-submissions/bulk-status",
            json=bulk_data,
            headers=auth_headers
        )
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 2.0  # Bulk update should be fast
        
        data = response.json()
        assert data["updated_count"] == 100

    async def test_analytics_query_performance(self, client: AsyncClient, auth_headers, clean_db):
        """Test analytics query performance with large datasets."""
        
        # Create job with many submissions for analytics
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Analytics Test Job",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Create submissions with various scores and dates
        submissions = []
        for i in range(2000):
            submission = {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {
                    "overall_score": 50 + (i % 50),
                    "criteria_scores": {
                        "critical_thinking": 50 + (i % 50),
                        "problem_solving": 55 + (i % 45),
                        "technical_skills": 60 + (i % 40)
                    },
                    "evaluated_at": datetime.now() - timedelta(days=i % 90)
                },
                "time_spent": 60 + (i % 120),
                "submitted_at": datetime.now() - timedelta(days=i % 90),
                "created_at": datetime.now() - timedelta(days=i % 90)
            }
            submissions.append(submission)
        
        await clean_db.task_submissions.insert_many(submissions)
        
        # Test analytics query performance
        start_time = time.time()
        response = await client.get(
            f"/api/analytics/job/{str(job_id)}",
            headers=auth_headers
        )
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 3.0  # Analytics should complete within 3 seconds
        
        data = response.json()
        assert "score_distribution" in data
        assert "criteria_averages" in data
        assert "time_trends" in data

    async def test_concurrent_user_performance(self, client: AsyncClient, clean_db):
        """Test performance with multiple concurrent users."""
        
        # Create multiple test users
        users = []
        for i in range(10):
            user = {
                "_id": ObjectId(),
                "email": f"user{i}@example.com",
                "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                "full_name": f"User {i}",
                "is_active": True
            }
            users.append(user)
        
        await clean_db.users.insert_many(users)
        
        # Get auth tokens for all users
        async def login_user(user):
            login_data = {"username": user["email"], "password": "secret"}
            response = await client.post("/api/users/login", data=login_data)
            return response.json()["access_token"]
        
        tokens = await asyncio.gather(*[login_user(user) for user in users])
        
        # Simulate concurrent operations by different users
        async def user_operations(token, user_index):
            headers = {"Authorization": f"Bearer {token}"}
            
            operations_time = []
            
            # Create job
            job_data = {
                "title": f"Job by User {user_index}",
                "description": "Test job",
                "requirements": ["Python"],
                "responsibilities": ["Develop"],
                "salary": {"min": 70000, "max": 100000, "currency": "USD"},
                "location": {"type": "remote"},
                "employment_type": "full-time",
                "task": {
                    "title": "Test Task",
                    "description": "Test description",
                    "time_limit": 120,
                    "submission_format": "text"
                },
                "evaluation_criteria": {
                    "critical_thinking": 50,
                    "problem_solving": 50,
                    "creativity": 0,
                    "technical_skills": 0,
                    "communication": 0,
                    "attention_to_detail": 0
                }
            }
            
            start_time = time.time()
            response = await client.post("/api/jobs", json=job_data, headers=headers)
            operations_time.append(time.time() - start_time)
            
            if response.status_code != 201:
                return None, operations_time
            
            job_id = response.json()["id"]
            
            # Get jobs list
            start_time = time.time()
            await client.get("/api/jobs", headers=headers)
            operations_time.append(time.time() - start_time)
            
            # Update job
            start_time = time.time()
            await client.put(f"/api/jobs/{job_id}", 
                           json={"title": f"Updated Job {user_index}"}, 
                           headers=headers)
            operations_time.append(time.time() - start_time)
            
            return job_id, operations_time
        
        # Run operations for all users concurrently
        start_time = time.time()
        results = await asyncio.gather(*[
            user_operations(token, i) for i, token in enumerate(tokens)
        ])
        total_time = time.time() - start_time
        
        # Analyze results
        successful_operations = [r for r in results if r[0] is not None]
        assert len(successful_operations) == 10  # All users should succeed
        
        # Total time should be reasonable for concurrent operations
        assert total_time < 10.0
        
        # Individual operation times should be acceptable
        all_operation_times = []
        for _, operation_times in successful_operations:
            all_operation_times.extend(operation_times)
        
        avg_operation_time = statistics.mean(all_operation_times)
        assert avg_operation_time < 2.0

    async def test_database_query_performance(self, client: AsyncClient, auth_headers, clean_db):
        """Test database query performance with complex queries."""
        
        # Create large dataset
        jobs = []
        submissions = []
        
        for i in range(100):
            job_id = ObjectId()
            job = {
                "_id": job_id,
                "title": f"Job {i}",
                "status": "active" if i % 2 == 0 else "draft",
                "created_at": datetime.now() - timedelta(days=i % 30),
                "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6"),
                "application_count": i % 50,
                "view_count": i * 10
            }
            jobs.append(job)
            
            # Create submissions for each job
            for j in range(20):
                submission = {
                    "_id": ObjectId(),
                    "job_id": job_id,
                    "candidate_id": ObjectId(),
                    "status": "evaluated",
                    "ai_evaluation": {
                        "overall_score": 50 + ((i + j) % 50),
                        "evaluated_at": datetime.now() - timedelta(days=(i + j) % 60)
                    },
                    "created_at": datetime.now() - timedelta(days=(i + j) % 60)
                }
                submissions.append(submission)
        
        await clean_db.jobs.insert_many(jobs)
        await clean_db.task_submissions.insert_many(submissions)
        
        # Test complex aggregation query performance
        start_time = time.time()
        
        # Simulate complex analytics query
        pipeline = [
            {"$match": {"recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")}},
            {"$lookup": {
                "from": "task_submissions",
                "localField": "_id",
                "foreignField": "job_id",
                "as": "submissions"
            }},
            {"$addFields": {
                "avg_score": {"$avg": "$submissions.ai_evaluation.overall_score"},
                "submission_count": {"$size": "$submissions"}
            }},
            {"$sort": {"avg_score": -1}},
            {"$limit": 50}
        ]
        
        cursor = clean_db.jobs.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        end_time = time.time()
        query_time = end_time - start_time
        
        # Complex aggregation should complete within reasonable time
        assert query_time < 2.0
        assert len(results) > 0

    async def test_memory_usage_under_load(self, client: AsyncClient, auth_headers, clean_db):
        """Test memory usage patterns under load."""
        
        # Create job for submissions
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Memory Test Job",
            "status": "active",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Test memory usage with large payloads
        large_content = "Large submission content. " * 10000  # ~250KB content
        
        async def create_large_submission(index):
            submission_data = {
                "job_id": str(job_id),
                "submission": {
                    "type": "text",
                    "content": large_content + f" Submission {index}"
                }
            }
            
            response = await client.post(
                "/api/task-submissions",
                json=submission_data,
                headers=auth_headers
            )
            return response.status_code
        
        # Create multiple large submissions
        start_time = time.time()
        tasks = [create_large_submission(i) for i in range(20)]
        results = await asyncio.gather(*tasks)
        end_time = time.time()
        
        # All should succeed
        assert all(status == 201 for status in results)
        
        # Should handle large payloads efficiently
        total_time = end_time - start_time
        assert total_time < 10.0  # Should complete within 10 seconds
        
        # Test retrieval of large submissions
        start_time = time.time()
        response = await client.get(
            f"/api/task-submissions?job_id={str(job_id)}",
            headers=auth_headers
        )
        end_time = time.time()
        
        assert response.status_code == 200
        assert end_time - start_time < 3.0  # Retrieval should be fast
        
        data = response.json()
        assert len(data["submissions"]) == 20

    @pytest.mark.benchmark
    async def test_endpoint_benchmarks(self, client: AsyncClient, auth_headers, sample_job_data):
        """Benchmark critical endpoints."""
        
        benchmarks = {}
        
        # Benchmark job creation
        times = []
        for _ in range(10):
            start = time.time()
            response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
            end = time.time()
            assert response.status_code == 201
            times.append(end - start)
        
        benchmarks["job_creation"] = {
            "avg": statistics.mean(times),
            "min": min(times),
            "max": max(times),
            "p95": statistics.quantiles(times, n=20)[18] if len(times) >= 20 else max(times)
        }
        
        # Benchmark job listing
        times = []
        for _ in range(10):
            start = time.time()
            response = await client.get("/api/jobs", headers=auth_headers)
            end = time.time()
            assert response.status_code == 200
            times.append(end - start)
        
        benchmarks["job_listing"] = {
            "avg": statistics.mean(times),
            "min": min(times),
            "max": max(times),
            "p95": statistics.quantiles(times, n=20)[18] if len(times) >= 20 else max(times)
        }
        
        # Assert performance thresholds
        assert benchmarks["job_creation"]["avg"] < 1.0
        assert benchmarks["job_creation"]["p95"] < 2.0
        assert benchmarks["job_listing"]["avg"] < 0.5
        assert benchmarks["job_listing"]["p95"] < 1.0
        
        # Print benchmarks for monitoring
        print(f"\nPerformance Benchmarks:")
        for endpoint, metrics in benchmarks.items():
            print(f"{endpoint}: avg={metrics['avg']:.3f}s, p95={metrics['p95']:.3f}s")