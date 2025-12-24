<template>
<div id="app">
    <v-app id="inspire" dark>
        <!-- ======= TOOLBAR ================================================= -->
        <v-toolbar class="glass-toolbar" dark fixed app clipped-right>
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-toolbar-title class="neon-text font-weight-bold">log(x)</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-text-field ref="findall" @click:append="finall" solo-inverted class="glass-search glass-input-rounded" id="findall" placeholder="Search logs..." single-line append-icon="search" v-model="searchterm" color="cyan" @keyup.enter="finall" hide-details></v-text-field>
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
                <!-- <v-btn color="blue darken-1" flat @click.stop="dialog = true">Settings</v-btn> -->
                <!-- <v-toolbar-side-icon @click.stop="drawerRight = !drawerRight"></v-toolbar-side-icon> -->
            </v-toolbar-items>
        </v-toolbar>
        <!-- ======= NAV DRAWER ================================================= -->
        <v-navigation-drawer class="glass-nav" fixed v-model="drawer" app :style="{ zIndex: 900 }">
            <!-- Overlay to block footer animations -->
            <div class="sidebar-overlay"></div>
            <v-layout column class="pa-2">
                <div class="glass-panel ma-2 pa-2">
                    <v-switch class="mt-0 pa-0 ml-1" :label="`${showFiltered?'Showing All Lines':'Showing Filtered Lines'}`" v-model="showFiltered" ref="sw"></v-switch>
                    <v-switch class="mt-0 pa-0 ml-1" :label="`${streamEnabled?'Streaming On':'Streaming Off'}`" v-model="streamEnabled"></v-switch>
                    <v-switch class="mt-0 pa-0 ml-1" label="Wrap Lines" v-model="wrapLines"></v-switch>
                    <v-switch class="mt-0 pa-0 ml-1" label="Run in Command Line" v-model="runInTerminal"></v-switch>
                </div>
            </v-layout>
            <v-layout v-if="runInTerminal" column class="pa-2">
                <div class="glass-panel ma-2 pa-3">
                    <div class="caption grey--text text--lighten-1 mb-2 font-weight-bold uppercase">Terminal Console</div>
                    <v-textarea
                        v-model="terminalCommand"
                        solo
                        flat
                        background-color="rgba(255,255,255,0.03)"
                        label="Command"
                        rows="3"
                        auto-grow
                        class="mb-3 glass-input"
                        hide-details
                    ></v-textarea>
                    <v-layout row justify-space-between class="mb-2">
                        <v-btn class="mr-1 success" block :disabled="isCommandRunning" @click="executeCommand">Start</v-btn>
                        <v-btn class="ml-1 error" block :disabled="!isCommandRunning" @click="stopCommand">Stop</v-btn>
                    </v-layout>
                    <div v-if="commandStatus" class="caption white--text text-xs-center mt-2">{{ commandStatus }}</div>
                </div>
            </v-layout>
            <v-expansion-panel class="transparent" v-model="panel" expand>
                <div class="glass-panel ma-2 mt-0">
                    <v-layout row justify-center align-center class="ml-3 mt-1 pr-3">
                        <v-combobox class="glass-input glass-presets" @input="onFilterPresetSelected" v-model="selectedPresetName" :items="filterPresets" label="Filter Preset" solo outline hide-details>
                            <template slot="item" slot-scope="data">
                                <v-list-tile-content>
                                    <v-list-tile-title>{{ data.item }}</v-list-tile-title>
                                </v-list-tile-content>
                                <v-list-tile-action v-if="data.item !== 'Default'">
                                    <v-btn icon small @click.stop="onDeletePresetInline(data.item)" class="ma-0">
                                        <v-icon color="error" small>delete</v-icon>
                                    </v-btn>
                                </v-list-tile-action>
                            </template>
                        </v-combobox>
                        <v-btn v-on:click="savePresetClicked" flat icon color="white" :disabled="canSave == false" class="ma-0">
                            <v-icon small>save</v-icon>
                        </v-btn>
                    </v-layout>
                </div>

                <div class="glass-panel ma-2">
                    <v-expansion-panel-content :value="panel[0]">
                        <div slot="header" class="text-uppercase caption font-weight-bold">Filters {{filters?'('+filters.length+')':""}}</div>
                        <v-layout column class="pa-2">
                            <v-layout row justify-center align-center class="mb-2">
                                <v-switch class="mt-0 mb-0 pa-0 ml-1" :label="`${useFilters?'On':'Off'}`" v-model="useFilters" hide-details></v-switch>
                                <v-spacer></v-spacer>
                                <v-btn class="success ma-0" v-on:click="addFilter" small dark>Add Filter<v-icon dark small class="ml-1">playlist_add</v-icon></v-btn>
                                <v-btn v-on:click="removeFilter(-1)" flat icon color='error' class="ma-0"><v-icon small>delete_outline</v-icon></v-btn>
                            </v-layout>
                            <v-layout class="px-1 mb-2" row v-for="(item, index) in filters" :key="index">
                                <v-text-field class="mt-0 pt-0 glass-input-rounded" append-icon="color_lens" @click:append="colorFromFilter(index)" append-outer-icon="delete_outline" @click:append-outer="removeFilter(index)" v-model.lazy="item.value" hide-details solo flat></v-text-field>
                            </v-layout>
                        </v-layout>
                    </v-expansion-panel-content>
                </div>

                <div class="glass-panel ma-2">
                    <v-expansion-panel-content :value="panel[1]">
                        <div slot="header" class="text-uppercase caption font-weight-bold">Colors {{highlights?'('+highlights.length+')':""}}</div>
                        <v-layout column class="pa-2">
                            <v-layout row justify-center align-center class="mb-2">
                                <v-switch class="mt-0 pa-0 ml-1" :label="`${useColors?'On':'Off'}`" v-model="useColors" hide-details></v-switch>
                                <v-spacer></v-spacer>
                                <v-btn :disabled="!canAddColor" class="success ma-0" v-on:click="addColor" small dark>Add Color<v-icon dark small class="ml-1">playlist_add</v-icon></v-btn>
                                <v-btn v-on:click="removeColor(-1)" flat icon color='error' class="ma-0"><v-icon small>delete_outline</v-icon></v-btn>
                            </v-layout>
                            <v-layout class="px-1 mb-2" row v-for="(item, index) in highlights" :key="index" align-center>
                                <v-text-field autofocus class="mt-0 pt-0 custom-highlight-input glass-input-rounded highlight-no-bg" append-icon="call_made" @click:append="filterFromColor(index)" append-outer-icon="delete_outline" @click:append-outer="removeColor(index)" v-model="item.value" hide-details solo flat></v-text-field>
                                <input type="color" v-model="item.color" @input="updateHighlightColor(index)" style="width: 20px; height: 20px; border: none; background: none; cursor: pointer; margin-left: 8px; border-radius: 50%;">
                            </v-layout>
                        </v-layout>
                    </v-expansion-panel-content>
                </div>

                <div class="glass-panel ma-2">
                    <v-expansion-panel-content :value="panel[2]">
                        <div slot="header" class="text-uppercase caption font-weight-bold">Exclude {{exfilters?'('+exfilters.length+')':""}}</div>
                        <v-layout column class="pa-2">
                             <v-layout row justify-center align-center class="mb-2">
                                <v-switch class="mt-0 pa-0 ml-1" :label="`${useExFilters?'On':'Off'}`" v-model="useExFilters" hide-details></v-switch>
                                <v-spacer></v-spacer>
                                <v-btn class="success ma-0" v-on:click="addExFilter" small dark>Add Ex<v-icon dark small class="ml-1">playlist_add</v-icon></v-btn>
                                <v-btn v-on:click="removeExFilter(-1)" flat icon color='error' class="ma-0"><v-icon small>delete_outline</v-icon></v-btn>
                            </v-layout>
                            <v-layout class="px-1" row v-for="(item, index) in exfilters" :key="index">
                                <v-text-field class="mt-0 pt-0 glass-input" append-outer-icon="delete_outline" @click:append-outer="removeExFilter(index)" v-model.lazy="item.value" hide-details solo flat></v-text-field>
                            </v-layout>
                        </v-layout>
                    </v-expansion-panel-content>
                </div>
            </v-expansion-panel>
            <!-- ======= DRAWER ================================================= -->
        </v-navigation-drawer>
        <!-- ======= Logs Viewer ================================================= -->
        <v-content class="fill-height glass-app-bg" :class="{ 'glass-content-with-footer': searchs && searchs.length > 0 }">
            <v-container fluid fill-height pa-0 class="transparent">
                <v-layout column fill-height>
                    <v-flex xs12 class="fill-height d-flex flex-column">
                        <!-- Global Timeline -->
                        <div class="timeline-glow ma-2 pt-1 pb-1">
                            <log-timeline v-if="logLines && logLines.length > 0" :lines="logLines" :highlights="highlights" :useColors="useColors" :scroll-position="scrollPosition" />
                        </div>
                        
                        <fast-text-view v-if="logLines && logLines.length > 0" :lines="logLines" :position="position" :highlights="highlights" :ident="'main-logger'" :filters="filters" :exfilters="exfilters" :useExFilters="useExFilters" :useFilters="useFilters" :useColors="useColors" :showFiltered="showFiltered" :wrap="wrapLines" @view-scroll="onLogScroll" class="flex-grow-1"></fast-text-view>
                        <v-layout v-else-if="runInTerminal" column justify-center align-center fill-height style="opacity: 0.5; height: 100%">
                            <template v-if="isCommandRunning">
                                <v-progress-circular indeterminate size="64" width="7" color="primary"></v-progress-circular>
                                <div class="headline mt-3">Waiting for Command Output...</div>
                            </template>
                            <template v-else>
                                <v-icon size="120">laptop</v-icon>
                                <div class="headline">Command line mode waiting to start</div>
                            </template>
                        </v-layout>
                        <v-layout v-else-if="streamEnabled" column justify-center align-center fill-height style="opacity: 0.5; height: 100%">
                            <v-progress-circular indeterminate size="64" width="7" color="primary"></v-progress-circular>
                            <div class="headline mt-3">Waiting for Stream...</div>
                        </v-layout>
                        <v-layout v-else column justify-center align-center fill-height style="opacity: 0.5; height: 100%">
                            <v-icon size="120">cloud_off</v-icon>
                            <div class="headline">Streaming is Off</div>
                            <div class="subheading">Drop log files here or press Cmd+V to paste from clipboard</div>
                        </v-layout>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <!-- ======= Right Nav DRAWER ================================================= -->
        <v-navigation-drawer right temporary v-model="right" fixed></v-navigation-drawer>
        <!-- ======= Footer ================================================= -->
        <v-footer v-if="searchs && searchs.length > 0" fixed id="theFooter" :height="footerHeight" class="glass-footer" :style="{ position: 'fixed', left: drawer ? '300px' : '0', width: drawer ? 'calc(100% - 300px)' : '100%', zIndex: 850 }">
            <div id="resizer"></div>
            <div :style="{ width: '100%', textAlign: 'left', height: (footerHeight - 8) + 'px', display: 'flex', flexDirection: 'column' }">
                <!-- ======= SEARCHES ================================================= -->
                <v-tabs show-arrows dark slider-color="yellow" v-model="active" :style="{ width: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }">
                    <v-tooltip top debounce=1000 v-for="(s,index) in searchs" ripple v-bind:key="index">
                        <template v-slot:activator="{ on } ">
                            <v-tab v-on="on" class="glass-tab">
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
                                <fast-text-view class="ma-1" :showFiltered="false" :lines="logLines" :highlights="highlights" :useExFilters="false" :useColors="useColors" useFilters="true" :filters="s" :ident="'s-tab'" :parentid="'theFooter'" :wrap="wrapLines"></fast-text-view>
                            </v-card>
                            <v-card v-else-if="s[0].type==='map'">
                                <mapFromText :lines="logLines" :filter="s[0].filter"></mapFromText>
                            </v-card>
                            <v-card v-else-if="s[0].type==='graph' || s[0].type==='timegraph'">
                                <plotFromText :lines="logLines" :filter="s[0].filter" :filterList='filters'></plotFromText>
                            </v-card>
                        </v-tab-item>
                    </v-tabs-items>
                </v-tabs>
            </div>
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
            <v-card class="glass-panel" tile>
                <v-toolbar card dark class="glass-toolbar">
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
                            <v-list-tile v-for="(item, i) in items" :key="i" @click.native="dialog = false">
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
            <v-card class="glass-panel">
                <v-card-title class="pb-0 neon-text">
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
import LogTimeline from './components/LogTimeline'
import './assets/glass-theme.css'
import JQuery from 'jquery'
let $ = JQuery

