const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role?.toLowerCase();
        
        // Check if user's role (case-insensitive) is in the allowed list
        const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires ${allowedRoles.join(" or ")} role.`
            });
        }
        next();
    };
};

module.exports = roleMiddleware;