<!DOCTYPE html>

<html>
<head>
  <title>KaiOS WebSMS</title>
  <meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <link rel="stylesheet" href="/static/css/style.css">
  <script>
    const ISCLIENT = {{ .isClient }}
  </script>
</head>

<body>
  <header>
    <h1 class="logo">Welcome to KaiOS WebSMS</h1>
    <div class="description">
      Write SMS on browser
    </div>
  </header>
  <div class="container" style="padding:10px;">

    <div class="__server__">SERVER ID: <span id="server_id"></span></div>
    <div class="__client__">CLIENT ID: <span id="client_id"></span></div>

    <div class="container">
      <input id="body" type="text" placeholder="body" class="nav" style="margin:0 0 10px 0;" maxlength="160" />
    </div>

    <button style="margin-bottom:10px;" onclick="sendMessage()">Push To Client</button>
    <div class="__server__ container">
      <button style="margin-bottom:10px;" onclick="_connectAsHost()">Connect As Desktop</button>
    </div>

    <div class="__client__ container">
      <button style="margin-bottom:10px;" onclick="connectToDesktop()">Connect To Desktop</button>
    </div>

    <div class="container">
      <textarea id="js-subscription-details" class="nav" rows="8" cols="18" readonly></textarea>
    </div>
  </div>

  <script src="/static/js/simplepeer.min.js"></script>
  <script src="/static/js/helper.js"></script>
  <script src="/static/js/crypto-js.min.js"></script>
  <script src="/static/js/ws.js"></script>
  <script src="/static/js/app.js"></script>
</body>
</html>
