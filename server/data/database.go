package data

import (
	"livepaint/models"
	"sync"
)

var clientsMutex = sync.Mutex{}
var roomsMutex = sync.Mutex{}

var Clients = make(map[string]*models.Client)
var Rooms = make(map[string]*models.Room)

func CreateRoom() *models.Room {
	room := models.NewRoom()
	roomsMutex.Lock()
	Rooms[room.Id] = room
	roomsMutex.Unlock()
	return room
}

func CreateClient(token string, username string) *models.Client {
	client := models.NewClient(token, username)
	clientsMutex.Lock()
	Clients[token] = client
	clientsMutex.Unlock()
	return client
}
