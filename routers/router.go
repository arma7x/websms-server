package routers

import (
  "encoding/json"
  "log"
  "websms/controllers"
  "github.com/beego/beego/v2/server/web/context"
  beego "github.com/beego/beego/v2/server/web"
  webpush "github.com/SherClockHolmes/webpush-go"
  "os"
  "fmt"
)

type Payload struct {
  Title string `json:"title"`
  Body  string `json:"body"`
}

func init() {
  beego.Any("/ws", func(ctx *context.Context) {
    controllers.HandleWebsocketRequest(ctx)
  })

  beego.Get("/push", func(ctx *context.Context) {
    subscription := ctx.Input.Query("subscription")
    sub := &webpush.Subscription{}
    json.Unmarshal([]byte(subscription), sub)

    var arr []string
    json.Unmarshal([]byte(ctx.Input.Query("body")), &arr);

    fmt.Println(string("\033[32m"), ctx.Input.Query("subscription"), ctx.Input.Query("title"), ctx.Input.Query("body"))

    exec := func(body string) {
      payload := &Payload{}
      payload.Title = "Title"
      if ctx.Input.Query("title") != "" {
        payload.Title = ctx.Input.Query("title")
      }
      payload.Body = body
      msg, _ := json.Marshal(payload)
      fmt.Println(string("\033[35m"), payload.Title, payload.Body)
      resp, err := webpush.SendNotification([]byte(msg), sub, &webpush.Options{
        Subscriber:      os.Getenv("VAPIDSubscriber"),
        VAPIDPublicKey:  os.Getenv("VAPIDPublicKey"),
        VAPIDPrivateKey: os.Getenv("VAPIDPrivateKey"),
        TTL:             60,
      })
      if err != nil {
        log.Println(err)
      } else {
        defer resp.Body.Close()
      }
    }

    for _, txt := range arr {
      go exec(txt);
    }

    ctx.Output.JSON(subscription, false, true)
  })

  beego.Router("/", &controllers.MainController{})
  beego.Router("/client", &controllers.MainController{})
}
