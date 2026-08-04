/* ==========================================================================
   PULSERED - Authentication Controller
   Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
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
            message: 'User registered successfully.',
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
            message: 'Login successful.',
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

module.exports = {
    register,
    login,
    getMe,
    logout
};
