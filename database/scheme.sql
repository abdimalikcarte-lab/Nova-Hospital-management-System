
-- =====================================================
-- NOVA HMS | CORE MULTI-HOSPITAL DATABASE
-- PostgreSQL / Neon
-- =====================================================

-- 1. HOSPITALS
CREATE TABLE hospitals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(180),
    phone VARCHAR(40),
    address TEXT,
    country VARCHAR(100) DEFAULT 'Somaliland',
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USERS
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(180) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id)
);

-- 3. ROLES
CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hospital_id, id)
);

CREATE UNIQUE INDEX roles_name_per_hospital
ON roles (COALESCE(hospital_id, 0), LOWER(name));

-- 4. PERMISSIONS
CREATE TABLE permissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_key VARCHAR(120) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. HOSPITAL MEMBERSHIP
CREATE TABLE user_hospitals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, hospital_id),
    UNIQUE (hospital_id, user_id)
);

-- 6. DEPARTMENTS
CREATE TABLE departments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, name)
);

-- 7. DOCTORS
CREATE TABLE doctors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    user_id BIGINT REFERENCES users(id),
    department_id BIGINT,
    employee_number VARCHAR(60) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(180),
    phone VARCHAR(40),
    specialization VARCHAR(150),
    qualification VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, employee_number),

    FOREIGN KEY (hospital_id, department_id)
        REFERENCES departments(hospital_id, id),

    FOREIGN KEY (hospital_id, user_id)
        REFERENCES user_hospitals(hospital_id, user_id)
);

-- 8. PATIENTS
CREATE TABLE patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    patient_number VARCHAR(60) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20)
        CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    phone VARCHAR(40),
    email VARCHAR(180),
    address TEXT,
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(180),
    emergency_contact_phone VARCHAR(40),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'deceased')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, patient_number)
);

-- 9. APPOINTMENTS
CREATE TABLE appointments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN (
            'scheduled', 'confirmed', 'completed',
            'cancelled', 'no_show'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hospital_id, id),

    FOREIGN KEY (hospital_id, patient_id)
        REFERENCES patients(hospital_id, id),

    FOREIGN KEY (hospital_id, doctor_id)
        REFERENCES doctors(hospital_id, id),

    FOREIGN KEY (hospital_id, department_id)
        REFERENCES departments(hospital_id, id)
);

-- 10. OPD / CLINICAL ENCOUNTERS
CREATE TABLE encounters (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    encounter_number VARCHAR(60) NOT NULL,
    encounter_type VARCHAR(30) NOT NULL
        CHECK (encounter_type IN ('OPD', 'emergency', 'inpatient')),
    chief_complaint TEXT,
    symptoms TEXT,
    treatment_plan TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, encounter_number),

    FOREIGN KEY (hospital_id, patient_id)
        REFERENCES patients(hospital_id, id),

    FOREIGN KEY (hospital_id, doctor_id)
        REFERENCES doctors(hospital_id, id),

    FOREIGN KEY (hospital_id, appointment_id)
        REFERENCES appointments(hospital_id, id)
);

-- 11. CLINICAL NOTES / EMR
CREATE TABLE clinical_notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    encounter_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL REFERENCES users(id),
    note_type VARCHAR(50) NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (hospital_id, encounter_id)
        REFERENCES encounters(hospital_id, id)
);

-- 12. DIAGNOSES
CREATE TABLE diagnoses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    encounter_id BIGINT NOT NULL,
    diagnosis_code VARCHAR(40),
    diagnosis_name VARCHAR(250) NOT NULL,
    diagnosis_type VARCHAR(30) DEFAULT 'primary',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (hospital_id, encounter_id)
        REFERENCES encounters(hospital_id, id)
);

-- 13. VITAL SIGNS
CREATE TABLE vital_signs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    encounter_id BIGINT NOT NULL,
    recorded_by BIGINT REFERENCES users(id),
    temperature NUMERIC(5,2),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation NUMERIC(5,2),
    weight_kg NUMERIC(6,2),
    height_cm NUMERIC(6,2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (hospital_id, encounter_id)
        REFERENCES encounters(hospital_id, id)
);

-- 14. SERVICE CATALOG
CREATE TABLE service_catalog (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    service_code VARCHAR(60) NOT NULL,
    service_name VARCHAR(180) NOT NULL,
    service_type VARCHAR(40) NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, service_code)
);

-- 15. LAB / RADIOLOGY SERVICE ORDERS
CREATE TABLE service_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    encounter_id BIGINT NOT NULL,
    ordered_by BIGINT NOT NULL REFERENCES doctors(id),
    service_id BIGINT NOT NULL,
    order_type VARCHAR(30) NOT NULL
        CHECK (order_type IN ('laboratory', 'radiology', 'other')),
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(30) NOT NULL DEFAULT 'ordered'
        CHECK (status IN (
            'ordered', 'in_progress', 'completed', 'cancelled'
        )),
    clinical_notes TEXT,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hospital_id, id),

    FOREIGN KEY (hospital_id, encounter_id)
        REFERENCES encounters(hospital_id, id),

    FOREIGN KEY (hospital_id, ordered_by)
        REFERENCES doctors(hospital_id, id),

    FOREIGN KEY (hospital_id, service_id)
        REFERENCES service_catalog(hospital_id, id)
);

