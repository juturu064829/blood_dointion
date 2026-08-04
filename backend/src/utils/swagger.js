/* ==========================================================================
   PULSERED - OpenAPI / Swagger Documentation Utility
   ========================================================================== */

const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'PulseRed Blood Search & Donor Management API',
        version: '2.0.0',
        description: 'Production REST API for Blood Search, Andhra Pradesh Donor Locator, ABO Compatibility Engine, Emergency Requests, and User Auth.'
    },
    servers: [
        { url: 'http://localhost:4000', description: 'Local Backend Server' },
        { url: 'http://localhost:8080', description: 'Production Gateway Server' }
    ],
    paths: {
        '/api/auth/register': {
            post: {
                summary: 'Register a new user account',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    email: { type: 'string' },
                                    password: { type: 'string' },
                                    phone: { type: 'string' },
                                    bloodGroup: { type: 'string' },
                                    district: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': { description: 'User successfully registered' }
                }
            }
        },
        '/api/auth/login': {
            post: {
                summary: 'Log into account and obtain JWT token',
                responses: {
                    '200': { description: 'Authentication successful' }
                }
            }
        },
        '/api/donors/search': {
            get: {
                summary: 'Search available donors by blood group & Andhra Pradesh district/city',
                parameters: [
                    { name: 'bloodGroup', in: 'query', schema: { type: 'string' } },
                    { name: 'district', in: 'query', schema: { type: 'string' } },
                    { name: 'city', in: 'query', schema: { type: 'string' } }
                ],
                responses: {
                    '200': { description: 'List of matching donors' }
                }
            }
        },
        '/api/blood-requests': {
            post: {
                summary: 'Post an urgent emergency blood request',
                responses: {
                    '201': { description: 'Emergency alert created & broadcasted' }
                }
            },
            get: {
                summary: 'Get active blood requests',
                responses: {
                    '200': { description: 'Array of blood requests' }
                }
            }
        },
        '/api/locations/ap-districts': {
            get: {
                summary: 'Get list of all 26 Andhra Pradesh districts',
                responses: {
                    '200': { description: 'Districts array' }
                }
            }
        }
    }
};

function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
