import { and, eq, ilike, or, desc, sql, count as drizzleCount, avg, gte } from "drizzle-orm";
import {
  tutorAvailability,
  tutorProfiles,
  tutorSubjects,
  tuteeProfiles,
  sessionsTable,
  users,
  reviews,
  conversations,
  messages,
  notifications,
  gigs,
  gigApplications,
  proofOfWork,
  type CreateAvailabilityRequest,
  type CreateSessionRequest,
  type CreateTutorProfileRequest,
  type CreateTutorSubjectRequest,
  type CreateTuteeProfileRequest,
  type MarketplaceSession,
  type TutorAvailability,
  type TutorProfile,
  type TutorSearchQueryParams,
  type TutorSubject,
  type TuteeProfile,
  type UpdateSessionRequest,
  type UpdateTutorProfileRequest,
  type UpdateTutorSubjectRequest,
  type UpdateTuteeProfileRequest,
  type User,
  type Review,
  type Conversation,
  type Message,
  type Notification,
  type Gig,
  type GigApplication,
  type ProofOfWork,
} from "@shared/schema";
import { db } from "./db";

export interface TutorSearchResult {
  user: User;
  tutorProfile: TutorProfile;
  subjects: TutorSubject[];
  availability: TutorAvailability[];
  averageRating: number | null;
  totalReviews: number;
}

export interface TutorDetailResult extends TutorSearchResult {
  reviews: { review: Review; reviewer: User }[];
  averageRating: number | null;
  totalReviews: number;
}

export interface IStorage {
  getCurrentUser(userId: string): Promise<User | undefined>;

  getTutorProfile(userId: string): Promise<TutorProfile | undefined>;
  upsertTutorProfile(
    userId: string,
    input: CreateTutorProfileRequest,
  ): Promise<TutorProfile>;
  updateTutorProfile(
    userId: string,
    updates: UpdateTutorProfileRequest,
  ): Promise<TutorProfile>;

  getTuteeProfile(userId: string): Promise<TuteeProfile | undefined>;
  upsertTuteeProfile(
    userId: string,
    input: CreateTuteeProfileRequest,
  ): Promise<TuteeProfile>;
  updateTuteeProfile(
    userId: string,
    updates: UpdateTuteeProfileRequest,
  ): Promise<TuteeProfile>;

  searchTutors(params?: TutorSearchQueryParams): Promise<TutorSearchResult[]>;
  getTutor(tutorId: string): Promise<TutorDetailResult | undefined>;

  listTutorSubjects(tutorId: string): Promise<TutorSubject[]>;
  addTutorSubject(
    tutorId: string,
    input: CreateTutorSubjectRequest,
  ): Promise<TutorSubject>;
  updateTutorSubject(
    tutorId: string,
    subjectId: string,
    updates: UpdateTutorSubjectRequest,
  ): Promise<TutorSubject | undefined>;
  deleteTutorSubject(tutorId: string, subjectId: string): Promise<boolean>;

  listTutorAvailability(tutorId: string): Promise<TutorAvailability[]>;
  addTutorAvailability(
    tutorId: string,
    input: CreateAvailabilityRequest,
  ): Promise<TutorAvailability>;
  deleteTutorAvailability(
    tutorId: string,
    availabilityId: string,
  ): Promise<boolean>;

  listMySessions(userId: string): Promise<MarketplaceSession[]>;
  createSession(
    tuteeId: string,
    input: CreateSessionRequest,
  ): Promise<MarketplaceSession>;
  updateSession(
    sessionId: string,
    userId: string,
    updates: UpdateSessionRequest,
  ): Promise<MarketplaceSession | undefined>;

  // Reviews
  createReview(reviewerId: string, data: { sessionId: string; rating: number; review?: string; tags?: string[] }): Promise<Review>;
  getReviewsForUser(userId: string): Promise<{ reviews: { review: Review; reviewer: User }[]; averageRating: number | null; totalReviews: number }>;

