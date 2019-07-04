<template>
<div id="app">
    <v-app id="inspire" dark>
        <!-- ======= TOOLBAR ================================================= -->
        <v-toolbar color="black" dark fixed app clipped-right>
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-toolbar-title>log(x)</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-text-field @click:append="finall" solo-inverted class="mt-2" id="findall" placeholder="New Search Tab" single-line append-icon="search" v-model="searchterm" color="grey" @keyup.enter="finall"></v-text-field>
            <v-spacer></v-spacer>
            <v-toolbar-items class="hidden-sm-and-down">
                <v-btn color="blue darken-1" flat @click.native="searchDialog = true">Find multiple</v-btn>
                <v-menu offset-y v-if="jsTextFilters && jsTextFilters.length>0">
                    <template v-slot:activator="{ on }">
                        <v-btn fab flat small color="primary" dark v-on="on">
                            <v-icon small class="ma-0 pa-0">playlist_add</v-icon>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-tile v-for="(f, index) in jsTextFilters" :key="index" @click="AddTextFilter(f)">
                            <v-list-tile-title v-if="f.valid && f.type">
                                <v-icon class="mr-1">{{f.type.icon}}</v-icon>{{ f.name }} ({{f.type.name}})
                            </v-list-tile-title>
                        </v-list-tile>
                    </v-list>
                </v-menu>
                <v-btn color="orange darken-1" fab flat small @click="jsTextFilterDialog=true">
                    <v-icon small>brightness_auto</v-icon>
                </v-btn>
                <v-btn class="ma-0 pa-0" color="orange darken-1" fab flat small @click="filesDialog = true">
                    <v-icon class="ma-0 pa-0" small>attach_file</v-icon>
                </v-btn>
                <v-btn class="ma-0 pa-0" color="green" fab flat small @click.stop="jump(0)">
                    <v-icon class="ma-0 pa-0" small>vertical_align_top</v-icon>
                </v-btn>
                <!-- <v-btn color="blue darken-1" flat @click.stop="dialog = true">Settings</v-btn> -->
                <!-- <v-toolbar-side-icon @click.stop="drawerRight = !drawerRight"></v-toolbar-side-icon> -->
            </v-toolbar-items>
        </v-toolbar>
        <!-- ======= NAV DRAWER ================================================= -->
        <v-navigation-drawer fixed v-model="drawer" app>
            <v-layout justify-center align-center>
                <v-flex>
                    <v-switch class="mt-3 pa-0 ml-3" :label="`${showFiltered?'Showing All Lines':'Showing Filtered Lines'}`" v-model="showFiltered" ref="sw"></v-switch>
                </v-flex>
            </v-layout>
            <v-expansion-panel v-model="panel" expand>
                <v-layout row justify-center align-center class="ml-3">
                    <v-combobox @input="onFilterPresetSelected" v-model="selectedPresetName" :items="filterPresets" label="Select a filter present or create new"></v-combobox>
                    <v-btn v-on:click="savePresetClicked" flat icon color="white" :disabled="canSave == false">
                        <v-icon>save</v-icon>
                    </v-btn>
                </v-layout>
                <!-- ======= FILTERS ================================================= -->
                <v-expansion-panel-content :value="panel[0]">
                    <div slot="header">Filters {{filters?'('+filters.length+')':""}}</div>
                    <v-layout row justify-center align-center>
                        <v-switch class="mt-3 mb-0 pa-0 ml-3" :label="`${useFilters?'On':'Off'}`" v-model="useFilters"></v-switch>
                        <v-btn class="mt-0 mb-0 mr-0" v-on:click="addFilter" small dark>Add Filter<v-icon dark class="ml-1">playlist_add</v-icon>
                        </v-btn>
                        <v-btn class="mt-0 ml-0" v-on:click="removeFilter(-1)" flat icon color='error'>
                            <v-icon dark>delete_outline</v-icon>
                        </v-btn>
                    </v-layout>

                    <v-layout class="ml-3 mr-3" row v-for="(item, index) in filters" :key="index">
                        <v-text-field class="mt-0 pt-0" ref="filterId" append-icon="color_lens" @click:append="colorFromFilter(index)" append-outer-icon="delete_outline" @click:append-outer="removeFilter(index)" v-model.lazy="item.value"></v-text-field>
                    </v-layout>
                </v-expansion-panel-content>
                <!-- ======= COLORS ================================================= -->
                <v-expansion-panel-content :value="panel[1]">
                    <!-- -------------------- -->
                    <div slot="header">Colors {{highlights?'('+highlights.length+')':""}}</div>
                    <v-layout row justify-center align-center>
                        <v-switch class="mt-0 pa-0 ml-3" :label="`${useColors?'On':'Off'}`" v-model="useColors"></v-switch>
                        <v-btn :disabled="!canAddColor" class="mt-0 mr-0" v-on:click="addColor" small dark>Add Color<v-icon dark class="ml-1">playlist_add</v-icon>
                        </v-btn>
                        <v-btn class="mt-0 ml-0" v-on:click="removeColor(-1)" flat icon color='error'>
                            <v-icon dark>delete_outline</v-icon>
                        </v-btn>
                    </v-layout>
                    <v-layout class="ml-3 mr-3" row v-for="(item, index) in highlights" :key="index">
                        <v-text-field autofocus class="mt-0 pt-0" append-icon="call_made" @click:append="filterFromColor(index)" :background-color="stylesCache[index+1]" append-outer-icon="delete_outline" @click:append-outer="removeColor(index)" v-model.lazy="item.value"></v-text-field>
                    </v-layout>

                </v-expansion-panel-content>
                <!-- ======= EX-FILTERS ================================================= -->
                <v-expansion-panel-content :value="panel[2]">
                    <div slot="header">Exclude Filters {{exfilters?'('+exfilters.length+')':""}}</div>
                    <v-layout row justify-center align-center>
                        <v-switch class="mt-0 pa-0 ml-3" :label="`${useExFilters?'On':'Off'}`" v-model="useExFilters"></v-switch>
                        <v-btn class="mt-0 mr-0" v-on:click="addExFilter" small dark>Add Ex-Filter<v-icon dark class="ml-1">playlist_add</v-icon>
                        </v-btn>
                        <v-btn class="mt-0 ml-0" v-on:click="removeExFilter(-1)" flat icon color='error'>
                            <v-icon dark>delete_outline</v-icon>
                        </v-btn>
                    </v-layout>
                    <v-layout class="ml-3 mr-3" row v-for="(item, index) in exfilters" :key="index">
                        <v-text-field class="mt-0 pt-0" append-outer-icon="delete_outline" @click:append-outer="removeExFilter(index)" v-model.lazy="item.value"></v-text-field>
                    </v-layout>
                </v-expansion-panel-content>
            </v-expansion-panel>
            <!-- ======= DRAWER ================================================= -->
        </v-navigation-drawer>
        <!-- ======= Logs Viewer ================================================= -->
        <v-content>
            <v-container fluid fill-height pa-2>
                <v-layout justify-left align-left>
                    <v-flex xs12>
                        <fast-text-view :lines="logLines" :position="position" :highlights="highlights" :ident="'main-logger'" :filters="filters" :exfilters="exfilters" :useExFilters="useExFilters" :useFilters="useFilters" :useColors="useColors" :showFiltered="showFiltered"></fast-text-view>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <!-- ======= Right Nav DRAWER ================================================= -->
        <v-navigation-drawer right temporary v-model="right" fixed></v-navigation-drawer>
        <!-- ======= Footer ================================================= -->
        <v-footer inset app fixed id="theFooter" height="30">
            <v-container fluid fill-height pa-0>
                <v-layout justify-left align-left>
                    <v-flex xs12>
                        <div id="resizer"></div>
                        <!-- ======= SEARCHES ================================================= -->
                        <v-tabs show-arrows dark slider-color="yellow" v-model="active">
                            <!-- <v-tabs-slider color="yellow"></v-tabs-slider> -->
                            <v-tooltip top debounce=1000 v-for="(s,index) in searchs" ripple v-bind:key="index">
                                <template v-slot:activator="{ on } ">
                                    <v-tab v-on="on">
                                        <v-btn class="ml-0 pl-0" fab flat small v-on:click="removeSearch(s)">
                                            <v-icon dark color="grey">close</v-icon>
                                        </v-btn>{{ getFindTabText(s,true)}}
                                    </v-tab>
                                </template>
                                <span>{{ getFindTabText(s,false)}}</span>
                            </v-tooltip>
                            <v-btn v-if="searchs.length>1" @click="clearSearches" flat icon color="error">
                                <v-icon small>delete_outline</v-icon>
                            </v-btn>
                            <v-tabs-items>
                                <v-tab-item v-for="(s,index) in searchs" v-bind:key="index">
                                    <v-card flat v-if="s[0].type==='find'">
                                        <fast-text-view class="ma-1" :showFiltered="false" :lines="logLines" :highlights="highlights" :useExFilters="false" useFilters="true" :filters="s" :ident="'s-tab'" :parentid="'theFooter'"></fast-text-view>
                                    </v-card>
                                    <v-card v-else-if="s[0].type==='map'">
                                        <mapFromText :lines="logLines" :func="s[0].code"></mapFromText>
                                    </v-card>
                                    <v-card v-else-if="s[0].type==='graph'">
                                        <plotFromText :lines="logLines" :func="s[0].code"></plotFromText>
                                    </v-card>
                                </v-tab-item>
                            </v-tabs-items>
                        </v-tabs>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-footer>

        <!-- <v-dialog v-model="dialog3" scrollable max-width="80%" max-height="80%">
      <v-btn slot="activator" color="primary" dark>Open Dialog</v-btn>
      <v-card>
        <v-card-title>Select Country</v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 800px;">
            <textarea style="width:100%;height:100%;" v-model="logLines"></textarea>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn color="blue darken-1" flat @click.native="dialog3 = false">Close</v-btn>
          <v-btn color="blue darken-1" flat @click.native="dialog3 = false">Save</v-btn>
        </v-card-actions>
      </v-card>
      </v-dialog>-->

        <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition" scrollable>
            <v-card tile>
                <v-toolbar card dark color="primary">
                    <v-btn icon dark @click.native="dialog = false">
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Settings</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn dark flat @click.native="dialog = false">Save</v-btn>
                    </v-toolbar-items>
                    <v-menu bottom right offset-y>
                        <v-btn slot="activator" dark icon>
                            <v-icon>more_vert</v-icon>
                        </v-btn>
                        <v-list>
                            <v-list-tile v-for="(item, i) in items" :key="i" @click>
                                <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                            </v-list-tile>
                        </v-list>
                    </v-menu>
                </v-toolbar>
                <v-card-text>
                    <v-btn color="primary" dark @click.stop="dialog2 = !dialog2">Open Dialog 2</v-btn>
                    <v-tooltip right>
                        <v-btn slot="activator">Tool Tip Activator</v-btn>Tool Tip
                    </v-tooltip>
                    <v-list three-line subheader>
                        <v-subheader>User Controls</v-subheader>
                        <v-list-tile avatar>
                            <v-list-tile-content>
                                <v-list-tile-title>Content filtering</v-list-tile-title>
                                <v-list-tile-sub-title>Set the content filtering level to restrict apps that can be downloaded</v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile avatar>
                            <v-list-tile-content>
                                <v-list-tile-title>Password</v-list-tile-title>
                                <v-list-tile-sub-title>Require password for purchase or use password to restrict purchase</v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                    <v-divider></v-divider>
                    <v-list three-line subheader>
                        <v-subheader>General</v-subheader>
                        <v-list-tile avatar>
                            <v-list-tile-action>
                                <v-checkbox v-model="notifications"></v-checkbox>
                            </v-list-tile-action>
                            <v-list-tile-content>
                                <v-list-tile-title>Notifications</v-list-tile-title>
                                <v-list-tile-sub-title>Notify me about updates to apps or games that I downloaded</v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile avatar>
                            <v-list-tile-action>
                                <v-checkbox v-model="sound"></v-checkbox>
                            </v-list-tile-action>
                            <v-list-tile-content>
                                <v-list-tile-title>Sound</v-list-tile-title>
                                <v-list-tile-sub-title>Auto-update apps at any time. Data charges may apply</v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile avatar>
                            <v-list-tile-action>
                                <v-checkbox v-model="widgets"></v-checkbox>
                            </v-list-tile-action>
                            <v-list-tile-content>
                                <v-list-tile-title>Auto-add widgets</v-list-tile-title>
                                <v-list-tile-sub-title>Automatically add home screen widgets</v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                </v-card-text>

                <div style="flex: 1 1 auto;"></div>
            </v-card>
        </v-dialog>
        <!-- ======= FIND MULTI DIALOG ================================================= -->
        <v-dialog v-model="searchDialog" max-width="500px">
            <v-card>
                <v-card-title class="pb-0">
                    <span class="headline">Find multiple</span>
                </v-card-title>
                <v-card-text class="pa-0">
                    <v-container grid-list-md>
                        <v-layout class="mb-1" wrap v-for="(f,index) in findMultiSearchTerms" :key="index">
                            <v-text-field :focus="index==0" :autofocus="index==0" :placeholder="`Find Text ${index+1}`" v-model="f.value" solo-inverted color="grey" flat single-line @keyup.enter="findMulti()" hide-details></v-text-field>
                        </v-layout>
                    </v-container>
                </v-card-text>
                <v-card-actions class="pt-0">
                    <v-btn color="grey darken-1" flat @click.native="searchDialog = false">Cancel</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" flat @click.native="findMulti()">Find all</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- ======= FILES DIALOG ================================================= -->
        <v-dialog v-model="filesDialog" max-width="600px">
            <v-card>
                <v-card-title class="pb-1">
                    <span class="headline">Dropped files</span>
                </v-card-title>
                <v-card-text v-if="filesList && filesList.length>0">
                    <v-layout class="ma-0 pa-0" wrap v-for="(f,index) in filesList" :key="index">
                        <v-text-field class="ma-0 pa-0" :value="getFileName(index)" style="font-size: 1em" readonly solo color="grey" flat single-line hide-details append-outer-icon="delete_outline" @click:append-outer="removeFile(index)"></v-text-field>
                    </v-layout>
                </v-card-text>
                <v-card-text v-else>
                    No Files
                </v-card-text>
                <v-card-actions class="pt-0">
                    <v-spacer></v-spacer>
                    <v-btn color="grey darken-1" flat @click.native="filesDialog = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- ======= TOAST ================================================= -->
        <v-snackbar v-model="snackbarVis" color="deep-orange darken-1" :timeout="2500">
            {{ snackbarText }}
            <v-btn dark flat @click="snackbarVis = false">
                Close
            </v-btn>
        </v-snackbar>
        <!-- ======= TOAST ================================================= -->
        <jsTextFilterDialog :visible="jsTextFilterDialog" :jsTextFilters="jsTextFilters" :types="jsTextTypes" @close="saveAndCloseFiltersEditor" />
    </v-app>
