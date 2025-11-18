import io from "socket.io-client";
import { store } from "../store/store";

let socket = null;

export const initializeSocket = () => {
  const token = store.getState().auth.token;

  if (!socket) {
    socket = io("https://haat-zkun.onrender.com", {
      transports: ["websocket"],
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");

      // Join user room
      const user = store.getState().auth.user;
      if (user) {
        socket.emit("join-user", user.id);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
