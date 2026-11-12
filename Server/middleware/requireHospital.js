
import { query } from "../config/db.js";

export async function requireHospital(req, res, next) {
  try {
    const hospitalId = Number(req.session?.hospitalId);

    if (!hospitalId || !Number.isSafeInteger(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a hospital.",
      });
    }

    if (req.session.isPlatformAdmin) {
      const result = await query(
        `SELECT id, name, slug, status
         FROM hospitals
         WHERE id = $1 AND status = 'active'`,
        [hospitalId]
      );

      if (!result.rowCount) {
        return res.status(403).json({
          success: false,
          message: "Hospital is unavailable.",
        });
      }

      req.hospital = result.rows[0];
      return next();
    }

    const result = await query(
      `SELECT h.id, h.name, h.slug, h.status
       FROM user_hospitals uh
       JOIN hospitals h ON h.id = uh.hospital_id
       WHERE uh.user_id = $1
         AND uh.hospital_id = $2
         AND uh.status = 'active'
         AND h.status = 'active'`,
      [req.session.userId, hospitalId]
    );

    if (!result.rowCount) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this hospital.",
      });
    }

    req.hospital = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
