import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [{
      path: '/',
      name: 'logx_main-page',
      component: require('@/components/LogXmain').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})