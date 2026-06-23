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
                description: 'hosted server'
            },
            {
                url: "https://stich-sure-backend.onrender.com",
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
        './docs/customer.yaml',
        './docs/designer.yaml',
        './docs/designerprofile.yaml',
        './docs/request.yaml',
        './docs/designs.yaml',
        './docs/collaboration.yaml',
        './docs/order.yaml',
        './docs/designerWallet.yaml',
        './docs/payment.yaml',
        './docs/shipbubble.yaml',
        './docs/Payment.yaml',
        './docs/notifications.yaml'
    ]
}

module.exports = swagger(options)
