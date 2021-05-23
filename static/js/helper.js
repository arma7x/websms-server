function dec2hex(dec) {
  return dec.toString(16).padStart(2, "0");
}

function generateId(len) {
  var arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join('');
}

function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function splitSMS(text, type) {
  const id = generateId(10);
  const max = 183;
  const len = text.length;
  const n = Math.floor(len / max);
  const l = len % max;
  const e = l > 0 ? n + 1 : n;
  var fragments = [];
  var x = 0;
  for (x=0;x<n;x++) {
    var s = x * max;
    fragments.push(`${id} ${x+1} ${e} ${type} ${text.slice(s, s + max)}`);
  }
  if (l > 0) {
    var s = x * max;
    fragments.push(`${id} ${x+1} ${e} ${type} ${text.slice(s)}`);
  }
  return fragments
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
