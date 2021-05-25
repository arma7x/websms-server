package routers

import (
  "encoding/json"
  // "log"
  "websms/controllers"
  "github.com/beego/beego/v2/server/web/context"
  beego "github.com/beego/beego/v2/server/web"
  // webpush "github.com/SherClockHolmes/webpush-go"
  "os"
  "fmt"
  "net/http"
  "bytes"
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
    publicVapidKey := os.Getenv("VAPIDPublicKey")
    privateVapidKey := os.Getenv("VAPIDPrivateKey")
    encoding := "aesgcm"
    subscription := ctx.Input.Query("subscription")

    var arr []string
    json.Unmarshal([]byte(ctx.Input.Query("body")), &arr);

    exec := func(body string) {
      payload := &Payload{}
      payload.Title = "Title"
      if ctx.Input.Query("title") != "" {
        payload.Title = ctx.Input.Query("title")
      }
      payload.Body = body
      msg, _ := json.Marshal(payload)

      message := map[string]interface{} {
        "publicVapidKey": publicVapidKey,
        "privateVapidKey": privateVapidKey,
        "encoding": encoding,
        "payload": string(msg),
        "subscription": subscription,
      }

      bytesRepresentation, err := json.Marshal(message)
      if err != nil {
        fmt.Println(err)
      }

      resp, err := http.Post("https://kai-push-notification.herokuapp.com/push", "application/json", bytes.NewBuffer(bytesRepresentation))
      defer resp.Body.Close()
      if err != nil {
        fmt.Println(err)
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
