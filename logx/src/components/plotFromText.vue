<template>
<v-container class='pa-1 ma-0'>
    <v-layout row v-if="filter.type.name=='timegraph'">
        <v-menu offset-y>
            <template v-slot:activator="{ on }">
                <v-btn :disabled="filterList.length==0" color="primary" dark v-on="on">
                    <v-icon small>add</v-icon>
                </v-btn>
            </template>
            <v-list>
                <v-list-tile class="ma-0 pa-0" v-for="(item, index) in filterList" :key="index" @click="AddMarker(item)">
                    <v-list-tile-title class="ma-0 pa-0">{{ item.value }}</v-list-tile-title>
                </v-list-tile>
            </v-list>
        </v-menu>
    </v-layout>
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
    props: ['lines', 'filter', 'filterList'],
    data: () => ({
        width: 0.5,
        value: [],
        divId: '',
        graphs: [],
        layout: {},
        timeFunc: null,
        minY:undefined
    }),
    methods: {
        AddMarker: function (item) {
            let model = this
            var trace2 = {
                x: [],
                y: [],
                mode: 'markers',
                type: 'scatter',
                name: item.value
            };

            this.lines.forEach(function (line) {
                try {
                    if (!line.toLowerCase().includes(item.value.toLowerCase())) {
                        return;
                    }

                    let retVal = model.timeFunc(line, true);
                    //console.log(time)
                    trace2.x.push(retVal.time);
                    trace2.y.push(model.minY);
                } catch {}
            })

            //model.graphs.push(trace2);
            //console.log(trace2)
            Plotly.addTraces(model.divId, trace2);
            Plotly.relayout(model.divId, {});

        }
    },
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
            name: model.filter.name
        };

        var func = new Function('line', 'returnTimeOnly', this.filter.text)
        model.timeFunc = new Function('line', 'returnTimeOnly', this.filter.text)
        //console.log('started')
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
                            if(model.minY == undefined || number<model.minY) model.minY = number
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
                    let val = func(line, false)
                    if (!val) {
                        return
                    }
                    if (!val.time || !val.value) {
                        return
                    }
                    let number = parseFloat(val.value)
                    if (!isNaN(number)) {
                        if(model.minY == undefined || number<model.minY) model.minY = number
                        trace1.x.push(val.time);
                        trace1.y.push(number);
                    }
                } catch {}
            })
        }

        loadScript('https://cdn.plot.ly/plotly-latest.min.js', function () {
            console.log('plot script loaded 1')

            var data = [trace1];

            model.layout = {
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
            //console.log(trace1)
            model.graphs = data;
            Plotly.newPlot(model.divId, model.graphs, model.layout, {
                showSendToCloud: false
            });

            if (model.filter.type.name == 'timegraph') {
                var myPlot = document.getElementById(model.divId);
                myPlot.on('plotly_click', function (data) {
                    var counter = 0
                    if (data.points.length == 0) {
                        return
                    }

                    let find = new Date(data.points[0].x);
                    console.log('start find of: ',find,data.points[0].x)
                    //find.setMilliseconds(0)
                    model.lines.forEach(function (line) {
                        let retVal = model.timeFunc(line, true);
                       
                        
                        if (retVal != null && retVal.time.getTime() === find.getTime()) {
                            //console.log('found line: ' + line + ' on line: ' + counter)
                            console.log('jump from graph',retVal.time)
                            EventBus.$emit('jumpto', {
                                value: counter,
                                source: 1,
                                showFiltered: true
                            })
                            return
                        }
                        counter++
                    })
                })
            }
        })

    }
}
</script>

<style>

</style>
