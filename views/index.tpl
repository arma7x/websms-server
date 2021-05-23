<!DOCTYPE html>

<html>
<head>
  <title>Beego</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">

  <style type="text/css">

    .backdrop {
      position: absolute;
      width: 100%;
      height: 100%;
      box-shadow: inset 0px 0px 100px #ddd;
      z-index: -1;
      top: 0px;
      left: 0px;
    }
  </style>
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
    <input tabIndex="0" id="title" type="text" placeholder="title" class="nav" style="margin:0 0 10px 0;"/>
    <input tabIndex="1" id="body" type="text" placeholder="body" class="nav" style="margin:0 0 10px 0;" maxlength="160" />
    <button class="trigger-push" onclick="triggerPushNotification()">Call to Push</button><br><br>
    <button class="trigger-push" onclick="subscribePushNotification()">SoftLeft to Sub</button><br><br>
    <textarea tabIndex="2" id="js-subscription-details" class="nav" rows="8" cols="18" readonly></textarea>
  </div>
  <div class="backdrop"></div>

  <script src="/static/js/helper.js"></script>
  <script src="/static/js/regenerator-runtime.js"></script>
  <script src="/static/js/idb.js"></script>
  <script src="/static/js/crypto-js.min.js"></script>
  <script src="/static/js/ws.js"></script>
  <script src="/static/js/app.js"></script>
</body>
</html>
