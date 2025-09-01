import passport from "passport";
import { Strategy as OpenIDStrategy } from "passport-openidconnect";
import session from "express-session";
import pgSimple from "connect-pg-simple";
import { db } from "./db";
import { storage } from "./storage";
import { randomUUID } from "crypto";

const PgSession = pgSimple(session);

// Configuration for Replit OIDC
const getOidcConfig = () => {
  const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
  const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
  const clientId = process.env.REPL_ID || "your-replit-id";
  
  return {
    issuer: issuerUrl,
    authorizationURL: `${issuerUrl}/auth`,
    tokenURL: `${issuerUrl}/token`,
    userInfoURL: `${issuerUrl}/userinfo`,
    clientID: clientId,
    clientSecret: process.env.REPLIT_CLIENT_SECRET || "your-client-secret",
    callbackURL: `${process.env.FRONTEND_URL || "http://localhost:3003"}/auth/callback`,
    scope: "openid profile email",
  };
};

// Session configuration
export const getSession = () => {
  return session({
    store: new PgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      },
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "your-super-secret-session-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
};

// Update user session with group context
export const updateUserSession = async (req: any, user: any) => {
  if (req.session) {
    req.session.user = user;
    req.session.userId = user.id;
    
    // Get user's teams for group context
    try {
      const userTeams = await storage.getUserTeams(user.id);
      req.session.userTeams = userTeams;
      req.session.primaryTeamId = userTeams[0]?.id;
    } catch (error) {
      console.error("Error fetching user teams:", error);
      req.session.userTeams = [];
    }
  }
};

// Upsert user in database
export const upsertUser = async (profile: any) => {
  try {
    const existingUser = await storage.getUser(profile.sub);
    
    if (existingUser) {
      // Update existing user
      return await storage.updateUser(profile.sub, {
        username: profile.preferred_username || profile.name,
        email: profile.email,
        battlemetrics_id: profile.battlemetrics_id,
      });
    } else {
      // Create new user
      return await storage.createUser({
        id: profile.sub,
        username: profile.preferred_username || profile.name,
        password: randomUUID(), // Generate random password for OAuth users
        email: profile.email,
        battlemetrics_id: profile.battlemetrics_id,
      });
    }
  } catch (error) {
    console.error("Error upserting user:", error);
    throw error;
  }
};

// Setup authentication middleware
export const setupAuth = async (app: any) => {
  const oidcConfig = getOidcConfig();
  
  // Session middleware
  app.use(getSession());
  
  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());
  
  // OIDC Strategy
  passport.use(
    new OpenIDStrategy(oidcConfig, async (issuer: string, profile: any, done: any) => {
      try {
        // Upsert user in database
        const user = await upsertUser(profile);
        
        // Return user profile
        return done(null, {
          id: user.id,
          username: user.username,
          email: user.email,
          claims: profile,
        });
      } catch (error) {
        return done(error);
      }
    })
  );
  
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Auth routes
  app.get("/auth", passport.authenticate("openidconnect"));
  
  app.get("/auth/callback", 
    passport.authenticate("openidconnect", { failureRedirect: "/login" }),
    (req: any, res: any) => {
      // Update session with user context
      updateUserSession(req, req.user);
      res.redirect("/admin");
    }
  );
  
  app.get("/auth/logout", (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.redirect("/");
      });
    });
  });
  
  console.log("✅ Authentication system configured");
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For API routes, return JSON error
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // For web routes, redirect to login
  res.redirect("/auth");
};

// Middleware to check if user is admin
export const isAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Check if user has admin role in any team
  const userTeams = req.session?.userTeams || [];
  const isAdmin = userTeams.some((team: any) => team.role === "admin");
  
  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

// Middleware to check if user is team admin
export const isTeamAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const teamId = req.params.teamId || req.body.teamId;
  if (!teamId) {
    return res.status(400).json({ message: "Team ID required" });
  }
  
  // Check if user is admin of the specific team
  const userTeams = req.session?.userTeams || [];
  const isTeamAdmin = userTeams.some((team: any) => 
    team.id === teamId && team.role === "admin"
  );
  
  if (!isTeamAdmin) {
    return res.status(403).json({ message: "Team admin access required" });
  }
  
  next();
};
