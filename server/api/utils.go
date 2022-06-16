package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type jsonResponse struct {
	Data any `json:"data"`
}

func newJSONResponse(data any) jsonResponse {
	return jsonResponse{
		Data: data,
	}
}

func bindValidate(c echo.Context, i any) error {
	if err := c.Bind(i); err != nil {
		return err
	}
	if err := c.Validate(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}
