import {
  compressionJobs,
  users,
  socialShares,
  userRewards,
  userReferrals,
  rewardTransactions,
  leadMagnetSignups,
  type CompressionJob,
  type InsertCompressionJob,
  type User,
  type UpsertUser,
  type SocialShare,
  type UserReward,
  type UserReferral,
  type RewardTransaction,
  type LeadMagnetSignup,
  type InsertLeadMagnetSignup,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray, and, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(id: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  togglePremiumStatus(userId: string): Promise<User | undefined>;
  
  // Compression job operations
  createCompressionJob(job: InsertCompressionJob): Promise<CompressionJob>;
  getCompressionJob(id: string): Promise<CompressionJob | undefined>;
  getJobsByIds(ids: string[]): Promise<CompressionJob[]>;
  updateCompressionJob(id: string, updates: Partial<CompressionJob>): Promise<CompressionJob | undefined>;
  getAllCompressionJobs(userId?: string): Promise<CompressionJob[]>;
  getCompressionJobsBySession(sessionId: string): Promise<CompressionJob[]>;
  deleteCompressionJob(id: string): Promise<boolean>;
  findExistingJob(userId: string | null, sessionId: string, originalFilename: string, outputFormat: string): Promise<CompressionJob | undefined>;

  // Guest file operations (temporary storage)
  setGuestFile(id: string, buffer: Buffer, originalName: string): void;
  getGuestFile(id: string): { buffer: Buffer; originalName: string } | null;

  // Social sharing and rewards operations
  createSocialShare(shareData: Partial<SocialShare>): Promise<SocialShare>;
  getUserShares(userId: string, limit?: number): Promise<SocialShare[]>;
  getUserRewards(userId: string): Promise<UserReward | undefined>;
  addRewardPoints(userId: string, points: number, source: string, relatedId?: string): Promise<UserReward>;
  updateUserDiscount(userId: string, discountPercent: number): Promise<UserReward>;
  getUserReferral(userId: string): Promise<UserReferral | undefined>;
  createUserReferral(userId: string, referralCode: string): Promise<UserReferral>;
  
  // Lead magnet operations
  getLeadMagnetSignup(email: string): Promise<LeadMagnetSignup | undefined>;
  getLeadMagnetSignupCountByIP(ipAddress: string): Promise<number>;
  createLeadMagnetSignup(signupData: InsertLeadMagnetSignup): Promise<LeadMagnetSignup>;
  deleteLeadMagnetSignup(id: string): Promise<boolean>;
  checkLeadMagnetCredits(email: string): Promise<{ hasCredits: boolean; creditsRemaining: number; expiresAt: Date | null }>;
  useLeadMagnetCredits(email: string, creditsToUse: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // In-memory storage for guest files (temporary)
  private guestFiles = new Map<string, { buffer: Buffer; originalName: string }>();
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createCompressionJob(insertJob: InsertCompressionJob): Promise<CompressionJob> {
    const [job] = await db
      .insert(compressionJobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getCompressionJob(id: string): Promise<CompressionJob | undefined> {
    const [job] = await db.select().from(compressionJobs).where(eq(compressionJobs.id, id));
    return job;
  }

  async getJobsByIds(ids: string[]): Promise<CompressionJob[]> {
    if (ids.length === 0) return [];
    const jobs = await db
      .select()
      .from(compressionJobs)
      .where(inArray(compressionJobs.id, ids));
    return jobs;
  }

  async updateCompressionJob(id: string, updates: Partial<CompressionJob>): Promise<CompressionJob | undefined> {
    const [updatedJob] = await db
      .update(compressionJobs)
      .set(updates)
      .where(eq(compressionJobs.id, id))
      .returning();
    return updatedJob;
  }

  async getAllCompressionJobs(userId?: string): Promise<CompressionJob[]> {
    const jobs = await db
      .select()
      .from(compressionJobs)
      .where(userId ? eq(compressionJobs.userId, userId) : undefined)
      .orderBy(desc(compressionJobs.createdAt)); // Show newest jobs first
    return jobs;
  }

  async deleteCompressionJob(id: string): Promise<boolean> {
    const result = await db
      .delete(compressionJobs)
      .where(eq(compressionJobs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCompressionJobsBySession(sessionId: string): Promise<CompressionJob[]> {
    const jobs = await db
      .select()
      .from(compressionJobs)
      .where(eq(compressionJobs.sessionId, sessionId))
      .orderBy(desc(compressionJobs.createdAt)); // Show newest jobs first
    return jobs;
  }

  async findExistingJob(userId: string | null, sessionId: string, originalFilename: string, outputFormat: string): Promise<CompressionJob | undefined> {
    // For authenticated users, search by userId
    if (userId) {
      const [job] = await db
        .select()
        .from(compressionJobs)
        .where(
          and(
            eq(compressionJobs.userId, userId),
            eq(compressionJobs.originalFilename, originalFilename),
            eq(compressionJobs.outputFormat, outputFormat)
          )
        )
        .orderBy(desc(compressionJobs.createdAt)) // Get most recent if multiple exist
        .limit(1);
      return job;
    }
    
    // For guest users, search by sessionId
    const [job] = await db
      .select()
      .from(compressionJobs)
      .where(
        and(
          eq(compressionJobs.sessionId, sessionId),
          eq(compressionJobs.originalFilename, originalFilename),
          eq(compressionJobs.outputFormat, outputFormat)
        )
      )
      .orderBy(desc(compressionJobs.createdAt))
      .limit(1);
    return job;
  }


  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    return user;
  }

  async verifyUserEmail(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isEmailVerified: "true", 
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async togglePremiumStatus(userId: string): Promise<User | undefined> {
    // Get current user
    const currentUser = await this.getUser(userId);
    if (!currentUser) return undefined;
    
    // Toggle premium status
    const newPremiumStatus = !currentUser.isPremium;
    
    // Update user with toggled premium status
    const [user] = await db
      .update(users)
      .set({ 
        isPremium: newPremiumStatus,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const updates: Partial<UpsertUser> = {
      stripeCustomerId,
      updatedAt: new Date(),
    };
    
    if (stripeSubscriptionId) {
      updates.stripeSubscriptionId = stripeSubscriptionId;
      updates.subscriptionStatus = "active";
    }
    
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, status: string, endDate?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionEndDate: endDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserTier(userId: string, tierData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...tierData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Guest file operations
  setGuestFile(id: string, buffer: Buffer, originalName: string): void {
    this.guestFiles.set(id, { buffer, originalName });
    
    // Auto-cleanup after 1 hour
    setTimeout(() => {
      this.guestFiles.delete(id);
    }, 60 * 60 * 1000);
  }

  getGuestFile(id: string): { buffer: Buffer; originalName: string } | null {
    return this.guestFiles.get(id) || null;
  }

  // Social sharing and rewards operations
  async createSocialShare(shareData: Partial<SocialShare>): Promise<SocialShare> {
    const [share] = await db
      .insert(socialShares)
      .values(shareData)
      .returning();
    return share;
  }

  async getUserShares(userId: string, limit: number = 10): Promise<SocialShare[]> {
    const shares = await db
      .select()
      .from(socialShares)
      .where(eq(socialShares.userId, userId))
      .orderBy(socialShares.sharedAt)
      .limit(limit);
    return shares;
  }

  async getUserRewards(userId: string): Promise<UserReward | undefined> {
    const [rewards] = await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId));
    return rewards;
  }

  async addRewardPoints(userId: string, points: number, source: string, relatedId?: string): Promise<UserReward> {
    // First, get or create user rewards record
    let [rewards] = await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId));

    if (!rewards) {
      // Create initial rewards record
      [rewards] = await db
        .insert(userRewards)
        .values({
          userId,
          totalPoints: points,
          totalEarned: points,
          sharePoints: source === 'social_share' ? points : 0,
          referralPoints: source === 'referral' ? points : 0,
        })
        .returning();
    } else {
      // Update existing rewards
      const newTotalPoints = rewards.totalPoints + points;
      const newTotalEarned = rewards.totalEarned + points;
      const newSharePoints = rewards.sharePoints + (source === 'social_share' ? points : 0);
      const newReferralPoints = rewards.referralPoints + (source === 'referral' ? points : 0);

      [rewards] = await db
        .update(userRewards)
        .set({
          totalPoints: newTotalPoints,
          totalEarned: newTotalEarned,
          sharePoints: newSharePoints,
          referralPoints: newReferralPoints,
          updatedAt: new Date(),
        })
        .where(eq(userRewards.userId, userId))
        .returning();
    }

    // Create transaction record
    await db
      .insert(rewardTransactions)
      .values({
        userId,
        type: 'earned',
        source,
        points,
        description: `Earned ${points} points from ${source.replace('_', ' ')}`,
        relatedId,
      });

    return rewards;
  }

  async updateUserDiscount(userId: string, discountPercent: number): Promise<UserReward> {
    const [rewards] = await db
      .update(userRewards)
      .set({
        currentDiscountPercent: discountPercent,
        updatedAt: new Date(),
      })
      .where(eq(userRewards.userId, userId))
      .returning();
    return rewards;
  }

  async getUserReferral(userId: string): Promise<UserReferral | undefined> {
    const [referral] = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.userId, userId));
    return referral;
  }

  async createUserReferral(userId: string, referralCode: string): Promise<UserReferral> {
    const [referral] = await db
      .insert(userReferrals)
      .values({
        userId,
        referralCode,
      })
      .returning();
    return referral;
  }

  // Lead magnet operations
  async getLeadMagnetSignup(email: string): Promise<LeadMagnetSignup | undefined> {
    const [signup] = await db
      .select()
      .from(leadMagnetSignups)
      .where(eq(leadMagnetSignups.email, email));
    return signup;
  }

  async getLeadMagnetSignupCountByIP(ipAddress: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const signups = await db
      .select()
      .from(leadMagnetSignups)
      .where(
        and(
          eq(leadMagnetSignups.ipAddress, ipAddress),
          gte(leadMagnetSignups.signedUpAt, today)
        )
      );
    return signups.length;
  }

  async createLeadMagnetSignup(signupData: InsertLeadMagnetSignup): Promise<LeadMagnetSignup> {
    const [signup] = await db
      .insert(leadMagnetSignups)
      .values(signupData)
      .returning();
    return signup;
  }

  async deleteLeadMagnetSignup(id: string): Promise<boolean> {
    const result = await db
      .delete(leadMagnetSignups)
      .where(eq(leadMagnetSignups.id, id));
    return result.rowCount > 0;
  }

  async checkLeadMagnetCredits(email: string): Promise<{ hasCredits: boolean; creditsRemaining: number; expiresAt: Date | null }> {
    const signup = await this.getLeadMagnetSignup(email);
    
    if (!signup || signup.status !== 'active') {
      return { hasCredits: false, creditsRemaining: 0, expiresAt: null };
    }

    // Check if credits have expired
    if (signup.expiresAt && new Date() > signup.expiresAt) {
      return { hasCredits: false, creditsRemaining: 0, expiresAt: signup.expiresAt };
    }

    const creditsRemaining = signup.creditsGranted - signup.creditsUsed;
    return {
      hasCredits: creditsRemaining > 0,
      creditsRemaining,
      expiresAt: signup.expiresAt
    };
  }

  async useLeadMagnetCredits(email: string, creditsToUse: number): Promise<boolean> {
    const creditCheck = await this.checkLeadMagnetCredits(email);
    
    if (!creditCheck.hasCredits || creditCheck.creditsRemaining < creditsToUse) {
      return false;
    }

    const signup = await this.getLeadMagnetSignup(email);
    if (!signup) return false;

    const newCreditsUsed = signup.creditsUsed + creditsToUse;
    
    await db
      .update(leadMagnetSignups)
      .set({
        creditsUsed: newCreditsUsed,
        lastUsed: new Date(),
      })
      .where(eq(leadMagnetSignups.email, email));

    return true;
  }
}

export const storage = new DatabaseStorage();
