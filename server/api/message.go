package api

import (
	"errors"
	"livepaint/models"
	"time"
)

type MessageType byte

const (
	MaxMessageSize = 65_535
	PongWait       = 60 * time.Second
	PingPeriod     = (PongWait * 9) / 10
	WriteWait      = 10 * time.Second
)

const (
	Undefined MessageType = 0

	DrawPath MessageType = 1
)

type IncomingMessage interface {
	process(*models.Client)
}

type baseIncomingMessage struct {
	rawBytes []byte
}

type DrawPathMessage struct {
	baseIncomingMessage
	color [3]byte
	x     uint16
	y     uint16
}

func (m DrawPathMessage) process(client *models.Client) {
	client.Room.Broadcast <- m.rawBytes
}

func unmarshal(bytes []byte) (IncomingMessage, error) {
	msgType := MessageType(bytes[0])

	switch msgType {
	case DrawPath:
		return DrawPathMessage{
			baseIncomingMessage: baseIncomingMessage{rawBytes: bytes},
		}, nil
	default:
		return nil, errors.New("Unsupported message type")
	}
}

type OutgoingMessage interface {
	marshal() []byte
}

func marshal(msgType MessageType, data []byte) []byte {
	bytes := make([]byte, len(data)+1)
	bytes[0] = byte(msgType)

	return append(bytes, data...)
}
