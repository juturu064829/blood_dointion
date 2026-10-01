/* ==========================================================================
   PULSERED - Production Real-User Auth & Account Isolation Service
   ========================================================================== */

const crypto = require('crypto');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS } = require('../config/jwtConfig');

// In-Memory Refresh Token Session Store (Supports Family ID Rotation & Revocation)
const refreshSessions = new Map();
const familyRevocations = new Set();

// Native Crypto JWT Implementation
function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return Buffer.from(base64, 'base64').toString('utf8');
}

function signJwt(payload, secret = JWT_SECRET, expireMinutes = null) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const minutes = expireMinutes || (process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES, 10) : ACCESS_TOKEN_EXPIRE_MINUTES) || 60;
    const expSeconds = nowSeconds + (minutes * 60);

    const userId = payload.sub || payload.user_id || payload.id;

    // Standardized claims schema (sub, user_id, iat, exp) - No passwords or sensitive PII stored
    const finalPayload = {
        sub: userId,
        user_id: userId,
        id: userId,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'DONOR',
        iat: nowSeconds,
        exp: expSeconds
    };

    const header = { alg: JWT_ALGORITHM, typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(finalPayload));
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function signRefreshToken(payload, secret = JWT_REFRESH_SECRET, expireDays = REFRESH_TOKEN_EXPIRE_DAYS) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const days = (process.env.REFRESH_TOKEN_EXPIRE_DAYS ? parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS, 10) : expireDays) || 7;
    const expSeconds = nowSeconds + (days * 24 * 60 * 60);

    const userId = payload.sub || payload.user_id || payload.id;
    const familyId = payload.familyId || `fam-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const jti = payload.jti || `jti-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const finalPayload = {
        sub: userId,
        user_id: userId,
        familyId,
        jti,
        type: 'refresh',
        iat: nowSeconds,
        exp: expSeconds
    };

    const header = { alg: JWT_ALGORITHM, typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(finalPayload));
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    refreshSessions.set(jti, {
        userId,
        familyId,
        isUsed: false,
        isRevoked: false,
        expiresAt: expSeconds * 1000
    });

    return { token, familyId, jti };
}

function verifyJwt(token, secret = JWT_SECRET) {
    if (!token || typeof token !== 'string') throw new Error('Token required');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token structure');

    const [header, payload, signature] = parts;

    // Explicit Algorithm Verification
    let decodedHeader;
    try {
        decodedHeader = JSON.parse(base64UrlDecode(header));
    } catch (e) {
        throw new Error('Invalid token header format');
    }

    if (!decodedHeader || !decodedHeader.alg) {
        throw new Error('Missing algorithm in token header');
    }

    if (decodedHeader.alg !== JWT_ALGORITHM) {
        throw new Error(`Algorithm mismatch: Expected ${JWT_ALGORITHM}, received ${decodedHeader.alg}`);
    }

    const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

    const expectedSigBuf = Buffer.from(expectedSig);
    const signatureBuf = Buffer.from(signature);

    if (expectedSigBuf.length !== signatureBuf.length || !crypto.timingSafeEqual(expectedSigBuf, signatureBuf)) {
        throw new Error('Invalid signature');
    }
    const decoded = JSON.parse(base64UrlDecode(payload));

    if (!decoded.sub && !decoded.user_id && !decoded.id) {
        throw new Error('Token subject identification missing');
    }

    if (!decoded.iat || typeof decoded.iat !== 'number') {
        throw new Error('Token issued-at (iat) claim missing');
    }

    if (!decoded.exp || typeof decoded.exp !== 'number') {
        throw new Error('Token expiration claim missing');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp >= decoded.exp) {
        throw new Error('Token expired');
    }

    const userId = decoded.user_id || decoded.sub || decoded.id;
    decoded.sub = userId;
    decoded.user_id = userId;
    decoded.id = userId;

    return decoded;
}

function verifyRefreshToken(token, secret = JWT_REFRESH_SECRET) {
    const decoded = verifyJwt(token, secret);
    if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type. Expected refresh token.');
    }

    if (familyRevocations.has(decoded.familyId)) {
        throw new Error('Refresh token family revoked due to reuse detection');
    }

    const session = refreshSessions.get(decoded.jti);
    if (!session || session.isRevoked) {
        throw new Error('Refresh token session revoked or invalid');
    }

    if (session.isUsed) {
        familyRevocations.add(decoded.familyId);
        throw new Error('Refresh token reuse detected. Revoking all sessions for family.');
    }

    return { decoded, session };
}

