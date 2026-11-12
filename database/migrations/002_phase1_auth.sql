-- ==========================================
-- NOVA HMS - PHASE 1 AUTH & RBAC MIGRATION
-- ==========================================

-- Platform-level administrator.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Hospital membership status.
ALTER TABLE user_hospitals
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'suspended'));

-- Ensure membership role belongs to the same hospital.
ALTER TABLE user_hospitals
DROP CONSTRAINT IF EXISTS user_hospitals_role_id_fkey;

ALTER TABLE user_hospitals
ADD CONSTRAINT user_hospitals_hospital_role_fkey
FOREIGN KEY (hospital_id, role_id)
REFERENCES roles(hospital_id, id);

-- Permission catalogue.
INSERT INTO permissions (permission_key, description)
VALUES
('dashboard.view', 'View hospital dashboard'),
('patients.view', 'View patients'),
('patients.create', 'Register patients'),
('patients.update', 'Update patient records'),
('patients.delete', 'Delete patient records'),
('doctors.view', 'View doctors'),
('doctors.manage', 'Manage doctors'),
('appointments.view', 'View appointments'),
('appointments.manage', 'Manage appointments'),
('departments.view', 'View departments'),
('departments.manage', 'Manage departments'),
('users.view', 'View hospital users'),
('users.create', 'Create hospital users'),
('users.manage_roles', 'Manage user roles'),
('reports.view', 'View reports'),
('billing.view', 'View billing'),
('billing.manage', 'Manage billing'),
('settings.view', 'View hospital settings'),
('settings.manage', 'Manage hospital settings'),
('audit.view', 'View audit logs')
ON CONFLICT (permission_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_membership_user_status
ON user_hospitals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_membership_hospital_status
ON user_hospitals(hospital_id, status);
