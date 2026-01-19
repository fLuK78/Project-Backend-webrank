require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger-output.json');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 3000;

const competitionRoutes = require('./routes/competition.route');
const registrationRoutes = require('./routes/registration.route');
const paymentRoutes = require('./routes/payment.route');
const authRoutes = require('./routes/auth.route');

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use('/competitions', competitionRoutes);
app.use('/registrations', registrationRoutes);
app.use('/payments', paymentRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Competition Registration API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});