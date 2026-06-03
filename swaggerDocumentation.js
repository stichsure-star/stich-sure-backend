const swagger = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stich Sure API Documentation',
            version: '1.0.0',
            description: ' Swagger Documenting'
        },
        servers: [
            {
                url: "http://localhost:7001",
                description: 'development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: [
        './routes/*.js',
        './docs/customer.yaml',
        './docs/designer.yaml'
    ]
}

module.exports = swagger(options)
