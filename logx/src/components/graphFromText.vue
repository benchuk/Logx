<template>
<v-container fluid>
    <v-sparkline :gradient="['#f72047', '#ffd200', '#1feaea']" :value="value" :line-width="width"  padding="15" auto-draw></v-sparkline>
</v-container>
</template>

<script>
export default {
  name: 'graph-text',
  props: ['lines', 'func'],
  data: () => ({
    width: 0.5,
    value: []
  }),
  created() {
    var filter = new Function('line', this.func)
    console.log('started')
    let that = this
    this.lines.forEach(function(line) {
      try {
        let val = filter(line)
        if (val) {
          let number = parseFloat(val)
          if (!isNaN(number)) {
            that.value.push(number)
          }
        }
      } catch {}
    })
    console.log('done')
    console.log('done ' + this.value.length)
    console.log(this.value)
  }
}
</script>
