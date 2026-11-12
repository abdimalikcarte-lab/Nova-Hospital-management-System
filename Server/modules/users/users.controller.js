
import bcrypt from "bcrypt";
import pool from "../../config/db.js";

// GET USERS FOR THE CURRENT HOSPITAL
export async function getUsers(req, res, next) {
  try {
    const hospitalId = req.hospital.id;

    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name AS "fullName",
         u.email,
         u.status AS "accountStatus",
         uh.status AS "membershipStatus",
         uh.is_default AS "isDefault",
         r.id AS "roleId",
         r.name AS "roleName",
         uh.created_at AS "joinedAt"
       FROM user_hospitals uh
       JOIN users u ON u.id = uh.user_id
       JOIN roles r
         ON r.id = uh.role_id
        AND r.hospital_id = uh.hospital_id
       WHERE uh.hospital_id = $1
         AND u.is_platform_admin = FALSE
       ORDER BY u.full_name ASC`,
      [hospitalId]
    );

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// GET ROLES FOR THE CURRENT HOSPITAL
export async function getHospitalRoles(req, res, next) {
  try {
    const hospitalId = req.hospital.id;

    const result = await pool.query(
      `SELECT id, name, description
       FROM roles
       WHERE hospital_id = $1
       ORDER BY name ASC`,
      [hospitalId]
    );

    res.json({
      success: true,
      roles: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// CREATE A NEW HOSPITAL USER
export async function createUser(req, res, next) {
  const client = await pool.connect();

  try {
    const hospitalId = req.hospital.id;

    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const roleId = Number(req.body.roleId);

    if (!fullName || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, password and role are required.",
      });
    }

    if (!Number.isSafeInteger(roleId) || roleId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid role.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    if (fullName.length > 180 || email.length > 180) {
      return res.status(400).json({
        success: false,
        message: "Name or email exceeds the allowed length.",
      });
    }

    // Confirm that the selected role belongs to this hospital.
    const roleResult = await client.query(
      `SELECT id
       FROM roles
       WHERE id = $1
         AND hospital_id = $2`,
      [roleId, hospitalId]
    );

    if (!roleResult.rowCount) {
      return res.status(400).json({
        success: false,
        message: "The selected role does not belong to this hospital.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (
         full_name,
         email,
         password_hash
       )
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [fullName, email, passwordHash]
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO user_hospitals (
         user_id,
         hospital_id,
         role_id,
         is_default
       )
       VALUES ($1, $2, $3, FALSE)`,
      [user.id, hospitalId, roleId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Hospital user created successfully.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        roleId,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    next(error);
  } finally {
    client.release();
  }
}

// UPDATE USER ROLE OR HOSPITAL MEMBERSHIP STATUS
export async function updateUser(req, res, next) {
  try {
    const hospitalId = req.hospital.id;
    const userId = Number(req.params.userId);

    const { roleId, membershipStatus } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required.",
      });
    }

    if (roleId === undefined && membershipStatus === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a role or membership status to update.",
      });
    }

    if (roleId !== undefined) {
      const parsedRoleId = Number(roleId);

      if (!Number.isSafeInteger(parsedRoleId) || parsedRoleId <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid role ID is required.",
        });
      }

      const roleResult = await pool.query(
        `SELECT id
         FROM roles
         WHERE id = $1
           AND hospital_id = $2`,
        [parsedRoleId, hospitalId]
      );

      if (!roleResult.rowCount) {
        return res.status(400).json({
          success: false,
          message: "The selected role does not belong to this hospital.",
        });
      }
    }

    if (
      membershipStatus !== undefined &&
      !["active", "suspended"].includes(membershipStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Membership status must be active or suspended.",
      });
    }

    const result = await pool.query(
      `UPDATE user_hospitals
       SET
         role_id = COALESCE($1, role_id),
         status = COALESCE($2, status)
       WHERE user_id = $3
         AND hospital_id = $4
       RETURNING user_id, role_id, status`,
      [
        roleId === undefined ? null : Number(roleId),
        membershipStatus === undefined ? null : membershipStatus,
        userId,
        hospitalId,
      ]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "User membership was not found in this hospital.",
      });
    }

    res.json({
      success: true,
      message: "User membership updated successfully.",
      membership: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}
