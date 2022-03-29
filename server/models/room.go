package models

import "github.com/google/uuid"

type Room struct {
	Id         string
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
}

func NewRoom() *Room {
	return &Room{
		Id:         uuid.NewString(),
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}
