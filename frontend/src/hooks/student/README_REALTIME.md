# Real-time Features Documentation

This document explains how to use the real-time features implemented for the student experience.

## Overview

The real-time system provides:
- **WebSocket connections** for instant updates
- **Application status updates** when AI evaluations or recruiter reviews complete
- **Live notifications** for deadlines, evaluations, and recommendations
- **Time tracking** during task work sessions with auto-sync
- **Optimistic updates** for better UX
- **Connection status indicators** with automatic reconnection

## Architecture

```
WebSocketContext (Global)
    ↓
├── useRealtimeApplications (Hook)
├── useRealtimeNotifications (Hook)
├── useTimeTracking (Hook)
└── useOptimisticUpdates (Hook)
```

## Components

### 1. WebSocket Context

The `WebSocketContext` manages the WebSocket connection and provides real-time messaging capabilities.

**Location:** `frontend/src/context/WebSocketContext.tsx`

**Features:**
- Automatic connection/reconnection
- Ping/pong keepalive
- Event handler registration
- Connection status tracking

**Usage:**
```typescript
import { useWebSocket } from '../../context/WebSocketContext';

const { isConnected, connectionStatus, sendMessage } = useWebSocket();
```

### 2. Real-time Applications Hook

Listens for application status updates via WebSocket and automatically updates the cache.

**Location:** `frontend/src/hooks/student/useRealtimeApplications.ts`

**Usage:**
```typescript
import { useRealtimeApplications } from '../../hooks/student/useRealtimeApplications';

const MyComponent = () => {
  useRealtimeApplications({
    enabled: true,
    onStatusUpdate: (update) => {
      console.log('Application updated:', update);
      // Handle custom logic
    }
  });
  
  // Component will automatically receive updates
};
```

**What it does:**
- Listens for `application_status_update` WebSocket messages
- Updates React Query cache automatically
- Shows toast notifications for evaluations and reviews
- Calls custom handler if provided

### 3. Real-time Notifications Hook

Listens for real-time notifications and updates the notification cache.

**Location:** `frontend/src/hooks/student/useRealtimeNotifications.ts`

**Usage:**
```typescript
import { useRealtimeNotifications } from '../../hooks/student/useRealtimeNotifications';

const MyComponent = () => {
  const { markAsRead } = useRealtimeNotifications({
    enabled: true,
    autoMarkAsRead: false, // Set to true to auto-mark after 3 seconds
    onNotification: (notification) => {
      console.log('New notification:', notification);
    }
  });
  
  // Manually mark notification as read
  const handleMarkRead = (notificationId: string) => {
    markAsRead(notificationId);
  };
};
```

### 4. Time Tracking Hook

Tracks time spent on tasks with automatic syncing to the server.

**Location:** `frontend/src/hooks/student/useTimeTracking.ts`

**Usage:**
```typescript
import { useTimeTracking } from '../../hooks/student/useTimeTracking';

const TaskWorkspace = ({ submissionId, applicationId }) => {
  const {
    isActive,
    formattedTime,
    timeInMinutes,
    start,
    pause,
    reset,
    sync,
    isSyncing
  } = useTimeTracking({
    submissionId,
    applicationId,
    initialTimeSpent: 0, // in minutes
    autoSyncInterval: 60000, // sync every minute
    onSync: (timeSpent) => {
      console.log('Time synced:', timeSpent, 'minutes');
    },
    onError: (error) => {
      console.error('Sync failed:', error);
    }
  });

  return (
    <div>
      <div>Time: {formattedTime}</div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={reset}>Reset</button>
      <button onClick={sync} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
};
```

**Features:**
- Automatic time tracking per second
- Auto-sync to server at configurable intervals
- Manual sync capability
- Pauses when tab is hidden
- Updates both submission and application records
- Sends real-time updates via WebSocket

### 5. Optimistic Updates Hook

Provides optimistic UI updates before server confirmation.

**Location:** `frontend/src/hooks/student/useOptimisticUpdates.ts`

