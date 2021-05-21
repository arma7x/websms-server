// {"type":"CONNECTED","content":"799523","to":0,"from":0}
var WEBSOCKET_ID;

function connectAsDesktop() {
  const ws = new WebSocket('ws://127.0.0.1:8080/ws');
  ws.onclose = () => {
    WEBSOCKET_ID = null;
    console.log('An event listener to be called when the connection is closed.');
  }
  ws.onerror = () => {
    console.log('An event listener to be called when an error occurs.');
  }
  ws.onmessage = (event) => {
    try {
      data = JSON.parse(event.data)
      switch (data.type) {
        case "CONNECTED":
          WEBSOCKET_ID = parseInt(data.content);
          break
        case "SYN":
          ws.send(JSON.stringify({"type":"SYN-ACK","content":"public_key","to":parseInt(data.from),"from":WEBSOCKET_ID}))
          break
        case "ACK":
          // decrypy data.content public_key(secret_key) && secret_key(push_endpoint)
          ws.send(JSON.stringify({"type":"RES","content":"true","to":parseInt(data.from),"from":WEBSOCKET_ID}))
          ws.close()
          break
      }
    } catch (e) {
      console.log(e);
    }
  }
  ws.onopen = () => {
    console.log('CONNECTED');
  }
}

function connectAsClient(DESKTOP_ID) {
  if (!DESKTOP_ID)
    return
  const ws = new WebSocket('ws://127.0.0.1:8080/ws');
  ws.onclose = () => {
    WEBSOCKET_ID = null;
    console.log('An event listener to be called when the connection is closed.');
  }
  ws.onerror = () => {
    console.log('An event listener to be called when an error occurs.');
  }
  ws.onmessage = (event) => {
    try {
      data = JSON.parse(event.data)
      switch (data.type) {
        case "CONNECTED":
          WEBSOCKET_ID = parseInt(data.content);
          ws.send(JSON.stringify({"type":"SYN","content":"","to":DESKTOP_ID,"from":WEBSOCKET_ID}))
          break
        case "SYN-ACK":
          var content = `${data.content}_(secret_key) secret_key(push_endpoint)`
          ws.send(JSON.stringify({"type":"ACK","content":content,"to":DESKTOP_ID,"from":WEBSOCKET_ID}))
          break
        case "RES":
          console.log(data.content);
          ws.close();
          break
      }
    } catch (e) {
      console.log(e);
    }
  }
  ws.onopen = () => {
    console.log('CONNECTED');
  }
}
