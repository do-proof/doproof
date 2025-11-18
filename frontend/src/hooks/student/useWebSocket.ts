import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../context/NotificationContext';
import { notificationKeys } from './useNotifications';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
  notification_id?: string;
}

interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  created_at: string;
}

interface UseWebSocketOptions {
  userId: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = ({
  userId,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();
  const { showInfo, showSuccess, showWarning, showError } = useNotifications();

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_URL || window.location.host.replace('3000', '8000');
    return `${protocol}//${host}/ws/notifications/${userId}`;
  }, [userId]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connection_established':
          setIsConnected(true);
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          console.log('WebSocket connected:', message.message);
          break;
          
        case 'notification':
          if (message.data) {
            const notification: RealtimeNotification = message.data;
            
            // Update notification cache
            queryClient.setQueriesData(
              { queryKey: notificationKeys.lists() },
              (oldData: any) => {
                if (!oldData) return oldData;
                
                const newNotification = {
                  id: notification.id,
                  user_id: userId,
                  type: notification.type,
                  title: notification.title,
                  message: notification.message,
                  data: notification.data,
                  read: false,
                  read_at: null,
                  created_at: notification.created_at,
                  expires_at: null
                };
                
                return {
                  ...oldData,
                  notifications: [newNotification, ...oldData.notifications],
                  total: oldData.total + 1,
                  unread_count: oldData.unread_count + 1
                };
              }
            );
            
            // Show toast notification based on type
            switch (notification.type) {
              case 'deadline_reminder':
                const urgency = notification.data.urgency;
                if (urgency === 'urgent') {
                  showWarning(notification.message, notification.title, 0, {
                    label: 'View Task',
                    onClick: () => {
                      // Navigate to task or application
                      console.log('Navigate to task:', notification.data.job_title);
                    }
                  });
                } else {
                  showWarning(notification.message, notification.title);
                }
                break;
                
              case 'evaluation_result':
                const score = notification.data.score;
                if (score >= 80) {
                  showSuccess(notification.message, notification.title);
                } else if (score >= 60) {
                  showInfo(notification.message, notification.title);
                } else {
                  showWarning(notification.message, notification.title);
                }
                break;
                
              case 'recruiter_update':
                const decision = notification.data.decision;
                if (decision === 'shortlist') {
                  showSuccess(notification.message, notification.title);
                } else if (decision === 'reject') {
                  showError(notification.message, notification.title);
                } else {
                  showInfo(notification.message, notification.title);
                }
                break;
                
              case 'new_recommendation':
                const matchScore = notification.data.match_score;
                if (matchScore >= 90) {
                  showSuccess(notification.message, notification.title);
                } else {
                  showInfo(notification.message, notification.title);
                }
                break;
                
              default:
                showInfo(notification.message, notification.title);
            }
          }
          break;
          
        case 'pong':
          // Handle ping/pong for keepalive
          break;
          
        case 'notification_marked_read':
          // Handle notification marked as read confirmation
          break;
          
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [queryClient, userId, showInfo, showSuccess, showWarning, showError]);

  const connect = useCallback(() => {
    if (!enabled || !userId) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        
        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };
      
      ws.onmessage = handleMessage;
      
      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && enabled && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [enabled, userId, getWebSocketUrl, handleMessage, reconnectAttempts, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    return sendMessage({
      type: 'mark_read',
      notification_id: notificationId
    });
  }, [sendMessage]);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled && userId) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, userId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionStatus,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    markNotificationRead
  };
};

export default useWebSocket;