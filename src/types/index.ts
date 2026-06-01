export type Role = 'Admin' | 'Manager' | 'Employee' | 'Trainee';

export interface Teammate {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  designation?: string;
  active: boolean;
}

export interface UserSession {
  user: Teammate | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  token?: string;
  refreshToken?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  message: string;
}

export interface Contact {
  _id?: string;
  clientId?: string;
  name: string;
  designation?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  alternatePhone?: string;
}

export interface Client {
  _id: string;
  name: string;
  tradeName?: string;
  constitution: 'Proprietorship' | 'Partnership' | 'LLP' | 'Pvt Ltd' | 'Public Ltd' | 'OPC' | 'Private Limited' | 'Public Limited' | 'Trust' | 'Individual';
  pan: string;
  gstType: 'Regular' | 'Composition' | 'Unregistered' | 'None';
  filingFrequency: 'Monthly' | 'Quarterly' | 'None';
  assignedTo?: string;
  assignedToUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  tags: string[];
  status: 'active' | 'inactive';
  grade: 'A' | 'B' | 'C' | 'D';
  clientType: 'Corporate' | 'Retail' | 'HNW' | 'SME' | 'Others';
  contactsCount?: number;
  contacts?: Contact[];
  createdAt: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  itemText: string;
  isMandatory: boolean;
}

export interface ComplianceTemplate {
  _id: string;
  title: string;
  description?: string;
  category: 'GST' | 'Income Tax' | 'Corporate Law' | 'Audit' | 'MSME' | 'FEMA' | 'Other';
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'One-Time';
  checklistItems: ChecklistItem[];
  averageMinutesToComplete?: number;
  applicableClientTypes: ('Pvt Ltd' | 'Public Ltd' | 'LLP' | 'OPC' | 'Partnership' | 'Proprietorship')[];
  dueDateRule: {
    ruleType: 'DayOfMonth' | 'DaysAfterMonthEnd' | 'DaysAfterQuarterEnd' | 'DaysAfterYearEnd' | 'SpecificDate';
    daysOffset?: number;
    specificDate?: string;
  };
  reminderRules: {
    daysBefore?: number[];
    channel?: 'Email' | 'Sms' | 'App' | 'Email & App';
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplianceCalendar {
  _id: string;
  templateId?: string;
  title: string;
  description?: string;
  category: 'GST' | 'Income Tax' | 'Corporate Law' | 'Audit' | 'MSME' | 'FEMA' | 'Other';
  dueDate: string;
  extDueDate?: string;
  penaltyAmountMultiplier?: number;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'One-Time';
  status: 'Upcoming' | 'Extended' | 'Completed' | 'Missed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