// Hardened Password Hashing (210,000 PBKDF2-HMAC-SHA512 Iterations)
function hashPassword(password, salt = null) {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, saltBuffer, 210000, 64, 'sha512').toString('hex');
    return `${saltBuffer.toString('hex')}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, originalHash] = storedHash.split(':');
    const computedHashBuf = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 210000, 64, 'sha512');
    const originalHashBuf = Buffer.from(originalHash, 'hex');

    if (computedHashBuf.length !== originalHashBuf.length) return false;
    return crypto.timingSafeEqual(computedHashBuf, originalHashBuf);
}

// In-Memory Storage Maps
const inMemoryUsers = new Map();
const inMemoryProfiles = new Map();
const resetTokens = new Map();

// Seed Default Admin
const defaultAdminHash = hashPassword('AdminPass123!');
inMemoryUsers.set('admin@pulsered.org', {
    id: 'usr-admin-01',
    name: 'Dr. Sarah Jenkins',
    email: 'admin@pulsered.org',
    phone: '+91 9876543210',
    passwordHash: defaultAdminHash,
    role: 'ADMIN',
    isVerified: true,
    createdAt: new Date()
});
inMemoryProfiles.set('usr-admin-01', {
    id: 'dp-admin-01',
    userId: 'usr-admin-01',
    bloodGroup: 'O-',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    city: 'Visakhapatnam City',
    pincode: '530001',
    available: true,
    emergencyAvailable: true
});

class AuthService {
    async registerUser({ name, email, password, confirmPassword, phone, role = 'DONOR', bloodGroup = 'O+', state = 'Andhra Pradesh', district = 'Visakhapatnam', city = 'Visakhapatnam City', pincode = '530001' }) {
        if (!email || !password || !name) {
            throw { statusCode: 400, message: 'Full Name, Email, and Password are required.' };
        }

        if (confirmPassword && password !== confirmPassword) {
            throw { statusCode: 400, message: 'Passwords do not match.' };
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check Email Uniqueness
        if (inMemoryUsers.has(normalizedEmail)) {
            throw { statusCode: 400, message: 'User already exists with this email address.' };
        }

        // 2. Check Mobile Uniqueness
        if (phone) {
            const cleanPhone = phone.trim();
            for (const u of inMemoryUsers.values()) {
                if (u.phone && u.phone.trim() === cleanPhone) {
                    throw { statusCode: 400, message: 'Mobile number is already registered to another account.' };
                }
            }
        }

        const passwordHash = hashPassword(password);
        const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const userObj = {
            id: userId,
            name,
            email: normalizedEmail,
            phone: phone || null,
            passwordHash,
            role,
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        inMemoryUsers.set(normalizedEmail, userObj);

        // Create Profile
        const profileObj = {
            id: `dp-${userId}`,
            userId: userId,
            bloodGroup: bloodGroup.toUpperCase(),
            state,
            district,
            city,
            pincode,
            available: true,
            emergencyAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        inMemoryProfiles.set(userId, profileObj);

        const token = this.generateToken(userObj);
        const refreshTokenRes = this.generateRefreshToken(userObj);
        return {
            user: this.sanitizeUser({ ...userObj, profile: profileObj }),
            token,
            accessToken: token,
            refreshToken: refreshTokenRes.token
        };
    }

    async loginUser({ email, phone, loginId, password }) {
        const identifier = (loginId || email || phone || '').toLowerCase().trim();
        if (!identifier || !password) {
            throw { statusCode: 400, message: 'Email/Mobile and Password are required.' };
        }

        let user = null;

        // Search by Email or Phone
        if (inMemoryUsers.has(identifier)) {
            user = inMemoryUsers.get(identifier);
        } else {
            for (const u of inMemoryUsers.values()) {
                if (u.phone && (u.phone.trim() === identifier || u.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))) {
                    user = u;
                    break;
                }
            }
        }

        if (!user) {
            throw { statusCode: 401, message: 'Invalid credentials. User account not found.' };
        }

        const isValidPassword = verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            throw { statusCode: 401, message: 'Invalid credentials. Password incorrect.' };
        }

        const token = this.generateToken(user);
        const refreshTokenRes = this.generateRefreshToken(user);
        const profile = inMemoryProfiles.get(user.id) || null;

        return {
            user: this.sanitizeUser({ ...user, profile }),
            token,
            accessToken: token,
            refreshToken: refreshTokenRes.token
        };
    }

    async getUserById(userId) {
        for (const u of inMemoryUsers.values()) {
            if (u.id === userId) {
                const profile = inMemoryProfiles.get(userId) || null;
                return this.sanitizeUser({ ...u, profile });
            }
        }
        throw { statusCode: 404, message: 'User profile not found.' };
    }

    async updateUserProfile(userId, updateData) {
        let targetUser = null;
        for (const u of inMemoryUsers.values()) {
            if (u.id === userId) {
                targetUser = u;
                break;
            }
        }

        if (!targetUser) throw { statusCode: 404, message: 'User not found.' };

        // Update User info
        if (updateData.name) targetUser.name = updateData.name;
        if (updateData.phone) targetUser.phone = updateData.phone;
        targetUser.updatedAt = new Date();

        // Update Profile info
        let profile = inMemoryProfiles.get(userId);
        if (!profile) {
            profile = { id: `dp-${userId}`, userId };
        }

        if (updateData.bloodGroup) profile.bloodGroup = updateData.bloodGroup.toUpperCase();
        if (updateData.state) profile.state = updateData.state;
        if (updateData.district) profile.district = updateData.district;
        if (updateData.city) profile.city = updateData.city;
        if (updateData.pincode) profile.pincode = updateData.pincode;
        if (updateData.gender) profile.gender = updateData.gender;
        if (updateData.dateOfBirth) profile.dateOfBirth = updateData.dateOfBirth;
        if (updateData.lastDonationDate) profile.lastDonationDate = updateData.lastDonationDate;
        if (updateData.available !== undefined) profile.available = updateData.available;
        if (updateData.emergencyAvailable !== undefined) profile.emergencyAvailable = updateData.emergencyAvailable;

        profile.updatedAt = new Date();
        inMemoryProfiles.set(userId, profile);

        return this.sanitizeUser({ ...targetUser, profile });
    }

    async forgotPassword(email) {
        if (!email) throw { statusCode: 400, message: 'Email address is required.' };
        const normalized = email.toLowerCase().trim();
        let user = inMemoryUsers.get(normalized);
        if (!user) {
            const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            user = {
                id: userId,
                name: normalized.split('@')[0],
                email: normalized,
                phone: null,
                passwordHash: hashPassword('TempPass123!'),
                role: 'DONOR',
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            inMemoryUsers.set(normalized, user);
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        resetTokens.set(resetToken, {
            email: normalized,
            expiresAt: Date.now() + 3600000 // 1 hour expiry
        });

        return {
            message: 'Password reset token generated successfully.',
            resetToken
        };
    }

    async resetPassword(resetToken, newPassword) {
        const record = resetTokens.get(resetToken);
        if (!record || record.expiresAt < Date.now()) {
            throw { statusCode: 400, message: 'Invalid or expired password reset token.' };
        }

        const user = inMemoryUsers.get(record.email);
        if (!user) throw { statusCode: 404, message: 'Account not found.' };

        user.passwordHash = hashPassword(newPassword);
        user.updatedAt = new Date();
        resetTokens.delete(resetToken);

        return { message: 'Password has been reset successfully. You can now log in with your new password.' };
    }

    generateToken(user) {
        return signJwt({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    }

    generateRefreshToken(user, familyId = null) {
        return signRefreshToken({
            sub: user.id,
            user_id: user.id,
            familyId
        });
    }

    async rotateRefreshToken(refreshTokenString) {
        if (!refreshTokenString) {
            throw { statusCode: 401, message: 'Refresh token is required.' };
        }

        let verified;
        try {
            verified = verifyRefreshToken(refreshTokenString);
        } catch (err) {
            throw { statusCode: 401, message: err.message || 'Invalid or expired refresh token.' };
        }

        const { decoded, session } = verified;
        
        // Mark current refresh token session as used
        session.isUsed = true;

        // Retrieve current active user
        const user = await this.getUserById(decoded.sub || decoded.user_id);
        if (!user) {
            throw { statusCode: 401, message: 'User account associated with refresh token no longer exists.' };
        }

        // Generate new access token and rotated refresh token under the SAME familyId
        const newAccessToken = this.generateToken(user);
        const newRefreshToken = this.generateRefreshToken(user, decoded.familyId);

        return {
            user,
            token: newAccessToken,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken.token
        };
    }

    async revokeRefreshToken(refreshTokenString) {
        if (!refreshTokenString) return;
        try {
            const parts = refreshTokenString.split('.');
            if (parts.length === 3) {
                const payloadStr = base64UrlDecode(parts[1]);
                const payload = JSON.parse(payloadStr);
                if (payload.jti) {
                    const session = refreshSessions.get(payload.jti);
                    if (session) {
                        session.isRevoked = true;
                    }
                }
                if (payload.familyId) {
                    familyRevocations.add(payload.familyId);
                }
            }
        } catch (e) {
            // Ignore decoding errors during logout revocation
        }
    }

    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
}

module.exports = new AuthService();
module.exports.inMemoryUsers = inMemoryUsers;
module.exports.inMemoryProfiles = inMemoryProfiles;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
module.exports.signJwt = signJwt;
module.exports.verifyJwt = verifyJwt;
module.exports.signRefreshToken = signRefreshToken;
module.exports.verifyRefreshToken = verifyRefreshToken;
module.exports.refreshSessions = refreshSessions;
module.exports.familyRevocations = familyRevocations;
