package api

import (
	"context"
	"errors"
	"livepaint/data"
	"livepaint/models"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

type contextKey int

const (
	authenticatedClientKey contextKey = 0
	tokenCookieName                   = "token"
)

type EnsureAuth struct {
	handler http.Handler
}

func getClient(r *http.Request) (*models.Client, error) {
	var client *models.Client
	tokenCookie, err := r.Cookie(tokenCookieName)
	if err != nil {
		return nil, errors.New("Missing token.")
	}
	client = data.Clients[tokenCookie.Value]
	if client == nil {
		return nil, errors.New("User doesn't exist.")
	}
	return client, nil
}

func GetCurrentClient(ctx context.Context) *models.Client {
	return ctx.Value(authenticatedClientKey).(*models.Client)
}

func (ea *EnsureAuth) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	client, err := getClient(r)
	if err != nil {
		http.Error(w, "Please sign-in", http.StatusUnauthorized)
		return
	}
	ctxWithClient := context.WithValue(r.Context(), authenticatedClientKey, client)
	rWithClient := r.Clone(ctxWithClient)
	ea.handler.ServeHTTP(w, rWithClient)
}

func EnsureAuthDecorator() MiddlewareDecorator {
	return func(handler http.Handler) http.Handler {
		return &EnsureAuth{handler: handler}
	}
}

func bakeToken() string {
	return uuid.NewString()
}

type RegisterHandler struct {
}

type RegisterRequest struct {
	Username string `json:"username"`
}

func (r *RegisterRequest) validate() error {
	maxUsernameLen := 32

	r.Username = strings.TrimSpace(r.Username)
	if r.Username == "" {
		return &malformedRequest{msg: "Username cannot be empty", status: http.StatusBadRequest}
	}
	if len(r.Username) > maxUsernameLen {
		return &malformedRequest{msg: "Username is too long", status: http.StatusBadRequest}
	}
	return nil
}

func (rh RegisterHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if client, _ := getClient(r); client != nil {
		http.Error(w, "Client already registered", http.StatusBadRequest)
		return
	}

	var registerRequest RegisterRequest
	if err := decodeJSONBody(w, r, &registerRequest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := registerRequest.validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	token := bakeToken()
	client := data.CreateClient(token, registerRequest.Username)
	tokenCookie := &http.Cookie{Name: tokenCookieName, Value: token}
	http.SetCookie(w, tokenCookie)
	writeJson(w, *client)
}

type MeHandler struct {
}

func (mh MeHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	client, err := getClient(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	writeJson(w, *client)
}
