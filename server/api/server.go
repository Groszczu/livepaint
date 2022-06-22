package api

import (
	"github.com/go-playground/validator"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func ListenAndServe(port *string) {
	e := echo.New()
	e.Validator = &CustomValidator{validator: validator.New()}
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"https://livepaint.vercel.app"},
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
	roomsGroup.DELETE("/:id/leave/", LeaveRoomHandler)

	e.Logger.Fatal(e.Start(":" + *port))
}
