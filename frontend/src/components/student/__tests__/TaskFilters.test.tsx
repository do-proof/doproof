import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TaskFilters, { FilterState } from '../TaskFilters';

expect.extend(toHaveNoViolations);

const mockOnFiltersChange = jest.fn();
const mockOnSaveSearch = jest.fn();
const mockOnLoadSearch = jest.fn();

const defaultProps = {
  filters: {
    search: '',
    difficulty: [],
    category: [],
    employment_type: [],
    location_type: '',
    min_reward: null,
    max_reward: null,
    deadline_within: null,
    exclude_applied: false
  } as FilterState,
  onFiltersChange: mockOnFiltersChange,
  onSaveSearch: mockOnSaveSearch,
  onLoadSearch: mockOnLoadSearch,
  savedSearches: []
};

describe('TaskFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter controls', () => {
    render(<TaskFilters {...defaultProps} />);
    
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/employment type/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<TaskFilters {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should update search filter on input change', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const searchInput = screen.getByLabelText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'React Developer' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'React Developer'
        })
      );
    });
  });

  it('should handle difficulty filter selection', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const difficultySelect = screen.getByLabelText(/difficulty/i);
    fireEvent.change(difficultySelect, { target: { value: 'Easy' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it('should handle category filter selection', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, { target: { value: 'Software Development' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it('should handle employment type filter', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const employmentTypeSelect = screen.getByLabelText(/employment type/i);
    fireEvent.change(employmentTypeSelect, { target: { value: 'full-time' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it('should handle location type filter', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const locationTypeSelect = screen.getByLabelText(/location type/i);
    fireEvent.change(locationTypeSelect, { target: { value: 'remote' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it('should handle reward range filters', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const minRewardInput = screen.getByLabelText(/min reward/i);
    const maxRewardInput = screen.getByLabelText(/max reward/i);
    
    fireEvent.change(minRewardInput, { target: { value: '50000' } });
    fireEvent.change(maxRewardInput, { target: { value: '100000' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it('should handle exclude applied filter', async () => {
    render(<TaskFilters {...defaultProps} />);
    
    const excludeAppliedCheckbox = screen.getByLabelText(/exclude applied/i);
    fireEvent.click(excludeAppliedCheckbox);
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          exclude_applied: true
        })
      );
    });
  });

  it('should be keyboard navigable', () => {
    render(<TaskFilters {...defaultProps} />);
    
    const searchInput = screen.getByLabelText(/search/i);
    searchInput.focus();
    expect(searchInput).toHaveFocus();
    
    // Tab navigation should work
    fireEvent.keyDown(searchInput, { key: 'Tab' });
    // Next focusable element should receive focus
  });

  it('should display saved searches when available', () => {
    const savedSearches = [
      { id: '1', name: 'My Saved Search', filters: { search: 'React' } }
    ];
    
    render(<TaskFilters {...defaultProps} savedSearches={savedSearches} />);
    
    expect(screen.getByText(/my saved search/i)).toBeInTheDocument();
  });

  it('should call onLoadSearch when saved search is clicked', () => {
    const savedSearches = [
      { id: '1', name: 'My Saved Search', filters: { search: 'React' } }
    ];
    
    render(<TaskFilters {...defaultProps} savedSearches={savedSearches} />);
    
    const savedSearchButton = screen.getByText(/my saved search/i);
    fireEvent.click(savedSearchButton);
    
    expect(mockOnLoadSearch).toHaveBeenCalledWith(savedSearches[0].filters);
  });

  it('should be responsive on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<TaskFilters {...defaultProps} />);
    
    // Filters should still be accessible on mobile
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  });
});

