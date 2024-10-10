const io = require("socket.io")(3000, {
    cors: {
        origin: "*"
    }
});

const rooms = {};

const wordArray = ["boy", "bat", "phone", "cat", "dog", "house", "car", "tree", "book", "pen"];

io.on('connection', (socket) => {
    socket.on("join-room", (data) => {
        const user = { id: socket.id, name: data.name, ready: false };
        let room = rooms[data.roomId];

        // Create the room if it doesn't exist
        if (!room) {
            room = { users: [], id: data.roomId, word: null, guesser: null };
            rooms[data.roomId] = room;
        }

        room.users.push(user);
        socket.join(data.roomId);
        console.log(room);
    });


    socket.on("ready", (data) => {
        const room = rooms[data.roomId];
        if (room) {
            const user = room.users.find(u => u.id === socket.id);
            if (user) {
                user.ready = true;

                // Start round when everyone is ready
                if (room.users.every(u => u.ready)) {
                    room.word = wordArray[Math.floor(Math.random() * wordArray.length)];

                    // Ensure there are users to assign as drawer and guesser
                    if (room.users.length > 1) {
                        // Randomly assign a guesser
                        room.guesser = room.users[Math.floor(Math.random() * room.users.length)];
                        room.drawer = room.users.find(u => u.id !== room.guesser.id); // Drawer is anyone but the guesser

                        // Emit different events for guesser and drawer
                        room.users.forEach(u => {
                            if (u.id === room.drawer.id) { // Change to check for drawer
                                io.to(u.id).emit("start-drawer", room.word);
                            } else {
                                io.to(u.id).emit("start-guesser"); // All others are guessers
                            }
                        });
                    } else {
                        console.error("Not enough users to start the game.");
                    }
                }
            }
        }
    });


    socket.on("draw", (data) => {
        if (data.start && data.end) {
            io.to(data.roomId).emit("draw-line", { start: data.start, end: data.end });
        }
    });

    socket.on("submit-guess", (data) => {
        const room = rooms[data.roomId];
        const user = room.users.find(u => u.id === socket.id);
        if (room && user) {
            socket.to(data.roomId).emit("guess", { user: user.name, data: data.guess });
            if (data.guess.toLowerCase().trim() === room.word.toLowerCase()) {
                io.to(data.roomId).emit("winner", user.name, room.word);
                room.users.forEach(u => {
                    u.ready = false; // Reset ready state for all users
                });
                room.word = null; // Reset the word for the room
            }
        }
    });

    socket.on("disconnect", () => {
        Object.values(rooms).forEach(room => {
            room.users.forEach(user => {
                if (user.id === socket.id) {
                    user.ready = false; // Reset ready state
                }
            });
            room.users = room.users.filter(u => u.id !== socket.id);
            if (room.users.length === 0) {
                delete rooms[room.id]; // Remove the room if all users have disconnected
            }
        });
    });
});
