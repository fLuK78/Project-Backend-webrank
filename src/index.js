require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const roomRoutes = require('./routes/room.route');

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/rooms', roomRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Room Booking API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});