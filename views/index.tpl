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
      <input id="title" type="text" placeholder="title" class="nav" style="margin:0 0 10px 0;"/>
      <input id="body" type="text" placeholder="body" class="nav" style="margin:0 0 10px 0;" maxlength="160" />
      <select name="type" id="type" style="margin:0 0 10px 0;">
        <option value="">Select type</option>
        <option value="1">Message</option>
        <option value="2">Whatsapp</option>
      </select>
      <select name="device" id="device" class="__server__ " style="margin:0 0 10px 0;">
        <option value="">Select device</option>
      </select>
    </div>

    <div class="__server__ container">
      <button style="margin-bottom:10px;" onclick="sendMessage(true)">Push To Client</button>
      <button style="margin-bottom:10px;" onclick="connectAsDesktop()">Connect As Desktop</button>
    </div>

    <div class="__client__ container">
      <button style="margin-bottom:10px;" onclick="sendMessage(false)">Push To Desktop</button>
      <button style="margin-bottom:10px;" onclick="connectToDesktop()">Connect To Desktop</button>
    </div>

    <div class="container">
      <textarea id="js-subscription-details" class="nav" rows="8" cols="18" readonly></textarea>
    </div>
  </div>

  <script src="/static/js/adapter-latest.js"></script>
  <script src="/static/js/helper.js"></script>
  <script src="/static/js/crypto-js.min.js"></script>
  <script src="/static/js/ws.js"></script>
  <script src="/static/js/app.js"></script>
</body>
</html>
