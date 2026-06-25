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
const designerWallet = require('./routes/designerWallet')
const collaboration = require('./routes/collaboration')
// const payment = require('./routes/payments')
const notificationRoutes = require('./routes/notification');
const shipbubble = require('./routes/shipbubble')
const withdrawalRoutes = require('./routes/withdrawal');

const order = require('./routes/order')


const { globalErrorHandler } = require('./utils/errorHandler');

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))


app.use(express_session({
    secret: 'Stich-Sure',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());
console.log('secret key:', process.env.KORA_SECRET_KEY);
console.log(process.env.KORA_SECRET_KEY?.slice(0, 10));
app.use('/apiDocs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/designer', designerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/request', request);
app.use('/api/v1/designs', designs);
app.use('/api/v1/designerProfile', designerProfile);
app.use('/api/v1/designerWallet', designerWallet);
app.use('/api/v1/collaboration', collaboration);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/withdrawal', withdrawalRoutes);
app.use('/api/v1/shipment', shipbubble)

app.use('/api/v1/orders', order);



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