// Conditionally import Electron modules (only available in Electron, not browser)
let ipcRenderer = null
try {
  if (typeof window !== 'undefined' && window.require) {
    const electron = window.require('electron')
    ipcRenderer = electron.ipcRenderer
  } else if (typeof require !== 'undefined') {
    const electron = require('electron')
    ipcRenderer = electron.ipcRenderer
  }
} catch (e) {
  console.warn('Electron ipcRenderer not available:', e)
}

function loadFilesOnServer(filesPaths) {
  if (filesPaths == undefined) {
    return
  }
  if (!ipcRenderer) {
    console.warn('ipcRenderer not available - running in browser mode')
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

const random_rgba = function() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const getContrastColor = function(hexcolor) {
  if (!hexcolor) return 'white'
  // If rgba string, parse it
  if (hexcolor.startsWith('rgb')) {
    const parts = hexcolor.match(/\d+/g)
    if (parts) {
      const r = parseInt(parts[0])
      const g = parseInt(parts[1])
      const b = parseInt(parts[2])
      const yiq = (r * 299 + g * 587 + b * 114) / 1000
      return yiq >= 128 ? 'black' : 'white'
    }
  }
  // If hex string
  if (hexcolor.slice(0, 1) === '#') {
    hexcolor = hexcolor.slice(1)
  }
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(function (hex) {
      return hex + hex
    }).join('')
  }
  var r = parseInt(hexcolor.substr(0, 2), 16)
  var g = parseInt(hexcolor.substr(2, 2), 16)
  var b = parseInt(hexcolor.substr(4, 2), 16)
  var yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

const rgbToHex = function(rgb) {
  if (!rgb || !rgb.startsWith('rgb')) return rgb
  const parts = rgb.match(/\d+/g)
  if (!parts) return rgb
  const r = parseInt(parts[0])
  const g = parseInt(parts[1])
  const b = parseInt(parts[2])
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function jqueryInit() {
  console.log('jqueryInit')

  function onDrop(e) {
    let droppedFilesPaths = []
    e.preventDefault()
    e.stopPropagation()
    var dt = e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer)
    var files = dt ? dt.files : []
    
    for (let i = 0; i < files.length; i++) {
      var p = files[i].path
      if (p != undefined) {
        droppedFilesPaths.push(p)
      }
    }
    
    if (droppedFilesPaths.length > 0) {
      console.log('Files dropped:', droppedFilesPaths)
      appStorage.saveFileListForWindow(droppedFilesPaths)
      loadFilesOnServer(droppedFilesPaths)
      // Vue instance is not easily accessible here without a reference, 
      // but the ipcRenderer listener in 'created' will handle the update.
    }
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
}

import { EventBus } from './components/event-bus'
import FastTextView from './components/FastTextView'



export default {
  name: 'logxmain-page',
  components: {
    FastTextView,
    mapFromText,
    plotFromText,
    jsTextFilterDialog,
    LogTimeline
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
    showFiltered: function(val) {
      appStorage.savePreference('showFiltered', val)
    },
    wrapLines: function(val) {
      appStorage.savePreference('wrapLines', val)
    },
    useFilters: function(val) {
      appStorage.savePreference('useFilters', val)
    },
    useExFilters: function(val) {
      appStorage.savePreference('useExFilters', val)
    },
    useColors: function(val) {
      appStorage.savePreference('useColors', val)
    },
    highlights: {
      handler: function(val) {
        if (this.isLoadingPreset) return
        let model = this
        model.canSave = true
        // Auto-save to current preset after debounce
        clearTimeout(model.autoSaveHighlightsTimer)
        model.autoSaveHighlightsTimer = setTimeout(function() {
          if (model.selectedPresetName && !model.isLoadingPreset) {
            console.log('Auto-saving highlights to preset: ' + model.selectedPresetName)
            model.savePreset(model.selectedPresetName, model.filters, model.exfilters, model.highlights)
            model.canSave = false
          }
        }, 500)
      },
      deep: true
    },
    filters: {
      handler: function(val) {
        if (this.isLoadingPreset) return
        let model = this
        model.canSave = true
        // Auto-save to current preset after debounce
        clearTimeout(model.autoSaveFiltersTimer)
        model.autoSaveFiltersTimer = setTimeout(function() {
          if (model.selectedPresetName && !model.isLoadingPreset) {
            console.log('Auto-saving filters to preset: ' + model.selectedPresetName)
            model.savePreset(model.selectedPresetName, model.filters, model.exfilters, model.highlights)
            model.canSave = false
          }
        }, 500)
      },
      deep: true
    },
    exfilters: {
      handler: function(val) {
        if (this.isLoadingPreset) return
        let model = this
        model.canSave = true
        // Auto-save to current preset after debounce
        clearTimeout(model.autoSaveExfiltersTimer)
        model.autoSaveExfiltersTimer = setTimeout(function() {
          if (model.selectedPresetName && !model.isLoadingPreset) {
            console.log('Auto-saving exfilters to preset: ' + model.selectedPresetName)
            model.savePreset(model.selectedPresetName, model.filters, model.exfilters, model.highlights)
            model.canSave = false
          }
        }, 500)
      },
      deep: true
    },
    streamEnabled: {
      immediate: true,
      handler: function(val) {
        let model = this
        if (val && model.runInTerminal) {
            model.runInTerminal = false
        }
        appStorage.savePreference('streamEnabled', val)
        if (val) {
          console.log('Connecting to Log Stream Bridge...')
          model.logLines = [] // Clear logs on stream start
          const connect = () => {
            if (!model.streamEnabled) return;
            
            try {
                if (model.ws) {
                  model.ws.close()
                }
                model.ws = new WebSocket('ws://localhost:9021')
                
                model.ws.onopen = function() {
                    console.log('WebSocket Connected')
                    model.showMessage('Connected to Log Stream')
                }
                
                model.ws.onmessage = function(event) {
                    let lines = event.data.split('\n')
                    lines.forEach(line => {
                        if (line && line.length > 0)
                            model.logLines.push(line)
                    })
                }
                
                model.ws.onclose = function() {
                    console.log('WebSocket Disconnected')
                    model.ws = null
                    if (model.streamEnabled) {
                         model.showMessage('Stream Disconnected - Retrying...')
                         // Auto-reconnect after 3 seconds
                         setTimeout(connect, 3000)
                    }
                }
                
                model.ws.onerror = function(error) {
                    console.log('WebSocket Error: ' + error)
                    // onclose will handle the retry
                }
                
            } catch (e) {
                console.error(e)
                if (model.streamEnabled) {
                  setTimeout(connect, 3000)
                }
            }
          }
          connect()
        } else {
          if (model.ws) {
              model.ws.close()
              model.ws = null
          }
        }
      }
    },
    runInTerminal: function(val) {
      if (val && this.streamEnabled) {
          this.streamEnabled = false
      }
      if (val) {
          this.logLines = []
          this.isCommandRunning = false
      } else {
          this.stopCommand()
          this.isCommandRunning = false
      }
      appStorage.savePreference('runInTerminal', val)
    },
    terminalCommand: function(val) {
       appStorage.savePreference('terminalCommand', val)
    },
    footerHeight: function(val) {
      appStorage.savePreference('footerHeight', val)
      EventBus.$emit('footer-resized', val)
    },
    active: function(val) {
      this.$nextTick(() => {
        EventBus.$emit('footer-resized', this.footerHeight)
      })
    },
    searchs: function(val) {
      // Initialize resizer when footer becomes visible
      if (val && val.length > 0) {
        this.$nextTick(() => {
          this.initializeResizer()
        })
      }
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
      showFiltered: appStorage.loadPreference('showFiltered', false),
      streamEnabled: appStorage.loadPreference('streamEnabled', false),
      runInTerminal: appStorage.loadPreference('runInTerminal', false),
      terminalCommand: appStorage.loadPreference('terminalCommand', ''),
      isCommandRunning: false,
      isLoadingPreset: false,
      scrollPosition: null,
      commandStatus: '',
      wrapLines: appStorage.loadPreference('wrapLines', false),
      footerHeight: appStorage.loadPreference('footerHeight', 35),
      ws: null,
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
      useFilters: appStorage.loadPreference('useFilters', false),
      filters: [],
      useExFilters: appStorage.loadPreference('useExFilters', true),
      exfilters: [],
      useColors: appStorage.loadPreference('useColors', true),
      dialog: false,
      dialog3: false,
      highlights: [],
      logLines: [],
      originalH: 35,
      startPoint: -1,
      theView: undefined,
      drawer: true,
      panel: [true, true, true, true],
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
          desc: 'function(line,returnTimeOnly){ // should return {time:t,value:v} or time:t or null (depands on returnTimeOnly)',
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
    if (ipcRenderer) {
      ipcRenderer.on('load-files-reply', (event, arg) => {
        console.log('--- load-files-reply received ---')
        let lines = arg.split('\n')
        console.log('Lines count:', lines.length)
        model.logLines = lines
        model.filesList = appStorage.loadLastFileList()
      })

      console.log('register past data replay event')
      ipcRenderer.on('paste-data-reply', (event, arg) => {
        appStorage.saveFileListForWindow(null)
        let lines = arg.split('\n')
        model.logLines = lines
        model.filesList = []
        model.showMessage('Pasted logs from clipboard')
      })
      
      console.log('register command output event')
      ipcRenderer.on('command-output', (event, arg) => {
          let lines = arg.split('\n')
          // Only push command output if enabled
          if (!model.runInTerminal) return;
          
          lines.forEach(line => {
             if(line && line.length > 0)
                model.logLines.push(line)
          })
      })

      ipcRenderer.on('command-stopped', (event, code) => {
          console.log('Command stopped with code:', code);
          model.isCommandRunning = false;
          model.commandStatus = `Stopped (Code: ${code})`;
      })
    }

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
      //console.log('jumpto event occured')
      model.position = pos
    })

    console.log('register key down shortcuts')
    let prevKey = -1
    $(window).off('keydown.logx').on('keydown.logx', function(event) {
      const isCmdOrCtrl = event.ctrlKey || event.metaKey || prevKey == 91;
      
      // Cmd/Ctrl + F (Find)
      if (isCmdOrCtrl && event.keyCode == 70) {
        event.preventDefault()
        prevKey = -1
        model.searchterm = ''
        if (model.$refs.findall) {
           model.$refs.findall.focus()
        }
        return;
      }

      // Ctrl + K (Clear Logs)
      if (event.ctrlKey && event.keyCode == 75) {
        event.preventDefault()
        model.logLines = []
        model.showMessage('Logs cleared')
        return;
      }

      // Enter (Add empty line)
      if (event.keyCode == 13) {
        const target = event.target || document.activeElement;
        const tag = target.tagName;
        const isInput = ['INPUT', 'TEXTAREA'].includes(tag) || target.isContentEditable;
        
        if (!isInput) {
            event.preventDefault()
            model.logLines.push(' ') // Add a space to ensure it's not a truly empty string if needed
            return;
        }
      }
      
      prevKey = event.keyCode
    })

    // Register namespaced paste listener
    $(window).off('paste.logx').on('paste.logx', (e) => {
        const target = e.target || document.activeElement;
        const tag = target.tagName;
        const isInput = ['INPUT', 'TEXTAREA'].includes(tag) || target.isContentEditable;
        
        if (isInput) return;
        
        const text = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
        if (text) {
            console.log('Global paste detected (standard event), loading lines:', text.length);
            const lines = text.split('\n');
            model.logLines = [...lines]; // Fresh array for reactivity
            appStorage.saveFileListForWindow(null);
            model.filesList = [];
            model.showMessage('Pasted ' + lines.length + ' lines');
        }
    });

    //hack for save button state
    setTimeout(() => {
      console.log('canSave -> false')
      model.canSave = false
    }, 0)
  },
  mounted: function() {
    console.log('app mounted')
    let model = this
    
    // Initialize resizer if footer is already visible
    this.$nextTick(() => {
      if (this.searchs && this.searchs.length > 0) {
        this.initializeResizer()
      }
    })

    // Ensure panel state matches UI
    if (model.panel.length < 4) {
      model.panel.push(false)
    }
    // model.logLines = [] // Removed: was clearing logs loaded on startup or early paste
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
    initializeResizer: function() {
      let model = this
      console.log('Initializing resizer')
      
      // Clean up any existing bindings
      $('#resizer').off('mousedown')
      $('body,html').off('mousemove').off('mouseup')
      
      // Cache the footer element
      const $footer = $('#theFooter')
      let animationFrameId = null
      let currentHeight = 0
      
      function mousemove(e) {
        var res = model.orgHeight + (model.startPoint - e.pageY)
        if (res < 35) res = 35;
        
        // Max height should not exceed window height minus toolbar (64px) and some margin
        const maxHeight = window.innerHeight - 100
        if (res > maxHeight) res = maxHeight
        
        currentHeight = res
        
        // Use requestAnimationFrame for smooth updates
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        
        animationFrameId = requestAnimationFrame(() => {
          $footer[0].style.height = currentHeight + 'px'
        })
        
        if (e.stopPropagation) e.stopPropagation()
        if (e.preventDefault) e.preventDefault()
        e.cancelBubble = true
        e.returnValue = false
      }

      function mouseup(e) {
        // Cancel any pending animation frame
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
        
        // Remove optimization class
        $footer.removeClass('resizing-active')
        
        var res = model.orgHeight + (model.startPoint - e.pageY)
        if (res < 35) res = 35;
        
        // Max height should not exceed window height minus toolbar (64px) and some margin
        const maxHeight = window.innerHeight - 100
        if (res > maxHeight) res = maxHeight
        
        // Now update the Vue data which triggers reactivity
        model.footerHeight = res
        
        $('body,html').off('mousemove', mousemove)
        $('body,html,#resizer').off('mouseup', mouseup)
      }

      function mousedown(e) {
        // Add class to disable expensive CSS effects during drag
        $footer.addClass('resizing-active')
        
        $('body,html,#resizer').mouseup(mouseup)
        model.startPoint = e.pageY
        model.orgHeight = model.footerHeight
        $('body,html').mousemove(mousemove)
      }
      
      $('#resizer').mousedown(mousedown)
      console.log('Resizer initialized')
    },
    saveAndCloseFiltersEditor: function() {
      let dataToSave = []
      for (let filter of this.jsTextFilters) {
        dataToSave.push({
          name: filter.name,
          text: filter.text,
          type: filter.type,
          valid: filter.valid,
          sample: filter.sample
        })
      }
      appStorage.saveParsingFilterList(dataToSave)
      this.jsTextFilterDialog = false
    },
    AddTextFilter: function(filter) {
      console.log('AddTextFilter')
      console.log(filter)
      if ($('#theFooter').height() < 600) {
        $('#theFooter').height(600)
      }
      this.searchs.push([
        {
          value: filter.name,
          type: filter.type.name,
          filter: filter,
          sample: ''
        }
      ])
      this.active = this.searchs.length - 1
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
      console.log('--- savePreset ---');
      console.log('Name:', presetName);
      console.log('Filters:', JSON.stringify(filters));
      console.log('ExFilters:', JSON.stringify(excludeFilters));
      console.log('Highlights:', JSON.stringify(highlights));
      
      appStorage.savePreset(presetName, filters, excludeFilters, highlights)
      this.filterPresets = appStorage.loadPresets().map(f => f.name)
      this.showMessage('saved')
    },
    loadPreset: function(presetName) {
      console.log('load preset: ' + presetName)
      let model = this
      
      let presets = appStorage.loadPresets();
      let preset = presets.find(p => p.name === presetName)
      
      if (!preset) {
        console.log("Preset not found - treating as new/save-as (keeping current state)")
        model.canSave = true
        return
      }
      
      // Validate structure to catch corrupted presets
      let isCorrupted = false
      if (preset.highlights && !Array.isArray(preset.highlights)) isCorrupted = true
      if (preset.filters && !Array.isArray(preset.filters)) isCorrupted = true
      if (preset.excludeFilters && !Array.isArray(preset.excludeFilters)) isCorrupted = true
      
      if (isCorrupted) {
          console.error("Corrupted preset detected: " + presetName + ". Deleting it.")
          appStorage.deletePresetWithName(presetName)
          // Refresh dropdown list
          this.filterPresets = appStorage.loadPresets().map(f => f.name)
          this.showMessage('Deleted corrupted preset: ' + presetName)
          return
      }
      
      model.isLoadingPreset = true
      
      console.log('--- Loading Preset Data ---');
      console.log('Filters:', JSON.stringify(preset.filters));
      console.log('ExFilters:', JSON.stringify(preset.excludeFilters));
      console.log('Highlights:', JSON.stringify(preset.highlights));
      
      // Clear all existing state first to avoid collisions
      model.highlights = []
      model.filters = []
      model.exfilters = []
      model.canSave = false
      
      let highlights = preset.highlights || []
      // ... continue normal loading ...
      if (highlights) {
        highlights.forEach(function(h) {
          // Pass the whole object if it exists (includes color)
          model.AddToHighlights(h)
        })
      }
      
      let filters = preset.filters || []
      if (filters) {
        filters.forEach(function(f) {
          model.AddToFilters(f)
        })
      }
      
      let exfilters = preset.excludeFilters || []
      if (exfilters) {
        exfilters.forEach(function(f) {
          model.AddToExFilters(f)
        })
      }
      
      setTimeout(() => {
        model.isLoadingPreset = false
        console.log("Preset loading complete")
      }, 500)
    },
    onDeletePreset: function() {
      if (!this.selectedPresetName || this.selectedPresetName === 'Default') return;
      
      console.log('Deleting preset: ' + this.selectedPresetName);
      appStorage.deletePresetWithName(this.selectedPresetName);
      
      // Refresh list
      this.filterPresets = appStorage.loadPresets().map(f => f.name);
      this.showMessage('Deleted preset: ' + this.selectedPresetName);
      
      // Reset to default
      this.selectedPresetName = 'Default';
      this.loadPreset('Default');
    },
    onDeletePresetInline: function(presetName) {
      if (!presetName || presetName === 'Default') return;
      
      console.log('Inline deleting preset: ' + presetName);
      appStorage.deletePresetWithName(presetName);
      
      // Refresh list
      this.filterPresets = appStorage.loadPresets().map(f => f.name);
      this.showMessage('Deleted preset: ' + presetName);
      
      // If we deleted the currently selected one, reset to default
      if (this.selectedPresetName === presetName) {
        this.selectedPresetName = 'Default';
        this.loadPreset('Default');
      }
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
      console.log('onFilterPresetSelected input:', selectedPresetName, 'type:', typeof selectedPresetName)
      
      let name = selectedPresetName
      if (typeof selectedPresetName === 'object' && selectedPresetName !== null) {
          name = selectedPresetName.text || selectedPresetName.value || selectedPresetName.name || ''
          console.log('Extracted name from object:', name)
      }
      
      this.selectedPresetName = name
      console.log('New Preset Name: ' + name)
      
      // Force change detection and update canSave status
      this.loadPreset(name)
      appStorage.saveLastUsedPresetName(name)
    },
    onLogScroll: function(e) {
      this.scrollPosition = e
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
      console.log('AddToHighlights', text)
      let model = this
      
      const val = typeof text === 'string' ? text : text.value || ''
      const color = typeof text === 'string' ? undefined : text.color

      if (val) {
        let lowertext = val.toLowerCase()
        let exists = model.highlights.findIndex(
           s => s && s.value && s.value.toLowerCase() === lowertext
        )
        if (exists >= 0) {
           if (!model.isLoadingPreset) {
             this.showMessage('Highlight is Already Defined')
           }
           return
        }
      }

      // If we are adding an empty highlight and one already exists, ignore
      if (!val && !model.canAddColor) {
         console.log('Ignore add color - already empty row exists')
         return
      }

      const id = model.highlights.length + 1
      const finalColor = color || model.stylesCache[id] || random_rgba()
      
      model.highlights.push({
        value: val,
        color: finalColor
      })
      
      model.addStyle(id, finalColor, true)
      this.panel[1] = true
      
      // Force refresh of the view
      EventBus.$emit('jumpto', this.position)
    },
    AddToFilters: function(text) {
      console.log('AddToFilters', text)
      let model = this
      const val = typeof text === 'string' ? text : text.value || ''
      if (val) {
        let lowertext = val.toLowerCase()
        let exists = model.filters.findIndex(s => s && s.value && s.value.toLowerCase() === lowertext)
        if (exists >= 0) {
          if (!model.isLoadingPreset) this.showMessage('Filter is Already Defined')
          return
        }
      }
      model.filters.unshift({ value: val })
      this.panel[0] = true
    },
    AddToExFilters: function(text) {
      console.log('AddToExFilters', text)
      let model = this
      const val = typeof text === 'string' ? text : text.value || ''
      if (val) {
        let lowertext = val.toLowerCase()
        let exists = model.exfilters.findIndex(s => s && s.value && s.value.toLowerCase() === lowertext)
        if (exists >= 0) {
          if (!model.isLoadingPreset) this.showMessage('Ex-Filter is Already Defined')
          return
        }
      }
      model.exfilters.unshift({ value: val })
      this.panel[2] = true
    },
    updateHighlightColor: function(index) {
      const id = index + 1
      const color = this.highlights[index].color
      this.stylesCache[id] = color
      this.addStyle(id, color, true)
      // Force refresh of the view
      EventBus.$emit('jumpto', this.position)
    },
    getColor: function(index) {
      return this.stylesCache[index]
    },
    clearSearches: function(s) {
      this.searchs = []
      this.footerHeight = 35
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
          this.footerHeight = 35
        }
      }, 10)
    },
    finall: function() {
      console.log('finall search called, term:', this.searchterm);
      let searchterm = this.searchterm.toLowerCase().trim()
      if (searchterm.length == 0) {
        console.log('empty search term, skipping');
        return
      }
      this.searchterm = ''
      let exists = this.searchs.findIndex(
        s => s.length == 1 && s[0].value === searchterm
      )
      if (exists >= 0) {
        this.active = exists
        this.showMessage('Switching to Existing Search Tab')
        if (this.footerHeight < 300) {
          this.footerHeight = 300
        }
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
      if (this.footerHeight < 300) {
        this.footerHeight = 300
      }
    },
    addExFilter: function(event) {
      console.log('addExFilter')
      this.useExFilters = true
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
      this.useFilters = true
      this.filters.unshift({
        value: ''
      })
      this.$nextTick(() => {
        if (this.$refs.filterId && this.$refs.filterId[0]) {
             this.$refs.filterId[0].focus()
        }
      })
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
    addStyle: function(id, color, force) {
      if (this.stylesCache[id] && !force && !color) {
        return
      }
      let backColor = color || this.stylesCache[id] || random_rgba(id)
      this.stylesCache[id] = backColor
      let textColor = getContrastColor(backColor)
      
      const styleId = `highlight-style-${id}`
      let styleElement = document.getElementById(styleId)
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        styleElement.type = 'text/css'
        document.getElementsByTagName('head')[0].appendChild(styleElement)
      }
      
      styleElement.innerHTML = `.highlight${id} {
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
          color: ${textColor} !important;
        }`
    },
    getContrastColor: getContrastColor,
    rgbToHex: rgbToHex,
    executeCommand: function() {
        console.log('executeCommand called', this.terminalCommand);
        if (!this.terminalCommand) {
            this.commandStatus = 'Please enter a command';
            return;
        }
        
        if (ipcRenderer) {
             this.logLines = [] // Clear logs on command start
             this.isCommandRunning = true;
             this.commandStatus = 'Starting...';
             console.log('Sending execute-command IPC');
             ipcRenderer.send('execute-command', this.terminalCommand);
        } else {
            console.error('ipcRenderer not available');
            this.commandStatus = 'Error: Electron IPC not available';
        }
    },
    stopCommand: function() {
        console.log('stopCommand called');
        if (ipcRenderer) {
            this.commandStatus = 'Stopping...';
            ipcRenderer.send('stop-command');
        }
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
  position: absolute;
  top: 0;
  left: 0;
  z-index: 101;
  height: 6px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
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

.custom-highlight-input input {
  color: var(--text-color) !important;
}
</style>
