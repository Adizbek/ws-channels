/**
 * @typedef ChannelOptions
 * @property {number} reconnectInterval
 */

export class Channel {

  /** @type {string} */
  url

  /** @typedef {WebSocket} */
  websocket

  connected = false

  listeners = {}

  reconnectInterval = 5000

  /**
   * @param {string} url
   * @param {ChannelOptions} options
   */
  constructor (url, options = {}) {
    this.url = url
    this.connect()

    if (Number.isInteger(options.reconnectInterval) > options.reconnectInterval > 0) {
      this.reconnectInterval = options.reconnectInterval
    }
  }

  connect () {
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

  newMessage (type, payload) {
    if (Array.isArray(this.listeners[type])) {
      for (let handler of this.listeners[type]) {
        handler(payload)
      }
    }
  }

  send (payload) {
    this.websocket.send(JSON.stringify(payload))
  }

  /**
   * @param {string} event
   * @param {object} payload
   */
  sendEvent (event, payload = {}) {
    this.send({
      event,
      payload
    })
  }

  $on (eventName, handler) {
    if (!Array.isArray(this.listeners[eventName])) {
      this.listeners[eventName] = []
    }

    this.listeners[eventName].push(handler)
  }

  $off (eventName, handler) {
    if (!Array.isArray(this.listeners[eventName])) {
      this.listeners[eventName] = []
    }

    this.listeners[eventName] = this.listeners[eventName].filter(x => x !== handler)
  }

  afterConnect (cb) {
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

  _connectionState (state) {
    this.connected = state

    if (state === true) {
      this.newMessage('connected')
    } else {
      this.newMessage('disconnected')
    }
  }
}

export class ChannelsVuePlugin {

  /**
   * @param {App|*} app
   * @param {object} options
   * @param {string} options.url
   * @param {ChannelOptions} options.wsOptions
   */
  install (app, options) {
    if (app.version.startsWith('3') && app.config.globalProperties) {
      app.config.globalProperties.$ws = new Channel(options.url, options.wsOptions)
    } else if (app.config && !app.config.globalProperties) {
      app.prototype.$ws = new Channel(options.url, options.wsOptions)
    } else {
      console.warn('Channels can not install vue plugin')
    }
  }

}
