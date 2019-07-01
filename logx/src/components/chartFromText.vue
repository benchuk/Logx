<template>
<v-container fluid>
    <canvas id="myChart" width="400" height="200"></canvas>
</v-container>
</template>

<script>
import { EventBus } from './event-bus.js'
export default {
  name: 'chart-text',
  props: ['lines', 'func'],
  data: () => ({
    width: 0.5,
    value: []
  }),
  created() {
    let model = this

    var css = function(url, callback) {
      var head = document.getElementsByTagName('head')[0]
      var cssnode = document.createElement('link')

      cssnode.type = 'text/css'
      cssnode.rel = 'stylesheet'
      cssnode.href = url

      cssnode.onreadystatechange = callback
      cssnode.onload = callback

      head.appendChild(cssnode)
    }
    // css('https://unpkg.com/leaflet@1.5.1/dist/leaflet.css', function() {
    //   console.log('style loaded')
    // })

    function loadScript(url, callback) {
      // adding the script tag to the head as suggested before
      var head = document.getElementsByTagName('head')[0]
      var script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = url

      // then bind the event to the callback function
      // there are several events for cross browser compatibility
      script.onreadystatechange = callback
      script.onload = callback

      // fire the loading
      head.appendChild(script)
    }

    // loadScript(
    //   'https://cdn.jsdelivr.net/npm/chart.js@2.8.0/dist/Chart.min.js',
    //   function() {
    //     console.log('map script loaded')
    //   }
    // )

    loadScript('https://cdn.jsdelivr.net/npm/chart.js@2.8.0', function() {
      console.log('chart script loaded 1')
      loadScript('https://cdn.jsdelivr.net/npm/hammerjs@2.0.8', function() {
        console.log('chart script loaded 2')
        loadScript(
          'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@0.7.0',
          function() {
            console.log('chart script loaded 3')
          }
        )
      })
    })

    var filter = new Function('line', this.func)
    console.log('started')
    model.lines.forEach(function(line) {
      try {
        let val = filter(line)
        if (val) {
          let number = parseFloat(val)
          if (!isNaN(number)) {
            //console.log('number: ' + number)
            model.value.push(number)
          }
        }
      } catch {}
    })

    var zoomAndPan = {
      zoom: {
        // Container for pan options
        pan: {
          // Boolean to enable panning
          enabled: true,

          // Panning directions. Remove the appropriate direction to disable
          // Eg. 'y' would only allow panning in the y direction
          mode: 'xy',
          rangeMin: {
            // Format of min pan range depends on scale type
            x: null,
            y: null
          },
          rangeMax: {
            // Format of max pan range depends on scale type
            x: null,
            y: null
          },
          // Function called once panning is completed
          // Useful for dynamic data loading
          onPan: function({ chart }) {
            console.log(`I was panned!!!`)
          }
        },

        // Container for zoom options
        zoom: {
          // Boolean to enable zooming
          enabled: true,

          // Enable drag-to-zoom behavior
          drag: true,

          // Drag-to-zoom rectangle style can be customized
          // drag: {
          // 	 borderColor: 'rgba(225,225,225,0.3)'
          // 	 borderWidth: 5,
          // 	 backgroundColor: 'rgb(225,225,225)'
          // },

          // Zooming directions. Remove the appropriate direction to disable
          // Eg. 'y' would only allow zooming in the y direction
          mode: 'xy',

          rangeMin: {
            // Format of min zoom range depends on scale type
            x: null,
            y: null
          },
          rangeMax: {
            // Format of max zoom range depends on scale type
            x: null,
            y: null
          },

          // Speed of zoom via mouse wheel
          // (percentage of zoom on a wheel event)
          speed: 0.1,

          // Function called once zooming is completed
          // Useful for dynamic data loading
          onZoom: function({ chart }) {
            console.log(`I was zoomed!!!`)
          }
        }
      }
    }
    setTimeout(() => {
      var ctx = document.getElementById('myChart').getContext('2d')
      var chart = new Chart(ctx, {
        plugins: zoomAndPan,
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
          labels: model.value,
          datasets: [
            {
              label: 'speed',

              borderColor: 'rgb(255, 99, 255)',
              data: model.value
            }
          ]
        },

        // Configuration options go here
        options: {
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true
                }
              }
            ]
          },
          // Container for pan options
          pan: {
            // Boolean to enable panning
            enabled: true,

            // Panning directions. Remove the appropriate direction to disable
            // Eg. 'y' would only allow panning in the y direction
            mode: 'xy'
          },

          // Container for zoom options
          zoom: {
            // Boolean to enable zooming
            enabled: true,

            // Zooming directions. Remove the appropriate direction to disable
            // Eg. 'y' would only allow zooming in the y direction
            mode: 'xy'
          }
        }
      })

      console.log('ended')
    }, 1500)
  }
}
</script>

<style>
#mapid {
  height: 480px;
}
</style>
