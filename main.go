package main

import (
	_ "websms/routers"
	"github.com/beego/beego/v2/server/web/context"
	beego "github.com/beego/beego/v2/server/web"
)

func main() {

	var corsCallback beego.FilterFunc

	corsCallback = func(ctx *context.Context) {
		ctx.ResponseWriter.Header().Add("Access-Control-Allow-Origin", "*")
		ctx.ResponseWriter.Header().Add("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Accept-Encoding, Accept-Language")
		ctx.ResponseWriter.Header().Add("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE, HEAD, OPTIONS")
	}

	beego.InsertFilter(
		"*",
		beego.BeforeRouter,
		corsCallback,
	)
	beego.Run()
}

