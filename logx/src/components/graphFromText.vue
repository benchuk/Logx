<template>
<v-container fluid>
    <v-sparkline :value="value" :line-width="width" auto-draw></v-sparkline>
</v-container>
</template>

<script>
export default {
    name: "graph-text",
    props: ['lines', 'func'],
    data: () => ({
      width: 2,
      value: []
    }),
    created(){
        var filter = new Function("line", this.func);

        this.lines.forEach(function(line) {
            try
            {
                let val = filter(line);
                if(val){
                    this.value.push(parseInt(val));
                }
            }
            catch
            {

            }
        }
        )
    }
}
</script>
