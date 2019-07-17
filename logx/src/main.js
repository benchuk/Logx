import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
Vue.config.productionTip = false

Vue.use({
  install: function(Vue, options){
      Vue.prototype.$jQuery = require('jquery'); // you'll have this.$jQuery anywhere in your vue project
  }})

new Vue({
  render: h => h(App),
}).$mount('#app')