**Usage:**
```typescript
import { useOptimisticUpdates } from '../../hooks/student/useOptimisticUpdates';

const MyComponent = () => {
  const {
    optimisticApplicationUpdate,
    optimisticSubmissionUpdate,
    optimisticTimeUpdate,
    optimisticMarkNotificationRead
  } = useOptimisticUpdates();

  const handleUpdateApplication = async (applicationId: string) => {
    // Optimistically update UI
    const rollback = optimisticApplicationUpdate(applicationId, {
      status: 'submitted'
    });

    try {
      // Make API call
      await updateApplication(applicationId);
    } catch (error) {
      // Rollback on error
      rollback();
    }
  };

  const handleTimeUpdate = (submissionId: string, applicationId: string, timeSpent: number) => {
    // Optimistically update both submission and application
    const rollback = optimisticTimeUpdate(submissionId, applicationId, timeSpent);
    
    // Rollback will be called automatically if sync fails
  };
};
```

## UI Components

### 1. TimeTracker Component

A complete time tracking UI with start/pause/reset controls.

**Location:** `frontend/src/components/student/TimeTracker.tsx`

**Usage:**
```typescript
import TimeTracker from './TimeTracker';

<TimeTracker
  submissionId="submission123"
  applicationId="app456"
  initialTimeSpent={30} // 30 minutes
  showControls={true}
  compact={false}
  onSync={(timeSpent) => console.log('Synced:', timeSpent)}
/>
```

**Props:**
- `submissionId`: ID of the task submission
- `applicationId`: ID of the application
- `initialTimeSpent`: Initial time in minutes (default: 0)
- `showControls`: Show start/pause/reset buttons (default: true)
- `compact`: Use compact display mode (default: false)
- `onSync`: Callback when time is synced

### 2. RealtimeStatusBanner Component

Shows connection status with visual indicators.

**Location:** `frontend/src/components/student/RealtimeStatusBanner.tsx`

**Usage:**
```typescript
import RealtimeStatusBanner from './RealtimeStatusBanner';

<RealtimeStatusBanner
  showWhenConnected={false} // Only show when disconnected/error
/>
```

**States:**
- **Connected**: Green indicator with success message
- **Connecting**: Yellow indicator with spinner
- **Disconnected**: Gray indicator with reconnect message
- **Error**: Red indicator with error message

### 3. RealtimeTaskWorkspace Component

A complete workspace that integrates all real-time features.

**Location:** `frontend/src/components/student/RealtimeTaskWorkspace.tsx`

**Usage:**
```typescript
import RealtimeTaskWorkspace from './RealtimeTaskWorkspace';

<RealtimeTaskWorkspace
  applicationId="app123"
  submissionId="sub456"
  jobTitle="Frontend Developer Task"
>
  {/* Your task content here */}
  <TaskSubmissionForm />
</RealtimeTaskWorkspace>
```

**Features:**
- Connection status banner
- Time tracker sidebar
- Real-time evaluation results display
- Real-time recruiter review display
- Quick stats panel
- Automatic cache updates

## Backend Integration

### WebSocket Endpoint

**URL:** `ws://localhost:8000/ws/notifications/{user_id}`

**Message Types:**

