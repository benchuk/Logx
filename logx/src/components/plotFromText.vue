<template>
<v-container fluid>
    <div :id="divId"></div>
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
    props: ['lines', 'filter'],
    data: () => ({
        width: 0.5,
        value: [],
        divId: ''
    }),
    created() {
        let model = this
        model.divId = Math.random().toString(36).substring(7);
        console.log('new graph with id ' + model.divId)

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

        var trace1 = {
            x: [],
            y: [],
            type: 'scatter',
        };
        var func = new Function('line', this.filter.text)
        console.log('started')
        let title = ''
        if (model.filter.type.name == 'graph') {
            title = 'samples'
            let counter = 1
            this.lines.forEach(function (line) {
                try {
                    let val = func(line)
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
        } else {
            title = 'time'
            this.lines.forEach(function (line) {
                try {
                    let val = func(line)
                    if (!val) {
                        return
                    }
                    if(!val.time || !val.value){
                        return
                    }
                    let number = parseFloat(val.value)
                    if (!isNaN(number)) {
                        trace1.x.push(val.time);
                        trace1.y.push(number);
                    }
                } catch {}
            })
        }

        loadScript('https://cdn.plot.ly/plotly-latest.min.js', function () {
            console.log('plot script loaded 1')

            var data = [trace1];

            var layout = {
                plot_bgcolor: "white",
                paper_bgcolor: "white",
                title: model.filter.name + ' graph',
                yaxis: {
                    title: model.filter.name
                },
                xaxis: {
                    title: title
                }
            };
            Plotly.newPlot(model.divId, data, layout, {
                showSendToCloud: false
            });
        })

    }
}
</script>

<style>

</style>
