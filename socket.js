let io;

module.exports = {
  init: (httpServer) => {
    require("socket.io")(httpServer);
    return op;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
