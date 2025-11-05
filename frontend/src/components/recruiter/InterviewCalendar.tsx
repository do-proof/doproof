import React, { useState, useEffect } from 'react';
import { Interview, useInterviews } from '../../hooks/recruiter/useInterviews';

interface InterviewCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onInterviewSelect?: (interview: Interview) => void;
  className?: string;
}

const InterviewCalendar: React.FC<InterviewCalendarProps> = ({
  selectedDate = new Date(),
  onDateSelect,
  onInterviewSelect,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [monthInterviews, setMonthInterviews] = useState<Record<string, Interview[]>>({});
  const { getCalendarDay, loading } = useInterviews();

  // Generate calendar days for current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of calendar (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Get last day of calendar (might be from next month)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    // Generate all days
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentDate]);

  // Load interviews for visible month
  useEffect(() => {
    const loadMonthInterviews = async () => {
      const interviews: Record<string, Interview[]> = {};
      
      // Load interviews for each day in the calendar
      for (const day of calendarDays) {
        const dateStr = day.toISOString().split('T')[0];
        const calendarDay = await getCalendarDay(dateStr);
        if (calendarDay) {
          interviews[dateStr] = calendarDay.interviews;
        }
      }
      
      setMonthInterviews(interviews);
    };

    if (calendarDays.length > 0) {
      loadMonthInterviews();
    }
  }, [calendarDays, getCalendarDay]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const getInterviewsForDate = (date: Date): Interview[] => {
    const dateStr = date.toISOString().split('T')[0];
    return monthInterviews[dateStr] || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getStatusColor = (status: Interview['status']): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const interviews = getInterviewsForDate(date);
            const hasInterviews = interviews.length > 0;
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth(date) ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                  ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected(date) ? 'bg-blue-50 border-blue-300' : ''}
                `}
                onClick={() => handleDateClick(date)}
              >
                {/* Date Number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${isToday(date) ? 'text-blue-600' : ''}
                  ${isSelected(date) ? 'text-blue-600' : ''}
                `}>
                  {date.getDate()}
                </div>

                {/* Interview Indicators */}
                {hasInterviews && (
                  <div className="space-y-1">
                    {interviews.slice(0, 2).map((interview, idx) => (
                      <div
                        key={interview._id}
                        className={`
                          text-xs px-2 py-1 rounded truncate cursor-pointer
                          ${getStatusColor(interview.status)}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInterviewSelect?.(interview);
                        }}
                        title={`${formatTime(interview.scheduled_date)} - ${interview.title}`}
                      >
                        {formatTime(interview.scheduled_date)}
                      </div>
                    ))}
                    
                    {interviews.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{interviews.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading interviews...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendar;