CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(100),
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE TABLE user_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_session_expiry ON user_sessions(expires_at);
CREATE TABLE password_resets (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_reset_user ON password_resets(user_id);
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  company VARCHAR(150) NOT NULL,
  title VARCHAR(150) NOT NULL,
  salary VARCHAR(100) NOT NULL,
  location VARCHAR(150) NOT NULL,
  work_mode VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  application_url VARCHAR(2048) NOT NULL,
  status_url VARCHAR(2048) NOT NULL,
  applied_date DATE,
  deadline DATE,
  notes VARCHAR(5000) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_application_owner_updated ON applications(user_id, updated_at);
CREATE INDEX idx_application_owner_status ON applications(user_id, status);
