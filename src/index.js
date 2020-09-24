import { Channel } from './channels'

export let $channel = null

export const ChannelsVuePlugin = {

  /**
   * @param {App|*} app
   * @param {object} options
   * @param {string} options.url
   * @param {ChannelOptions} options.wsOptions
   */
  install (app, options) {
    $channel = new Channel(options.url, options.wsOptions || {})

    if (app.version.startsWith('3') && app.config.globalProperties) {
      app.config.globalProperties.$ws = $channel
    } else if (app.config && !app.config.globalProperties) {
      app.prototype.$ws = $channel
    } else {
      console.warn('Channels can not install vue plugin')
    }
  }

}
