package models

import "github.com/google/uuid"

type Room struct {
	Id         string           `json:"id"`
	Clients    map[*Client]bool `json:"-"`
	Broadcast  chan []byte      `json:"-"`
	Register   chan *Client     `json:"-"`
	Unregister chan *Client     `json:"-"`
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
