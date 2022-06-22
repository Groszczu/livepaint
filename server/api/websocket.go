package api

import (
	"livepaint/models"
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
		return r.Header.Get("Origin") == "https://livepaint.vercel.app"
	}

	ac := c.(*AuthenticatedContext)
	client := ac.client

	conn, err := upgrader.Upgrade(ac.Response(), ac.Request(), nil)
	if err != nil {
		return err
	}

	client.Conn = conn

	go handleRead(ac, client)
	go handleWrite(ac, client)
	return nil
}

// TODO: Add AuthConn struct and replace models.Client
func handleRead(ac *AuthenticatedContext, client *models.Client) {
	conn := client.Conn
	defer conn.Close()

	conn.SetReadLimit(MaxMessageSize)
	conn.SetReadDeadline(time.Now().Add(PongWait))
	conn.SetPongHandler(func(string) error { conn.SetReadDeadline(time.Now().Add(PongWait)); return nil })
	for {
		_, buffer, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				ac.Logger().Error(err)
			}
			break
		}
		msg, err := unmarshal(buffer)
		if err != nil {
			ac.Logger().Error(err)
		} else {
			msg.process(client)
		}
	}
}

// TODO: Add AuthConn struct and replace models.Client
func handleWrite(ac *AuthenticatedContext, client *models.Client) {
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
			ac.Logger().Debug("Sending message")
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
