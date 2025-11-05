import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  search: string;
  difficulty: string[];
  category: string[];
  employment_type: string[];
  location_type: string;
  min_reward: number | null;
  max_reward: number | null;
  deadline_within: number | null;
  exclude_applied: boolean;
}

interface TaskFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSaveSearch?: (name: string, filters: FilterState) => void;
  savedSearches?: Array<{ name: string; filters: FilterState }>;
  onLoadSavedSearch?: (filters: FilterState) => void;
  isLoading?: boolean;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  onSaveSearch,
  savedSearches = [],
  onLoadSavedSearch,
  isLoading = false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // URL state management
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {};
    
    if (searchParams.get('search')) urlFilters.search = searchParams.get('search')!;
    if (searchParams.get('difficulty')) urlFilters.difficulty = searchParams.get('difficulty')!.split(',');
    if (searchParams.get('category')) urlFilters.category = searchParams.get('category')!.split(',');
    if (searchParams.get('employment_type')) urlFilters.employment_type = searchParams.get('employment_type')!.split(',');
    if (searchParams.get('location_type')) urlFilters.location_type = searchParams.get('location_type')!;
    if (searchParams.get('min_reward')) urlFilters.min_reward = parseInt(searchParams.get('min_reward')!);
    if (searchParams.get('max_reward')) urlFilters.max_reward = parseInt(searchParams.get('max_reward')!);
    if (searchParams.get('deadline_within')) urlFilters.deadline_within = parseInt(searchParams.get('deadline_within')!);
    if (searchParams.get('exclude_applied')) urlFilters.exclude_applied = searchParams.get('exclude_applied') === 'true';

    if (Object.keys(urlFilters).length > 0) {
      onFiltersChange({ ...filters, ...urlFilters });
      setSearchInput(urlFilters.search || '');
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.difficulty.length > 0) params.set('difficulty', filters.difficulty.join(','));
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (filters.employment_type.length > 0) params.set('employment_type', filters.employment_type.join(','));
    if (filters.location_type) params.set('location_type', filters.location_type);
    if (filters.min_reward) params.set('min_reward', filters.min_reward.toString());
    if (filters.max_reward) params.set('max_reward', filters.max_reward.toString());
    if (filters.deadline_within) params.set('deadline_within', filters.deadline_within.toString());
    if (filters.exclude_applied) params.set('exclude_applied', 'true');

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('taskFilters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        onFiltersChange({ ...filters, ...parsed });
        setSearchInput(parsed.search || '');
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('taskFilters', JSON.stringify(filters));
  }, [filters]);

  const handleMultiSelectChange = useCallback((field: keyof FilterState, value: string) => {
    const currentValues = filters[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ ...filters, [field]: newValues });
  }, [filters, onFiltersChange]);

  const handleSingleSelectChange = useCallback((field: keyof FilterState, value: string | number | boolean) => {
    onFiltersChange({ ...filters, [field]: value });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      search: '',
      difficulty: [],
      category: [],
      employment_type: [],
      location_type: '',
      min_reward: null,
      max_reward: null,
      deadline_within: null,
      exclude_applied: false
    };
    onFiltersChange(clearedFilters);
    setSearchInput('');
    localStorage.removeItem('taskFilters');
  }, [onFiltersChange]);

  const handleSaveSearch = useCallback(() => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  }, [saveSearchName, filters, onSaveSearch]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.difficulty.length > 0) count++;
    if (filters.category.length > 0) count++;
    if (filters.employment_type.length > 0) count++;
    if (filters.location_type) count++;
    if (filters.min_reward || filters.max_reward) count++;
    if (filters.deadline_within) count++;
    if (filters.exclude_applied) count++;
    return count;
  };

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];
  const categoryOptions = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Design', 'Data Science', 'AI/ML', 'QA'];
  const employmentTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const locationTypeOptions = ['Remote', 'On-site', 'Hybrid'];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6">
        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search tasks by title, description, or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 border rounded-lg font-medium transition-colors ${
              showAdvanced || getActiveFilterCount() > 1
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleSingleSelectChange('exclude_applied', !filters.exclude_applied)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.exclude_applied
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Hide Applied
          </button>
          
          <button
            onClick={() => handleSingleSelectChange('deadline_within', filters.deadline_within === 7 ? null : 7)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.deadline_within === 7
                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Due This Week
          </button>

          <button
            onClick={() => handleSingleSelectChange('deadline_within', filters.deadline_within === 30 ? null : 30)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.deadline_within === 30
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Due This Month
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => handleMultiSelectChange('difficulty', difficulty)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filters.difficulty.includes(difficulty)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleMultiSelectChange('category', category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filters.category.includes(category)
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Employment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
              <div className="flex flex-wrap gap-2">
                {employmentTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleMultiSelectChange('employment_type', type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filters.employment_type.includes(type)
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
              <select
                value={filters.location_type}
                onChange={(e) => handleSingleSelectChange('location_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Location</option>
                {locationTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Reward Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reward Points Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    placeholder="Min points"
                    value={filters.min_reward || ''}
                    onChange={(e) => handleSingleSelectChange('min_reward', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max points"
                    value={filters.max_reward || ''}
                    onChange={(e) => handleSingleSelectChange('max_reward', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Saved Searches Dropdown */}
            {savedSearches.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value && onLoadSavedSearch) {
                    const savedSearch = savedSearches.find(s => s.name === e.target.value);
                    if (savedSearch) {
                      onLoadSavedSearch(savedSearch.filters);
                      setSearchInput(savedSearch.filters.search);
                    }
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Load saved search...</option>
                {savedSearches.map((search) => (
                  <option key={search.name} value={search.name}>
                    {search.name}
                  </option>
                ))}
              </select>
            )}

            {/* Save Search Button */}
            {onSaveSearch && getActiveFilterCount() > 0 && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Save Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Search</h3>
            <input
              type="text"
              placeholder="Enter search name..."
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;