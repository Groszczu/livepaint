package main

import (
	"flag"
	"livepaint/api"
)

var addr = flag.String("addr", "localhost:8080", "http service address")

func main() {
	api.ListenAndServe(addr)
}
