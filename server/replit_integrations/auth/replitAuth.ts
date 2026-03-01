import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // ── REGISTER ──
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "Email, password, and first name are required." });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }

      // Check if email already exists
      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.upsertUser({
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName: lastName || null,
        profileImageUrl: null,
        passwordHash,
      });

      // Set session
      (req as any).session.userId = user.id;

      return res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err: any) {
      console.error("[auth] Register error:", err);
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // ── LOGIN ──
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Set session
      (req as any).session.userId = user.id;

      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err: any) {
      console.error("[auth] Login error:", err);
      return res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // ── GET CURRENT USER ──
  app.get("/api/auth/user", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  // ── LOGOUT ──
  app.get("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("[auth] Logout error:", err);
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("[auth] Logout error:", err);
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // ── Auth middleware: attach user to request ──
  app.use(async (req: any, _res, next) => {
    const userId = req.session?.userId;
    if (userId) {
      const user = await authStorage.getUser(userId);
      if (user) {
        // Simulate the same structure existing routes expect
        req.user = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          },
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        };
        req.isAuthenticated = () => true;
      } else {
        req.isAuthenticated = () => false;
      }
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
