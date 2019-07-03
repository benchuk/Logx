<template>
<v-container fluid>
    <div id="myPlot"></div>
</v-container>
</template>

<script>
import {
    EventBus
} from './event-bus.js'
import {
    setTimeout
} from 'timers';
export default {
    name: 'chart-text',
    props: ['lines', 'func'],
    data: () => ({
        width: 0.5,
        value: []
    }),
    created() {
        let model = this

        var css = function (url, callback) {
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

            var trace1 = {
                x: [],
                y: [],
                type: 'scatter',
            };
        var filter = new Function('line', this.func)
        console.log('started')
        let that = this
        let counter = 1
        this.lines.forEach(function (line) {
            try {
                let val = filter(line)
                if (val) {
                    let number = parseFloat(val)
                    if (!isNaN(number)) {
                        trace1.x.push(counter);
                        counter++
                        trace1.y.push(number);
                    }
                }
            } catch {}
        })

        loadScript('https://cdn.plot.ly/plotly-latest.min.js', function () {
            console.log('plot script loaded 1')
           

            var data = [trace1];

var layout = {
    plot_bgcolor:"white",
    paper_bgcolor:"white",
  title: 'Title of the Graph',
  xaxis: {
    title: 'x-axis title'
  },
  yaxis: {
    title: 'y-axis title'
  }
};
            Plotly.newPlot('myPlot', data, layout, {
                showSendToCloud: false
            });
        })

    }
}
</script>

<style>

</style>
