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
      value: [0, 2, 5, 9, 5, 10, 3, 5, 0, 0, 1, 8, 2, 9, 0]
    })
}
</script>
