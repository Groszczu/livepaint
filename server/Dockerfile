# syntax=docker/dockerfile:1

FROM golang:1.18-alpine

WORKDIR /app
COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY *.go ./
COPY data ./data
COPY models ./models
COPY utils ./utils
COPY api ./api

RUN go build -o /livepaint

EXPOSE 80

CMD [ "/livepaint", "-port", "80" ]