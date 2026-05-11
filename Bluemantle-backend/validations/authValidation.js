const { body, validationResult } = require("express-validator");

// Reusable middleware to intercept and return validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }
    next();
};

const validateLogin = [
    body("signInId").optional().trim().notEmpty().withMessage("Sign In ID is required"),
    body("userId").optional().trim().notEmpty().withMessage("User ID is required"),
    body("password").notEmpty().withMessage("Password is required"),
    (req, res, next) => {
        if (!req.body.signInId && !req.body.userId) {
            return res.status(400).json({ success: false, message: "Sign In ID or User ID is required" });
        }
        next();
    },
    handleValidationErrors
];

module.exports = {
    validateLogin
};
