import { useState, useEffect, useCallback } from 'react';
import { FilterState } from '../../components/student/TaskFilters';

export interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'savedTaskSearches';

export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedSearches(parsed);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  }, []);

  // Save to localStorage whenever savedSearches changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
    } catch (error) {
      console.error('Error saving searches:', error);
    }
  }, [savedSearches]);

  const saveSearch = useCallback((name: string, filters: FilterState) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString()
    };

    setSavedSearches(prev => {
      // Check if a search with this name already exists
      const existingIndex = prev.findIndex(search => search.name === name);
      if (existingIndex >= 0) {
        // Update existing search
        const updated = [...prev];
        updated[existingIndex] = { ...newSearch, id: prev[existingIndex].id };
        return updated;
      } else {
        // Add new search
        return [...prev, newSearch];
      }
    });
  }, []);

  const deleteSearch = useCallback((id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  }, []);

  const updateLastUsed = useCallback((id: string) => {
    setSavedSearches(prev => 
      prev.map(search => 
        search.id === id 
          ? { ...search, lastUsed: new Date().toISOString() }
          : search
      )
    );
  }, []);

  const loadSearch = useCallback((id: string) => {
    const search = savedSearches.find(s => s.id === id);
    if (search) {
      updateLastUsed(id);
      return search.filters;
    }
    return null;
  }, [savedSearches, updateLastUsed]);

  const getRecentSearches = useCallback((limit: number = 5) => {
    return savedSearches
      .filter(search => search.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, limit);
  }, [savedSearches]);

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    loadSearch,
    getRecentSearches
  };
};

export default useSavedSearches;