  // Conversations & Messages
  getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation>;
  listConversations(userId: string): Promise<{ conversation: Conversation; otherUser: User }[]>;
  sendMessage(senderId: string, receiverId: string, content: string): Promise<Message>;
  getMessages(conversationId: string, userId: string): Promise<Message[]>;
  markMessagesRead(conversationId: string, userId: string): Promise<void>;

  // Notifications
  createNotification(data: { userId: string; type: string; title: string; body: string; data?: any }): Promise<Notification>;
  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Analytics
  getDashboardAnalytics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getCurrentUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async getTutorProfile(userId: string): Promise<TutorProfile | undefined> {
    const [profile] = await db
      .select()
      .from(tutorProfiles)
      .where(eq(tutorProfiles.userId, userId));
    return profile;
  }

  async upsertTutorProfile(
    userId: string,
    input: CreateTutorProfileRequest,
  ): Promise<TutorProfile> {
    const [profile] = await db
      .insert(tutorProfiles)
      .values({ ...input, userId })
      .onConflictDoUpdate({
        target: tutorProfiles.userId,
        set: { ...input },
      })
      .returning();
    return profile;
  }

  async updateTutorProfile(
    userId: string,
    updates: UpdateTutorProfileRequest,
  ): Promise<TutorProfile> {
    const [updated] = await db
      .update(tutorProfiles)
      .set({ ...updates })
      .where(eq(tutorProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getTuteeProfile(userId: string): Promise<TuteeProfile | undefined> {
    const [profile] = await db
      .select()
      .from(tuteeProfiles)
      .where(eq(tuteeProfiles.userId, userId));
    return profile;
  }

  async upsertTuteeProfile(
    userId: string,
    input: CreateTuteeProfileRequest,
  ): Promise<TuteeProfile> {
    const [profile] = await db
      .insert(tuteeProfiles)
      .values({ ...input, userId })
      .onConflictDoUpdate({
        target: tuteeProfiles.userId,
        set: { ...input },
      })
      .returning();
    return profile;
  }

  async updateTuteeProfile(
    userId: string,
    updates: UpdateTuteeProfileRequest,
  ): Promise<TuteeProfile> {
    const [updated] = await db
      .update(tuteeProfiles)
      .set({ ...updates })
      .where(eq(tuteeProfiles.userId, userId))
      .returning();
    return updated;
  }

  async listTutorSubjects(tutorId: string): Promise<TutorSubject[]> {
    return await db
      .select()
      .from(tutorSubjects)
      .where(eq(tutorSubjects.tutorId, tutorId));
  }

  async addTutorSubject(
    tutorId: string,
    input: CreateTutorSubjectRequest,
  ): Promise<TutorSubject> {
    const [created] = await db
      .insert(tutorSubjects)
      .values({ ...input, tutorId })
      .returning();
    return created;
  }

  async updateTutorSubject(
    tutorId: string,
    subjectId: string,
    updates: UpdateTutorSubjectRequest,
  ): Promise<TutorSubject | undefined> {
    const [updated] = await db
      .update(tutorSubjects)
      .set({ ...updates })
      .where(and(eq(tutorSubjects.id, subjectId), eq(tutorSubjects.tutorId, tutorId)))
      .returning();
    return updated;
  }

  async deleteTutorSubject(tutorId: string, subjectId: string): Promise<boolean> {
    const [deleted] = await db
      .delete(tutorSubjects)
      .where(and(eq(tutorSubjects.id, subjectId), eq(tutorSubjects.tutorId, tutorId)))
      .returning();
    return !!deleted;
  }

  async listTutorAvailability(tutorId: string): Promise<TutorAvailability[]> {
    return await db
      .select()
      .from(tutorAvailability)
      .where(eq(tutorAvailability.tutorId, tutorId));
  }

  async addTutorAvailability(
    tutorId: string,
    input: CreateAvailabilityRequest,
  ): Promise<TutorAvailability> {
    const [created] = await db
      .insert(tutorAvailability)
      .values({ ...input, tutorId })
      .returning();
    return created;
  }

  async deleteTutorAvailability(
    tutorId: string,
    availabilityId: string,
  ): Promise<boolean> {
    const [deleted] = await db
      .delete(tutorAvailability)
      .where(
        and(
          eq(tutorAvailability.id, availabilityId),
          eq(tutorAvailability.tutorId, tutorId),
        ),
      )
      .returning();
    return !!deleted;
  }

  async searchTutors(params?: TutorSearchQueryParams): Promise<TutorSearchResult[]> {
    const p = params ?? {};

    const whereParts = [eq(tutorProfiles.isActive, p.isActive ?? true)];

    if (p.university) {
      whereParts.push(eq(tutorProfiles.university, p.university));
    }

    const rows = await db
      .select({
        user: users,
        tutorProfile: tutorProfiles,
      })
      .from(tutorProfiles)
      .innerJoin(users, eq(users.id, tutorProfiles.userId))
      .where(and(...whereParts));

    let tutorIds = rows.map((r) => r.user.id);

    if (p.subject || p.minRateCents !== undefined || p.maxRateCents !== undefined) {
      const subjectWhere: any[] = [];
      if (p.subject) {
        subjectWhere.push(ilike(tutorSubjects.subject, `%${p.subject}%`));
      }
      if (p.minRateCents !== undefined) {
        subjectWhere.push(sql`${tutorSubjects.hourlyRateCents} >= ${p.minRateCents}`);
      }
      if (p.maxRateCents !== undefined) {
        subjectWhere.push(sql`${tutorSubjects.hourlyRateCents} <= ${p.maxRateCents}`);
      }

      const subjectMatches = await db
        .select({ tutorId: tutorSubjects.tutorId })
        .from(tutorSubjects)
        .where(and(eq(tutorSubjects.tutorId, tutorSubjects.tutorId), ...subjectWhere));

      const matchIds = new Set(subjectMatches.map((m) => m.tutorId));
      tutorIds = tutorIds.filter((id) => matchIds.has(id));
    }

    if (tutorIds.length === 0) return [];

    const subjects = await db
      .select()
      .from(tutorSubjects)
      .where(or(...tutorIds.map((id) => eq(tutorSubjects.tutorId, id))));

    const availability = await db
      .select()
      .from(tutorAvailability)
      .where(or(...tutorIds.map((id) => eq(tutorAvailability.tutorId, id))));

    const byTutorSubjects = new Map<string, TutorSubject[]>();
    for (const s of subjects) {
      const list = byTutorSubjects.get(s.tutorId) ?? [];
      list.push(s);
      byTutorSubjects.set(s.tutorId, list);
    }

    const byTutorAvail = new Map<string, TutorAvailability[]>();
    for (const a of availability) {
      const list = byTutorAvail.get(a.tutorId) ?? [];
      list.push(a);
      byTutorAvail.set(a.tutorId, list);
    }

    // Bulk-fetch average rating per tutor from reviews table
    const ratingRows = await db
      .select({
        revieweeId: reviews.revieweeId,
        avg: sql<number>`avg(${reviews.rating})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(or(...tutorIds.map((id) => eq(reviews.revieweeId, id))))
      .groupBy(reviews.revieweeId);

    const ratingByTutor = new Map<string, { avg: number; count: number }>();
    for (const r of ratingRows) {
      ratingByTutor.set(r.revieweeId, { avg: r.avg, count: r.count });
    }

    return rows
      .filter((r) => tutorIds.includes(r.user.id))
      .map((r) => {
        const ratingData = ratingByTutor.get(r.user.id);
        return {
          user: r.user,
          tutorProfile: r.tutorProfile,
          subjects: byTutorSubjects.get(r.user.id) ?? [],
          availability: byTutorAvail.get(r.user.id) ?? [],
          averageRating: ratingData ? Math.round(ratingData.avg * 10) / 10 : null,
          totalReviews: ratingData?.count ?? 0,
        };
      });
  }

  async getTutor(tutorId: string): Promise<TutorDetailResult | undefined> {
    const [row] = await db
      .select({ user: users, tutorProfile: tutorProfiles })
      .from(tutorProfiles)
      .innerJoin(users, eq(users.id, tutorProfiles.userId))
      .where(eq(users.id, tutorId));

    if (!row) return undefined;

    const subjects = await this.listTutorSubjects(tutorId);
    const availability = await this.listTutorAvailability(tutorId);
    const { reviews: tutorReviews, averageRating, totalReviews } = await this.getReviewsForUser(tutorId);

    return {
      user: row.user,
      tutorProfile: row.tutorProfile,
      subjects,
      availability,
      reviews: tutorReviews,
      averageRating,
      totalReviews,
    };
  }

  async listMySessions(userId: string): Promise<MarketplaceSession[]> {
    return await db
      .select()
      .from(sessionsTable)
      .where(or(eq(sessionsTable.tutorId, userId), eq(sessionsTable.tuteeId, userId)));
  }

  async createSession(
    tuteeId: string,
    input: CreateSessionRequest,
  ): Promise<MarketplaceSession> {
    const platformFeeRate = 0.15;

    const totalAmountCents =
      input.totalAmountCents ??
      Math.round((input.hourlyRateCents * input.durationMinutes) / 60);

    const platformFeeCents =
      input.platformFeeCents ?? Math.round(totalAmountCents * platformFeeRate);

    const tutorEarningsCents =
      input.tutorEarningsCents ?? totalAmountCents - platformFeeCents;

    const values: CreateSessionRequest = {
      ...input,
      tuteeId,
      status: input.status ?? "pending",
      paymentStatus: input.paymentStatus ?? "pending",
      totalAmountCents,
      platformFeeCents,
      tutorEarningsCents,
    };

    const [created] = await db
      .insert(sessionsTable)
      .values({ ...values, updatedAt: new Date() })
      .returning();
    return created;
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: UpdateSessionRequest,
  ): Promise<MarketplaceSession | undefined> {
    const [existing] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId));

    if (!existing) return undefined;

    if (existing.tutorId !== userId && existing.tuteeId !== userId) {
      return undefined;
    }

    const [updated] = await db
      .update(sessionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sessionsTable.id, sessionId))
      .returning();

    return updated;
  }

  // ========================
  // Reviews
  // ========================

  async createReview(
    reviewerId: string,
    data: { sessionId: string; rating: number; review?: string; tags?: string[] },
  ): Promise<Review> {
    // Find the session to determine reviewee
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, data.sessionId));

    if (!session) throw new Error("Session not found");

    // The reviewer is the tutee, reviewee is the tutor
    const revieweeId = session.tutorId === reviewerId ? session.tuteeId : session.tutorId;

    const [created] = await db
      .insert(reviews)
      .values({
        sessionId: data.sessionId,
        reviewerId,
        revieweeId,
        rating: data.rating,
        review: data.review ?? null,
        tags: data.tags ?? [],
      })
      .returning();

    // Also update the session's rating fields
    await db
      .update(sessionsTable)
      .set({
        ratingScore: data.rating,
        ratingReview: data.review ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sessionsTable.id, data.sessionId));

    return created;
  }

  async getReviewsForUser(userId: string): Promise<{
    reviews: { review: Review; reviewer: User }[];
    averageRating: number | null;
    totalReviews: number;
  }> {
    const reviewRows = await db
      .select({
        review: reviews,
        reviewer: users,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));

    const totalReviews = reviewRows.length;
    const averageRating =
      totalReviews > 0
        ? reviewRows.reduce((sum, r) => sum + r.review.rating, 0) / totalReviews
        : null;

    return {
      reviews: reviewRows,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      totalReviews,
    };
  }

  // ========================
  // Conversations & Messages
  // ========================

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    // Sort IDs so participant1 < participant2 for uniqueness
    const [p1, p2] = [userId1, userId2].sort();

    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, p1),
          eq(conversations.participant2Id, p2),
        ),
      );

    if (existing) return existing;

    const [created] = await db
      .insert(conversations)
      .values({
        participant1Id: p1,
        participant2Id: p2,
        unreadCountP1: 0,
        unreadCountP2: 0,
      })
      .returning();

    return created;
  }

  async listConversations(userId: string): Promise<{ conversation: Conversation; otherUser: User }[]> {
    const rows = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId),
        ),
      )
      .orderBy(desc(conversations.updatedAt));

    const results: { conversation: Conversation; otherUser: User }[] = [];

    for (const conv of rows) {
      const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      if (otherUser) {
        results.push({ conversation: conv, otherUser });
      }
    }

    return results;
  }

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const conversation = await this.getOrCreateConversation(senderId, receiverId);

    // Detect if this is a file attachment (JSON with dataUrl field)
    let messageType = "text";
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.dataUrl === "string" && parsed.name) {
        messageType = "file";
      }
    } catch { /* regular text */ }

    const [message] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        senderId,
        content,
        type: messageType,
        read: false,
      })
      .returning();

    // Update conversation's last message and unread count
    const isP1 = conversation.participant1Id === senderId;
    const lastContent = messageType === "file" ? "📎 Attachment" : content;
    await db
      .update(conversations)
      .set({
        lastMessageContent: lastContent,
        lastMessageSenderId: senderId,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        // Increment unread for the OTHER participant
        ...(isP1
          ? { unreadCountP2: sql`${conversations.unreadCountP2} + 1` }
          : { unreadCountP1: sql`${conversations.unreadCountP1} + 1` }),
      })
      .where(eq(conversations.id, conversation.id));

    return message;
  }


  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    // Mark all messages sent by the OTHER user as read
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`,
          eq(messages.read, false),
        ),
      );

    // Reset unread count for this user
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (conv) {
      const isP1 = conv.participant1Id === userId;
      await db
        .update(conversations)
        .set(isP1 ? { unreadCountP1: 0 } : { unreadCountP2: 0 })
        .where(eq(conversations.id, conversationId));
    }
  }

  // ========================
  // Notifications
  // ========================

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ?? null,
        read: false,
      })
      .returning();
    return created;
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.count ?? 0;
  }

