import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =========================
// Replit Auth (MANDATORY)
// =========================
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// =========================
// StudyBuddy core tables
// =========================

export const tutorProfiles = pgTable(
  "tutor_profiles",
  {
    userId: varchar("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    university: text("university").notNull(),
    yearOfStudy: integer("year_of_study"),
    major: text("major"),
    bio: text("bio"),
    isActive: boolean("is_active").notNull().default(true),
    timezone: text("timezone").notNull().default("America/New_York"),
  },
  (table) => [index("IDX_tutor_profiles_active").on(table.isActive)],
);

export const tuteeProfiles = pgTable(
  "tutee_profiles",
  {
    userId: varchar("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    university: text("university").notNull(),
    yearOfStudy: integer("year_of_study"),
    major: text("major"),
    subjects: text("subjects").array().notNull().default(sql`ARRAY[]::text[]`),
    timezone: text("timezone").notNull().default("America/New_York"),
  },
  (table) => [index("IDX_tutee_profiles_university").on(table.university)],
);

export const tutorSubjects = pgTable(
  "tutor_subjects",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tutorId: varchar("tutor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    proficiency: text("proficiency").notNull(), // beginner | intermediate | expert
    hourlyRateCents: integer("hourly_rate_cents").notNull(),
    description: text("description"),
  },
  (table) => [
    index("IDX_tutor_subjects_tutor").on(table.tutorId),
    index("IDX_tutor_subjects_subject").on(table.subject),
    uniqueIndex("UQ_tutor_subjects_tutor_subject").on(
      table.tutorId,
      table.subject,
    ),
  ],
);

export const tutorAvailability = pgTable(
  "tutor_availability",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tutorId: varchar("tutor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0..6
    startTime: text("start_time").notNull(), // HH:MM
    endTime: text("end_time").notNull(), // HH:MM
  },
  (table) => [
    index("IDX_tutor_availability_tutor").on(table.tutorId),
    index("IDX_tutor_availability_day").on(table.dayOfWeek),
  ],
);

export const sessionsTable = pgTable(
  "sessions_marketplace",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tutorId: varchar("tutor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tuteeId: varchar("tutee_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    subject: text("subject").notNull(),
    status: text("status").notNull(), // pending | confirmed | completed | cancelled
    scheduledAt: timestamp("scheduled_at").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    hourlyRateCents: integer("hourly_rate_cents").notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    platformFeeCents: integer("platform_fee_cents").notNull(),
    tutorEarningsCents: integer("tutor_earnings_cents").notNull(),
    paymentStatus: text("payment_status").notNull(), // pending | paid | refunded
    meetingLink: text("meeting_link"),
    tuteeNotes: text("tutee_notes"),
    tutorNotes: text("tutor_notes"),
    ratingScore: integer("rating_score"),
    ratingReview: text("rating_review"),
    cancellationBy: text("cancellation_by"),
    cancellationReason: text("cancellation_reason"),
    cancellationRefundCents: integer("cancellation_refund_cents"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_sessions_tutor").on(table.tutorId),
    index("IDX_sessions_tutee").on(table.tuteeId),
    index("IDX_sessions_status").on(table.status),
    index("IDX_sessions_scheduled_at").on(table.scheduledAt),
  ],
);

// =========================
// Reviews
// =========================

export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => sessionsTable.id, { onDelete: "cascade" }),
    reviewerId: varchar("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    revieweeId: varchar("reviewee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    review: text("review"),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_reviews_reviewee").on(table.revieweeId),
    index("IDX_reviews_session").on(table.sessionId),
    uniqueIndex("UQ_reviews_session_reviewer").on(
      table.sessionId,
      table.reviewerId,
    ),
  ],
);

// =========================
// Conversations
// =========================

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    participant1Id: varchar("participant1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participant2Id: varchar("participant2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageContent: text("last_message_content"),
    lastMessageSenderId: varchar("last_message_sender_id"),
    lastMessageAt: timestamp("last_message_at"),
    unreadCountP1: integer("unread_count_p1").notNull().default(0),
    unreadCountP2: integer("unread_count_p2").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_conversations_p1").on(table.participant1Id),
    index("IDX_conversations_p2").on(table.participant2Id),
    uniqueIndex("UQ_conversations_participants").on(
      table.participant1Id,
      table.participant2Id,
    ),
  ],
);

// =========================
// Messages
// =========================

export const messages = pgTable(
  "messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    type: text("type").notNull().default("text"), // text | system
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_messages_conversation").on(table.conversationId),
    index("IDX_messages_created").on(table.createdAt),
  ],
);

// =========================
// Notifications
// =========================

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // session_request | session_confirmed | message | review | payment
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data"), // { sessionId, actionUrl, etc. }
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_notifications_user").on(table.userId),
    index("IDX_notifications_read").on(table.read),
  ],
);

// =========================
// Gigs (Campus Micro-Gig Marketplace)
// =========================