</div>
</template>

<script>
import appStorage from './components/appStorage'
import mapFromText from './components/mapFromText'
import plotFromText from './components/plotFromText'
import jsTextFilterDialog from './components/jsTextFilterDialog'
import JQuery from 'jquery'
let $ = JQuery
import { ipcRenderer } from 'electron'

function loadFilesOnServer(filesPaths) {
  if (filesPaths == undefined) {
    return
  }
  var params = {
    files: filesPaths
  }
  filesPaths.forEach(f => {
    console.log('File: ', f)
  })

  var res = ipcRenderer.send('load-files', params)
}
var filesPaths = appStorage.loadLastFileList()
loadFilesOnServer(filesPaths)

function random_rgba() {
  return (
    'rgb(' +
    Math.floor(Math.random() * 256) +
    ',' +
    Math.floor(Math.random() * 256) +
    ',' +
    Math.floor(Math.random() * 256) +
    ')'
  )
}
let calls = 1
let arr = [10, 20, 50, 100, 155]

function random_rgba2(id) {
  let cell = id % 4
  return (
    'rgb(' +
    Math.min(255, id) +
    ',' +
    Math.min(255, id * id) +
    ',' +
    Math.min(255, arr[cell]) +
    ')'
  )
}

function jqueryInit() {
  console.log('jqueryInit')
  var startPoint = 0
  var orgHeight = 0

  function onDrop(e) {
    filesPaths = []
    e.preventDefault()
    e.stopPropagation()
    var dt = e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer)
    var files = e.target.files || (dt && dt.files)
    for (var i in files) {
      var p = e.dataTransfer.files[i].path
      if (p != undefined) {
        filesPaths.push(p)
      }
    }
    appStorage.saveFileListForWindow(filesPaths)
    loadFilesOnServer(filesPaths)
  }

  $('html').on('dragover', function(event) {
    event.preventDefault()
    event.stopPropagation()
  })
  $('html').on('dragleave', function(event) {
    event.preventDefault()
    event.stopPropagation()
  })

  document.addEventListener('drop', function(e) {
    onDrop(e)
  })

  function mousemove(e) {
    var res = orgHeight + (startPoint - e.pageY)
    $('#theFooter').height(res)
    if (e.stopPropagation) e.stopPropagation()
    if (e.preventDefault) e.preventDefault()
    e.cancelBubble = true
    e.returnValue = false
  }

  function mouseup(e) {
    var res = orgHeight + (startPoint - e.pageY)
    $('#theFooter').height(res)
    $('body,html').off('mousemove', mousemove)
    $('body,html,#resizer').off('mouseup', mouseup)
  }

  function mousedown(e) {
    $('body,html,#resizer').mouseup(mouseup)
    startPoint = e.pageY
    orgHeight = $('#theFooter').height()
    $('body,html').mousemove(mousemove)
  }
  $('#resizer').mousedown(mousedown)
}

