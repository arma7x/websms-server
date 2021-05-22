<!DOCTYPE html>

<html>
<head>
  <title>Beego</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">

  <style type="text/css">
    *,body {
      margin: 0px;
      padding: 0px;
    }

    body {
      margin: 0px;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 20px;
      background-color: #fff;
    }

    header,
    footer {
      width: 960px;
      margin-left: auto;
      margin-right: auto;
    }

    header {
      padding: 100px 0;
    }

    footer {
      line-height: 1.8;
      text-align: center;
      padding: 50px 0;
      color: #999;
    }

    .logo {
      text-align: center;
      font-size: 24px;
    }

    .description {
      text-align: center;
      font-size: 16px;
    }

    a {
      color: #444;
      text-decoration: none;
    }

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
</head>

<body>
  <header>
    <h1 class="logo">Welcome to Beego</h1>
    <div class="description">
      Beego is a simple & powerful Go web framework which is inspired by tornado and sinatra.
    </div>
  </header>
  <footer>
    <div class="author">
      <button onclick="subscribe()">Click</button>
      Official website:
      <a href="http://{{.Website}}">{{.Website}}</a> /
      Contact me:
      <a class="email" href="mailto:{{.Email}}">{{.Email}}</a>
      <p id="address"></p>
    </div>
  </footer>
  <div class="backdrop"></div>

  <script src="/static/js/crypto-js.min.js"></script>
  <script src="/static/js/ws.js"></script>
  <script>

    let swRegistration;
    const vapidPublicKey = 'BJ6Rlb2Fa88-cH6awnZO22d4DxvQ-nCLt_-itQcIPHO0mIfSSA921yCtCj7zyNd3OOyeOrp9Pf0Ole6_K2-6wTg';

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    }
    
    function subscribe() {
      swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
      .then(function(subscription) {
        const data = { subscription: JSON.stringify(subscription) }
        document.getElementById('address').textContent = "";
        document.getElementById('address').textContent = data.subscription;
        fetch('/push?title=Hello&body=World&subscription=' + data.subscription, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
      })
      .catch(err => console.error(err));
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/static/js/service-worker.js')
      .then(function(registration) {
        swRegistration = registration;
      })
      .catch(function(error) {
        console.error('Service Worker Error', error);
      });
    }
  </script>
</body>
</html>
