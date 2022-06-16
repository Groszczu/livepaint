package api

import (
	"livepaint/data"
	"livepaint/models"
	"net/http"

	"github.com/labstack/echo/v4"
)

func CreateRoomHandler(c echo.Context) error {
	ac := c.(*AuthenticatedContext)
	client := ac.client

	if client.Room != nil {
		leaveRoom(client)
	}
	room := data.CreateRoom()
	go runRoom(room)
	client.Room = room
	client.Room.Register <- client

	return ac.JSON(http.StatusCreated, newJSONResponse(*room))
}

func runRoom(room *models.Room) {
	for {
		select {
		case client := <-room.Register:
			room.Clients[client] = true
		case client := <-room.Unregister:
			if _, ok := room.Clients[client]; ok {
				delete(room.Clients, client)
				// close(client.Send)
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
					// close(client.Send)
					delete(room.Clients, client)
				}
			}
		}
	}
}

type JoinRoomRequest struct {
	RoomID string `param:"id"`
}

func JoinRoomHandler(c echo.Context) error {
	ac := c.(*AuthenticatedContext)
	client := ac.client

	joinRoomRequest := new(JoinRoomRequest)

	if err := bindValidate(c, joinRoomRequest); err != nil {
		return err
	}

	room, ok := data.Rooms[joinRoomRequest.RoomID]
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "Room with given ID doesn't exist")
	}
	if client.Room != nil && client.Room.Id == room.Id {
		return echo.NewHTTPError(http.StatusConflict, "Client already joined this room")
	}

	if client.Room != nil {
		leaveRoom(client)
	}
	client.Room = room
	client.Room.Register <- client

	return ac.JSON(http.StatusCreated, newJSONResponse(*room))
}

func leaveRoom(client *models.Client) {
	client.Room.Unregister <- client
	close(client.Send)
}
