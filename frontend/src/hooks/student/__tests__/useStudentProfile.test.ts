import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudentProfile, useUpdateStudentProfile } from '../useStudentProfile';
import { api } from '../../../utils/api';
import React from 'react';

jest.mock('../../../utils/api');
const mockApi = api as jest.Mocked<typeof api>;

jest.mock('../../useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  
  return Wrapper;
};

describe('useStudentProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch profile successfully', async () => {
    const mockProfile = {
      _id: '1',
      user_id: 'user1',
      personal_info: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      skills: ['React', 'TypeScript'],
      profile_completeness: 75,
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockProfile,
    });

    const { result } = renderHook(() => useStudentProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProfile);
  });
});

describe('useUpdateStudentProfile', () => {
  it('should update profile successfully', async () => {
    const mockUpdated = {
      _id: '1',
      personal_info: {
        first_name: 'Jane',
        last_name: 'Doe',
      },
    };

    mockApi.put.mockResolvedValueOnce({
      success: true,
      data: mockUpdated,
    });

    const { result } = renderHook(() => useUpdateStudentProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        personal_info: {
          first_name: 'Jane',
          last_name: 'Doe',
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
