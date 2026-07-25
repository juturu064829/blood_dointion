/* ==========================================================================
   PULSERED - Auth Service (JWT + Redis Session Manager)
   Features: Token Sign/Verify, Refresh Token Rotation, Redis Blacklist
   ========================================================================== */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'pulsered_super_secret_jwt_key_998877665544332211';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'pulsered_refresh_secret_key_112233445566778899';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

class AuthService {
    constructor() {
        // In-Memory Redis Store fallback simulator
        this.redisMock = new Map();
        this.blacklistedJwt = new Set();
    }

    // 1. Generate short-lived JWT Access Token
    generateAccessToken(user) {
        const payload = {
            sub: user.id,
            googleId: user.google_id,
            email: user.email,
            name: user.full_name,
            bloodGroup: user.blood_group || 'O-',
            role: user.role || 'donor'
        };

        return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    }

    // 2. Generate Refresh Token with Family ID (for Refresh Token Rotation)
    generateRefreshToken(userId, familyId = null) {
        const newFamilyId = familyId || crypto.randomUUID();
        const payload = {
            sub: userId,
            familyId: newFamilyId,
            jti: crypto.randomUUID()
        };

        const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });

        // Store active session in Redis
        this.redisMock.set(`session:${token}`, {
            userId,
            familyId: newFamilyId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        });

        return { token, familyId: newFamilyId };
    }

    // 3. Verify JWT Access Token
    verifyAccessToken(token) {
        if (this.blacklistedJwt.has(token)) {
            throw new Error('Token has been revoked');
        }
        return jwt.verify(token, JWT_SECRET);
    }

    // 4. Revoke Session (Logout)
    revokeSession(refreshToken, accessToken = null) {
        if (refreshToken) {
            this.redisMock.delete(`session:${refreshToken}`);
        }
        if (accessToken) {
            this.blacklistedJwt.add(accessToken);
        }
    }
}

module.exports = new AuthService();
