const express = require('express');
const app = express.Router();
const controller = require('../controllers/room.controller');

app.get('/', controller.getRooms);

app.get('/:id', controller.getRoomById);

app.post('/', controller.createRoom);

app.put('/:id', controller.updateRoom);

app.delete('/:id', controller.deleteRoom);

module.exports = app;