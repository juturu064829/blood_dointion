/* ==========================================================================
   PULSERED - Security Audit Logger Utility
   ========================================================================== */

function logSecurityEvent(type, req, detail) {
    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    console.warn(`[SECURITY EVENT] [${timestamp}] TYPE=${type} | IP=${ip} | PATH=${req.originalUrl} | AGENT="${userAgent}" | DETAIL="${detail}"`);
}

module.exports = { logSecurityEvent };
