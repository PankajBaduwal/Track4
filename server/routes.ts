import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import * as aiService from "./ai";

function getUserId(req: any): string | undefined {
  return req?.user?.claims?.sub;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.auth.me.path, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.json(null);
    }
    const user = await storage.getCurrentUser(userId);
    return res.json(user ?? null);
  });

  // Tutor search/public detail
  app.get(api.tutors.search.path, async (req, res) => {
    const input = api.tutors.search.input?.parse(req.query);
    const tutors = await storage.searchTutors(input);
    res.json(tutors);
  });

  app.get(api.tutors.get.path, async (req, res) => {
    const tutor = await storage.getTutor(String(req.params.tutorId));
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    res.json(tutor);
  });

  // Tutor self
  app.get(api.tutors.me.getProfile.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const profile = await storage.getTutorProfile(userId);
    res.json(profile ?? null);
  });

  app.put(api.tutors.me.upsertProfile.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tutors.me.upsertProfile.input.parse(req.body);
      const profile = await storage.upsertTutorProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.get(api.tutors.me.listSubjects.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const subjects = await storage.listTutorSubjects(userId);
    res.json(subjects);
  });

  app.post(api.tutors.me.addSubject.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tutors.me.addSubject.input.parse(req.body);
      const created = await storage.addTutorSubject(userId, input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(
    api.tutors.me.updateSubject.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const input = api.tutors.me.updateSubject.input.parse(req.body);
        const updated = await storage.updateTutorSubject(
          userId,
          String(req.params.subjectId),
          input,
        );
        if (!updated) {
          return res.status(404).json({ message: "Subject not found" });
        }
        res.json(updated);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({
            message: err.errors[0]?.message ?? "Invalid input",
            field: err.errors[0]?.path?.join("."),
          });
        }
        throw err;
      }
    },
  );

  app.delete(
    api.tutors.me.deleteSubject.path,
    isAuthenticated,
    async (req: any, res) => {
      const userId = getUserId(req);
      const ok = await storage.deleteTutorSubject(userId, String(req.params.subjectId));
      if (!ok) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.status(204).send();
    },
  );

  app.get(
    api.tutors.me.listAvailability.path,
    isAuthenticated,
    async (req: any, res) => {
      const userId = getUserId(req);
      const availability = await storage.listTutorAvailability(userId);
      res.json(availability);
    },
  );

  app.post(
    api.tutors.me.addAvailability.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const input = api.tutors.me.addAvailability.input.parse(req.body);
        const created = await storage.addTutorAvailability(userId, input);
        res.status(201).json(created);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({
            message: err.errors[0]?.message ?? "Invalid input",
            field: err.errors[0]?.path?.join("."),
          });
        }
        throw err;
      }
    },
  );

  app.delete(
    api.tutors.me.deleteAvailability.path,
    isAuthenticated,
    async (req: any, res) => {
      const userId = getUserId(req);
      const ok = await storage.deleteTutorAvailability(
        userId,
        String(req.params.availabilityId),
      );
      if (!ok) {
        return res.status(404).json({ message: "Availability not found" });
      }
      res.status(204).send();
    },
  );

  // Tutee self
  app.get(api.tutees.me.getProfile.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const profile = await storage.getTuteeProfile(userId);
    res.json(profile ?? null);
  });

  app.put(api.tutees.me.upsertProfile.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tutees.me.upsertProfile.input.parse(req.body);
      const profile = await storage.upsertTuteeProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  // Sessions
  app.get(api.sessions.listMine.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const sessions = await storage.listMySessions(userId);
    res.json(sessions);
  });

  app.post(api.sessions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.sessions.create.input.parse(req.body);

      const tutor = await storage.getTutor(String(input.tutorId));
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found" });
      }

      const created = await storage.createSession(userId, {
        ...input,
        tuteeId: userId,
      } as any);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.sessions.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.sessions.update.input.parse(req.body);
      const updated = await storage.updateSession(
        String(req.params.sessionId),
        userId,
        input,
      );
      if (!updated) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  // ===== REVIEWS =====

  app.post(api.reviews.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.reviews.create.input.parse(req.body);
      const review = await storage.createReview(userId, input);

      // Create notification for reviewee
      const session = await storage.listMySessions(userId);
      const targetSession = session.find(s => s.id === input.sessionId);
      if (targetSession) {
        const revieweeId = targetSession.tutorId === userId ? targetSession.tuteeId : targetSession.tutorId;
        await storage.createNotification({
          userId: revieweeId,
          type: "review",
          title: "New Review Received",
          body: `You received a ${input.rating}-star review!`,
          data: { sessionId: input.sessionId },
        });
      }

      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      if (err instanceof Error && err.message === "Session not found") {
        return res.status(404).json({ message: "Session not found" });
      }
      throw err;
    }
  });

  app.get(api.reviews.getForUser.path, async (req, res) => {
    const data = await storage.getReviewsForUser(String(req.params.userId));
    res.json(data);
  });

  // ===== CONVERSATIONS =====

  app.get(api.conversations.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const convos = await storage.listConversations(userId);
    res.json(convos);
  });

  // ===== MESSAGES =====

  app.get(api.messages.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const msgs = await storage.getMessages(String(req.params.conversationId), userId);
    res.json(msgs);
  });

  app.post(api.messages.send.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.messages.send.input.parse(req.body);
      const message = await storage.sendMessage(userId, input.receiverId, input.content);

      // Create notification for receiver
      const sender = await storage.getCurrentUser(userId);
      await storage.createNotification({
        userId: input.receiverId,
        type: "message",
        title: "New Message",
        body: `${sender?.firstName ?? "Someone"} sent you a message`,
        data: { conversationId: message.conversationId },
      });

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.messages.markRead.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    await storage.markMessagesRead(String(req.params.conversationId), userId);
    res.json({ success: true });
  });

  // ===== NOTIFICATIONS =====

  app.get(api.notifications.unreadCount.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ count });
  });

  app.get(api.notifications.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const notifs = await storage.listNotifications(userId);
    res.json(notifs);
  });

  app.patch(api.notifications.markRead.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const notif = await storage.markNotificationRead(
      String(req.params.notificationId),
      userId,
    );
    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notif);
  });

  app.post(api.notifications.markAllRead.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    await storage.markAllNotificationsRead(userId);
    res.json({ success: true });
  });

  // ===== ANALYTICS =====

  app.get(api.analytics.dashboard.path, async (_req, res) => {
    const data = await storage.getDashboardAnalytics();
    res.json(data);
  });

  // ===== GIGS =====

  app.get(api.gigs.myGigs.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req)!;
    const myGigs = await storage.getMyGigs(userId);
    res.json(myGigs);
  });

  app.get(api.gigs.list.path, async (req, res) => {
    const filters = api.gigs.list.input?.parse(req.query);
    const gigList = await storage.listGigs(filters);
    res.json(gigList);
  });

  app.get(api.gigs.get.path, async (req: any, res) => {
    const gig = await storage.getGig(req.params.gigId);
    if (!gig) return res.status(404).json({ message: "Gig not found" });
    res.json(gig);
  });

  app.post(api.gigs.create.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req)!;
    const body = { ...req.body };
    // Convert deadline string to Date object for Drizzle
    if (body.deadline && typeof body.deadline === "string") {
      body.deadline = new Date(body.deadline);
    }
    const gig = await storage.createGig(userId, body);
    res.status(201).json(gig);
  });

  app.patch(api.gigs.update.path, isAuthenticated, async (req: any, res) => {
    const gig = await storage.updateGig(req.params.gigId, req.body);
    if (!gig) return res.status(404).json({ message: "Gig not found" });
    res.json(gig);
  });

  app.post(api.gigs.apply.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req)!;
    const app = await storage.applyToGig(req.params.gigId, userId, req.body);
    // Notify gig poster
    const gig = await storage.getGig(req.params.gigId);
    if (gig) {
      await storage.createNotification({
        userId: gig.posterId,
        type: "gig_application",
        title: "New application",
        body: `Someone applied to your gig "${gig.title}"`,
        data: { gigId: gig.id },
      });
    }
    res.status(201).json(app);
  });

  app.get(api.gigs.applications.path, isAuthenticated, async (req: any, res) => {
    const apps = await storage.getGigApplications(req.params.gigId);
    res.json(apps);
  });

  app.patch(api.gigs.updateApplication.path, isAuthenticated, async (req: any, res) => {
    const updated = await storage.updateGigApplication(req.params.appId, req.body);
    if (!updated) return res.status(404).json({ message: "Application not found" });

    // If accepted, update gig status to in_progress
    if (req.body.status === "accepted") {
      await storage.updateGig(req.params.gigId, { status: "in_progress" });
      await storage.createNotification({
        userId: updated.applicantId,
        type: "gig_accepted",
        title: "Application accepted!",
        body: "Your gig application has been accepted.",
        data: { gigId: req.params.gigId },
      });
    }

    // If rejected, notify the applicant
    if (req.body.status === "rejected") {
      const gig = await storage.getGig(req.params.gigId);
      await storage.createNotification({
        userId: updated.applicantId,
        type: "gig_rejected",
        title: "Application not selected",
        body: `Your application for "${gig?.title ?? "a gig"}" was not selected this time.`,
        data: { gigId: req.params.gigId },
      });
    }
    res.json(updated);
  });

  app.post(api.gigs.complete.path, isAuthenticated, async (req: any, res) => {
    const gig = await storage.getGig(req.params.gigId);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    // Find the accepted applicant
    const acceptedApp = gig.applications.find((a: any) => a.status === "accepted");
    if (!acceptedApp) return res.status(400).json({ message: "No accepted helper for this gig" });

    // Mark gig as completed
    await storage.updateGig(req.params.gigId, { status: "completed" });

    // Generate proof of work
    const pow = await storage.createProofOfWork({
      gigId: gig.id,
      helperId: acceptedApp.applicantId,
      posterId: gig.posterId,
      title: gig.title,
      description: gig.description,
      category: gig.category,
      skillsUsed: gig.skillsRequired ?? [],
      rating: req.body.rating,
      review: req.body.review,
    });

    // Notify the helper
    await storage.createNotification({
      userId: acceptedApp.applicantId,
      type: "gig_completed",
      title: "Gig completed! 🎉",
      body: `You earned a Proof of Work card for "${gig.title}"`,
      data: { gigId: gig.id },
    });

    res.json(pow);
  });

  // ===== AI (KAI) =====

  app.post(api.ai.enhanceGig.path, isAuthenticated, async (req: any, res) => {
    const { title, description, category } = req.body;
    const result = await aiService.enhanceGigDescription(title || "", description || "", category || "academic");
    res.json(result);
  });

  app.post(api.ai.suggestPrice.path, isAuthenticated, async (req: any, res) => {
    const { title, category, skills, description } = req.body;
    const result = await aiService.suggestFairPrice(title || "", category || "academic", skills || [], description || "");
    res.json(result);
  });

  app.post(api.ai.matchHelpers.path, isAuthenticated, async (req: any, res) => {
    const { gigTitle, gigCategory, gigSkills } = req.body;
    // For now, return empty since we need real helper data
    const result = await aiService.matchHelpers(gigTitle || "", gigCategory || "", gigSkills || [], []);
    res.json(result);
  });

  // ===== LEADERBOARD =====

  app.get(api.leaderboard.get.path, async (req, res) => {
    const filters = api.leaderboard.get.input?.parse(req.query);
    const board = await storage.getLeaderboard(filters);
    res.json(board);
  });

  // ===== PROOF OF WORK =====

  app.get(api.proofOfWork.myCards.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req)!;
    const cards = await storage.getMyProofOfWorkCards(userId);
    res.json(cards);
  });

  app.get(api.proofOfWork.get.path, async (req: any, res) => {
    const pow = await storage.getProofOfWork(req.params.gigId);
    if (!pow) return res.status(404).json({ message: "Proof of Work not found" });
    res.json(pow);
  });

  return httpServer;
}

