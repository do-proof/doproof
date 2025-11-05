import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  created_at: string;
}

export interface WebSocketMessage {
  type: 'connection_established' | 'notification' | 'pong' | 'notification_marked_read' | 'application_status_update' | 'time_tracking_update';
  data?: any;
  message?: string;
  timestamp?: string;
  notification_id?: string;
}

export interface ApplicationStatusUpdate {
  application_id: string;
  status: string;
  ai_evaluation?: {
    overall_score: number;
    criteria_scores: Record<string, number>;
    feedback: string;
  };
  recruiter_review?: {
    rating: number;
    notes: string;
    decision: string;
  };
}

export interface TimeTrackingUpdate {
  submission_id: string;
  time_spent: number;
  last_activity: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  markNotificationAsRead: (notificationId: string) => void;
  // Event handlers
  onApplicationStatusUpdate?: (update: ApplicationStatusUpdate) => void;
  onTimeTrackingUpdate?: (update: TimeTrackingUpdate) => void;
  onRealtimeNotification?: (notification: RealtimeNotification) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { showInfo, showSuccess, showError } = useNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  const pingInterval = 30000; // 30 seconds

  // Event handlers that can be set by components
  const [onApplicationStatusUpdate, setOnApplicationStatusUpdate] = useState<((update: ApplicationStatusUpdate) => void) | undefined>();
  const [onTimeTrackingUpdate, setOnTimeTrackingUpdate] = useState<((update: TimeTrackingUpdate) => void) | undefined>();
  const [onRealtimeNotification, setOnRealtimeNotification] = useState<((notification: RealtimeNotification) => void) | undefined>();

  const connect = useCallback(() => {
    if (!user?._id || wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/notifications/${user._id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Start ping interval to keep connection alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, pingInterval);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          switch (message.type) {
            case 'connection_established':
              console.log('WebSocket connection established:', message.message);
              break;
              
            case 'notification':
              if (message.data) {
                const notification = message.data as RealtimeNotification;
                
                // Show notification in UI
                switch (notification.type) {
                  case 'deadline_reminder':
                    showInfo(notification.message, notification.title, 10000);
                    break;
                  case 'evaluation_result':
                    showSuccess(notification.message, notification.title, 8000);
                    break;
                  case 'recruiter_update':
                    showInfo(notification.message, notification.title, 8000);
                    break;
                  case 'new_recommendation':
                    showInfo(notification.message, notification.title, 6000);
                    break;
                  default:
                    showInfo(notification.message, notification.title);
                }
                
                // Call custom handler if set
                if (onRealtimeNotification) {
                  onRealtimeNotification(notification);
                }
              }
              break;
              
            case 'application_status_update':
              if (message.data && onApplicationStatusUpdate) {
                onApplicationStatusUpdate(message.data as ApplicationStatusUpdate);
              }
              break;
              
            case 'time_tracking_update':
              if (message.data && onTimeTrackingUpdate) {
                onTimeTrackingUpdate(message.data as TimeTrackingUpdate);
              }
              break;
              
            case 'pong':
              // Pong received, connection is alive
              break;
              
            case 'notification_marked_read':
              console.log('Notification marked as read:', message.notification_id);
              break;
              
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current); // Exponential backoff
        } else if (reconnectAttemptsRef.current >= maxReconnec