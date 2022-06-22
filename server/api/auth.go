package api

import (
	"livepaint/data"
	"livepaint/models"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type contextKey int

const (
	authenticatedClientKey contextKey = 0
	tokenCookieName                   = "token"
)

type AuthenticatedContext struct {
	echo.Context
	client *models.Client
}

func EnsureAuthenticatedClient(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		client, err := getClient(c)
		if err != nil {
			return err
		}
		return next(&AuthenticatedContext{c, client})
	}
}

func getClient(c echo.Context) (*models.Client, error) {
	tokenCookie, err := c.Cookie(tokenCookieName)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Missing token")
	}
	client := data.Clients[tokenCookie.Value]
	if client == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Invalid token")
	}
	return client, nil
}

func bakeToken() string {
	return uuid.NewString()
}

type RegisterRequest struct {
	Username string `json:"username" validate:"required,max=32"`
}

func RegisterHandler(c echo.Context) error {
	if client, _ := getClient(c); client != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Client already registered")
	}
	registerRequest := new(RegisterRequest)
	if err := bindValidate(c, registerRequest); err != nil {
		return err
	}
	token := bakeToken()
	client := data.CreateClient(token, registerRequest.Username)
	tokenCookie := new(http.Cookie)
	tokenCookie.Name = tokenCookieName
	tokenCookie.Value = token
	tokenCookie.Expires = time.Now().Add(24 * time.Hour)
	tokenCookie.HttpOnly = true
	tokenCookie.Secure = false
	tokenCookie.Path = "/"
	tokenCookie.Domain = "livepaintapp.azurewebsites.net"
	tokenCookie.SameSite = http.SameSiteLaxMode
	c.SetCookie(tokenCookie)
	return c.JSON(http.StatusCreated, newJSONResponse(*client))
}

func MeHandler(c echo.Context) error {
	ac := c.(*AuthenticatedContext)

	return c.JSON(http.StatusOK, newJSONResponse(*ac.client))
}
