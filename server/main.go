package main

import (
	"flag"
	"livepaint/api"
)

var port = flag.String("port", "8080", "http service port")

func main() {
	flag.Parse()

	api.ListenAndServe(port)
}
