// Task-related type definitions

export interface TaskCardVariant {
  size: 'small' | 'medium' | 'large';
  layout: 'compact' | 'detailed' | 'grid';
  showProgress: boolean;
  showActions: boolean;
}

export interface TaskCardTheme {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export interface TaskInteraction {
  type: 'view' | 'enroll' | 'continue' | 'submit';
  timestamp: Date;
  jobId: string;
  userId: string;
}

export interface TaskCardMetrics {
  viewCount: number;
  enrollmentRate: number;
  completionRate: number;
  averageScore: number;
}

// Application status types
export type ApplicationStatus = 
  | 'enrolled'
  | 'in_progress' 
  | 'submitted'
  | 'under_review'
  | 'completed'
  | 'rejected';

// Deadline status types
export type DeadlineStatus = 
  | 'open'
  | 'normal'
  | 'soon'
  | 'urgent'
  | 'expired';

// Difficulty levels
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

// Submission formats
export type SubmissionFormat = 'text' | 'file' | 'code' | 'presentation';

export interface TaskCardState {
  isHovered: boolean;
  isSelected: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export interface TaskCardActions {
  onView: () => void;
  onEnroll: () => void;
  onContinue: () => void;
  onSubmit: () => void;
  onSave: () => void;
  onShare: () => void;
}

export interface TaskCardConfig {
  showMatchScore: boolean;
  showDeadline: boolean;
  showProgress: boolean;
  showRewardPoints: boolean;
  showDifficulty: boolean;
  showCompany: boolean;
  enableHover: boolean;
  enableSelection: boolean;
}

// Helper type for task card props
export interface BaseTaskCardProps {
  className?: string;
  variant?: TaskCardVariant;
  theme?: TaskCardTheme;
  config?: Partial<TaskCardConfig>;
  onInteraction?: (interaction: TaskInteraction) => void;
}