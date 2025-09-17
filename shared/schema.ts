import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isEmailVerified: text("is_email_verified").default("false"),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // New unified pricing structure
  subscriptionTier: varchar("subscription_tier").default("free_registered"), // free_anonymous, free_registered, pro, enterprise  
  subscriptionStatus: varchar("subscription_status").default("inactive"), // inactive, active, past_due, canceled
  subscriptionEndDate: timestamp("subscription_end_date"),
  monthlyOperations: integer("monthly_operations").default(0), // Current month usage
  dailyOperations: integer("daily_operations").default(0), // Current day usage
  hourlyOperations: integer("hourly_operations").default(0), // Current hour usage
  lastOperationAt: timestamp("last_operation_at"), // When last operation was performed
  bytesProcessed: integer("bytes_processed").default(0), // Total bytes processed this month
  isPremium: boolean("is_premium").default(false), // For development testing and manual premium grants
  purchasedCredits: integer("purchased_credits").default(0), // Prepaid credits purchased
  totalCreditsUsed: integer("total_credits_used").default(0), // Lifetime credits consumed
  accountStatus: varchar("account_status").default("active"), // active, suspended, cancelled
  suspendedAt: timestamp("suspended_at"), // When account was suspended
  suspensionReason: text("suspension_reason"), // Reason for suspension
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys table for API access system
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(), // User-friendly name for the key
  keyHash: varchar("key_hash").notNull().unique(), // Hashed version of the API key
  keyPrefix: varchar("key_prefix").notNull(), // First 8 chars for identification (sk_test_12345678...)
  permissions: jsonb("permissions").notNull().default('["compress", "convert", "special-convert", "special-batch"]'), // Array of allowed operations
  rateLimit: integer("rate_limit").default(1000), // Requests per hour
  usageCount: integer("usage_count").default(0), // Total requests made
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
  isActive: boolean("is_active").default(true),
  suspendedAt: timestamp("suspended_at"), // When API key was suspended
  suspensionReason: text("suspension_reason"), // Reason for suspension
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Usage tracking for rate limiting and analytics
export const apiUsage = pgTable("api_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  endpoint: varchar("endpoint").notNull(), // /api/v1/compress, /api/v1/convert, etc.
  method: varchar("method").notNull(), // POST, GET, etc.
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // milliseconds
  bytesProcessed: integer("bytes_processed"), // input file size
  bytesReturned: integer("bytes_returned"), // output file size
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Usage tracking table for lifetime/daily limits and billing
// Anonymous session tracking for non-registered users
export const anonymousSessions = pgTable("anonymous_sessions", {
  sessionId: varchar("session_id").primaryKey(), // Generated from IP + user agent hash
  ipHash: varchar("ip_hash").notNull(), // Hashed IP for privacy
  monthlyOperationsUsed: integer("monthly_operations_used").default(0),
  dailyOperationsUsed: integer("daily_operations_used").default(0),
  hourlyOperationsUsed: integer("hourly_operations_used").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  lastDailyReset: timestamp("last_daily_reset").defaultNow(),
  lastHourlyReset: timestamp("last_hourly_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scoped anonymous session tracking - isolated per page/scope
export const anonymousSessionScopes = pgTable("anonymous_session_scopes", {
  sessionId: varchar("session_id").notNull(),
  scope: varchar("scope").notNull(), // 'main', 'free', 'test_premium', 'pro', 'enterprise', 'cr2-free'
  monthlyUsed: integer("monthly_used").default(0),
  dailyUsed: integer("daily_used").default(0),
  hourlyUsed: integer("hourly_used").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  lastDailyReset: timestamp("last_daily_reset").defaultNow(),
  lastHourlyReset: timestamp("last_hourly_reset").defaultNow(),
  ipHash: varchar("ip_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  sql`PRIMARY KEY (${table.sessionId}, ${table.scope})`
]);

// Scoped user operation counters - isolated per page/scope for registered users
export const userScopeCounters = pgTable("user_scope_counters", {
  userId: varchar("user_id").references(() => users.id).notNull(),
  scope: varchar("scope").notNull(), // 'main', 'free', 'test_premium', 'pro', 'enterprise', 'cr2-free'
  monthlyUsed: integer("monthly_used").default(0),
  dailyUsed: integer("daily_used").default(0),
  hourlyUsed: integer("hourly_used").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  lastDailyReset: timestamp("last_daily_reset").defaultNow(),
  lastHourlyReset: timestamp("last_hourly_reset").defaultNow(),
  lastOperationAt: timestamp("last_operation_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  sql`PRIMARY KEY (${table.userId}, ${table.scope})`
]);

// PageIdentifier-based tracking - isolated per sessionId + pageIdentifier for anonymous users
export const anonymousSessionPageIdentifiers = pgTable("anonymous_session_page_identifiers", {
  sessionId: varchar("session_id").notNull(),
  pageIdentifier: varchar("page_identifier").notNull(), // '/', '/compress-free', '/compress-premium', etc.
  monthlyUsed: integer("monthly_used").default(0),
  dailyUsed: integer("daily_used").default(0),
  hourlyUsed: integer("hourly_used").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  lastDailyReset: timestamp("last_daily_reset").defaultNow(),
  lastHourlyReset: timestamp("last_hourly_reset").defaultNow(),
  ipHash: varchar("ip_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  sql`PRIMARY KEY (${table.sessionId}, ${table.pageIdentifier})`
]);

// PageIdentifier-based user counters - isolated per userId + pageIdentifier for registered users
export const userPageIdentifierCounters = pgTable("user_page_identifier_counters", {
  userId: varchar("user_id").references(() => users.id).notNull(),
  pageIdentifier: varchar("page_identifier").notNull(), // '/', '/compress-free', '/compress-premium', etc.
  monthlyUsed: integer("monthly_used").default(0),
  dailyUsed: integer("daily_used").default(0),
  hourlyUsed: integer("hourly_used").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  lastDailyReset: timestamp("last_daily_reset").defaultNow(),
  lastHourlyReset: timestamp("last_hourly_reset").defaultNow(),
  lastOperationAt: timestamp("last_operation_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  sql`PRIMARY KEY (${table.userId}, ${table.pageIdentifier})`
]);

// Unified operations log - tracks all operations regardless of interface or format
export const operationsLog = pgTable("operations_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Null for anonymous users
  sessionId: varchar("session_id"), // For anonymous users
  operationType: varchar("operation_type").notNull(), // 'compression', 'conversion', 'special_conversion'
  fileFormat: varchar("file_format").notNull(), // 'jpg', 'png', 'raw', 'svg', etc.
  fileSizeMb: integer("file_size_mb").notNull(), // File size in MB
  processingTimeMs: integer("processing_time_ms"), // Processing time in milliseconds
  interface: varchar("interface").notNull(), // 'web', 'api'
  planId: varchar("plan_id").notNull(), // 'anonymous', 'free', 'pro', 'enterprise'
  scope: varchar("scope").default("main"), // Page-specific scope: 'main', 'free', 'test_premium', 'pro', 'enterprise', 'cr2-free'
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Null for anonymous users
  fingerprint: varchar("fingerprint"), // Browser fingerprint for anonymous tracking
  totalCompressions: integer("total_compressions").default(0), // Lifetime total
  totalConversions: integer("total_conversions").default(0), // Lifetime total
  dailyCompressions: integer("daily_compressions").default(0), // Daily count
  dailyConversions: integer("daily_conversions").default(0), // Daily count
  currentCredits: integer("current_credits").default(0), // Pay-per-use credits consumed
  lastResetDate: timestamp("last_reset_date").defaultNow(), // For daily resets
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const compressionJobs = pgTable("compression_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Now optional - null for guest users
  originalFilename: text("original_filename").notNull(),
  originalSize: integer("original_size").notNull(),
  compressedSize: integer("compressed_size"),
  compressionRatio: integer("compression_ratio"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  errorMessage: text("error_message"),
  qualityLevel: text("quality_level").notNull().default("medium"),
  resizeOption: text("resize_option").notNull().default("none"),
  outputFormat: text("output_format").notNull().default("jpeg"), // jpeg, png, webp, avif
  compressionAlgorithm: text("compression_algorithm").notNull().default("standard"), // standard, mozjpeg, webp, avif
  webOptimized: boolean("web_optimized").default(false),
  progressiveJpeg: boolean("progressive_jpeg").default(false),
  arithmeticCoding: boolean("arithmetic_coding").default(false),
  originalPath: text("original_path").notNull(),
  compressedPath: text("compressed_path"),
  // R2 CDN fields for optimized serving
  r2Key: text("r2_key"), // R2 object key
  cdnUrl: text("cdn_url"), // Public CDN URL for serving
  originalFormat: text("original_format").notNull(), // Track original file format
  // Visual Quality Assessment fields
  psnr: integer("psnr"), // Peak Signal-to-Noise Ratio
  ssim: integer("ssim"), // Structural Similarity Index (stored as percentage * 100)
  qualityScore: integer("quality_score"), // Overall quality score (0-100)
  qualityGrade: text("quality_grade"), // excellent, good, fair, poor
  sessionId: varchar("session_id"), // For guest users to track their jobs
  expiresAt: timestamp("expires_at"), // Guest jobs expire after 24 hours
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // Amount in cents/paise
  currency: varchar("currency").default("USD").notNull(),
  paymentMethod: varchar("payment_method").notNull(), // 'razorpay', 'paypal', 'stripe'
  paymentId: varchar("payment_id").notNull(), // External payment ID
  orderId: varchar("order_id"), // External order ID
  status: varchar("status").notNull(), // 'pending', 'completed', 'failed', 'cancelled'
  plan: varchar("plan").notNull(), // 'free', 'pro', 'enterprise'
  billingDetails: jsonb("billing_details"), // Billing address and info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  plan: varchar("plan").notNull(), // 'free', 'pro', 'enterprise'
  status: varchar("status").notNull(), // 'active', 'cancelled', 'expired', 'paused'
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentTransactionId: varchar("payment_transaction_id").references(() => paymentTransactions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Anonymous session types
export type AnonymousSession = typeof anonymousSessions.$inferSelect;
export type InsertAnonymousSession = typeof anonymousSessions.$inferInsert;

// Operations log types
export type OperationLog = typeof operationsLog.$inferSelect;
export type InsertOperationLog = typeof operationsLog.$inferInsert;

// Scoped counter types
export type AnonymousSessionScope = typeof anonymousSessionScopes.$inferSelect;
export type InsertAnonymousSessionScope = typeof anonymousSessionScopes.$inferInsert;
export type UserScopeCounter = typeof userScopeCounters.$inferSelect;
export type InsertUserScopeCounter = typeof userScopeCounters.$inferInsert;

// PageIdentifier-based counter types
export type AnonymousSessionPageIdentifier = typeof anonymousSessionPageIdentifiers.$inferSelect;
export type InsertAnonymousSessionPageIdentifier = typeof anonymousSessionPageIdentifiers.$inferInsert;
export type UserPageIdentifierCounter = typeof userPageIdentifierCounters.$inferSelect;
export type InsertUserPageIdentifierCounter = typeof userPageIdentifierCounters.$inferInsert;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEmailVerified: true,
  lastLogin: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export const insertCompressionJobSchema = createInsertSchema(compressionJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertCompressionJob = z.infer<typeof insertCompressionJobSchema>;
export type CompressionJob = typeof compressionJobs.$inferSelect;

// New unified usage tracking table
export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  
  // Regular operations (JPG, PNG, WebP, etc.)
  regularMonthly: integer("regular_monthly").default(0),
  regularDaily: integer("regular_daily").default(0),
  regularHourly: integer("regular_hourly").default(0),
  
  // RAW operations (CR2, ARW, NEF, etc.)
  rawMonthly: integer("raw_monthly").default(0),
  rawDaily: integer("raw_daily").default(0),
  rawHourly: integer("raw_hourly").default(0),
  
  // Bandwidth tracking (optional)
  monthlyBandwidthMb: integer("monthly_bandwidth_mb").default(0),
  
  // Reset timestamps
  hourlyResetAt: timestamp("hourly_reset_at").defaultNow(),
  dailyResetAt: timestamp("daily_reset_at").defaultNow(),
  monthlyResetAt: timestamp("monthly_reset_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  sql`UNIQUE (${table.userId}, ${table.sessionId})`
]);

// Operation log for audit trail
export const operationLog = pgTable("operation_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  operationType: varchar("operation_type"),
  fileFormat: varchar("file_format"),
  fileSizeMb: integer("file_size_mb"),
  pageIdentifier: varchar("page_identifier"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type UserUsage = typeof userUsage.$inferSelect;
export type InsertUserUsage = typeof userUsage.$inferInsert;
export type OperationLog = typeof operationLog.$inferSelect;
export type InsertOperationLog = typeof operationLog.$inferInsert;

// API Key types and schemas
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = typeof apiUsage.$inferInsert;

export const createApiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(50, "Name too long"),
  permissions: z.array(z.enum(["compress", "convert", "batch", "webhook", "special-convert", "special-batch"])).default(["compress", "convert"]),
  rateLimit: z.number().min(100).max(10000).default(1000),
  expiresAt: z.date().optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// API request/response schemas
export const apiCompressRequestSchema = z.object({
  quality: z.number().min(10).max(100).default(75),
  outputFormat: z.enum(["jpeg", "webp", "avif", "png"]).default("jpeg"),
  resizeOption: z.string().default("keep-original"),
  compressionAlgorithm: z.enum(["standard", "aggressive", "lossless", "mozjpeg", "progressive"]).default("standard"),
  webOptimization: z.boolean().default(true),
  progressive: z.boolean().default(false),
  resizeQuality: z.enum(["lanczos", "bicubic", "bilinear", "nearest"]).default("lanczos"),
});

export type ApiCompressRequest = z.infer<typeof apiCompressRequestSchema>;

// Social Sharing and Rewards System Tables

// User referral tracking - each user gets a unique referral code
export const userReferrals = pgTable("user_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  referralCode: varchar("referral_code").unique().notNull(), // 6-8 char unique code
  totalReferrals: integer("total_referrals").default(0), // Number of users they've referred
  totalEarned: integer("total_earned").default(0), // Total reward points earned
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media sharing tracking
export const socialShares = pgTable("social_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for guest shares
  sessionId: varchar("session_id"), // For guest user tracking
  compressionJobId: varchar("compression_job_id").references(() => compressionJobs.id),
  platform: varchar("platform").notNull(), // twitter, linkedin, facebook, instagram
  shareUrl: text("share_url"), // Generated sharing URL
  shareText: text("share_text"), // The text that was shared
  imageStats: jsonb("image_stats"), // Before/after stats for the shared image
  clicks: integer("clicks").default(0), // Number of people who clicked the shared link
  conversions: integer("conversions").default(0), // Number who signed up from this share
  rewardPointsEarned: integer("reward_points_earned").default(0),
  sharedAt: timestamp("shared_at").defaultNow(),
});

// User reward points and discount tracking
export const userRewards = pgTable("user_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalPoints: integer("total_points").default(0), // Current available points
  totalEarned: integer("total_earned").default(0), // Lifetime points earned
  totalSpent: integer("total_spent").default(0), // Points spent on discounts
  sharePoints: integer("share_points").default(0), // Points from social sharing
  referralPoints: integer("referral_points").default(0), // Points from referrals
  bonusPoints: integer("bonus_points").default(0), // Manual bonus points
  currentDiscountPercent: integer("current_discount_percent").default(0), // Available discount
  nextDiscountThreshold: integer("next_discount_threshold").default(1), // Points needed for next discount
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reward transactions log
export const rewardTransactions = pgTable("reward_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // earned, spent, bonus, referral
  source: varchar("source").notNull(), // social_share, referral, admin_bonus, subscription_purchase
  points: integer("points").notNull(), // Positive for earned, negative for spent
  description: text("description").notNull(),
  relatedId: varchar("related_id"), // Links to social_shares.id, user_referrals.id, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Dropbox integration settings per user
export const userIntegrations = pgTable("user_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider").notNull(), // dropbox, google_drive, onedrive
  accessToken: text("access_token"), // Encrypted token
  refreshToken: text("refresh_token"), // Encrypted refresh token
  accountInfo: jsonb("account_info"), // User's account details from provider
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cloud saves tracking
export const cloudSaves = pgTable("cloud_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for guest saves
  sessionId: varchar("session_id"), // For guest user tracking  
  compressionJobId: varchar("compression_job_id").references(() => compressionJobs.id).notNull(),
  integrationId: varchar("integration_id").references(() => userIntegrations.id),
  provider: varchar("provider").notNull(), // dropbox, google_drive, onedrive
  filePath: text("file_path").notNull(), // Path where file was saved
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  status: varchar("status").default("pending"), // pending, success, failed
  errorMessage: text("error_message"),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Credit purchases tracking
export const creditPurchases = pgTable("credit_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for guest purchases
  sessionId: varchar("session_id"), // For guest user tracking
  packageId: varchar("package_id").notNull(), // starter, standard, pro, enterprise
  packageName: varchar("package_name").notNull(),
  credits: integer("credits").notNull(),
  price: integer("price").notNull(), // Price in cents
  pricePerCredit: integer("price_per_credit").notNull(), // Price per credit in cents
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeSessionId: varchar("stripe_session_id"),
  status: varchar("status").default("pending"), // pending, completed, failed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types and schemas for social sharing and rewards
export type UserReferral = typeof userReferrals.$inferSelect;
export type SocialShare = typeof socialShares.$inferSelect;
export type UserReward = typeof userRewards.$inferSelect;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type UserIntegration = typeof userIntegrations.$inferSelect;
export type CloudSave = typeof cloudSaves.$inferSelect;
export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

// Special format trial tracking table - prevents abuse across different routes
export const specialFormatTrials = pgTable("special_format_trials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  browserFingerprint: varchar("browser_fingerprint"),
  conversionsUsed: integer("conversions_used").default(0),
  maxConversions: integer("max_conversions").default(3),
  firstUsed: timestamp("first_used").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 24 hour expiry
});

export type SpecialFormatTrial = typeof specialFormatTrials.$inferSelect;
export type InsertSpecialFormatTrial = typeof specialFormatTrials.$inferInsert;

export const createSocialShareSchema = z.object({
  platform: z.enum(["twitter", "linkedin", "facebook", "instagram"]),
  compressionJobId: z.string().uuid(),
  shareText: z.string().optional(),
  imageStats: z.object({
    originalSize: z.number(),
    compressedSize: z.number(),
    compressionRatio: z.number(),
    qualityScore: z.number().optional(),
  }),
});

export const connectDropboxSchema = z.object({
  accessToken: z.string().min(1),
  accountInfo: z.object({
    accountId: z.string(),
    email: z.string().email(),
    displayName: z.string(),
  }),
});

export type CreateSocialShareInput = z.infer<typeof createSocialShareSchema>;
export type ConnectDropboxInput = z.infer<typeof connectDropboxSchema>;

// Lead magnet tracking table - prevents abuse and tracks credit allocation
export const leadMagnetSignups = pgTable("lead_magnet_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  creditsGranted: integer("credits_granted").default(1000),
  creditsUsed: integer("credits_used").default(0),
  status: varchar("status").default("active"), // active, expired, suspended
  expiresAt: timestamp("expires_at"), // Credits expire after 90 days
  signedUpAt: timestamp("signed_up_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

export type LeadMagnetSignup = typeof leadMagnetSignups.$inferSelect;
export type InsertLeadMagnetSignup = typeof leadMagnetSignups.$inferInsert;

// Page-specific usage tracking for detailed records
export const pageUsage = pgTable("page_usage", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  pageIdentifier: varchar("page_identifier", { length: 50 }).notNull(),
  operationType: varchar("operation_type", { length: 20 }),
  timestamp: timestamp("timestamp").defaultNow(),
  fileCount: integer("file_count").default(1),
}, (table) => [
  index("idx_session_page").on(table.sessionId, table.pageIdentifier),
  index("idx_timestamp").on(table.timestamp),
]);

// Cached counters for performance optimization
export const pageUsageCache = pgTable("page_usage_cache", {
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  pageIdentifier: varchar("page_identifier", { length: 50 }).notNull(),
  dailyUsed: integer("daily_used").default(0),
  hourlyUsed: integer("hourly_used").default(0),
  monthlyUsed: integer("monthly_used").default(0),
  dailyResetAt: timestamp("daily_reset_at"),
  hourlyResetAt: timestamp("hourly_reset_at"),
  monthlyResetAt: timestamp("monthly_reset_at"),
}, (table) => [
  sql`PRIMARY KEY (${table.sessionId}, ${table.pageIdentifier})`
]);

export type PageUsage = typeof pageUsage.$inferSelect;
export type InsertPageUsage = typeof pageUsage.$inferInsert;
export type PageUsageCache = typeof pageUsageCache.$inferSelect;
export type InsertPageUsageCache = typeof pageUsageCache.$inferInsert;
