package routers

import (
	"websms/controllers"
  "github.com/beego/beego/v2/server/web/context"
	beego "github.com/beego/beego/v2/server/web"
)

func init() {
    beego.Any("/ws", func(ctx *context.Context) {
      controllers.HandleWebsocketRequest(ctx)
    })
    beego.Router("/", &controllers.MainController{})
}
