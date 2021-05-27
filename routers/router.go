package routers

import (
  "websms/controllers"
  "github.com/beego/beego/v2/server/web/context"
  beego "github.com/beego/beego/v2/server/web"
)

type Payload struct {
  Title string `json:"title"`
  Body  string `json:"body"`
}

func init() {
  
  beego.Any("/ws", func(ctx *context.Context) {
    controllers.HandleWebsocketRequest(ctx)
  })

  beego.Options("*", func(ctx *context.Context) {
    ctx.ResponseWriter.Header().Add("Access-Control-Allow-Origin", "*")
    ctx.ResponseWriter.Header().Add("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding, Accept-Language")
    ctx.ResponseWriter.Header().Add("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE, HEAD, OPTIONS")
    ctx.Output.JSON("{}", false, true)
  })

  beego.Router("/", &controllers.MainController{})
  beego.Router("/client", &controllers.MainController{})
}