import { EventBus } from './components/event-bus'
import FastTextView from './components/FastTextView'
export default {
  name: 'logxmain-page',
  components: {
    FastTextView,
    mapFromText,
    plotFromText,
    jsTextFilterDialog
  },
  computed: {
    canAddColor() {
      return (
        this.highlights == null ||
        this.highlights.length == 0 ||
        this.highlights[this.highlights.length - 1].value.trim().length > 0
      )
    }
  },
  watch: {
    highlights: {
      handler: function(val) {
        let model = this
        model.canSave = true
      },
      deep: true
    },
    filters: {
      handler: function(val) {
        let model = this
        model.canSave = true
      },
      deep: true
    },
    exfilters: {
      handler: function(val) {
        let model = this
        model.canSave = true
      },
      deep: true
    }
  },
  data: function() {
    return {
      canSave: false,
      filterPresets: [],
      selectedPresetName: '',
      findMultiSearchTerms: [
        {
          value: ''
        },
        {
          value: ''
        },
        {
          value: ''
        },
        {
          value: ''
        },
        {
          value: ''
        },
        {
          value: ''
        }
      ],
      snackbarVis: false,
      snackbarText: '',
      searchDialog: false,
      filesDialog: false,
      showFiltered: false,
      position: {
        value: 0,
        source: 'default',
        showFiltered: false
      },
      stylesCache: {},
      active: 0,
      drawerRight: false,
      right: null,
      left: null,
      notifications: true,
      sound: true,
      widgets: true,
      useFilters: true,
      filters: [],
      useExFilters: true,
      exfilters: [],
      useColors: true,
      dialog: false,
      dialog3: false,
      highlights: [],
      logLines: [],
      originalH: 35,
      startPoint: -1,
      theView: undefined,
      drawer: true,
      panel: [true, true, false],
      searchReasultsContent: [],
      searchterm: '',
      searchs: [],
      filesList: [],
      items: [],
      jsTextFilterDialog: false,
      jsTextFilters: [],
      jsTextTypes: [
        {
          name: 'graph',
          desc: 'function(line){ // should return a number of null',
          icon: 'show_chart'
        },
        {
          name: 'timegraph',
          desc: 'function(line){ // should return {time:t,value:v} or null',
          icon: 'timer'
        },
        {
          name: 'map',
          desc: 'function(line){ // should return {lat:lt,lon:ln} or null',
          icon: 'place'
        }
      ]
    }
  },
  created() {
    console.log('app created')
    let model = this

    this.jsTextFilters = appStorage.loadParsingFilterList()
    model.filterPresets = appStorage.loadPresets().map(f => f.name)
    model.selectedPresetName = appStorage.getLastPresetsName()
    model.loadPreset(model.selectedPresetName)

    console.log('register load files replay event')
    ipcRenderer.on('load-files-reply', (event, arg) => {
      let lines = arg.split('\n')
      model.logLines = lines
      model.filesList = appStorage.loadLastFileList()
    })

    console.log('register past data replay event')
    ipcRenderer.on('paste-data-reply', (event, arg) => {
      appStorage.saveFileListForWindow(null)
      let lines = arg.split('\n')
      model.logLines = lines
      model.filesList = appStorage.loadLastFileList()
    })

    console.log('register text selection event')
    EventBus.$on('textSelection', text => {
      console.log('text selection event occured')
      model.AddToHighlights(text)
    })
    console.log('register show filtered event')
    EventBus.$on('showingFiltered', showingFiltered => {
      console.log('showFiltered event occured')
      model.showFiltered = showingFiltered
    })
    console.log('register jump to event')
    EventBus.$on('jumpto', pos => {
      console.log('jumpto event occured')
      model.position = pos
    })

    console.log('register key down (find all shortcut)')
    let prevKey = -1
    $(window).keydown(function(event) {
      if ((event.ctrlKey || prevKey == 91) && event.keyCode == 70) {
        event.preventDefault()
        prevKey = -1
        model.searchterm = ''
        $('#findall').focus()
        $('#findall').val('')
      }
      prevKey = event.keyCode
    })

    //hack for save button state
    setTimeout(() => {
      console.log('canSave -> false')
      model.canSave = false
    }, 0)
  },
  mounted: function() {
    console.log('app mounted')
    let model = this
    model.logLines = []
    //console.log(model);
    // for (var i = 0; i <= 200; i++) {
    //     //console.log(i);
    //     model.logLines.push("" + i);
    // }
    this.$nextTick(function() {
      //console.log("register resize");
      // window.addEventListener('resize', function(e) {
      //   e.preventDefault()
      // })
      jqueryInit()
    })
  },
  methods: {
    saveAndCloseFiltersEditor: function() {
      let dataToSave = []
      for (let filter of this.jsTextFilters) {
        dataToSave.push({
          name: filter.name,
          text: filter.text,
          type: filter.type,
          valid: filter.valid
        })
      }
      appStorage.saveParsingFilterList(dataToSave)
      this.jsTextFilterDialog = false
    },
    AddTextFilter: function(filter) {
      if ($('#theFooter').height() < 600) {
        $('#theFooter').height(600)
      }
      this.searchs.push([
        {
          value: filter.name,
          type: filter.type.name,
          code: filter.text
        }
      ])
      this.active = this.searchs.length - 1
    },
    addChart: function() {
      if ($('#theFooter').height() < 600) {
        $('#theFooter').height(600)
      }
      this.searchs.push([
        {
          value: 'chart',
          type: 'chart'
        }
      ])
      this.active = this.searchs.length - 1
    },
    addMap: function() {
      if ($('#theFooter').height() < 600) {
        $('#theFooter').height(600)
      }
      this.searchs.push([
        {
          value: 'map',
          type: 'map'
        }
      ])
      this.active = this.searchs.length - 1
    },
    speedGps: function() {
      if ($('#theFooter').height() < 600) {
        $('#theFooter').height(600)
      }
      this.searchs.push([
        {
          value: 'speed-gps',
          type: 'speed-gps'
        }
      ])
      this.active = this.searchs.length - 1
    },
    speedSensor: function() {
      if ($('#theFooter').height() < 600) {
        $('#theFooter').height(600)
      }
      this.searchs.push([
        {
          value: 'speed',
          type: 'speed-sensor'
        }
      ])
      this.active = this.searchs.length - 1
    },
    getHrGraphText: function() {
      //return "console.log(line);";
      //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
      return "if(!line.toLowerCase().includes('onHeartrateReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[7];"
    },
    getCadenceGraphText: function() {
      //return "console.log(line);";
      //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
      return "if(!line.toLowerCase().includes('onCadenceReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[7];"
    },
    getPowerGraphText: function() {
      //return "console.log(line);";
      //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
      return "if(!line.toLowerCase().includes('onPowerReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[7];"
    },
    getSpeedGraphText: function() {
      //return "console.log(line);";
      //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
      return "if(!line.toLowerCase().includes('onSpeedReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];"
    },
    getGpsSpeedGraphText: function() {
      //return "console.log(line);";
      //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
      return "if(!line.toLowerCase().includes('onSpeedFromGpsReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[6];"
    },
    getMapText: function() {
      //return "console.log(line);";
      //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
      return "if(!line.toLowerCase().includes('updateFusedLocation'.toLowerCase())) return null; return line.split(' ')[7];"
    },
    savePresetClicked: function() {
      console.log('save Preset Clicked')
      let model = this
      model.canSave = false
      model.savePreset(
        model.selectedPresetName,
        model.filters,
        model.exfilters,
        model.highlights
      )
    },
    savePreset: function(presetName, filters, excludeFilters, highlights) {
      console.log('savePreset to storage for preset name: ' + presetName)
      appStorage.savePreset(presetName, filters, excludeFilters, highlights)
      this.showMessage('saved')
    },
    loadPreset: function(presetName) {
      console.log('load preset: ' + presetName)
      let model = this
      model.highlights = []
      model.filters = []
      model.exfilters = []
      let highlights = model.highlightsForPresetName(presetName)
      if (highlights) {
        highlights.forEach(function(h) {
          model.AddToHighlights(h.value)
        })
      }
      model.filters = model.filtersForPresetName(presetName)
      model.exfilters = model.excludeFiltersForPresetName(presetName)
      setTimeout(() => {
        console.log('canSave -> false')
        model.canSave = false
      }, 0)
    },
    filtersForPresetName: function(presetName) {
      console.log('filtersForPresetName')
      var preset = appStorage.loadPresets().find(l => l.name === presetName)
      var filters = preset ? preset.filters : []
      return filters
    },
    excludeFiltersForPresetName: function(presetName) {
      console.log('excludeFiltersForPresetName')
      var preset = appStorage.loadPresets().find(l => l.name === presetName)
      var exFilters = preset ? preset.excludeFilters : []
      return exFilters
    },
    highlightsForPresetName: function(presetName) {
      console.log('highlightsForPresetName')
      var preset = appStorage.loadPresets().find(l => l.name === presetName)
      console.log('preset', preset)
      var highlights = preset
        ? preset.highlights ? preset.highlights : []
        : []
      console.log('highlights', highlights)
      return highlights
    },
    onFilterPresetSelected: function(selectedPresetName) {
      console.log('New Preset Name: ' + selectedPresetName)
      this.loadPreset(selectedPresetName)
      appStorage.saveLastUsedPresetName(selectedPresetName)
    },
    removeFile: function(index) {
      console.log('removeFile')
      if (!this.filesList || this.filesList.length < index) {
        return
      }
      this.filesList.splice(index, 1)
      appStorage.saveFileListForWindow(this.filesList)
      loadFilesOnServer(this.filesList)
    },
    getFileName: function(index) {
      //console.log('getFileName')
      if (!this.filesList || this.filesList.length < index) {
        return ''
      }
      return this.filesList[index]
        .split('\\')
        .pop()
        .split('/')
        .pop()
    },
    getFindTabText: function(texts, forTab) {
      if (!texts) {
        return ''
      }
      if (forTab) {
        let str = texts[0].value
        if (texts.length > 1) {
          str = texts
            .filter(t => t.value && t.value.trim().length > 0)
            .map(x => `${x.value}`)
            .join(',')
        }
        return str.length > 13 ? str.substring(0, 10) + '...' : str
      } else {
        return texts
          .filter(t => t.value && t.value.trim().length > 0)
          .map(x => `${x.value}`)
          .join(',')
      }
    },
    showMessage: function(text) {
      console.log('showMessage ' + text)
      this.snackbarText = text.toLowerCase()
      this.snackbarVis = true
    },
    findMulti: function() {
      var searchTerms = []
      for (var s of this.findMultiSearchTerms.slice()) {
        if (!s.value || s.value.trim().length <= 0) {
          continue
        }
        searchTerms.push({
          value: s.value,
          type: 'find'
        })
      }
      if (searchTerms.length == 0) {
        this.showMessage('no searches entered')
        return
      }
      this.searchDialog = false
      this.findMultiSearchTerms.forEach(s => (s.value = ''))
      this.searchs.push(searchTerms)
      this.active = (this.searchs.length - 1).toString()
      if ($('#theFooter').height() < 300) {
        $('#theFooter').height(300)
      }
    },
    jump: function(p) {
      console.log('jump ' + p)
      this.position = {
        value: p,
        source: 'default',
        showFiltered: false
      }
    },
    filterFromColor: function(index) {
      let text = this.highlights[index].value
      if (text.trim().length == 0) {
        return
      }
      let lowertext = text.toLowerCase()
      let exists = this.filters.findIndex(
        s => s.value.toLowerCase() === lowertext.toLowerCase()
      )
      if (exists >= 0) {
        this.showMessage('Filter is Already Defined')
        return
      }
      this.filters.unshift({
        value: this.highlights[index].value
      })
    },
    colorFromFilter: function(index) {
      this.AddToHighlights(this.filters[index].value)
    },
    AddToHighlights: function(text) {
      console.log('AddToHighlights')
      console.log(text)
      let model = this

      let lowertext = text.toLowerCase()
      let exists = model.highlights.findIndex(
        s => s.value.toLowerCase() === lowertext.toLowerCase()
      )
      if (exists >= 0) {
        this.showMessage('Highlight is Already Defined')
        return
      }

      if (!this.canAddColor) {
        this.removeColor(model.highlights.length - 1)
      }
      model.addStyle(model.highlights.length + 1)
      model.highlights.push({
        value: '' + text
      })
      this.panel[1] = true
    },
    getColor: function(index) {
      return stylesCache[index]
    },
    clearSearches: function(s) {
      this.searchs = []
      $('#theFooter').height(35)
    },
    removeSearch: function(s) {
      let index = this.searchs.indexOf(s)
      var wasLast = false
      if (index == this.searchs.length - 1) {
        wasLast = true
      }
      this.searchs.splice(index, 1)
      setTimeout(() => {
        if (wasLast) {
          this.active = (this.searchs.length - 1).toString()
        }
        if (this.searchs.length <= 0) {
          $('#theFooter').height(35)
        }
      }, 10)
    },
    finall: function() {
      let searchterm = this.searchterm.toLowerCase().trim()
      if (searchterm.length == 0) {
        return
      }
      this.searchterm = ''
      let exists = this.searchs.findIndex(
        s => s.length == 1 && s[0].value === searchterm
      )
      if (exists >= 0) {
        this.active = exists
        this.showMessage('Search is Already Defined')
        return
      }
      this.searchs.push([
        {
          value: '' + searchterm,
          type: 'find'
        }
      ])
      console.log(this.searchs)
      this.active = this.searchs.length - 1
      if ($('#theFooter').height() < 300) {
        $('#theFooter').height(300)
      }
    },
    addExFilter: function(event) {
      console.log('addExFilter')
      this.exfilters.unshift({
        value: ''
      })
    },
    removeExFilter: function(index) {
      console.log('removeExFilter')
      if (index === -1) {
        this.exfilters = []
        return
      }
      this.exfilters.splice(index, 1)
    },
    addFilter: function(event) {
      console.log('addFilter')
      this.filters.unshift({
        value: ''
      })
      this.$refs.filterId[0].focus()
    },
    removeFilter: function(index) {
      console.log('removeFilter')
      if (index === -1) {
        this.filters = []
        return
      }
      this.filters.splice(index, 1)
    },
    addColor: function(event) {
      console.log('addColor')
      this.AddToHighlights('')
    },
    removeColor: function(index) {
      console.log('removeColor')
      if (index === -1) {
        this.highlights = []
        return
      }
      this.highlights.splice(index, 1)
    },
    up: function(e) {
      this.startPoint = -1
    },
    down: function(e) {
      this.startPoint = e.pageY
      this.originalH = this.h
    },
    move: function(e) {
      if (this.startPoint <= 0) {
        return
      }
      let y = this.startPoint - e.pageY
      let x = this.originalH + this.startPoint - e.pageY
      this.theView.style.height = x + 'px'
      if (e.stopPropagation) e.stopPropagation()
      if (e.preventDefault) e.preventDefault()
      e.cancelBubble = true
      e.returnValue = false
    },
    addStyle: function(id) {
      if (this.stylesCache[id]) {
        return
      }
      let backColor = random_rgba(id)
      this.stylesCache[id] = backColor
      //let color = random_rgba();
      var style = document.createElement('style')
      style.type = 'text/css'
      style.innerHTML = `.highlight${id} {
          background-color: ${backColor};
          -moz-border-radius: 3px;
          /* FF1+ */
          -webkit-border-radius: 3px;
          /* Saf3-4 */
          border-radius: 3px;
          /* Opera 10.5, IE 9, Saf5, Chrome */
          -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
          /* FF3.5+ */
          -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
          /* Saf3.0+, Chrome */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
          /* Opera 10.5+, IE 9.0 */
          color: white;
        }`
      document.getElementsByTagName('head')[0].appendChild(style)
    }
  },
  props: {
    source: String
  }
}
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

#resizer {
  position: relative;
  z-index: 10;
  height: 17px;
  background: #343436;
  box-shadow: 0 0 1px black;
  border-bottom: 1px solid black;
  cursor: row-resize;
}

.ui-slider-range-min {
  background-color: gray;
}

.ui-slider {
  background-color: #343436 !important;
}

.ui-state-default {
  background-color: gray !important;
}

.ui-widget-header {
  background: #343436 !important;
}

.ui-corner-all {
  border-top-right-radius: 9px !important;
  border-bottom-right-radius: 9px !important;
  border-bottom-left-radius: 9px !important;
  border-top-left-radius: 9px !important;
}
</style>
