package initilize

import (
	beego "github.com/beego/beego/v2/server/web"
	"os"
)

func init() {
	SERVER_ENV := os.Getenv("RUN_MODE")
	if SERVER_ENV != "" {
		beego.AppConfig.Set("runmode", SERVER_ENV)
	} else {
		beego.AppConfig.Set("runmode", "prod")
	}
}
