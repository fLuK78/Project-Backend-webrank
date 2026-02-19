require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger-output.json');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 4000;
const userRoutes = require('./routes/user.route');

// 1. Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 2. Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// 3. API Routes
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/competitions', require('./routes/competition.route'));
app.use('/api/registrations', require('./routes/registration.route'));
app.use('/api/payments', require('./routes/payment.route'));
app.use('/api/approvals', require('./routes/approval.route'));
app.use('/api/users', require('./routes/user.route'));
app.use('/uploads', express.static('uploads'));

// แยก Path ให้ชัดเจน ไม่ให้ซ้ำกัน
app.use('/api/history', require('./routes/history.route')); 
app.use('/api/players', require('./routes/player.route'));

// 4. Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the Competition Registration API');
});

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'ไม่พบเส้นทาง API ที่ร้องขอ'
  });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log('='.repeat(50));
});