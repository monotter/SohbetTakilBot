import tls from 'node:tls'
import https from 'node:https'
import net from 'node:net'

function tlsConnect(options) {
  options.path = undefined;

  if (!options.servername && options.servername !== '') {
    options.servername = net.isIP(options.host) ? '' : options.host;
  }

  return tls.connect(options);
}

const opts = {
  protocolVersion: 13,
  maxPayload: 104857600,
  skipUTF8Validation: false,
  perMessageDeflate: true,
  followRedirects: false,
  maxRedirects: 10,
  handshakeTimeout: 30000,
  createConnection: tlsConnect,
  socketPath: undefined,
  hostname: undefined,
  protocol: undefined,
  timeout: 30000,
  method: "GET",
  host: "gateway.discord.gg",
  path: "/?v=10&encoding=json",
  port: 443,
  defaultPort: 443,
  headers: {
    Connection: "Upgrade",
    Upgrade: "websocket",
    "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits"
  }
}

https.request(opts)