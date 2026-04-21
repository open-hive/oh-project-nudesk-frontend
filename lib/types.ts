export type UserRole = "student" | "tutor" | "admin" | "parent";

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_approved: boolean;
  is_email_verified: boolean;
  is_profile_complete: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_approved: boolean;
  is_profile_complete: boolean;
}

export interface LoginResponse extends AuthTokens {
  user: LoginUser;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  role: "student" | "tutor" | "parent";
  subject_area?: string;
  qualifications?: string;
  statement?: string;
}

export interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  phone: string;
  avatar_url: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileSetupPayload {
  first_name: string;
  last_name: string;
  bio?: string;
  phone?: string;
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: number;
  category_name: string;
  tutor: number;
  tutor_name: string;
  cover_image: string | null;
  price: string;
  is_free: boolean;
  status: string;
  average_rating: number | null;
  review_count: number;
  module_count: number;
  created_at: string;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
  reviews: CourseReview[];
  rejection_reason: string;
  updated_at: string;
}

export interface CourseModule {
  id: number;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  file: string | null;
  order: number;
  duration_minutes: number | null;
  quiz_question_count?: number | null;
  questions?: AdminQuizQuestion[] | null;
  created_at: string;
  updated_at: string;
}

export interface AdminQuizAnswer {
  id: number;
  text: string;
  is_correct: boolean;
  order: number;
}

export interface AdminQuizQuestion {
  id: number;
  text: string;
  explanation: string;
  order: number;
  answers: AdminQuizAnswer[];
}

export interface QuizAnswer {
  id: number;
  text: string;
  is_correct?: boolean; // present in tutor view, absent in student view
  order: number;
}

