package api

import (
	"livepaint/models"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func WsHandler(c echo.Context) error {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:3000"
	}

	ac := c.(*AuthenticatedContext)
	client := ac.client

	conn, err := upgrader.Upgrade(ac.Response(), ac.Request(), nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	client.Conn = conn

	go handleRead(client)
	go handleWrite(client)
	return nil
}

// TODO: Add AuthConn struct and replace models.Client
func handleRead(client *models.Client) {
	defer client.Conn.Close()

	client.Conn.SetReadLimit(MaxMessageSize)
	client.Conn.SetReadDeadline(time.Now().Add(PongWait))
	client.Conn.SetPongHandler(func(string) error { client.Conn.SetReadDeadline(time.Now().Add(PongWait)); return nil })
	for {
		_, buffer, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println(err)
			}
			break
		}
		msg, err := unmarshal(buffer)
		if err != nil {
			log.Println(err)
		} else {
			msg.process(client)
		}
	}
}

// TODO: Add AuthConn struct and replace models.Client
func handleWrite(client *models.Client) {
	ticker := time.NewTicker(PingPeriod)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()
	for {
		select {
		case outMsg, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(WriteWait))
			if !ok {
				// The hub closed the channel.
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.BinaryMessage)
			if err != nil {
				return
			}
			w.Write(outMsg)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(WriteWait))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
