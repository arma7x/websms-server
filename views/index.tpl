<!DOCTYPE html>

<html>
<head>
  <title>WebSMS</title>
  <meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <link rel="stylesheet" href="/static/css/style.css">
</head>

<body>
  <header>
    <h1 class="logo">Welcome to WebSMS</h1>
    <div class="description">
      Beego is a simple & powerful Go web framework which is inspired by tornado and sinatra.
    </div>
  </header>
  <div class="container" style="padding:10px;">
    <div>SERVER ID: <span id="server_id"></span></div>
    <div>CLIENT ID: <span id="client_id"></span></div>
    <input tabIndex="0" id="title" type="text" placeholder="title" class="nav" style="margin:0 0 10px 0;"/>
    <input tabIndex="1" id="body" type="text" placeholder="body" class="nav" style="margin:0 0 10px 0;" maxlength="160" />
    <div>
      <button style="margin-bottom:10px;" onclick="triggerPushNotification()">Call to Push</button>
      <button style="margin-bottom:10px;" onclick="subscribePushNotification()">SoftLeft to Sub</button>
      <button style="margin-bottom:10px;" onclick="unsubscribePushNotification()">SoftRight to Unsub</button>
      <button style="margin-bottom:10px;" onclick="connectAsDesktop()">Connect As Desktop</button>
      <button style="margin-bottom:10px;" onclick="connectToDesktop()">Connect To Desktop</button>
    </div>
    <textarea tabIndex="2" id="js-subscription-details" class="nav" rows="8" cols="18" readonly></textarea>
  </div>

  <script src="/static/js/helper.js"></script>
  <script src="/static/js/regenerator-runtime.js"></script>
  <script src="/static/js/idb.js"></script>
  <script src="/static/js/crypto-js.min.js"></script>
  <script src="/static/js/ws.js"></script>
  <script src="/static/js/app.js"></script>
</body>
</html>