-- 16. LAB RESULTS
CREATE TABLE lab_results (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    service_order_id BIGINT NOT NULL,
    result_text TEXT,
    result_value VARCHAR(180),
    unit VARCHAR(40),
    reference_range VARCHAR(100),
    abnormal_flag VARCHAR(20),
    verified_by BIGINT REFERENCES users(id),
    verified_at TIMESTAMPTZ,

    FOREIGN KEY (hospital_id, service_order_id)
        REFERENCES service_orders(hospital_id, id)
);

-- 17. RADIOLOGY REPORTS
CREATE TABLE radiology_reports (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    service_order_id BIGINT NOT NULL,
    findings TEXT,
    impression TEXT,
    image_reference TEXT,
    reported_by BIGINT REFERENCES users(id),
    reported_at TIMESTAMPTZ,

    FOREIGN KEY (hospital_id, service_order_id)
        REFERENCES service_orders(hospital_id, id)
);

-- 18. PRESCRIPTIONS
CREATE TABLE prescriptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    encounter_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'dispensed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hospital_id, id),

    FOREIGN KEY (hospital_id, encounter_id)
        REFERENCES encounters(hospital_id, id),

    FOREIGN KEY (hospital_id, doctor_id)
        REFERENCES doctors(hospital_id, id)
);

-- 19. PRESCRIPTION ITEMS
CREATE TABLE prescription_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    prescription_id BIGINT NOT NULL,
    medicine_name VARCHAR(180) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    instructions TEXT,

    FOREIGN KEY (hospital_id, prescription_id)
        REFERENCES prescriptions(hospital_id, id)
);

-- 20. WARDS
CREATE TABLE wards (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    name VARCHAR(120) NOT NULL,
    ward_type VARCHAR(60),
    floor VARCHAR(40),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, name)
);

-- 21. BEDS
CREATE TABLE beds (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    ward_id BIGINT NOT NULL,
    bed_number VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'occupied', 'maintenance')),
    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, ward_id, bed_number),

    FOREIGN KEY (hospital_id, ward_id)
        REFERENCES wards(hospital_id, id)
);

-- 22. ADMISSIONS
CREATE TABLE admissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    patient_id BIGINT NOT NULL,
    bed_id BIGINT NOT NULL,
    admitted_by BIGINT REFERENCES users(id),
    admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    discharge_date TIMESTAMPTZ,
    admission_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'admitted'
        CHECK (status IN ('admitted', 'transferred', 'discharged')),

    UNIQUE (hospital_id, id),

    FOREIGN KEY (hospital_id, patient_id)
        REFERENCES patients(hospital_id, id),

    FOREIGN KEY (hospital_id, bed_id)
        REFERENCES beds(hospital_id, id)
);

-- Only one active admission can occupy a bed.
CREATE UNIQUE INDEX one_active_admission_per_bed
ON admissions(hospital_id, bed_id)
WHERE status = 'admitted';

-- 23. INVOICES
CREATE TABLE invoices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    patient_id BIGINT NOT NULL,
    encounter_id BIGINT,
    invoice_number VARCHAR(60) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'void')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hospital_id, id),
    UNIQUE (hospital_id, invoice_number),

    FOREIGN KEY (hospital_id, patient_id)
        REFERENCES patients(hospital_id, id),

    FOREIGN KEY (hospital_id, encounter_id)
        REFERENCES encounters(hospital_id, id)
);

-- 24. INVOICE ITEMS
CREATE TABLE invoice_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    invoice_id BIGINT NOT NULL,
    description VARCHAR(250) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),

    FOREIGN KEY (hospital_id, invoice_id)
        REFERENCES invoices(hospital_id, id)
);

-- 25. PAYMENTS
CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    invoice_id BIGINT NOT NULL,
    receipt_number VARCHAR(60) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(40) NOT NULL,
    reference_number VARCHAR(120),
    received_by BIGINT REFERENCES users(id),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (hospital_id, invoice_id)
        REFERENCES invoices(hospital_id, id),

    UNIQUE (hospital_id, receipt_number)
);

-- 26. AUDIT LOGS
CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hospital_id BIGINT REFERENCES hospitals(id),
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_patients_hospital_name
ON patients(hospital_id, last_name, first_name);

CREATE INDEX idx_appointments_hospital_date
ON appointments(hospital_id, appointment_date);

CREATE INDEX idx_encounters_patient
ON encounters(hospital_id, patient_id, started_at DESC);

CREATE INDEX idx_service_orders_status
ON service_orders(hospital_id, status);

CREATE INDEX idx_admissions_status
ON admissions(hospital_id, status);

CREATE INDEX idx_invoices_patient
ON invoices(hospital_id, patient_id, created_at DESC);

CREATE INDEX idx_audit_hospital_date
ON audit_logs(hospital_id, created_at DESC);

