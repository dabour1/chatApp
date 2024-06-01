const WebSocket = require("ws");

class ChatService {
  constructor() {
    this.userCount = 0;
    this.activeClients = [];
    this.webSocketServer = new WebSocket.Server({ port: 8090 });

    this.webSocketServer.on("connection", (socket) => {
      this.addClient(socket);
      socket.on("message", (message) => {
        this.handleMessage(socket, message);
      });
      socket.on("close", () => {
        this.removeClient(socket);
      });
    });
  }

  addClient(socket) {
    this.userCount++;
    socket.id = this.userCount;
    this.activeClients.push(socket);
  }

  handleMessage(socket, message) {
    console.log("Recived:", message);
    let preparedMessage = this.formatMessage(message);
    console.log("preparedMessage:", preparedMessage);
    if (preparedMessage.username) {
      socket.username = preparedMessage.username;
      socket.send(JSON.stringify({ online: this.listOnlineUsers() }));
    }
    preparedMessage.online = this.listOnlineUsers();
    this.broadcastMessage(JSON.stringify(preparedMessage), socket);
  }

  formatMessage(messageObj) {
    let formattedData = {};
    const incomingData = JSON.parse(messageObj);
    if (incomingData.login && incomingData.username) {
      const user = incomingData.username;
      const joinMessage = `${user} has joined`;
      formattedData = { username: user, message: joinMessage, type: "login" };
    } else if (incomingData.body) {
      formattedData = { message: incomingData.body, type: "chat" };
    }
    return formattedData;
  }

  listOnlineUsers() {
    return this.activeClients.map((client) => client.username);
  }

  broadcastMessage(message, excludeSocket) {
    this.activeClients.forEach((client) => {
      if (client !== excludeSocket) {
        client.send(message);
      }
    });
  }

  removeClient(socket) {
    const index = this.activeClients.indexOf(socket);
    if (index !== -1) {
      this.activeClients.splice(index, 1);
    }
    const disconnectMessage = `${socket.username} has been disconnected`;
    const data = {
      type: "logout",
      message: disconnectMessage,
      online: this.listOnlineUsers(),
    };
    this.broadcastMessage(JSON.stringify(data), socket);
  }
}

const chatService = new ChatService();
console.log("---Server started");