1. **Connection Established**
```json
{
  "type": "connection_established",
  "message": "Connected to notification stream",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

2. **Notification**
```json
{
  "type": "notification",
  "data": {
    "id": "notif123",
    "type": "evaluation_result",
    "title": "Evaluation Complete",
    "message": "Your submission scored 85/100",
    "data": { "score": 85 },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

3. **Application Status Update**
```json
{
  "type": "application_status_update",
  "data": {
    "application_id": "app123",
    "status": "evaluated",
    "ai_evaluation": {
      "overall_score": 85,
      "criteria_scores": { "technical": 90, "communication": 80 },
      "feedback": "Great work!"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

4. **Time Tracking Update**
```json
{
  "type": "time_tracking_update",
  "data": {
    "submission_id": "sub123",
    "time_spent": 45,
    "last_activity": "2024-01-01T00:00:00Z",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

5. **Ping/Pong** (Keepalive)
```json
// Client sends
{ "type": "ping" }

// Server responds
{ "type": "pong", "timestamp": "2024-01-01T00:00:00Z" }
```

## Best Practices

### 1. Enable Real-time Features Conditionally

```typescript
// Only enable when user is on the page
const isOnTaskPage = useMatch('/student/task/:id');

useRealtimeApplications({
  enabled: !!isOnTaskPage
});
```

### 2. Handle Connection Errors Gracefully

```typescript
const { connectionStatus } = useWebSocket();

if (connectionStatus === 'error') {
  return <ErrorMessage>Real-time updates unavailable. Please refresh.</ErrorMessage>;
}
```

### 3. Use Optimistic Updates for Better UX

```typescript
const { optimisticTimeUpdate } = useOptimisticUpdates();

// Update UI immediately, sync in background
const handleTimeSync = (timeSpent: number) => {
  optimisticTimeUpdate(submissionId, applicationId, timeSpent);
};
```

### 4. Clean Up Event Handlers

```typescript
useEffect(() => {
  // Handlers are automatically cleaned up when component unmounts
  // No manual cleanup needed
}, []);
```

### 5. Monitor Connection Status

```typescript
const { isConnected, connectionStatus } = useWebSocket();

useEffect(() => {
  if (!isConnected) {
    console.warn('WebSocket disconnected, some features may be delayed');
  }
}, [isConnected]);
```

## Testing

### Manual Testing

1. **Test WebSocket Connection:**
   - Open browser DevTools → Network → WS
   - Look for WebSocket connection to `/ws/notifications/{user_id}`
   - Should see "connection_established" message

2. **Test Time Tracking:**
   - Start timer
   - Wait for auto-sync (1 minute)
   - Check Network tab for API calls to update submission
   - Verify time updates in UI

3. **Test Real-time Updates:**
   - Have a recruiter evaluate a submission
   - Student should see instant notification
   - Application status should update without refresh

4. **Test Reconnection:**
   - Disconnect network
   - Reconnect network
   - WebSocket should automatically reconnect
   - Check connection status indicator

### Automated Testing

```typescript
// Example test for time tracking
import { renderHook, act } from '@testing-library/react';
import { useTimeTracking } from './useTimeTracking';

test('time tracking increments every second', async () => {
  const { result } = renderHook(() => useTimeTracking({
    submissionId: 'test',
    applicationId: 'test',
    autoSyncInterval: 60000
  }));

  act(() => {
    result.current.start();
  });

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  expect(result.current.elapsedTime).toBeGreaterThanOrEqual(2);
});
```

## Troubleshooting

### WebSocket Not Connecting

1. Check WebSocket URL in environment variables
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure backend WebSocket endpoint is running

### Time Not Syncing

1. Check network tab for failed API calls
2. Verify submission and application IDs are valid
3. Check user permissions
4. Look for error callbacks being triggered

### Updates Not Appearing

1. Verify WebSocket is connected
2. Check React Query DevTools for cache updates
3. Ensure hooks are enabled
4. Check for JavaScript errors in console

### High Memory Usage

1. Reduce auto-sync interval
2. Disable real-time features when not needed
3. Clean up old cache data
4. Use compact mode for time tracker

## Performance Considerations

- **Auto-sync interval**: Default 60 seconds, adjust based on needs
- **Cache invalidation**: Selective invalidation to avoid unnecessary refetches
- **Optimistic updates**: Reduce perceived latency
- **Connection pooling**: One WebSocket per user, reused across tabs
- **Ping interval**: 30 seconds to keep connection alive

## Future Enhancements

- [ ] Add WebSocket message queue for offline support
- [ ] Implement exponential backoff for reconnection
- [ ] Add compression for large messages
- [ ] Support multiple WebSocket channels
- [ ] Add analytics for connection quality
- [ ] Implement message acknowledgment system
