/**
 * User interface representing a user of the Seriously AI platform
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name */
  name: string;
  /** User's role in the organization */
  role: 'admin' | 'analyst' | 'viewer' | 'manager';
  /** Name of the user's organization */
  organization: string;
  /** User's avatar URL (optional) */
  avatar?: string;
  /** Timestamp when the user was created */
  createdAt: Date;
  /** Timestamp when the user was last updated */
  updatedAt: Date;
  /** Whether the user account is active */
  isActive: boolean;
  /** User's preferences for notifications and UI */
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    timezone: string;
  };
}

/**
 * Insight interface representing AI-generated business insights
 */
export interface Insight {
  /** Unique identifier for the insight */
  id: string;
  /** Title of the insight */
  title: string;
  /** Detailed description of the insight */
  description: string;
  /** Type/category of the insight */
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  /** Priority level of the insight */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Confidence score from AI analysis (0-100) */
  confidence: number;
  /** Data sources used to generate this insight */
  dataSources: string[];
  /** Metrics and data points supporting the insight */
  metrics: {
    [key: string]: number | string;
  };
  /** Recommended actions based on the insight */
  recommendations: string[];
  /** Tags for categorization and filtering */
  tags: string[];
  /** Timestamp when the insight was generated */
  generatedAt: Date;
  /** Timestamp when the insight expires or becomes stale */
  expiresAt?: Date;
  /** User who generated or requested the insight */
  createdBy: string;
  /** Current status of the insight */
  status: 'new' | 'reviewed' | 'acted_upon' | 'dismissed';
  /** Additional metadata */
  metadata: {
    analysisModel: string;
    dataRange: {
      start: Date;
      end: Date;
    };
    [key: string]: unknown;
  };
} 