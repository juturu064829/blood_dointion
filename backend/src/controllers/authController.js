/* ==========================================================================
   PULSERED - Production Auth & User Account Controller
   ========================================================================== */

const authService = require('../services/authService');

async function register(req, res, next) {
    try {
        const result = await authService.registerUser(req.body);
        res.cookie('accessToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({
            success: true,
            message: 'Account registered and profile created successfully.',
            data: result
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const result = await authService.loginUser(req.body);
        res.cookie('accessToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            success: true,
            message: 'Logged in successfully.',
            data: result
        });
    } catch (err) {
        next(err);
    }
}

async function getMe(req, res, next) {
    try {
        const user = await authService.getUserById(req.user.id);
        res.json({
            success: true,
            user
        });
    } catch (err) {
        next(err);
    }
}

async function updateMe(req, res, next) {
    try {
        const updatedUser = await authService.updateUserProfile(req.user.id, req.body);
        res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: updatedUser
        });
    } catch (err) {
        next(err);
    }
}

async function logout(req, res, next) {
    try {
        res.clearCookie('accessToken');
        res.json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) throw { statusCode: 400, message: 'Email is required.' };
        const result = await authService.forgotPassword(email);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) throw { statusCode: 400, message: 'Reset token and new password are required.' };
        const result = await authService.resetPassword(resetToken, newPassword);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    logout,
    forgotPassword,
    resetPassword
};
