package api

import (
	"net/http"

	"livepaint/utils"
)

type MiddlewareDecorator func(handler http.Handler) http.Handler

type AllowMethod struct {
	methods []string
	handler http.Handler
}

func (am *AllowMethod) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !utils.Contains(am.methods, r.Method) {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	am.handler.ServeHTTP(w, r)
}

func AllowMethodDecorator(method string) MiddlewareDecorator {
	return AllowMethodsDecorator([]string{method})
}

func AllowMethodsDecorator(methods []string) MiddlewareDecorator {
	return func(handler http.Handler) http.Handler {
		return &AllowMethod{methods: methods, handler: handler}
	}
}

func Compose(handler http.Handler, middlewares ...MiddlewareDecorator) http.Handler {
	for _, middleware := range middlewares {
		handler = middleware(handler)
	}
	return handler
}