  // ========================
  // Analytics / SDG Dashboard
  // ========================

  async getDashboardAnalytics(): Promise<any> {
    // Total / completed sessions
    const allSessions = await db.select().from(sessionsTable);
    const completedSessions = allSessions.filter((s) => s.status === "completed");

    const totalSessions = allSessions.length;
    const completedCount = completedSessions.length;
    const totalRevenueCents = completedSessions.reduce((s, r) => s + r.totalAmountCents, 0);
    const platformFeesCents = completedSessions.reduce((s, r) => s + r.platformFeeCents, 0);
    const tutorEarningsCents = completedSessions.reduce((s, r) => s + r.tutorEarningsCents, 0);

    // Users
    const allUsers = await db.select().from(users);
    const activeUsers = allUsers.length;

    // Active tutors
    const activeTutors = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tutorProfiles)
      .where(eq(tutorProfiles.isActive, true));

    // Subjects
    const subjectRows = await db
      .selectDistinct({ subject: tutorSubjects.subject })
      .from(tutorSubjects);

    // Average rating from reviews
    const [ratingResult] = await db
      .select({ avg: sql<number>`avg(${reviews.rating})::float` })
      .from(reviews);

    const averageRating = ratingResult?.avg ? Math.round(ratingResult.avg * 10) / 10 : null;

