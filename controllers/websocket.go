package controllers

import (
	"encoding/json"
	"math/rand"
	"errors"
	"net/http"
	"log"
	"github.com/gorilla/websocket"
	"github.com/beego/beego/v2/server/web/context"
	"io"
	"strconv"
)

var (
	message = make(chan Message)
	clients = make(map[int]*websocket.Conn)
	connected = make(chan *websocket.Conn)
	disconnected = make(chan *websocket.Conn)
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func init() {
	go listening()
}

type Message struct {
	Type			string	`json:"type"`
	Content		string	`json:"content"`
	To				int			`json:"to"`
	From			int			`json:"from"`
}

func (m *Message) Stringify() (_string []byte, err error) {
	return json.Marshal(m)
}

func validateMessage(data []byte) (Message, error) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return msg, errors.New("Error unmarshaling message")
	}
	return msg, nil
}

func rangeIn(low, hi int) int {
	return low + rand.Intn(hi-low)
}

func genClientID() int {
	id := rangeIn(100000, 999999);
	if _, ok := clients[id]; ok {
		return genClientID()
	}
	return id
}

func getClientID(c *websocket.Conn) int {
	var id int
	for k, v := range clients {
		if v == c {
			id = k
			break
		}
	}
	return id
}

func Connected(ws *websocket.Conn) {
	connected <- ws
}

func Disconnected(ws *websocket.Conn) {
	disconnected <- ws
}

func listening() {
	for {
		select {
			case conn := <- connected:
				id := genClientID()
				clients[id] = conn
				msg := Message{"CONNECTED", strconv.Itoa(id), 0, 0}
				if msg_txt, err := json.Marshal(msg); err == nil {
					conn.WriteMessage(websocket.TextMessage, msg_txt)
				}
				break
			case conn := <- disconnected:
				delete(clients, getClientID(conn))
				break
			case msg := <- message:
				switch (msg.Type) {
					case "TEST":
						fallthrough
					case "SYN":
						fallthrough
					case "SYN-ACK":
						fallthrough
					case "ACK":
						fallthrough
					case "RES":
						conn, ok := clients[msg.To]
						if ok {
							if msg_txt, err := json.Marshal(msg); err == nil {
								conn.WriteMessage(websocket.TextMessage, msg_txt)
							}
						}
						break
				}
				break
		}
	}
}

func HandleWebsocketRequest (ctx *context.Context) {

	if ctx.Request.Method != "GET" {
		http.Error(ctx.ResponseWriter, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	ws, err := upgrader.Upgrade(ctx.ResponseWriter, ctx.Request, nil)
	if _, ok := err.(websocket.HandshakeError); ok {
		http.Error(ctx.ResponseWriter, "Not a websocket handshake", 400)
		return
	} else if err != nil {
		log.Println("Cannot setup WebSocket connection:", err)
		return
	}

	Connected(ws)
	defer Disconnected(ws)

	// Message receive loop.
	for {
		mt, data, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway) || err == io.EOF {
				log.Println(err)
				break
			}
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println(err)
				break
			}
			log.Println("Error reading websocket message", err)
			break
		}
		
		switch mt {
			case websocket.TextMessage:
				if msg, err := validateMessage(data); err == nil {
					msg.From = getClientID(ws) //override from client
					message <- msg
				}
				break
			default:
				log.Println("Unknown Error!")
				break
		}
	}
}

// type    CONNECTED
// content ID
// to		-> Desktop
// from -> KaiOS

// type    SYN
// content
// to		-> Desktop
// from -> KaiOS

// type    SYN-ACK
// content public_key
// to		-> KaiOS
// from	-> Desktop

// type    ACK
// content public_key(secret_key) && secret_key(push_endpoint)
// to		-> Desktop
// from -> KaiOS

// type    RES
// content true OR false
// to		-> Desktop
// from -> KaiOS

