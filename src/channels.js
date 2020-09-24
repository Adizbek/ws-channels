/**
 * @typedef ChannelOptions
 * @property {number} reconnectInterval
 */

/**
 * Channel class.
 *
 * @constructor
 * @param {String} url.
 * @param {ChannelOptions} options
 */
export function Channel (url, options) {
  this.listeners = {}
  this.connected = false
  this.reconnectInterval = 5000
  this.url = url

  if (Number.isInteger(options.reconnectInterval) > options.reconnectInterval > 0) {
    this.reconnectInterval = options.reconnectInterval
  }

  this.connect()
}

Channel.prototype.connect = function () {
  console.log('Trying to connect')

  this.websocket = new WebSocket(this.url)

  this.websocket.onopen = (event) => {
    console.log('Connection established')

    this._connectionState(true)
  }

  this.websocket.onclose = (event) => {
    console.log('Connection closed')

    this._connectionState(false)

    setTimeout(() => {
      console.log('Reconnecting...')

      this.connect()
    }, this.reconnectInterval)
  }

  this.websocket.onmessage = (event) => {
    let { event: type, payload } = JSON.parse(event.data)

    this.newMessage(type, payload)
  }

  this.websocket.onerror = (event) => {
    console.log(event)
    this.websocket.close()
  }
}

Channel.prototype.newMessage = function (type, payload) {
  if (Array.isArray(this.listeners[type])) {
    for (let handler of this.listeners[type]) {
      handler(payload)
    }
  }
}

Channel.prototype.send = function (payload) {
  this.websocket.send(JSON.stringify(payload))
}

/**
 * @param {string} event
 * @param {object} payload
 */
Channel.prototype.sendEvent = function (event, payload = {}) {
  this.send({
    event,
    payload
  })
}

Channel.prototype.$on = function (eventName, handler) {
  if (!Array.isArray(this.listeners[eventName])) {
    this.listeners[eventName] = []
  }

  this.listeners[eventName].push(handler)
}

Channel.prototype.$off = function (eventName, handler) {
  if (!Array.isArray(this.listeners[eventName])) {
    this.listeners[eventName] = []
  }

  this.listeners[eventName] = this.listeners[eventName].filter(x => x !== handler)
}

Channel.prototype.afterConnect = function (cb) {
  if (this.connected === true) {
    cb()
  } else {
    let timer = setInterval(() => {
      if (this.connected === true) {
        clearInterval(timer)
        cb()
      }
    }, 50)
  }
}

Channel.prototype._connectionState = function (state) {
  this.connected = state

  if (state === true) {
    this.newMessage('connected')
  } else {
    this.newMessage('disconnected')
  }
}
