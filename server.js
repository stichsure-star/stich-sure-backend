require('dotenv').config();
const express = require('express');
const app = express();
const { sequelize } = require('./models');
const swaggerUi = require('swagger-ui-express')
const redisClient = require('./Redis/redisConnection')
const PORT = process.env.PORT || 7001;
const cors = require('cors')
const swaggerDocument = require('./swaggerDocumentation');
const express_session = require('express-session');
const passport = require('passport')
require('./middlewares/passport');
const customerRoutes = require('./routes/customer');
const authRoutes = require('./routes/auth');
const designerRoutes = require('./routes/designer');
const request = require('./routes/request')
const designs = require('./routes/designs')
const designerProfile = require('./routes/designerProfile')
const collaboration = require('./routes/collaboration')

const shipbubble = require('./routes/shipbubble')

const order = require('./routes/order')
const payment = require('./routes/payment')

const { globalErrorHandler } = require('./utils/errorHandler');

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express_session({
    secret: 'Stich-Sure',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use('/apiDocs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/designer', designerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/request', request);
app.use('/api/v1/designs', designs);
app.use('/api/v1/designerProfile', designerProfile);
app.use('/api/v1/collaboration', collaboration);

app.use('/api/v1/shipment', shipbubble)

app.use('/api/v1/orders', order);
app.use('/api/v1/payment', payment);


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})


app.use(globalErrorHandler);

const startServer = async () => {
  try {
    try {
        await redisClient.connect();
        console.log('Connected to Redis successfully');
    } catch (err) {
        console.log('Failed to connect to Redis:', err.message);
    }

    await sequelize.authenticate();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Running on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
  }
};

startServer();
