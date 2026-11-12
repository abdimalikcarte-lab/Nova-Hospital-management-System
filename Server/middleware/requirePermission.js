
import { query } from "../config/db.js";

export function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (req.session?.isPlatformAdmin) {
        return next();
      }

      if (!req.session?.userId || !req.hospital?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication and hospital selection required.",
        });
      }

      const result = await query(
        `SELECT 1
         FROM user_hospitals uh
         JOIN roles r
           ON r.id = uh.role_id
          AND r.hospital_id = uh.hospital_id
         JOIN role_permissions rp ON rp.role_id = r.id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE uh.user_id = $1
           AND uh.hospital_id = $2
           AND uh.status = 'active'
           AND p.permission_key = $3
         LIMIT 1`,
        [req.session.userId, req.hospital.id, permissionKey]
      );

      if (!result.rowCount) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
          requiredPermission: permissionKey,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
