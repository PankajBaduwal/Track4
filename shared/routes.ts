import { z } from "zod";
import {
  insertSessionSchema,
  insertTutorAvailabilitySchema,
  insertTutorProfileSchema,
  insertTutorSubjectSchema,
  insertTuteeProfileSchema,
  insertReviewSchema,
  insertMessageSchema,
  insertNotificationSchema,
  sessionsTable,
  tutorAvailability,
  tutorProfiles,
  tutorSubjects,
  tuteeProfiles,
  users,
  reviews,
  conversations,
  messages,
  notifications,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const userSchema = z.custom<typeof users.$inferSelect>();
const tutorProfileSchema = z.custom<typeof tutorProfiles.$inferSelect>();
const tuteeProfileSchema = z.custom<typeof tuteeProfiles.$inferSelect>();
const tutorSubjectSchema = z.custom<typeof tutorSubjects.$inferSelect>();
const tutorAvailabilitySchema = z.custom<typeof tutorAvailability.$inferSelect>();
const sessionSchema = z.custom<typeof sessionsTable.$inferSelect>();
const reviewSchema = z.custom<typeof reviews.$inferSelect>();
const conversationSchema = z.custom<typeof conversations.$inferSelect>();
const messageSchema = z.custom<typeof messages.$inferSelect>();
const notificationSchema = z.custom<typeof notifications.$inferSelect>();

export const api = {
  auth: {
    me: {
      method: "GET" as const,
      path: "/api/me" as const,
      responses: {
        200: userSchema.nullable(),
      },
    },
  },

  tutors: {
    search: {
      method: "GET" as const,
      path: "/api/tutors" as const,
      input: z
        .object({
          subject: z.string().optional(),
          university: z.string().optional(),
          minRateCents: z.coerce.number().int().nonnegative().optional(),
          maxRateCents: z.coerce.number().int().nonnegative().optional(),
          isActive: z
            .union([z.literal("true"), z.literal("false"), z.boolean()])
            .transform((v) => v === "true" || v === true)
            .optional(),
        })
        .optional(),
      responses: {
        200: z.array(
          z.object({
            user: userSchema,
            tutorProfile: tutorProfileSchema,
            subjects: z.array(tutorSubjectSchema),
            availability: z.array(tutorAvailabilitySchema),
            averageRating: z.number().nullable().optional(),
            totalReviews: z.number().optional(),
          }),
        ),
      },
    },

    get: {
      method: "GET" as const,
      path: "/api/tutors/:tutorId" as const,
      responses: {
        200: z.object({
          user: userSchema,
          tutorProfile: tutorProfileSchema,
          subjects: z.array(tutorSubjectSchema),
          availability: z.array(tutorAvailabilitySchema),
          reviews: z.array(
            z.object({
              review: reviewSchema,
              reviewer: userSchema,
            }),
          ),
          averageRating: z.number().nullable(),
          totalReviews: z.number(),
        }),
        404: errorSchemas.notFound,
      },
    },

    me: {
      getProfile: {
        method: "GET" as const,
        path: "/api/tutors/me/profile" as const,
        responses: {
          200: tutorProfileSchema.nullable(),
        },
      },
      upsertProfile: {
        method: "PUT" as const,
        path: "/api/tutors/me/profile" as const,
        input: insertTutorProfileSchema
          .omit({ userId: true })
          .extend({
            university: z.string().min(1),
            timezone: z.string().min(1).optional(),
          }),
        responses: {
          200: tutorProfileSchema,
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },

      listSubjects: {
        method: "GET" as const,
        path: "/api/tutors/me/subjects" as const,
        responses: {
          200: z.array(tutorSubjectSchema),
          401: errorSchemas.unauthorized,
        },
      },
      addSubject: {
        method: "POST" as const,
        path: "/api/tutors/me/subjects" as const,
        input: insertTutorSubjectSchema
          .omit({ id: true, tutorId: true })
          .extend({
            subject: z.string().min(1),
            proficiency: z.enum(["beginner", "intermediate", "expert"]),
            hourlyRateCents: z.coerce.number().int().min(0),
          }),
        responses: {
          201: tutorSubjectSchema,
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      updateSubject: {
        method: "PATCH" as const,
        path: "/api/tutors/me/subjects/:subjectId" as const,
        input: insertTutorSubjectSchema
          .omit({ id: true, tutorId: true })
          .partial()
          .extend({
            hourlyRateCents: z.coerce.number().int().min(0).optional(),
          }),
        responses: {
          200: tutorSubjectSchema,
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      deleteSubject: {
        method: "DELETE" as const,
        path: "/api/tutors/me/subjects/:subjectId" as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },

      listAvailability: {
        method: "GET" as const,
        path: "/api/tutors/me/availability" as const,
        responses: {
          200: z.array(tutorAvailabilitySchema),
          401: errorSchemas.unauthorized,
        },
      },
      addAvailability: {
        method: "POST" as const,
        path: "/api/tutors/me/availability" as const,
        input: insertTutorAvailabilitySchema
          .omit({ id: true, tutorId: true })
          .extend({
            dayOfWeek: z.coerce.number().int().min(0).max(6),
            startTime: z.string().regex(/^\d{2}:\d{2}$/),
            endTime: z.string().regex(/^\d{2}:\d{2}$/),
          }),
        responses: {
          201: tutorAvailabilitySchema,
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      deleteAvailability: {
        method: "DELETE" as const,
        path: "/api/tutors/me/availability/:availabilityId" as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
  },

  tutees: {
    me: {
      getProfile: {
        method: "GET" as const,
        path: "/api/tutees/me/profile" as const,
        responses: {
          200: tuteeProfileSchema.nullable(),
        },
      },
      upsertProfile: {
        method: "PUT" as const,
        path: "/api/tutees/me/profile" as const,
        input: insertTuteeProfileSchema
          .omit({ userId: true })
          .extend({ university: z.string().min(1) }),
        responses: {
          200: tuteeProfileSchema,
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
    },
  },

  sessions: {
    listMine: {
      method: "GET" as const,
      path: "/api/sessions/mine" as const,
      responses: {
        200: z.array(sessionSchema),
        401: errorSchemas.unauthorized,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/sessions" as const,
      input: insertSessionSchema
        .omit({ id: true, createdAt: true, updatedAt: true })
        .extend({
          tutorId: z.string().min(1),
          tuteeId: z.string().min(1).optional(),
          scheduledAt: z.coerce.date(),
          durationMinutes: z.coerce.number().int().min(15).max(240),
          hourlyRateCents: z.coerce.number().int().min(0),
          totalAmountCents: z.coerce.number().int().min(0).optional(),
          platformFeeCents: z.coerce.number().int().min(0).optional(),
          tutorEarningsCents: z.coerce.number().int().min(0).optional(),
          status: z
            .enum(["pending", "confirmed", "completed", "cancelled"])
            .optional(),
          paymentStatus: z.enum(["pending", "paid", "refunded"]).optional(),
        }),
      responses: {
        201: sessionSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },

    update: {
      method: "PATCH" as const,
      path: "/api/sessions/:sessionId" as const,
      input: insertSessionSchema
        .omit({ id: true, createdAt: true, updatedAt: true })
        .partial()
        .extend({
          scheduledAt: z.coerce.date().optional(),
          durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
          hourlyRateCents: z.coerce.number().int().min(0).optional(),
          totalAmountCents: z.coerce.number().int().min(0).optional(),
          platformFeeCents: z.coerce.number().int().min(0).optional(),
          tutorEarningsCents: z.coerce.number().int().min(0).optional(),
        }),
      responses: {
        200: sessionSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },

  // ===== NEW FEATURE ROUTES =====

  reviews: {
    create: {
      method: "POST" as const,
      path: "/api/reviews" as const,
      input: z.object({
        sessionId: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        review: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      responses: {
        201: reviewSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    getForUser: {
      method: "GET" as const,
      path: "/api/reviews/:userId" as const,
      responses: {
        200: z.object({
          averageRating: z.number().nullable(),
          totalReviews: z.number(),
          reviews: z.array(
            z.object({
              review: reviewSchema,
              reviewer: userSchema,
            }),
          ),
        }),
      },
    },
  },

  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations" as const,
      responses: {
        200: z.array(
          z.object({
            conversation: conversationSchema,
            otherUser: userSchema,
          }),
        ),
        401: errorSchemas.unauthorized,
      },
    },
  },

  messages: {
    list: {
      method: "GET" as const,
      path: "/api/messages/:conversationId" as const,
      responses: {
        200: z.array(messageSchema),
        401: errorSchemas.unauthorized,
      },
    },
    send: {
      method: "POST" as const,
      path: "/api/messages" as const,
      input: z.object({
        receiverId: z.string().min(1),
        content: z.string().min(1),
      }),
      responses: {
        201: messageSchema,
        401: errorSchemas.unauthorized,
      },
    },
    markRead: {
      method: "POST" as const,
      path: "/api/messages/:conversationId/read" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
  },

  notifications: {
    list: {
      method: "GET" as const,
      path: "/api/notifications" as const,
      responses: {
        200: z.array(notificationSchema),
        401: errorSchemas.unauthorized,
      },
    },
    markRead: {
      method: "PATCH" as const,
      path: "/api/notifications/:notificationId/read" as const,
      responses: {
        200: notificationSchema,
        401: errorSchemas.unauthorized,
      },
    },
    markAllRead: {
      method: "POST" as const,
      path: "/api/notifications/read-all" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    unreadCount: {
      method: "GET" as const,
      path: "/api/notifications/unread-count" as const,
      responses: {
        200: z.object({ count: z.number() }),
      },
    },
  },

  analytics: {
    dashboard: {
      method: "GET" as const,
      path: "/api/analytics/dashboard" as const,
      responses: {
        200: z.object({
          totalSessions: z.number(),
          completedSessions: z.number(),
          totalRevenueCents: z.number(),
          platformFeesCents: z.number(),
          tutorEarningsCents: z.number(),
          activeUsers: z.number(),
          activeTutors: z.number(),
          averageRating: z.number().nullable(),
          subjectsOffered: z.number(),
          sdg: z.object({
            sessionsCompleted: z.number(),
            subjectsOffered: z.number(),
            totalTutorEarningsCents: z.number(),
            activeTutors: z.number(),
            averageSessionRating: z.number().nullable(),
          }),
        }),
      },
    },
  },

  // =========================
  // Gigs
  // =========================
  gigs: {
    list: {
      method: "GET" as const,
      path: "/api/gigs" as const,
      input: z
        .object({
          category: z.enum(["creative", "tech", "academic"]).optional(),
          status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
          university: z.string().optional(),
        })
        .optional(),
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: "GET" as const,
      path: "/api/gigs/:gigId" as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: "POST" as const,
      path: "/api/gigs" as const,
      responses: { 201: z.any() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/gigs/:gigId" as const,
      responses: { 200: z.any() },
    },
    myGigs: {
      method: "GET" as const,
      path: "/api/gigs/mine" as const,
      responses: { 200: z.array(z.any()) },
    },
    apply: {
      method: "POST" as const,
      path: "/api/gigs/:gigId/apply" as const,
      responses: { 201: z.any() },
    },
    applications: {
      method: "GET" as const,
      path: "/api/gigs/:gigId/applications" as const,
      responses: { 200: z.array(z.any()) },
    },
    updateApplication: {
      method: "PATCH" as const,
      path: "/api/gigs/:gigId/applications/:appId" as const,
      responses: { 200: z.any() },
    },
    complete: {
      method: "POST" as const,
      path: "/api/gigs/:gigId/complete" as const,
      responses: { 200: z.any() },
    },
  },

  // =========================
  // AI (Kai)
  // =========================
  ai: {
    enhanceGig: {
      method: "POST" as const,
      path: "/api/ai/enhance-gig" as const,
      responses: { 200: z.object({ enhancedDescription: z.string(), suggestedTitle: z.string().optional() }) },
    },
    suggestPrice: {
      method: "POST" as const,
      path: "/api/ai/suggest-price" as const,
      responses: { 200: z.object({ suggestedPriceCents: z.number(), reasoning: z.string() }) },
    },
    matchHelpers: {
      method: "POST" as const,
      path: "/api/ai/match-helpers" as const,
      responses: { 200: z.array(z.object({ userId: z.string(), score: z.number(), reason: z.string() })) },
    },
  },

  // =========================
  // Leaderboard
  // =========================
  leaderboard: {
    get: {
      method: "GET" as const,
      path: "/api/leaderboard" as const,
      input: z
        .object({
          category: z.enum(["creative", "tech", "academic"]).optional(),
          university: z.string().optional(),
          period: z.enum(["week", "month", "all"]).optional(),
        })
        .optional(),
      responses: { 200: z.array(z.any()) },
    },
  },

  // =========================
  // Proof of Work
  // =========================
  proofOfWork: {
    get: {
      method: "GET" as const,
      path: "/api/proof-of-work/:gigId" as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    myCards: {
      method: "GET" as const,
      path: "/api/proof-of-work/mine" as const,
      responses: { 200: z.array(z.any()) },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }
  return url;
}

export type CurrentUserResponse = z.infer<typeof api.auth.me.responses[200]>;

export type TutorSearchResponse = z.infer<typeof api.tutors.search.responses[200]>;
export type TutorDetailResponse = z.infer<typeof api.tutors.get.responses[200]>;

export type TutorProfileResponse = z.infer<
  typeof api.tutors.me.upsertProfile.responses[200]
>;
export type TuteeProfileResponse = z.infer<
  typeof api.tutees.me.upsertProfile.responses[200]
>;

export type MarketplaceSessionResponse = z.infer<
  typeof api.sessions.create.responses[201]
>;
export type MarketplaceSessionListResponse = z.infer<
  typeof api.sessions.listMine.responses[200]
>;

export type ReviewResponse = z.infer<typeof api.reviews.create.responses[201]>;
export type ReviewsForUserResponse = z.infer<typeof api.reviews.getForUser.responses[200]>;
export type ConversationListResponse = z.infer<typeof api.conversations.list.responses[200]>;
export type MessageListResponse = z.infer<typeof api.messages.list.responses[200]>;
export type NotificationListResponse = z.infer<typeof api.notifications.list.responses[200]>;
export type AnalyticsDashboardResponse = z.infer<typeof api.analytics.dashboard.responses[200]>;

export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type UnauthorizedError = z.infer<typeof errorSchemas.unauthorized>;
export type InternalError = z.infer<typeof errorSchemas.internal>;

