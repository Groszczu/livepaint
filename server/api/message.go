package api

import (
	"encoding/binary"
	"errors"
	"livepaint/data"
	"livepaint/models"
	"time"
)

type MessageType byte

const (
	MaxMessageSize = 256
	PongWait       = 60 * time.Second
	PingPeriod     = (PongWait * 9) / 10
	WriteWait      = 10 * time.Second
)

const (
	Undefined MessageType = 0

	CreateRoom MessageType = 1
	JoinRoom   MessageType = 2

	RoomCreated MessageType = 128
	ListClients MessageType = 129
)

type IncomingMessage interface {
	getTotalLength() uint16
	getType() MessageType
	process(*models.Client)
}

type CreateRoomMessage struct {
	totalLength uint16
}

func (m CreateRoomMessage) getType() MessageType {
	return CreateRoom
}

func (m CreateRoomMessage) getTotalLength() uint16 {
	return m.totalLength
}

func (m CreateRoomMessage) process(client *models.Client) {
	room := data.CreateRoom()
	data.Rooms[room.Id] = room
	go runRoom(room)
	client.Room = room
	client.Room.Register <- client

	clients := make([]*models.Client, len(room.Clients))
	i := 0
	for c := range room.Clients {
		clients[i] = c
		i++
	}
	client.Send <- ListClientsMessage{clients: clients}.marshal()
}

type JoinRoomMessage struct {
	totalLength uint16
	roomId      string
}

func (m JoinRoomMessage) getType() MessageType {
	return JoinRoom
}

func (m JoinRoomMessage) getTotalLength() uint16 {
	return m.totalLength
}

func (m JoinRoomMessage) process(client *models.Client) {
	room := data.Rooms[m.roomId]
	client.Room = room
	client.Room.Register <- client
}

func unmarshal(bytes []byte) (IncomingMessage, error) {
	msgType := MessageType(bytes[0])
	totalLength := binary.BigEndian.Uint16(bytes[1:3])
	// data := bytes[3:]

	switch msgType {
	case CreateRoom:
		return CreateRoomMessage{totalLength: totalLength}, nil
	default:
		return nil, errors.New("Unsupported message type")
	}
}

type OutgoingMessage interface {
	marshal() []byte
}

type ListClientsMessage struct {
	clients []*models.Client
}

func (m ListClientsMessage) marshal() []byte {
	data := make([]byte, 0)
	for _, c := range m.clients {
		data = append(append(data, []byte(c.Username)...), ' ')
	}
	return marshal(ListClients, data)
}

func marshal(msgType MessageType, data []byte) []byte {
	totalLength := uint16(3 + len(data))
	bytes := make([]byte, 3)
	bytes[0] = byte(msgType)
	binary.BigEndian.PutUint16(bytes[1:], totalLength)

	return append(bytes, data...)
}
