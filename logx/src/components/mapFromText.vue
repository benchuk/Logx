<template>
<v-container fluid>
    <div id="mapid"></div>
</v-container>
</template>

<script>
import { EventBus } from './event-bus.js'
export default {
  name: 'graph-text',
  props: ['lines', 'filter'],
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
    css('https://unpkg.com/leaflet@1.5.1/dist/leaflet.css', function() {
      console.log('style loaded')
    })

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

    loadScript('https://unpkg.com/leaflet@1.5.1/dist/leaflet.js', function() {
      console.log('map script loaded')
    })

    setTimeout(() => {
      console.log('loading map')
      var map = new L.Map('mapid')

      // create the tile layer with correct attribution
      var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      var osmAttrib =
        'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      var osm = new L.TileLayer(osmUrl, {
        minZoom: 8,
        maxZoom: 12,
        attribution: osmAttrib
      })

      // start the map in South-East England
      //map.setView(new L.LatLng(31.6, 34.7), 7)
      map.addLayer(osm)

      var filter = new Function('line', this.filter.text)
      console.log('started')

      console.log('loading map parse lines')
      let dataLine = []
      model.lines.forEach(function(line) {
        try {
          let val = filter(line)
          if (val) {
            //console.log(val)
            let coords = val.split(',')
            let lat = 0.0
            let lon = 0.0
            // console.log('lat', coords[0])
            // console.log('lon', coords[1])
            lat = parseFloat(coords[0])
            lon = parseFloat(coords[1])
            let pair = []
            pair.push(lat, lon)
            dataLine.push(pair)
            // var marker = L.marker([lat, lon]).addTo(map)
            // map.setView(new L.LatLng(coords[0], coords[1]), 7)
          }
        } catch {}
      })

      //var polygon = L.polygon(dataLine).addTo(map)
      var polyline = L.polyline(dataLine, { color: 'green', weight: 10 }).addTo(
        map
      )

      var onPolyClick = function(event) {
        //callFancyboxIframe('flrs.html')
        console.log(event)
        console.log(event.latlng.lat)
        console.log(event.latlng.lng)
        var counter = 0

        let find = Number(event.latlng.lat.toFixed(3))
        console.log('start find of: ' + find)
        model.lines.forEach(function(line) {
          if (line.includes(find)) {
            console.log('found line: ' + line + ' on line: ' + counter)
            EventBus.$emit('jumpto', {
              value: counter,
              source: 1,
              showFiltered: true
            })
            return
          }
          counter++
        })
      }

      polyline.on('click', onPolyClick)

      console.log('loading map parse lines ended')
      //map.setView(new L.LatLng(dataLine[0][0], dataLine[0][1]), 7)
      map.fitBounds(polyline.getBounds())
      var markerStart = L.marker(dataLine[0]).addTo(map)
      var markerEnd = L.marker(dataLine[dataLine.length - 1]).addTo(map)
    }, 500)
  }
}
</script>
<style>
#mapid {
  height: 480px;
}
</style>