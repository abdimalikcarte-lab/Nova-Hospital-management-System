
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

dotenv.config();

const required = [
  "BOOTSTRAP_ADMIN_NAME",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_PASSWORD",
  "HOSPITAL_NAME",
  "HOSPITAL_SLUG",
  "HOSPITAL_ADMIN_NAME",
  "HOSPITAL_ADMIN_EMAIL",
  "HOSPITAL_ADMIN_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

async function bootstrap() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create the first hospital.
    const hospitalResult = await client.query(
      `INSERT INTO hospitals (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug)
       DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [process.env.HOSPITAL_NAME, process.env.HOSPITAL_SLUG]
    );

    const hospital = hospitalResult.rows[0];

    // Create platform administrator.
    const platformPasswordHash = await bcrypt.hash(
      process.env.BOOTSTRAP_ADMIN_PASSWORD,
      12
    );

    const platformAdminResult = await client.query(
      `INSERT INTO users (
         full_name, email, password_hash, is_platform_admin
       )
       VALUES ($1, LOWER($2), $3, TRUE)
       ON CONFLICT (email)
       DO UPDATE SET is_platform_admin = TRUE
       RETURNING id`,
      [
        process.env.BOOTSTRAP_ADMIN_NAME,
        process.env.BOOTSTRAP_ADMIN_EMAIL,
        platformPasswordHash,
      ]
    );

    // Create hospital administrator.
    const hospitalPasswordHash = await bcrypt.hash(
      process.env.HOSPITAL_ADMIN_PASSWORD,
      12
    );

    const hospitalAdminResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       ON CONFLICT (email)
       DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [
        process.env.HOSPITAL_ADMIN_NAME,
        process.env.HOSPITAL_ADMIN_EMAIL,
        hospitalPasswordHash,
      ]
    );

    const platformAdminId = platformAdminResult.rows[0].id;
    const hospitalAdminId = hospitalAdminResult.rows[0].id;

    // Create hospital roles.
    const roleNames = [
      "Hospital Admin",
      "Doctor",
      "Receptionist",
      "Nurse",
      "Accountant",
    ];

    const roleIds = {};

    for (const roleName of roleNames) {
      const roleResult = await client.query(
        `INSERT INTO roles (hospital_id, name)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [hospital.id, roleName]
      );

      if (roleResult.rowCount) {
        roleIds[roleName] = roleResult.rows[0].id;
      } else {
        const existingRole = await client.query(
          `SELECT id FROM roles
           WHERE hospital_id = $1 AND LOWER(name) = LOWER($2)`,
          [hospital.id, roleName]
        );

        roleIds[roleName] = existingRole.rows[0].id;
      }
    }

    // Assign permissions to each role.
    const allPermissions = await client.query(
      "SELECT id, permission_key FROM permissions"
    );

    const permissionSets = {
      "Hospital Admin": allPermissions.rows.map((p) => p.permission_key),

      Doctor: [
        "dashboard.view",
        "patients.view",
        "doctors.view",
        "appointments.view",
      ],

      Receptionist: [
        "dashboard.view",
        "patients.view",
        "patients.create",
        "patients.update",
        "doctors.view",
        "appointments.view",
        "appointments.manage",
        "departments.view",
      ],

      Nurse: [
        "dashboard.view",
        "patients.view",
        "appointments.view",
      ],

      Accountant: [
        "dashboard.view",
        "billing.view",
        "billing.manage",
        "reports.view",
      ],
    };

    for (const [roleName, permissionKeys] of Object.entries(permissionSets)) {
      for (const permissionKey of permissionKeys) {
        const permission = allPermissions.rows.find(
          (p) => p.permission_key === permissionKey
        );

        if (!permission) continue;

        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleIds[roleName], permission.id]
        );
      }
    }

    // Add hospital administrator membership.
    await client.query(
      `INSERT INTO user_hospitals (
         user_id, hospital_id, role_id, is_default
       )
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (user_id, hospital_id)
       DO UPDATE SET
         role_id = EXCLUDED.role_id,
         status = 'active'`,
      [
        hospitalAdminId,
        hospital.id,
        roleIds["Hospital Admin"],
      ]
    );

    await client.query("COMMIT");

    console.log("Nova HMS bootstrap completed.");
    console.log("Hospital:", hospital.name);
    console.log("Hospital Admin:", process.env.HOSPITAL_ADMIN_EMAIL);
    console.log("Platform Admin:", process.env.BOOTSTRAP_ADMIN_EMAIL);
    console.log("Hospital ID:", hospital.id);
    console.log("Keep your administrator passwords private.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