    return {
      totalSessions,
      completedSessions: completedCount,
      totalRevenueCents,
      platformFeesCents,
      tutorEarningsCents,
      activeUsers,
      activeTutors: activeTutors[0]?.count ?? 0,
      averageRating,
      subjectsOffered: subjectRows.length,
      sdg: {
        sessionsCompleted: completedCount,
        subjectsOffered: subjectRows.length,
        totalTutorEarningsCents: tutorEarningsCents,
        activeTutors: activeTutors[0]?.count ?? 0,
        averageSessionRating: averageRating,
      },
    };
  }

  // ═══════════════════════════
  // Gigs
  // ═══════════════════════════

  async createGig(posterId: string, data: {
    title: string; description: string; category: string; budgetCents: number;
    skillsRequired?: string[]; deadline?: Date | null; university?: string | null;
    aiEnhancedDescription?: string | null; aiSuggestedPriceCents?: number | null;
  }): Promise<Gig> {
    const [gig] = await db.insert(gigs).values({
      posterId,
      title: data.title,
      description: data.description,
      category: data.category,
      budgetCents: data.budgetCents,
      skillsRequired: data.skillsRequired ?? [],
      deadline: data.deadline ?? null,
      university: data.university ?? null,
      aiEnhancedDescription: data.aiEnhancedDescription ?? null,
      aiSuggestedPriceCents: data.aiSuggestedPriceCents ?? null,
      status: "open",
    }).returning();
    return gig;
  }

  async listGigs(filters?: { category?: string; status?: string; university?: string }): Promise<(Gig & { poster: User })[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(gigs.category, filters.category));
    if (filters?.status) conditions.push(eq(gigs.status, filters.status));
    else conditions.push(eq(gigs.status, "open")); // default: show open gigs
    if (filters?.university) conditions.push(eq(gigs.university, filters.university));

    const rows = await db
      .select({ gig: gigs, poster: users })
      .from(gigs)
      .innerJoin(users, eq(gigs.posterId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(gigs.createdAt));

    return rows.map(r => ({ ...r.gig, poster: r.poster }));
  }

  async getGig(gigId: string): Promise<(Gig & { poster: User; applications: (GigApplication & { applicant: User })[] }) | undefined> {
    const [row] = await db
      .select({ gig: gigs, poster: users })
      .from(gigs)
      .innerJoin(users, eq(gigs.posterId, users.id))
      .where(eq(gigs.id, gigId));

    if (!row) return undefined;

    const apps = await db
      .select({ app: gigApplications, applicant: users })
      .from(gigApplications)
      .innerJoin(users, eq(gigApplications.applicantId, users.id))
      .where(eq(gigApplications.gigId, gigId))
      .orderBy(desc(gigApplications.createdAt));

    return {
      ...row.gig,
      poster: row.poster,
      applications: apps.map(a => ({ ...a.app, applicant: a.applicant })),
    };
  }

  async getMyGigs(userId: string): Promise<Gig[]> {
    return db.select().from(gigs)
      .where(or(eq(gigs.posterId, userId)))
      .orderBy(desc(gigs.createdAt));
  }

  async updateGig(gigId: string, updates: Partial<{ title: string; description: string; status: string; budgetCents: number; aiEnhancedDescription: string; aiSuggestedPriceCents: number }>): Promise<Gig | undefined> {
    const [gig] = await db.update(gigs).set({ ...updates, updatedAt: new Date() }).where(eq(gigs.id, gigId)).returning();
    return gig;
  }

  // ═══════════════════════════
  // Gig Applications
  // ═══════════════════════════

  async applyToGig(gigId: string, applicantId: string, data: { message?: string; proposedPriceCents?: number }): Promise<GigApplication> {
    const [app] = await db.insert(gigApplications).values({
      gigId,
      applicantId,
      message: data.message ?? null,
      proposedPriceCents: data.proposedPriceCents ?? null,
      status: "pending",
    }).returning();
    return app;
  }

  async getGigApplications(gigId: string): Promise<(GigApplication & { applicant: User })[]> {
    const rows = await db
      .select({ app: gigApplications, applicant: users })
      .from(gigApplications)
      .innerJoin(users, eq(gigApplications.applicantId, users.id))
      .where(eq(gigApplications.gigId, gigId))
      .orderBy(desc(gigApplications.createdAt));
    return rows.map(r => ({ ...r.app, applicant: r.applicant }));
  }

  async updateGigApplication(appId: string, updates: { status: string }): Promise<GigApplication | undefined> {
    const [app] = await db.update(gigApplications).set(updates).where(eq(gigApplications.id, appId)).returning();
    return app;
  }

  // ═══════════════════════════
  // Proof of Work
  // ═══════════════════════════

  async createProofOfWork(data: {
    gigId: string; helperId: string; posterId: string;
    title: string; description?: string; category: string;
    skillsUsed?: string[]; rating?: number; review?: string;
  }): Promise<ProofOfWork> {
    const [pow] = await db.insert(proofOfWork).values({
      gigId: data.gigId,
      helperId: data.helperId,
      posterId: data.posterId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      skillsUsed: data.skillsUsed ?? [],
      rating: data.rating ?? null,
      review: data.review ?? null,
      cardData: {},
    }).returning();
    return pow;
  }

  async getProofOfWork(gigId: string): Promise<(ProofOfWork & { helper: User; posterUser: User }) | undefined> {
    const [row] = await db
      .select({ pow: proofOfWork, helper: users })
      .from(proofOfWork)
      .innerJoin(users, eq(proofOfWork.helperId, users.id))
      .where(eq(proofOfWork.gigId, gigId));

    if (!row) return undefined;

    const [posterRow] = await db.select().from(users).where(eq(users.id, row.pow.posterId));
    return { ...row.pow, helper: row.helper, posterUser: posterRow };
  }

  async getMyProofOfWorkCards(userId: string): Promise<ProofOfWork[]> {
    return db.select().from(proofOfWork)
      .where(eq(proofOfWork.helperId, userId))
      .orderBy(desc(proofOfWork.completedAt));
  }

  // ═══════════════════════════
  // Leaderboard
  // ═══════════════════════════

  async getLeaderboard(filters?: { category?: string; university?: string; period?: string }): Promise<any[]> {
    // Compute from completed gigs + reviews
    let dateFilter: Date | null = null;
    if (filters?.period === "week") {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (filters?.period === "month") {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const conditions = [eq(proofOfWork.category, filters?.category ?? proofOfWork.category)];
    if (filters?.category) conditions.push(eq(proofOfWork.category, filters.category));
    if (dateFilter) conditions.push(gte(proofOfWork.completedAt, dateFilter));

    const rows = await db
      .select({
        userId: proofOfWork.helperId,
        completedGigs: sql<number>`count(*)::int`,
        avgRating: sql<number>`coalesce(avg(${proofOfWork.rating})::float, 0)`,
        totalEarnings: sql<number>`0`, // placeholder
      })
      .from(proofOfWork)
      .where(conditions.length > 1 ? and(...conditions) : undefined)
      .groupBy(proofOfWork.helperId)
      .orderBy(sql`count(*) desc, avg(${proofOfWork.rating}) desc nulls last`)
      .limit(20);

    // Enrich with user info
    const enriched = await Promise.all(
      rows.map(async (r, i) => {
        const [user] = await db.select().from(users).where(eq(users.id, r.userId));
        return {
          rank: i + 1,
          userId: r.userId,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Anonymous",
          profileImage: user?.profileImageUrl,
          completedGigs: r.completedGigs,
          avgRating: Math.round(r.avgRating * 10) / 10,
        };
      }),
    );

    return enriched;
  }
}

export const storage = new DatabaseStorage();

