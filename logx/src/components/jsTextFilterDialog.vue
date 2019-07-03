<template>
<v-layout>
    <v-dialog v-model="show" max-width="70%" persistent>
        <v-card>
            <v-container v-if="jsTextFilters.length>0" class="ma-0 pa-0">
                <v-tabs v-model="active" dark slider-color="yellow">
                    <v-tab v-for="(f,index) in jsTextFilters" :key="index" ripple>
                        <v-btn class="ml-0 pl-0" fab flat small v-on:click="RemoveFilter(index)">
                            <v-icon dark color="grey">close</v-icon>
                        </v-btn>
                        {{ getTabText(f.name) }}
                    </v-tab>
                    <v-tab-item v-for="(f,index) in jsTextFilters" :key="index">
                        <jsTextFilter :editable="true" :filter='f' :types='types'></jsTextFilter>
                    </v-tab-item>
                </v-tabs>
            </v-container>
            <v-container v-else>
                <v-subheader>No Filters. Click the Add button to begin</v-subheader>
            </v-container>
            <v-card-actions class="pa-0 ma-1">
                <v-btn :disabled="HasInvalidFilters" color="primary" flat @click="AddFilter">Add</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="HasInvalidFilters" color="primary" flat @click.stop="show=false">Save & Close</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</v-layout>
</template>

<script>
import jsTextFilter from './jsTextFilter'

export default {
  props: ['visible', 'jsTextFilters', 'types'],
  components: {
    jsTextFilter
  },
  data() {
    return {
      active: null
    }
  },

  mounted() {},
  computed: {
    show: {
      get() {
        return this.visible
      },
      set(value) {
        if (!value) {
          this.$emit('close')
          //   in the parent: <jsTextFilterDialog :visible="showJsTextFilterDialog" @close="showJsTextFilterDialog=false" />
        }
      }
    },
    HasInvalidFilters() {
      //console.log(this.jsTextFilters.find(x=>x.valid==false))
      return this.jsTextFilters.find(x => x.valid == false) != undefined
    }
  },
  methods: {
    AddFilter: function() {
      this.jsTextFilters.push({
        name: '',
        type: null,
        text: '',
        valid: false
      })
      this.active = this.jsTextFilters.length - 1
    },
    RemoveFilter: function(index) {
      this.jsTextFilters.splice(index, 1)
    },
    getTabText: function(text) {
      if (!text || text.trim().length == 0) {
        return '[New]'
      }
      let str = text.trim()
      return str.length > 13 ? str.substring(0, 10) + '...' : str
    }
  }
}
</script>
