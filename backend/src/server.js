/* ==========================================================================
   PULSERED - Production Server Entry Point
   ========================================================================== */

try { require('dotenv').config(); } catch (e) {}
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(`🩸 PulseRed Full-Stack API Server running on port ${PORT}`);
    console.log(`📍 Andhra Pradesh Location System Enabled (26 Districts)`);
    console.log(`📖 Swagger API Docs live at http://localhost:${PORT}/api-docs`);
    console.log(`===========================================================`);
});
