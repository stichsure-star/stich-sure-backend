require('dotenv').config();
const express = require('express');
const app = express();
const { sequelize } = require('./models');
const swaggerUi = require('swagger-ui-express')
const PORT = process.env.PORT || 7001;
const swaggerDocument = require('./swaggerDocumentation');
const express_session = require('express-session');
const { passport } = require('./middlewares/passport');
const customerRoutes = require('./routes/customer');
const authRoutes = require('./routes/auth');
const designerRoutes = require('./routes/designer');
const request = require('./routes/request')
const designs = require('./routes/designs')
const designImage = require('./routes/DesignImage')
const requestImage = require('./routes/requestImage')

app.use(express.json());

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
app.use('/api/v1/designImage', designImage);
app.use('/api/v1/requestImage', requestImage);
const startServer = async () => {
  try {
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
