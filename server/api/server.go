package api

import (
	"log"
	"net/http"
	"os"
)

func ListenAndServe(addr *string) {
	mux := http.NewServeMux()

	mux.Handle("/ws", AllowMethodDecorator(http.MethodGet)(WsHandler{}))
	mux.Handle("/auth/me", AllowMethodDecorator(http.MethodGet)(MeHandler{}))
	mux.Handle("/auth/register", AllowMethodDecorator(http.MethodPost)(RegisterHandler{}))

	logger := log.New(os.Stdout, "server: ", log.Lshortfile)
	wrappedMux := LoggerDecorator(logger)(mux)

	logger.Printf("Starting listener on http://%v\n", *addr)
	logger.Fatal(http.ListenAndServe(*addr, wrappedMux))
}
