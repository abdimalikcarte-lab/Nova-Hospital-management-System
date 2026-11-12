import { query } from "../../config/db.js";

export async function getMyHospitals(req, res, next) {
  try {
    if (req.session.isPlatformAdmin) {
      const result = await query(
        `SELECT id, name, slug, status
         FROM hospitals
         WHERE status = 'active'
         ORDER BY name`
      );

      return res.json({
        success: true,
        hospitals: result.rows,
      });
    }

    const result = await query(
      `SELECT h.id, h.name, h.slug, r.name AS role_name
       FROM user_hospitals uh
       JOIN hospitals h ON h.id = uh.hospital_id
       JOIN roles r
         ON r.id = uh.role_id
        AND r.hospital_id = uh.hospital_id
       WHERE uh.user_id = $1
         AND uh.status = 'active'
         AND h.status = 'active'
       ORDER BY h.name`,
      [req.session.userId]
    );

    res.json({
      success: true,
      hospitals: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function switchHospital(req, res, next) {
  try {
    const hospitalId = Number(req.body.hospitalId);

    if (!Number.isSafeInteger(hospitalId) || hospitalId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid hospital ID is required.",
      });
    }

    let membership;

    if (req.session.isPlatformAdmin) {
      membership = await query(
        `SELECT id, name, slug
         FROM hospitals
         WHERE id = $1 AND status = 'active'`,
        [hospitalId]
      );
    } else {
      membership = await query(
        `SELECT h.id, h.name, h.slug
         FROM user_hospitals uh
         JOIN hospitals h ON h.id = uh.hospital_id
         WHERE uh.user_id = $1
           AND uh.hospital_id = $2
           AND uh.status = 'active'
           AND h.status = 'active'`,
        [req.session.userId, hospitalId]
      );
    }

    if (!membership.rowCount) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this hospital.",
      });
    }

    req.session.hospitalId = hospitalId;

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({
      success: true,
      hospital: membership.rows[0],
      message: "Hospital switched successfully.",
    });
  } catch (error) {
    next(error);
  }
}

