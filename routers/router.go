package routers

import (
  "encoding/json"
  "log"
  "websms/controllers"
  "github.com/beego/beego/v2/server/web/context"
  beego "github.com/beego/beego/v2/server/web"
  webpush "github.com/SherClockHolmes/webpush-go"
  "os"
)

type Payload struct {
  Title string `json:"title"`
  Body  []string `json:"body"`
}

func init() {
  beego.Any("/ws", func(ctx *context.Context) {
    controllers.HandleWebsocketRequest(ctx)
  })

  beego.Get("/push", func(ctx *context.Context) {
    subscription := ctx.Input.Query("subscription")
    s := &webpush.Subscription{}
    json.Unmarshal([]byte(subscription), s)

    payload := &Payload{}
    payload.Title = "Title"
    if ctx.Input.Query("title") != "" {
      payload.Title = ctx.Input.Query("title")
    }
    payload.Body = []string{}
    if ctx.Input.Query("body") != "" {
      var arr []string
      if err := json.Unmarshal([]byte(ctx.Input.Query("body")), &arr); err == nil {
        payload.Body = arr
      }
    }
    msg, _ := json.Marshal(payload)

    resp, err := webpush.SendNotification([]byte(msg), s, &webpush.Options{
      Subscriber:      os.Getenv("VAPIDSubscriber"),
      VAPIDPublicKey:  os.Getenv("VAPIDPublicKey"),
      VAPIDPrivateKey: os.Getenv("VAPIDPrivateKey"),
      TTL:             60,
    })
    if err != nil {
      log.Println(err)
    } else {
      resp.Body.Close()
    }

    ctx.Output.Body([]byte(subscription))
  })

  beego.Router("/", &controllers.MainController{})
}
