/**
 * TypeScript type definitions for Diliguard PocketBase collections
 * Generated from pb_schema (1).json
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  emailVisibility: boolean
  verified: boolean
  name?: string
  avatar?: string
  created: string
  updated: string
}

export interface Account {
  id: string
  user: string // relation to users collection
  role: 'user' | 'admin'
  key: string
  account_status: 'active' | 'inactive' | 'suspended'
  monthly_usage: number
  last_payment?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  trial_end_date?: string
  cancel_at_period_end?: string
  last_reset_month?: number
  created: string
  updated: string
}

// ============================================================================
// RESEARCH TYPES
// ============================================================================

export interface Research {
  id: string
  account: string // relation to accounts collection
  date: string
  entity_type?: 'Individual' | 'Company' | 'Organization'
  primary_name: string
  location?: string
  url?: string
  industry?: string
  tax_reg?: string
  known_aliases?: string
  owner?: string
  status: 'Pending' | 'Complete' | 'Error'
  scan_timestamp: string
  risk_level?: 'Low' | 'Medium' | 'High' | 'Critical'
  status_color?: string
  overall_score?: number
  full_verdict?: string
  
  // Red Flags
  red_flag_1_desc?: string
  red_flag_1_url?: string
  red_flag_2_desc?: string
  red_flag_2_url?: string
  red_flag_3_desc?: string
  red_flag_3_url?: string
  
  // Green Flags
  green_flag_1_desc?: string
  green_flag_1_url?: string
  green_flag_2_desc?: string
  green_flag_2_url?: string
  green_flag_3_desc?: string
  green_flag_3_url?: string
  
  suggested_next_steps?: string
  key_associates?: string
  online_footprint?: string
  financial_indicators?: string
  expertise_assessment?: string
  behavioral_patterns?: string
  data_quality_score?: number
  investigation_depth?: 'Basic' | 'Moderate' | 'Deep'
  primary_risk_category?: string
  deception_score?: number
  follow_up_priority?: 'Low' | 'Medium' | 'High'
  prof_consistency_score?: number
  rep_integrity_score?: number
  legal_financial_score?: number
  operational_reliability?: number
  identity_match_rating?: number
  claims_vs_reality?: string
  
  // Pillar Analysis (JSON fields)
  pillar1_analysis?: any
  pillar2_analysis?: any
  pillar3_analysis?: any
  
  error_log?: string
  created: string
  updated: string
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment {
  id: string
  account: string // relation to accounts collection
  stripe_customer_id: string
  event_type: string
  amount: number
  currency: string
  stripe_id: string
  status: string
  timestamp: string
  created: string
  updated: string
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminConfig {
  id: string
  trial_days?: number
  stripe_price_id?: string
  success_url?: string
  stripe_secret_key?: string
  gemini_api_key?: string
  groq_api_key?: string
  gemini_model?: string
  groq_model?: string
  webhook: string
  created: string
  updated: string
}

// ============================================================================
// EXPANDED TYPES (with relations expanded)
// ============================================================================

export interface ResearchWithAccount extends Research {
  expand?: {
    account?: Account
  }
}

export interface PaymentWithAccount extends Payment {
  expand?: {
    account?: Account
  }
}

export interface AccountWithUser extends Account {
  expand?: {
    user?: User
  }
}

// ============================================================================
// FORM & UI TYPES
// ============================================================================

export interface NewSearchFormData {
  entity_type: 'Individual' | 'Company' | 'Organization'
  primary_name: string
  location?: string
  url?: string
  industry?: string
  tax_reg?: string
  known_aliases?: string
  owner?: string
}

export interface DashboardStats {
  totalSearches: number
  pendingSearches: number
  completedSearches: number
  monthlyUsage: number
  usageLimit: number | 'unlimited'
}

export interface AdminStats {
  totalUsers: number
  totalSearches: number
  totalRevenue: number
  activeSubscriptions: number
  monthlySearches: number
  monthlyRevenue: number
}