export interface QuizQuestion {
  id: number;
  text: string;
  explanation: string;
  order: number;
  answers: QuizAnswer[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizSubmitResult {
  question_id: number;
  chosen_answer_id: number | null;
  correct_answer_id: number | null;
  is_correct: boolean;
  explanation: string;
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
  score_pct: number;
  passed: boolean;
  results: QuizSubmitResult[];
}

export interface CourseReview {
  id: number;
  student: number;
  student_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface TutorSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ModuleProgress {
  id: number;
  module: number;
  module_title: string;
  module_order: number;
  content_type: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed_at: string | null;
  time_spent_minutes: number;
}

export interface EnrollmentDetail extends Enrollment {
  module_progress: ModuleProgress[];
}

export interface Enrollment {
  id: number;
  course: number;
  course_title: string;
  course_slug: string;
  tutor_name: string;
  cover_image: string | null;
  progress_percentage: number;
  module_count: number;
  completed_modules: number;
  enrolled_at: string;
  completed_at: string | null;
}

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Admin Types ──

export interface AdminDashboard {
  gmv_monthly: string;
  active_students: number;
  active_tutors: number;
  active_parents: number;
  published_courses: number;
  pending_tutor_applications: number;
  pending_courses: number;
  pending_study_guides: number;
  pending_live_classes: number;
  total_users: number;
  total_transactions: number;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_approved: boolean;
  is_email_verified: boolean;
  is_profile_complete: boolean;
  date_joined: string;
}

export interface TutorApplication {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  subject_area: string;
  qualifications: string;
  statement: string;
  cv_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string;
  reviewed_at: string | null;
  date_joined: string;
  created_at: string;
}

// ── Content Review Types ──

export interface PendingLiveClass {
  id: number;
  title: string;
  description: string;
  tutor_email: string;
  tutor_name: string;
  category_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_free: boolean;
  price: string;
  status: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface PendingCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  tutor_email: string;
  tutor_name: string;
  category_name: string;
  is_free: boolean;
  price: string;
  module_count: number;
  modules: CourseModule[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PendingStudyGuide {
  id: number;
  title: string;
  slug: string;
  description: string;
  tutor_email: string;
  tutor_name: string;
  category_name: string;
  is_free: boolean;
  price: string;
  page_count: number;
  file: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TutorCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  tutor: number;
  tutor_name: string;
  cover_image: string | null;
  is_free: boolean;
  price: string;
  status: string;
  module_count: number;
  average_rating: number | null;
  review_count: number;
  created_at: string;
  rejection_reason?: string;
}

// ── Study Guide Types ──

export interface StudyGuide {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  tutor: number;
  tutor_name: string;
  page_count: number;
  is_free: boolean;
  price: string;
  status: string;
  download_count: number;
  created_at: string;
}

export interface TutorStudyGuide extends StudyGuide {
  file: string;
  rejection_reason: string;
  updated_at: string;
}

export interface StudyGuideAccess {
  id: number;
  study_guide: number;
  guide_title: string;
  guide_slug: string;
  tutor_name: string;
  file: string;
  page_count: number;
  accessed_at: string;
  downloaded: boolean;
}

// ── Tutor Student Types ──

export interface TutorStudent {
  student_id: number;
  student_name: string;
  student_email: string;
  course_title: string;
  course_slug: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
  rating: number | null;
}

export interface TutorStudentModuleProgress {
  module_id: number;
  module_title: string;
  is_completed: boolean;
  time_spent_minutes: number;
  last_accessed_at: string | null;
}

export interface TutorStudentCourseDetail {
  course_id: number;
  course_title: string;
  course_slug: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
  modules: TutorStudentModuleProgress[];
}

export interface TutorStudentDetail {
  student_id: number;
  student_name: string;
  student_email: string;
  courses: TutorStudentCourseDetail[];
}

// ── Live Class Types ──

export interface LiveClass {
  id: number;
  title: string;
  description: string;
  category: number;
  category_name: string;
  tutor: number;
  tutor_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  registered_count: number;
  is_free: boolean;
  price: string;
  status: "pending_review" | "rejected" | "scheduled" | "live" | "completed" | "cancelled";
  rejection_reason?: string;
  room_id: string;
  recording_url: string;
  created_at: string;
}

export interface LiveClassRegistration {
  id: number;
  live_class: number;
  class_title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  tutor_name: string;
  status: "pending_review" | "rejected" | "scheduled" | "live" | "completed" | "cancelled";
  room_id: string;
  recording_url: string;
  max_capacity: number;
  registered_count: number;
  is_free: boolean;
  price: string;
  registered_at: string;
  attended: boolean;
}

export interface TurnCredentials {
  room_id: string;
  ice_servers: RTCIceServer[];
  title: string;
  tutor_id: number;
}

export interface LiveClassCreatePayload {
  title: string;
  description: string;
  category: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_free: boolean;
  price?: string;
}

// ── Student Dashboard Types ──

export interface StudentDashboard {
  enrolled_courses: number;
  completed_courses: number;
  certificates_earned: number;
  total_study_hours: number;
  learning_streak_days: number;
}

export interface CourseProgress {
  course_id: number;
  course_title: string;
  course_slug: string;
  tutor_name: string;
  progress_percentage: number;
  module_count: number;
  completed_modules: number;
  is_complete: boolean;
}

export interface Certificate {
  id: number;
  student_id: number;
  student_email: string;
  course_id: number;
  course_title: string;
  tutor_name: string;
  certificate_id: string;
  issued_at: string;
}

// ── Payment / Earnings Types ──

export interface Transaction {
  id: number;
  reference: string;
  student_email: string;
  tutor_email: string;
  content_type: "course" | "study_guide" | "live_class";
  content_title: string;
  amount: string;
  commission_rate: string;
  commission_amount: string;
  tutor_payout: string;
  gateway: string;
  gateway_reference: string;
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
}

export interface CheckoutResponse {
  detail: string;
  transaction: Transaction;
}

export interface MonthlyRevenue {
  month: string;
  revenue: string;
  enrollments: number;
}

export interface CourseRevenue {
  id: number;
  title: string;
  slug: string;
  student_count: number;
  revenue: string;
}

export interface TutorEarnings {
  total_earnings: string;
  monthly_earnings: string;
  monthly_chart: MonthlyRevenue[];
  per_course: CourseRevenue[];
}

export interface TutorDashboard {
  monthly_earnings: string;
  total_earnings: string;
  active_students: number;
  total_students: number;
  published_courses: number;
  total_courses: number;
  average_rating: number | null;
  total_reviews: number;
  published_guides: number;
  upcoming_live_classes: number;
}

// ── Admin Revenue Types ──

export interface AdminRevenueOverview {
  gmv_monthly: string;
  gmv_ytd: string;
  commission_monthly: string;
  commission_ytd: string;
  tutor_payouts_monthly: string;
  tutor_payouts_ytd: string;
  total_transactions: number;
  new_students_monthly: number;
  avg_revenue_per_user: string | null;
}

export interface MonthlyRevenueRow {
  month: string;
  gmv: string;
  commission: string;
  tutor_payouts: string;
  transaction_count: number;
}

// ── Parent Module Types ──

export interface ParentChildLink {
  id: number;
  parent: { id: number; email: string; first_name: string; last_name: string };
  child: { id: number; email: string; first_name: string; last_name: string };
  status:
    | "pending_parent_approval"
    | "pending_child_approval"
    | "active"
    | "declined"
    | "removed";
  initiated_by: "parent" | "child";
  requested_at: string;
  responded_at: string | null;
}

export interface ParentDashboard {
  children_count: number;
  total_enrolled: number;
  total_certs: number;
  total_spent: string;
}

export interface ChildSummary {
  link_id: number;
  child_id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
  enrolled_courses: number;
  completed_courses: number;
  certificates_earned: number;
  avg_progress: number;
  latest_activity: string | null;
  linked_since: string;
}

export interface ChildDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  phone: string;
  stats: {
    enrolled_courses: number;
    completed_courses: number;
    certificates_earned: number;
    total_study_hours: number;
    learning_streak_days: number;
  };
}

export interface ChildCourseProgress {
  id: number;
  course: number;
  course_title: string;
  course_slug: string;
  tutor_name: string;
  cover_image: string | null;
  progress_percentage: number;
  module_count: number;
  completed_modules: number;
  enrolled_at: string;
  completed_at: string | null;
}

export interface ParentTransaction {
  id: number;
  reference: string;
  content_type: "course" | "study_guide" | "live_class";
  content_title: string;
  child_email: string;
  child_name: string;
  amount: string;
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
}

export interface ChildInviteInfo {
  email: string;
  parent_name: string;
}

export interface InviteAcceptResult {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
    username: string;
    first_name: string;
    last_name: string;
    is_approved: boolean;
    is_profile_complete: boolean;
  };
}

// ── Admin Platform Settings ──

export interface AdminPlatformSettings {
  commission_percentage: string;
  platform_name: string;
  support_email: string;
}
