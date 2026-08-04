/* ==========================================================================
   PULSERED - Auth Service (Zero-Dependency Native Crypto JWT + Prisma DB Manager)
   ========================================================================== */

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'pulsered_super_secret_jwt_key_998877665544332211';

// Native JWT Sign & Verify Implementation using Node.js Crypto
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
        .digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

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
        .digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    if (signature !== expectedSig) throw new Error('Invalid signature');
    const decoded = JSON.parse(base64UrlDecode(payload));

    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
        throw new Error('Token expired');
    }
    return decoded;
}

// Password Hashing helper
function hashPassword(password, salt = null) {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, saltBuffer, 10000, 64, 'sha512').toString('hex');
    return `${saltBuffer.toString('hex')}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, originalHash] = storedHash.split(':');
    const computedHash = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 10000, 64, 'sha512').toString('hex');
    return computedHash === originalHash;
}

// In-Memory Storage
const inMemoryUsers = new Map();
const inMemoryProfiles = new Map();

// Default Admin
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

class AuthService {
    async registerUser({ name, email, password, phone, role = 'DONOR', bloodGroup, district, city }) {
        if (!email || !password || !name) {
            throw { statusCode: 400, message: 'Name, email, and password are required.' };
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (inMemoryUsers.has(normalizedEmail)) {
            throw { statusCode: 400, message: 'User already exists with this email.' };
        }

        const passwordHash = hashPassword(password);
        const userId = `usr-${Date.now()}`;
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

        if (bloodGroup && district) {
            inMemoryProfiles.set(userObj.id, {
                id: `dp-${Date.now()}`,
                userId: userObj.id,
                bloodGroup,
                state: 'Andhra Pradesh',
                district,
                city: city || district,
                available: true,
                emergencyAvailable: true
            });
        }

        const token = this.generateToken(userObj);
        return { user: this.sanitizeUser(userObj), token };
    }

    async loginUser({ email, password }) {
        if (!email || !password) {
            throw { statusCode: 400, message: 'Email and password are required.' };
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = inMemoryUsers.get(normalizedEmail);

        if (!user) {
            throw { statusCode: 401, message: 'Invalid email or password.' };
        }

        const isValidPassword = verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            throw { statusCode: 401, message: 'Invalid email or password.' };
        }

        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }

    async getUserById(userId) {
        for (const u of inMemoryUsers.values()) {
            if (u.id === userId) {
                return this.sanitizeUser({ ...u, donorProfile: inMemoryProfiles.get(userId) || null });
            }
        }
        throw { statusCode: 404, message: 'User not found' };
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
