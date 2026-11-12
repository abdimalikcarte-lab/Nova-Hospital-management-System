
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import pool from "./config/db.js";

import authRoutes from "./modules/auth/auth.routes.js";
import hospitalRoutes from "./modules/auth/hospitals/hospital.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const PgSession = connectPgSimple(session);

// Required for secure cookies behind Render's proxy.
if (isProduction) {
  app.set("trust proxy", 1);
}

// Validate essential environment variables.
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from environment variables.");
}

if (!process.env.CLIENT_URL) {
  throw new Error("CLIENT_URL is missing from environment variables.");
}

// Allowed frontend origins.
const allowedOrigins = process.env.CLIENT_URL
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""));

// Security headers.
app.use(helmet());

// Cross-origin requests with session cookies.
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-side health checks.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  })
);

// Parse incoming JSON.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// PostgreSQL-backed session storage.
app.use(
  session({
    name: "nova.sid",
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

// Health check.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Nova Hospital Management System API is running.",
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);

// Unknown API endpoint.
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// Central error handler.
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.status || 500).json({
    success: false,
    message:
      isProduction && (error.status || 500) === 500
        ? "An unexpected server error occurred."
        : error.message || "Internal server error.",
  });
});

// Start server.
app.listen(PORT, () => {
  console.log(`Nova HMS API running on port ${PORT}`);
});