export const gigs = pgTable(
  "gigs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    posterId: varchar("poster_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(), // creative | tech | academic
    budgetCents: integer("budget_cents").notNull(),
    status: text("status").notNull().default("open"), // open | in_progress | completed | cancelled
    aiEnhancedDescription: text("ai_enhanced_description"),
    aiSuggestedPriceCents: integer("ai_suggested_price_cents"),
    skillsRequired: text("skills_required").array().notNull().default(sql`ARRAY[]::text[]`),
    deadline: timestamp("deadline"),
    university: text("university"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_gigs_poster").on(table.posterId),
    index("IDX_gigs_category").on(table.category),
    index("IDX_gigs_status").on(table.status),
    index("IDX_gigs_created").on(table.createdAt),
  ],
);

// =========================
// Gig Applications
// =========================

export const gigApplications = pgTable(
  "gig_applications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    gigId: varchar("gig_id")
      .notNull()
      .references(() => gigs.id, { onDelete: "cascade" }),
    applicantId: varchar("applicant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message"),
    proposedPriceCents: integer("proposed_price_cents"),
    status: text("status").notNull().default("pending"), // pending | accepted | rejected
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_gig_apps_gig").on(table.gigId),
    index("IDX_gig_apps_applicant").on(table.applicantId),
    uniqueIndex("UQ_gig_apps_gig_applicant").on(table.gigId, table.applicantId),
  ],
);

// =========================
// Proof of Work
// =========================

export const proofOfWork = pgTable(
  "proof_of_work",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    gigId: varchar("gig_id")
      .notNull()
      .references(() => gigs.id, { onDelete: "cascade" }),
    helperId: varchar("helper_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    posterId: varchar("poster_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    skillsUsed: text("skills_used").array().notNull().default(sql`ARRAY[]::text[]`),
    rating: integer("rating"), // 1-5
    review: text("review"),
    completedAt: timestamp("completed_at").defaultNow(),
    cardData: jsonb("card_data"), // additional visual card metadata
  },
  (table) => [
    index("IDX_pow_helper").on(table.helperId),
    index("IDX_pow_gig").on(table.gigId),
  ],
);

// =========================
// Zod schemas
// =========================

export const upsertUserSchema = createInsertSchema(users);

export const insertTutorProfileSchema = createInsertSchema(tutorProfiles).omit({
  userId: true,
});

export const insertTuteeProfileSchema = createInsertSchema(tuteeProfiles).omit({
  userId: true,
});

export const insertTutorSubjectSchema = createInsertSchema(tutorSubjects).omit({
  id: true,
});

export const insertTutorAvailabilitySchema = createInsertSchema(
  tutorAvailability,
).omit({ id: true });

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGigApplicationSchema = createInsertSchema(gigApplications).omit({
  id: true,
  createdAt: true,
});

export const insertProofOfWorkSchema = createInsertSchema(proofOfWork).omit({
  id: true,
  completedAt: true,
});

// =========================
// Explicit API contract types
// =========================

export type TutorProfile = typeof tutorProfiles.$inferSelect;
export type InsertTutorProfile = z.infer<typeof insertTutorProfileSchema>;

export type TuteeProfile = typeof tuteeProfiles.$inferSelect;
export type InsertTuteeProfile = z.infer<typeof insertTuteeProfileSchema>;

export type TutorSubject = typeof tutorSubjects.$inferSelect;
export type InsertTutorSubject = z.infer<typeof insertTutorSubjectSchema>;

export type TutorAvailability = typeof tutorAvailability.$inferSelect;
export type InsertTutorAvailability = z.infer<typeof insertTutorAvailabilitySchema>;

export type MarketplaceSession = typeof sessionsTable.$inferSelect;
export type InsertMarketplaceSession = z.infer<typeof insertSessionSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Gig = typeof gigs.$inferSelect;
export type InsertGig = z.infer<typeof insertGigSchema>;

export type GigApplication = typeof gigApplications.$inferSelect;
export type InsertGigApplication = z.infer<typeof insertGigApplicationSchema>;

export type ProofOfWork = typeof proofOfWork.$inferSelect;
export type InsertProofOfWork = z.infer<typeof insertProofOfWorkSchema>;

export type CreateTutorProfileRequest = InsertTutorProfile;
export type UpdateTutorProfileRequest = Partial<InsertTutorProfile>;

export type CreateTuteeProfileRequest = InsertTuteeProfile;
export type UpdateTuteeProfileRequest = Partial<InsertTuteeProfile>;

export type CreateTutorSubjectRequest = InsertTutorSubject;
export type UpdateTutorSubjectRequest = Partial<InsertTutorSubject>;

export type CreateAvailabilityRequest = InsertTutorAvailability;
export type UpdateAvailabilityRequest = Partial<InsertTutorAvailability>;

export type CreateSessionRequest = InsertMarketplaceSession;
export type UpdateSessionRequest = Partial<InsertMarketplaceSession>;

export type CreateReviewRequest = InsertReview;
export type CreateMessageRequest = { receiverId: string; content: string };
export type CreateNotificationRequest = InsertNotification;

export type CreateGigRequest = InsertGig;
export type UpdateGigRequest = Partial<InsertGig>;
export type CreateGigApplicationRequest = InsertGigApplication;

export type CurrentUserResponse = User | null;

export interface TutorSearchQueryParams {
  subject?: string;
  university?: string;
  minRateCents?: number;
  maxRateCents?: number;
  isActive?: boolean;
}

