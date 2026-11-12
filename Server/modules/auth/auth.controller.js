
import bcrypt from "bcrypt";
import { query } from "../../config/db.js";

export async function login(req, res, next) {
  try {
    const { email, password, hospitalId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const result = await query(
      `SELECT id, full_name, email, password_hash,
              status, is_platform_admin
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    let selectedHospital = null;
    let permissions = [];

    if (user.is_platform_admin) {
      if (hospitalId) {
        const hospitalResult = await query(
          `SELECT id, name, slug
           FROM hospitals
           WHERE id = $1 AND status = 'active'`,
          [hospitalId]
        );

        selectedHospital = hospitalResult.rows[0] || null;
      }
    } else {
      const memberships = await query(
        `SELECT h.id, h.name, h.slug, r.name AS role_name,
                uh.is_default
         FROM user_hospitals uh
         JOIN hospitals h ON h.id = uh.hospital_id
         JOIN roles r
           ON r.id = uh.role_id
          AND r.hospital_id = uh.hospital_id
         WHERE uh.user_id = $1
           AND uh.status = 'active'
           AND h.status = 'active'
         ORDER BY uh.is_default DESC, h.name ASC`,
        [user.id]
      );

      if (!memberships.rowCount) {
        return res.status(403).json({
          success: false,
          message: "Your account has no active hospital membership.",
        });
      }

      selectedHospital =
        memberships.rows.find(
          (hospital) => String(hospital.id) === String(hospitalId)
        ) ||
        (hospitalId
          ? null
          : memberships.rows[0]);

      if (!selectedHospital) {
        return res.status(403).json({
          success: false,
          message: "You cannot access the selected hospital.",
        });
      }

      const permissionResult = await query(
        `SELECT p.permission_key
         FROM user_hospitals uh
         JOIN role_permissions rp ON rp.role_id = uh.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE uh.user_id = $1
           AND uh.hospital_id = $2
           AND uh.status = 'active'`,
        [user.id, selectedHospital.id]
      );

      permissions = permissionResult.rows.map(
        (row) => row.permission_key
      );
    }

    if (user.is_platform_admin && hospitalId && !selectedHospital) {
      return res.status(403).json({
        success: false,
        message: "Selected hospital does not exist or is inactive.",
      });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.userId = user.id;
    req.session.isPlatformAdmin = user.is_platform_admin;
    req.session.hospitalId = selectedHospital?.id || null;

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isPlatformAdmin: user.is_platform_admin,
        permissions,
      },
      hospital: selectedHospital,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, email, is_platform_admin
       FROM users
       WHERE id = $1 AND status = 'active'`,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        message: "User account is unavailable.",
      });
    }

    let hospital = null;
    let permissions = [];

    if (req.session.hospitalId) {
      const hospitalResult = await query(
        `SELECT id, name, slug
         FROM hospitals
         WHERE id = $1 AND status = 'active'`,
        [req.session.hospitalId]
      );

      hospital = hospitalResult.rows[0] || null;

      if (!user.is_platform_admin && hospital) {
        const permissionResult = await query(
          `SELECT p.permission_key
           FROM user_hospitals uh
           JOIN role_permissions rp ON rp.role_id = uh.role_id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE uh.user_id = $1
             AND uh.hospital_id = $2
             AND uh.status = 'active'`,
          [user.id, hospital.id]
        );

        permissions = permissionResult.rows.map(
          (row) => row.permission_key
        );
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        isPlatformAdmin: user.is_platform_admin,
        permissions,
      },
      hospital,
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("nova.sid");

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
}

