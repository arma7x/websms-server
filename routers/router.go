package routers

import (
  "websms/controllers"
  "github.com/beego/beego/v2/server/web/context"
  beego "github.com/beego/beego/v2/server/web"
  "github.com/robertkrimen/otto"
  "net/http"
  "log"
  "io/ioutil"
  "regexp"
  "fmt"
)

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
  
  beego.Get("/decrypt", func(ctx *context.Context) {
    player := ctx.Input.Query("player")
    sig := ctx.Input.Query("sig")
    if resp, err := http.Get(player); err != nil {
      log.Println(err)
    } else {
      defer resp.Body.Close()
      if resp.StatusCode == http.StatusOK {
        bodyBytes, err := ioutil.ReadAll(resp.Body)
        if err != nil {
          ctx.Output.Body([]byte("Error"))
        } else {
          js := bodyBytes
          re := `\n[^.]+\.split\(""\);.+`
          child := regexp.MustCompile(re).Find(js)
          if child == nil {
            ctx.Output.Body([]byte("Error"))
            return
          }
          re = `\w+`
          childName := regexp.MustCompile(re).Find(child)
          if childName == nil {
            ctx.Output.Body([]byte("Error"))
            return
          }
          re = `;(\w+)`
          parentName := regexp.MustCompile(re).FindSubmatch(child)
          if parentName == nil {
            ctx.Output.Body([]byte("Error"))
            return
          }
          re = fmt.Sprintf(`var %s=.+\n.+\n[^}]+}};`, parentName[1])
          parent := regexp.MustCompile(re).Find(js)
          if parent == nil {
            ctx.Output.Body([]byte("Error"))
            return
          }
          vm := otto.New()
          if _, err := vm.Run(string(parent) + string(child)); err != nil {
            ctx.Output.Body([]byte("Error"))
          } else {
            sig, err := vm.Call(string(childName), nil, sig)
            if err == nil {
              ctx.Output.Body([]byte(sig.String()))
            }
          }
        }
      }
    }
  })

  beego.Router("/", &controllers.MainController{})
  beego.Router("/client", &controllers.MainController{})
}
