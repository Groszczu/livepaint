import { createStore } from "solid-js/store";
import { WS_URL } from "./config";
import { decodeMessage, encodeMessage, MessageType } from "./message";
import { setUserStore } from "./user";

export interface WebSocketStore {
  ws: WebSocket | null;
  connected: boolean;
  error: string | null;
}

export const [webSocketStore, setWebSocketStore] = createStore<WebSocketStore>({
  ws: null,
  connected: false,
  error: null,
});

export const createWebSocket = () => {
  const ws = new WebSocket(WS_URL);
  ws.binaryType = "arraybuffer";

  ws.addEventListener("open", () => {
    setWebSocketStore("connected", true);
    console.log("connected with", WS_URL);
  });
  ws.addEventListener("error", (e) => {
    console.log("Error:", e);

    setWebSocketStore("error", "Error occurred");
  });
  ws.addEventListener("message", (e) => {
    const receivedMessage = decodeMessage(e.data);
    switch (receivedMessage.type) {
      case MessageType.Registered: {
        setUserStore("username", receivedMessage.data);
      }
      default: {
        console.log("unsupported message type", receivedMessage.type);
      }
    }
    console.log("Received:", receivedMessage);
  });

  setWebSocketStore("ws", ws);
};

export const register = (username: string) => {
  if (!webSocketStore.ws) {
    return;
  }
  webSocketStore.ws.send(encodeMessage(MessageType.Register, username));
};

export const addMessageEventListener = (
  messageType: MessageType,
  callback: MessageEvent<any>
) => {};
