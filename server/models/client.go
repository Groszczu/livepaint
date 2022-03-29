package models

import "github.com/gorilla/websocket"

type Client struct {
	Token    string          `json:"-"`
	Username string          `json:"username"`
	Room     *Room           `json:"-"`
	Conn     *websocket.Conn `json:"-"`
	Send     chan []byte     `json:"-"`
}

func NewClient(token string, username string) *Client {
	return &Client{Token: token, Username: username, Send: make(chan []byte)}
}
