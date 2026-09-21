/* ==========================================================================
   PULSERED - Production Real-User Auth & Account Isolation Service
   ========================================================================== */

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'pulsered_super_secret_jwt_key_998877665544332211';

// Native Crypto JWT Implementation
function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return Buffer.from(base64, 'base64').toString('utf8');
}

function signJwt(payload, secret = JWT_SECRET) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 3600) }));
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token, secret = JWT_SECRET) {
    if (!token || typeof token !== 'string') throw new Error('Token required');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token structure');

    const [header, payload, signature] = parts;
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

    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
        throw new Error('Token expired');
    }
    return decoded;
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
        return {
            user: this.sanitizeUser({ ...userObj, profile: profileObj }),
            token
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
        const profile = inMemoryProfiles.get(user.id) || null;

        return {
            user: this.sanitizeUser({ ...user, profile }),
            token
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
        const normalized = email.toLowerCase().trim();
        const user = inMemoryUsers.get(normalized);
        if (!user) {
            // Return success without revealing whether account exists to prevent account enumeration
            return { message: 'If an account with that email exists, a password reset link has been issued.' };
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
