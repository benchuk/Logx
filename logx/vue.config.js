const webpack = require('webpack')
module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jquery: 'jquery',
        'window.jQuery': 'jquery',
        jQuery: 'jquery'
      })
    ]
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        mac: {
          target: ['zip', 'dir']  // Skip DMG to avoid python dependency
        }
      }
    }
  }
}