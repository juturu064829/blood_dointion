/* ==========================================================================
   PULSERED - Production Global Error Handler Middleware
   ========================================================================== */

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode && typeof err.statusCode === 'number' ? err.statusCode : 500;
    
    // Log detailed internal error trace on server console for developer diagnosis
    console.error(`[SERVER ERROR HANDLER] ${new Date().toISOString()} [${req.method} ${req.originalUrl}]:`, err);

    // Provide generic response message for unhandled 500 internal errors to avoid information leakage
    const message = statusCode === 500 
        ? 'An internal error occurred. Please try again later.' 
        : (err.message || 'Error processing request');

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { devStack: err.stack })
    });
}

module.exports = errorHandler;
