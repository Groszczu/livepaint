package api

import (
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func ListenAndServe(addr *string) {
	e := echo.New()
	e.Validator = &CustomValidator{validator: validator.New()}
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowCredentials: true,
	}))
	e.Pre(middleware.AddTrailingSlash())
	e.Use(middleware.Logger())

	e.GET("/ws/", WsHandler, EnsureAuthenticatedClient)
	e.GET("/auth/me/", MeHandler, EnsureAuthenticatedClient)
	e.POST("/auth/session/", RegisterHandler)

	roomsGroup := e.Group("/rooms", EnsureAuthenticatedClient)
	roomsGroup.POST("/", CreateRoomHandler)
	roomsGroup.POST("/:id/join/", JoinRoomHandler)

	e.Logger.Fatal(e.Start(*addr))
}
