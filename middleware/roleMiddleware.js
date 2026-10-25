const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(401).json({
        success: false,
        message: "Role not found"
      });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    next();
  };
};

module.exports = allowRoles;