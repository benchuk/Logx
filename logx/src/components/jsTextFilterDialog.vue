<template>
<v-layout>

    <v-dialog v-model="show" max-width="70%" persistent>

        <v-card>
            <v-container v-if="jsTextFilters && jsTextFilters.length>0" class="ma-0 pa-0">
                <v-tabs v-model="active" dark slider-color="yellow">
                    <v-tab v-for="(f,index) in jsTextFilters" :key="index" ripple>
                        <v-btn class="ml-0 pl-0" fab flat small v-on:click="RemoveFilter(index)">
                            <v-icon dark color="error">delete_outline</v-icon>
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
                <v-menu offset-y top> 
                    <template v-slot:activator="{ on }">
                        <v-btn fab flat small color="white" dark v-on="on">
                            <v-icon small class="ma-0 pa-0">menu</v-icon>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-tile>
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on }">
                                    <v-btn class="ml-0 pl-0" fab flat small v-on="on" v-on:click="showLoadFileDialog()">
                                        <v-icon dark color="white">cloud_download</v-icon>
                                    </v-btn>

                                </template>
                                <span>Import Filters From Files...</span>
                            </v-tooltip>
                        </v-list-tile>
                        <v-list-tile>
                            <v-tooltip bottom>
                                <template v-slot:activator="{ on }">
                                    <v-btn :disabled="HasInvalidFilters || !jsTextFilters || jsTextFilters.length==0" class="ml-0 pl-0" fab flat small v-on="on" v-on:click="exportParsingFilters()">
                                        <v-icon dark color="white">cloud_upload</v-icon>
                                    </v-btn>
                                </template>
                                <span>Export Filters To File...</span>
                            </v-tooltip>
                        </v-list-tile>

                    </v-list>
                </v-menu>
                <v-btn :disabled="HasInvalidFilters" color="primary" flat @click="AddFilter">
                    <v-icon small dark color="primary">add</v-icon>Add Filter
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="HasInvalidFilters" color="primary" flat @click.stop="show=false">
                    <v-icon small dark color="primary">add</v-icon>Save & Close
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</v-layout>
</template>

<script>
import jsTextFilter from './jsTextFilter'
import appStorage from './appStorage'
import Vue from 'vue'
var fs = require('fs')
var app = require('electron').remote
var dialog = app.dialog

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
            if (!this.jsTextFilters) {
                return false
            }
            return this.jsTextFilters.find(x => x.valid == false) != undefined
        }
    },
    methods: {
        showLoadFileDialog: function () {
            let model = this
            dialog.showOpenDialog(fileNames => {
                if (fileNames === undefined) {
                    console.log('No file selected')
                    return
                }
                console.log(fileNames)
                fs.readFile(fileNames[0], 'utf-8', (err, data) => {
                    if (err) {
                        alert('An error ocurred reading the file :' + err.message)
                        return
                    }

                    let arr = JSON.parse(data)
                    while (model.jsTextFilters.length > 0) {
                        model.jsTextFilters.pop()
                    }

                    for (let a of arr) {
                        model.jsTextFilters.push(a)
                    }
                })
            })
        },
        exportParsingFilters: function () {
            function download(content, fileName, contentType) {
                var a = document.createElement('a')
                var file = new Blob([content], {
                    type: contentType
                })
                a.href = URL.createObjectURL(file)
                a.download = fileName
                a.click()
            }
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
            let jsonData = appStorage.loadParsingFilterList()
            download(JSON.stringify(jsonData), 'filtersConfig.txt', 'text/plain')
        },
        AddFilter: function () {
            this.jsTextFilters.push({
                name: '',
                type: null,
                text: '',
                valid: false
            })
            this.active = this.jsTextFilters.length - 1
        },
        RemoveFilter: function (index) {
            this.jsTextFilters.splice(index, 1)
        },
        getTabText: function (text) {
            if (!text || text.trim().length == 0) {
                return '[New]'
            }
            let str = text.trim()
            return str.length > 13 ? str.substring(0, 10) + '...' : str
        }
    }
}

//   getHrGraphText: function() {
//       //return "console.log(line);";
//       //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
//       return "if(!line.toLowerCase().includes('onHeartrateReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[7];"
//     },
//     getCadenceGraphText: function() {
//       //return "console.log(line);";
//       //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
//       return "if(!line.toLowerCase().includes('onCadenceReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[7];"
//     },
//     getPowerGraphText: function() {
//       //return "console.log(line);";
//       //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
//       return "if(!line.toLowerCase().includes('onPowerReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[7];"
//     },
//     getSpeedGraphText: function() {
//       //return "console.log(line);";
//       //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
//       return "if(!line.toLowerCase().includes('onSpeedReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];"
//     },
//     getGpsSpeedGraphText: function() {
//       //return "console.log(line);";
//       //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
//       return "if(!line.toLowerCase().includes('onSpeedFromGpsReceived'.toLowerCase())) return null; let l = line.split(' ').length; return line.split(' ')[6];"
//     },
//     getMapText: function() {
//       //return "console.log(line);";
//       //return "if(!line.includes('onSpeedReceived: from device')) return null; let l = line.split(' ').length; return line.split(' ')[l - 1];";
//       return "if(!line.toLowerCase().includes('updateFusedLocation'.toLowerCase())) return null; return line.split(' ')[7];"
//     },
</script>
