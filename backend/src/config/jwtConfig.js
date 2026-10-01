/* ==========================================================================
   PULSERED - Centralized JWT Secret Key, Refresh Key & Expiration Config
   ========================================================================== */

/**
 * Resolves the JWT secret key from the environment configuration.
 * Checks JWT_SECRET_KEY first, with fallback to JWT_SECRET.
 * Throws a configuration error in production if no secret key is provided.
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;

    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY or JWT_SECRET must be defined in backend environment configuration (.env).');
    }

    return secret || 'pulsered_super_secret_jwt_key_998877665544332211';
}

/**
 * Resolves the JWT refresh secret key from environment configuration.
 */
function getJwtRefreshSecret() {
    const refreshSecret = process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_REFRESH_SECRET;

    if (!refreshSecret && process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: JWT_REFRESH_SECRET_KEY or JWT_REFRESH_SECRET must be defined in backend environment configuration (.env).');
    }

    return refreshSecret || 'pulsered_super_secret_jwt_refresh_key_112233445566778899';
}

/**
 * Resolves the JWT signing algorithm from environment configuration.
 * Defaults to 'HS256' for HMAC-SHA256 signature verification.
 */
function getJwtAlgorithm() {
    return process.env.JWT_ALGORITHM || 'HS256';
}

/**
 * Resolves the JWT access token expiration duration in minutes from environment configuration.
 * Defaults to 60 minutes (1 hour).
 */
function getAccessTokenExpireMinutes() {
    const val = process.env.ACCESS_TOKEN_EXPIRE_MINUTES || process.env.JWT_EXPIRE_MINUTES;
    if (val && !isNaN(parseInt(val, 10))) {
        return parseInt(val, 10);
    }
    return 60;
}

/**
 * Resolves the JWT refresh token expiration duration in days from environment configuration.
 * Defaults to 7 days.
 */
function getRefreshTokenExpireDays() {
    const val = process.env.REFRESH_TOKEN_EXPIRE_DAYS || process.env.JWT_REFRESH_EXPIRE_DAYS;
    if (val && !isNaN(parseInt(val, 10))) {
        return parseInt(val, 10);
    }
    return 7;
}

const JWT_SECRET = getJwtSecret();
const JWT_REFRESH_SECRET = getJwtRefreshSecret();
const JWT_ALGORITHM = getJwtAlgorithm();
const ACCESS_TOKEN_EXPIRE_MINUTES = getAccessTokenExpireMinutes();
const REFRESH_TOKEN_EXPIRE_DAYS = getRefreshTokenExpireDays();

module.exports = {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    getJwtSecret,
    getJwtRefreshSecret,
    getJwtAlgorithm,
    getAccessTokenExpireMinutes,
    getRefreshTokenExpireDays
};
