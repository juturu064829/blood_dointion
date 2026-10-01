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
            maxAge: 60 * 60 * 1000
        });
        if (result.refreshToken) {
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/api/v1/auth/refresh',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }
        res.status(201).json({
            success: true,
            message: 'Account registered and profile created successfully.',
            token: result.token,
            accessToken: result.token,
            refreshToken: result.refreshToken,
            tokenType: 'Bearer',
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
            maxAge: 60 * 60 * 1000
        });
        if (result.refreshToken) {
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/api/v1/auth/refresh',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }
        res.json({
            success: true,
            message: 'Logged in successfully.',
            token: result.token,
            accessToken: result.token,
            refreshToken: result.refreshToken,
            tokenType: 'Bearer',
            data: result
        });
    } catch (err) {
        next(err);
    }
}

async function refresh(req, res, next) {
    try {
        const refreshToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token missing. Please log in again.'
            });
        }

        const result = await authService.rotateRefreshToken(refreshToken);

        // Update rotated refresh token cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/api/v1/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Token refreshed successfully.',
            token: result.token,
            accessToken: result.token,
            refreshToken: result.refreshToken,
            tokenType: 'Bearer',
            user: result.user
        });
    } catch (err) {
        res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
        res.clearCookie('accessToken');
        res.status(err.statusCode || 401).json({
            success: false,
            message: err.message || 'Invalid or expired refresh token. Please log in again.'
        });
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
        const refreshToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
        if (refreshToken) {
            await authService.revokeRefreshToken(refreshToken);
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
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
    refresh,
    getMe,
    updateMe,
    logout,
    forgotPassword,
    resetPassword
};
