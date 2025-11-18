//controller function for get rooms
exports.getRooms = (req, res) => {
    res.send('Room route is working');
}

//controller function for get room by id
exports.getRoomById = (req, res) => {
    const roomId = req.params.id;
    res.send(`Details of room with ID: ${roomId}`);
}

//controller function for create new room
exports.createRoom = (req, res) => {
    const newRoom = req.body;
    res.status(201).send(`New room created: ${JSON.stringify(newRoom)}`);
}

//controller function for update room by id
exports.updateRoom = (req, res) => {
    const roomId = req.params.id;
    const updatedRoom = req.body;
    res.send(`Room with ID: ${roomId} updated to: ${JSON.stringify(updatedRoom)}`);
}

//controller function for delete room by id
exports.deleteRoom = (req, res) => {
    const roomId = req.params.id;
    res.send(`Room with ID: ${roomId} deleted`);
}