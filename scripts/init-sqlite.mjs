import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const file = resolve("prisma/dev.db");
mkdirSync(dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT,
  googleId TEXT UNIQUE,
  avatarUrl TEXT,
  emailVerifiedAt DATETIME,
  verificationToken TEXT,
  resetToken TEXT,
  resetTokenExpiry DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS Company (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  websiteUrl TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS Job (
  id TEXT PRIMARY KEY NOT NULL,
  companyId TEXT NOT NULL,
  title TEXT NOT NULL,
  jobId TEXT,
  location TEXT,
  workMode TEXT NOT NULL DEFAULT 'UNKNOWN',
  salaryMin INTEGER,
  salaryMax INTEGER,
  salaryCurrency TEXT NOT NULL DEFAULT 'INR',
  experience TEXT,
  employmentType TEXT,
  description TEXT,
  skills TEXT,
  jobUrl TEXT,
  applicationUrl TEXT,
  companyUrl TEXT,
  postedDate DATETIME,
  closingDate DATETIME,
  source TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS Resume (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  targetRole TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  fileName TEXT,
  filePath TEXT,
  mimeType TEXT,
  sizeBytes INTEGER,
  description TEXT,
  isDefault BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS Profile (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin TEXT,
  github TEXT,
  portfolio TEXT,
  education TEXT,
  experience TEXT,
  skills TEXT,
  otherInfo TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS Application (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  jobId TEXT NOT NULL,
  resumeId TEXT,
  profileId TEXT,
  status TEXT NOT NULL DEFAULT 'SAVED',
  appliedAt DATETIME,
  progressUrl TEXT,
  recruiterUrl TEXT,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (jobId) REFERENCES Job(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (resumeId) REFERENCES Resume(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (profileId) REFERENCES Profile(id) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS ApplicationEvent (
  id TEXT PRIMARY KEY NOT NULL,
  applicationId TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicationId) REFERENCES Application(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS Interview (
  id TEXT PRIMARY KEY NOT NULL,
  applicationId TEXT NOT NULL,
  round TEXT NOT NULL,
  type TEXT,
  scheduledAt DATETIME NOT NULL,
  duration INTEGER,
  meetingUrl TEXT,
  interviewer TEXT,
  notes TEXT,
  result TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (applicationId) REFERENCES Application(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS Reminder (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  applicationId TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduledAt DATETIME NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (applicationId) REFERENCES Application(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS Note (
  id TEXT PRIMARY KEY NOT NULL,
  applicationId TEXT NOT NULL,
  body TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (applicationId) REFERENCES Application(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS Application_userId_jobId_key ON Application(userId, jobId);
CREATE INDEX IF NOT EXISTS Job_title_idx ON Job(title);
CREATE INDEX IF NOT EXISTS Job_jobId_idx ON Job(jobId);
CREATE INDEX IF NOT EXISTS Job_closingDate_idx ON Job(closingDate);
CREATE INDEX IF NOT EXISTS Resume_userId_idx ON Resume(userId);
CREATE INDEX IF NOT EXISTS Profile_userId_idx ON Profile(userId);
CREATE INDEX IF NOT EXISTS Application_userId_status_idx ON Application(userId, status);
CREATE INDEX IF NOT EXISTS Application_resumeId_idx ON Application(resumeId);
CREATE INDEX IF NOT EXISTS Application_profileId_idx ON Application(profileId);
CREATE INDEX IF NOT EXISTS ApplicationEvent_applicationId_timestamp_idx ON ApplicationEvent(applicationId, timestamp);
CREATE INDEX IF NOT EXISTS Interview_applicationId_idx ON Interview(applicationId);
CREATE INDEX IF NOT EXISTS Interview_scheduledAt_idx ON Interview(scheduledAt);
CREATE INDEX IF NOT EXISTS Reminder_userId_completed_scheduledAt_idx ON Reminder(userId, completed, scheduledAt);
CREATE INDEX IF NOT EXISTS Reminder_applicationId_idx ON Reminder(applicationId);
CREATE INDEX IF NOT EXISTS Note_applicationId_idx ON Note(applicationId);
`);
for (const statement of [
  "ALTER TABLE User ADD COLUMN googleId TEXT",
  "ALTER TABLE User ADD COLUMN avatarUrl TEXT"
]) {
  try {
    db.exec(statement);
  } catch {
    // Column already exists in an initialized local database.
  }
}
db.close();
console.log(`Initialized SQLite database at ${file}`);
