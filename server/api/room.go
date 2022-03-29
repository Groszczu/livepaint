package api

import (
	"livepaint/data"
	"livepaint/models"
)

func runRoom(room *models.Room) {
	for {
		select {
		case client := <-room.Register:
			room.Clients[client] = true
		case client := <-room.Unregister:
			if _, ok := room.Clients[client]; ok {
				delete(room.Clients, client)
				close(client.Send)
				if len(room.Clients) == 0 {
					delete(data.Rooms, room.Id)
					break
				}
			}
		case message := <-room.Broadcast:
			for client := range room.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(room.Clients, client)
				}
			}
		}
	}
}
