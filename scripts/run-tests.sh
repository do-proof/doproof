#!/bin/bash

echo "Running DoProof Test Suite..."
echo ""

echo "================================"
echo "Backend Tests"
echo "================================"
cd backend

echo "Running unit tests..."
python -m pytest tests/ -v --tb=short -m "not slow and not performance"

echo ""
echo "Running integration tests..."
python -m pytest tests/ -v --tb=short -m "integration"

echo ""
echo "Running performance tests..."
python -m pytest tests/ -v --tb=short -m "performance"

echo ""
echo "Generating coverage report..."
python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

cd ..

echo ""
echo "================================"
echo "Frontend Tests"
echo "================================"
cd frontend

echo "Running unit tests..."
npm run test:coverage

echo ""
echo "Running accessibility tests..."
npm run test:a11y

echo ""
echo "Running performance tests..."
npm run test:performance

echo ""
echo "Running E2E tests..."
npm run cypress:run

cd ..

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "All tests completed!"
echo "Check coverage reports:"
echo "- Backend: backend/htmlcov/index.html"
echo "- Frontend: frontend/coverage/lcov-report/index.html"
echo "- E2E: cypress/reports/"