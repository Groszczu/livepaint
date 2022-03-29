package api

import (
	"log"
	"net/http"
	"time"
)

type Logger struct {
	logger  *log.Logger
	handler http.Handler
}

func (l *Logger) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	l.handler.ServeHTTP(w, r)
	log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(startTime))
}

func LoggerDecorator(logger *log.Logger) MiddlewareDecorator {
	return func(handler http.Handler) http.Handler {
		return &Logger{logger: logger, handler: handler}
	}
}
