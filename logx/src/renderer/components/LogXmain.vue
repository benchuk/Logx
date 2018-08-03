<template>
<div id="app">
    <v-app id="inspire" dark>
        <!-- <v-navigation-drawer fixed v-model="drawerRight" right clipped app>
            <v-list dense>
                <v-list-tile @click.stop="right = !right">
                    <v-list-tile-action>
                        <v-icon>exit_to_app</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>Open Temporary Drawer</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list>
        </v-navigation-drawer> -->
        <v-toolbar color="black" dark fixed app clipped-right>
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-toolbar-title>log(x)</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items class="hidden-sm-and-down">
                <v-text-field style="margin:15px;width=:600px;" :append-icon-cb="() => {}" solo-inverted class="mx-3" flat id="findall" placeholder="find all..." single-line append-icon="search" v-model="searchterm" color="white" @keyup.enter="finall" hide-details></v-text-field>
                <v-btn color="blue darken-1" flat @click.stop="jump(0)">Top</v-btn>
                <v-btn color="blue darken-1" flat @click.native="searchDialog = true">Find multiple</v-btn>
                <v-btn color="blue darken-1" flat @click.stop="dialog = true">Settings</v-btn>
                <!-- <v-toolbar-side-icon @click.stop="drawerRight = !drawerRight"></v-toolbar-side-icon> -->
            </v-toolbar-items>
        </v-toolbar>
        <v-navigation-drawer fixed v-model="drawer" app>
            <v-container>
                <v-layout justify-center align-center>
                    <v-flex>
                        <v-switch :label="`Show Filtered: ${showFiltered.toString()}`" v-model="showFiltered" style="margin-left:15px"></v-switch>
                        <!-- <v-checkbox :label="`dialog3: ${dialog3.toString()}`" v-model="dialog3"></v-checkbox> -->
                    </v-flex>
                </v-layout>
            </v-container>
            <v-expansion-panel v-model="panel" expand>
                <v-expansion-panel-content value=true>
                     <v-switch :label="`Use Filters: ${useFilters.toString()}`" v-model="useFilters" style="margin-left:15px"></v-switch>
                    <div slot="header">Include Filters</div>
                    <v-btn flat small v-on:click="addFilter">+</v-btn>
                    <v-list two-line>
                        <template v-for="(item, index) in filters">
                            <v-list-tile avatar ripple>
                                <v-list-tile-content>
                                    <v-layout row wrap>

                                        <v-btn dark @click.stop="removeFilter(index)">-</v-btn>
                                        <!-- <input v-model.lazy="item.value" style="width:100px;height:50px"> -->
                                        <v-text-field v-model.lazy="item.value"></v-text-field>

                                    </v-layout>
                                </v-list-tile-content>

                            </v-list-tile>
                            <v-divider v-if="index + 1 < filters.length" :key="index"></v-divider>
                        </template>
                    </v-list>
                </v-expansion-panel-content>

                <v-expansion-panel-content value=true>
                    <v-switch :label="`Use Filters: ${useColors.toString()}`" v-model="useColors" style="margin-left:15px"></v-switch>
                    <div slot="header">Colors</div>
                    <v-btn flat small v-on:click="addColor">+</v-btn>
                    <v-list two-line>
                        <template v-for="(item, index) in highlights">
                            <v-list-tile avatar ripple>
                                <v-list-tile-content>
                                    <v-layout row wrap style="width:100%">
                                        <v-btn dark @click.stop="removeColor(index)">-</v-btn>
                                        <!-- <input v-model.lazy="item.value" style="width:100px;height:50px"> -->
                                        <v-text-field style="width:100%" v-model="item.value" :class="['highlight' + (index+1)]"></v-text-field>
                                    </v-layout>
                                </v-list-tile-content>
                            </v-list-tile>
                            <v-divider v-if="index + 1 < highlights.length" :key="index"></v-divider>
                        </template>
                    </v-list>
                </v-expansion-panel-content>

                <v-expansion-panel-content value=true>
                    <v-switch :label="`Use Ex Filters: ${useExFilters.toString()}`" v-model="useExFilters" style="margin-left:15px"></v-switch>
                    <div slot="header">Exclude Filters</div>
                    <v-btn flat small v-on:click="addExFilter">+</v-btn>
                    <v-list two-line>
                        <template v-for="(item, index) in exfilters">
                            <v-list-tile avatar ripple>
                                <v-list-tile-content>
                                    <v-layout row wrap>
                                        <v-btn dark @click.stop="removeExFilter(index)">-</v-btn>
                                        <!-- <input v-model.lazy="item.value" style="width:100px;height:50px"> -->
                                        <v-text-field v-model.lazy="item.value"></v-text-field>
                                    </v-layout>
                                </v-list-tile-content>
                            </v-list-tile>
                            <v-divider v-if="index + 1 < filters.length" :key="index"></v-divider>
                        </template>
                    </v-list>
                </v-expansion-panel-content>

            </v-expansion-panel>
        </v-navigation-drawer>
        <v-content fill-height fluid grid-list-sm id="main-content">
            <v-container id="main-container" fill-height fluid grid-list-sm>
                <v-layout justify-left align-top style="padding-top:30px">
                    <v-flex>

                        <fast-text-view :lines="logLines" :position=position :height="logsHeight" :highlights="highlights" :ident="'main-logger'" :filters="filters" :parentid="'main-container'" :exfilters="exfilters" :useExFilters="useExFilters" :useFilters="useFilters" :useColors="useColors" :showFiltered="showFiltered"></fast-text-view>

                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <v-navigation-drawer right temporary v-model="right" fixed></v-navigation-drawer>
        <v-footer inset app fixed id="theFooter" height=30>
            <v-container fluid fill-height pa-0>
                <v-layout justify-left align-left>
                    <v-flex xs12>
                        <div id="resizer"></div>
                        <v-tabs dark slider-color="white" style="height: 100%;" v-model="active">
                            <v-tabs-slider color="yellow"></v-tabs-slider>
                            <v-tab v-for="s in searchs" ripple>
                                <v-btn depressed small v-on:click="removeSearch(s)">
                                    X
                                </v-btn>
                                <v-tooltip top>
                                    <v-btn slot="activator" dark color="primary">{{ s[0].value.substring(0, 10) + "..." }}</v-btn>
                                    <span>{{ s.reduce((accumulator, currentValue, currentIndex, array) => {return accumulator + " " + currentValue.value.substring(0, 10); }, "") }}</span>
                                </v-tooltip>

                                <!-- <v-chip  color="blue-grey darken-2" text-color="white">
                      <v-avatar >1</v-avatar>
                      {{ s[0].value.substring(0, 10) + "..." }}
                    </v-chip> -->

                            </v-tab>
                            <v-tabs-items style="height: 100%;">
                                <v-tab-item v-for="s in searchs" style="height: 100%;">
                                    <v-card flat style="height: 100%;">
                                        <fast-text-view :showFiltered="false" :lines="logLines" :height="100" :highlights="highlights" :useExFilters="false" useFilters="true" :filters="s" :ident="'s-tab'" :parentid="'theFooter'"></fast-text-view>
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
    </v-dialog> -->

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
                            <v-list-tile v-for="(item, i) in items" :key="i" @click="">
                                <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                            </v-list-tile>
                        </v-list>
                    </v-menu>
                </v-toolbar>
                <v-card-text>
                    <v-btn color="primary" dark @click.stop="dialog2 = !dialog2">Open Dialog 2</v-btn>
                    <v-tooltip right>
                        <v-btn slot="activator">Tool Tip Activator</v-btn>
                        Tool Tip
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

        <v-dialog v-model="searchDialog" persistent max-width="500px">
            
            <v-card>
                <v-card-title>
                    <span class="headline">Find multiple</span>
                </v-card-title>
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout wrap>

                            <v-list two-line>
                                <template v-for="(f,index) in findMultiSearchTerms">
                                    <v-flex xs12 :key="index">
                                        <v-text-field v-model.lazy="f.value" solo-inverted class="mx-3" flat single-line append-icon="search" color="white" @keyup.enter="findMulti()" hide-details>
                                        </v-text-field>
                                    </v-flex>
                                </template>
                            </v-list>

                        </v-layout>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" flat @click.native="searchDialog = false">Close</v-btn>
                    <v-btn color="blue darken-1" flat @click.native="findMulti()">Find all</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-app>
</div>
</template>

<script>
import appStorage from './appStorage'
import JQuery from 'jquery'
let $ = JQuery
const {
    ipcRenderer
} = require('electron')
//console.log($);
function refreshView(filesPaths) {
    if (filesPaths == undefined || filesPaths.length <= 0) {
        return;
    }
    var params = {
        "files": filesPaths
    };
    var res = ipcRenderer.send('load-files', params);
}
console.error('-------------------------------------------');
var filesPaths = appStorage.loadLastFileList();
refreshView(filesPaths);

function jqueryInit() {
    var startPoint = 0;
    var orgHeight = 0;

    function onDrop(e) {
        filesPaths = [];
        e.preventDefault();
        e.stopPropagation();
        var dt = e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer);
        var files = e.target.files || (dt && dt.files);
        console.error(e);
        for (var i in files) {
            var p = e.dataTransfer.files[i].path;
            if (p != undefined) {
                filesPaths.push(p);
            }
        }
        appStorage.saveFileListForWindow(filesPaths);
        //windowLocalStorage["myFiles"] = filesPaths;
        //saveLocalStorage();
        refreshView(filesPaths);
        //loadFileContent(filesPaths);
    }

    function loadFileContent(filesPaths) {
        for (var f of filesPaths) {
            var reader = new FileReader();
            reader.onload = function (e) {
                // get file content
                var text = e.target.result;
                console.log('start')
                document.getElementById('area').innerHTML = text;
                console.log('end')
            }
            reader.readAsText(f);
        }
    }
    console.error("!!!!!!!!!!!!!!!!! ready for drop");
    //  document.getElementById('main-container').addEventListener('drop', function(e) {
    //    console.log("drop!");
    //    onDrop(e)
    // });
    $("html").on("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
        //$(this).addClass('dragging');
    });
    $("html").on("dragleave", function (event) {
        event.preventDefault();
        event.stopPropagation();
        //$(this).removeClass('dragging');
    });
    // $("html").on("drop", function(event) {
    //     event.preventDefault();  
    //     event.stopPropagation();
    //     onDrop(event)
    // });
    document.addEventListener('drop', function (e) {
        console.log("drop!");
        onDrop(e)
    });

    function mousemove(e) {
        console.log(".")
        var res = orgHeight + (startPoint - e.pageY);
        //console.log("mousemove: res: " + res);
        //let currentH = $("#theFooter").height();
        $("#theFooter").height(res);
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = true;
        e.returnValue = false;
        //$("#footer-container").height(res);
    }

    function mouseup(e) {
        console.log("mouseup")
        $("body,html").off("mousemove", mousemove);
        $("body,html,#resizer").off("mouseup", mouseup);
    }

    function mousedown(e) {
        console.log("mousedown!!!!!!!!!!!!!")
        $("body,html,#resizer").mouseup(mouseup);
        startPoint = e.pageY;
        orgHeight = $("#theFooter").height();
        //$("#resizer").off("mousedown", mousedown);
        $("body,html").mousemove(mousemove);
    }
    $("#resizer").mousedown(mousedown);
    //$("#resizer").height(900);
}
// window.onload = function() {
// if (window.jQuery) {  
//     // jQuery is loaded  
//     alert("Yeah!");
// } else {
//     // jQuery is not loaded
//     alert("Doesn't Work");
// }
//}
import {
    EventBus
} from './event-bus.js';
import FastTextView from './Controls/FastTextView.vue'
export default {
    name: 'logxmain-page',
    components: {
        FastTextView
    },
    watch: {
        'highlights': {
            handler: function (val) {
                console.log("saving highlights");
                console.error(val);
                let model = this;
                appStorage.saveHighlights(val);
            },
            deep: true
        },
        'filters': {
            handler: function (val) {
                console.log("saving filters");
                console.error(val);
                let model = this;
                appStorage.saveFilters(val);
            },
            deep: true
        },
        'exfilters': {
            handler: function (val) {
                console.log("saving ex-filters");
                console.error(val);
                let model = this;
                appStorage.saveExFilters(val);
            },
            deep: true
        }
    },
    data() {
        return {
            findMultiSearchTerms: [{
                'value': ''
            }, {
                'value': ''
            }, {
                'value': ''
            }, {
                'value': ''
            }, {
                'value': ''
            }, {
                'value': ''
            }],
            searchDialog: false,
            showFiltered: false,
            position: {
                'value': 0,
                'source': 'default',
                'showFiltered': false
            },
            active: 0,
            drawerRight: false,
            right: null,
            left: null,
            notifications: true,
            sound: true,
            widgets: true,
            useFilters:true,
            filters: [],
            useExFilters:true,
            exfilters: [],
            useColors:true,
            dialog: false,
            dialog3: false,
            logsHeight: 10,
            highlights: [],
            logLines: [],
            originalH: 35,
            startPoint: -1,
            theView: undefined,
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            drawer: false,
            panel: [true, false],
            items: [{
                    action: '15 min',
                    headline: 'Brunch this weekend?',
                    title: 'Ali Connors',
                    subtitle: "1"
                },
                {
                    action: '2 hr',
                    headline: 'Summer BBQ',
                    title: 'me, Scrott, Jennifer',
                    subtitle: "2"
                },
                {
                    action: '6 hr',
                    headline: 'Oui oui',
                    title: 'Sandra Adams',
                    subtitle: '3'
                },
                {
                    action: '12 hr',
                    headline: 'Birthday gift',
                    title: 'Trevor Hansen',
                    subtitle: '4'
                },
                {
                    action: '18hr',
                    headline: 'Recipe to try',
                    title: 'Britta Holt',
                    subtitle: 'asdasdasd'
                }
            ],
            searchReasultsContent: ["3", "5"],
            searchterm: "",
            searchs: []
        }
    },
    beforeCreate() {
        //console.log('Nothing gets called before me!')
    },
    created() {
        //model.$forceUpdate();
        let model = this;
        model.highlights = appStorage.loadLastHighlightsList();
        model.filters = appStorage.loadLastFiltersList();
        model.exfilters = appStorage.loadLastExFiltersList();
        //console.log('Component Created');
        ipcRenderer.on('load-files-reply', (event, arg) => {
            console.log("done");
            let lines = arg.split('\n');
            //document.getElementById('area').innerHTML = lines[0];
            model.logLines = lines;
            console.log(model);
            model.onResize(window);
        });
        EventBus.$on('textSelection', text => {
            console.log("textSelection " + text);
            model.AddToHighlights(text);
            //model.filters = [{value:"start"}];
            // console.log("push!!!!!!!!");
            // console.error(model.filters[1]);
        });
        EventBus.$on('showingFiltered', showingFiltered => {
            console.log("showingFiltered" + showingFiltered);
            model.showFiltered = showingFiltered;
        });
        EventBus.$on('jumpto', pos => {
            console.log("jumpto: " + pos.value);
            model.position = pos;
        });
        let prevKey = -1;
        // document.addEventListener("keydown", function (e) {
        //     if (e.which === 116) {
        //       //location.reload();
        //        console.error("!!!!!!!!!!!!!");
        //     }
        //  });
        $(window).keydown(function (event) {
            //console.log("event.keyCode: " + event.keyCode);
            if ((event.ctrlKey || prevKey == 91) && event.keyCode == 70) {
                event.preventDefault();
                prevKey = -1;
                model.searchterm = '';
                $("#findall").focus();
                $("#findall").val('');
            }
            prevKey = event.keyCode;
        });
        //  EventBus.$on('newPosition', newPosition => {
        //   console.log("newPosition: " + newPosition);
        //   model.newPosition = newPosition;
        // });
    },
    mounted: function () {
        let model = this;
        model.logLines = [];
        console.log(model);
        // for (var i = 0; i <= 200; i++) {
        //     //console.log(i);
        //     model.logLines.push("" + i);
        // }
        this.$nextTick(function () {
            console.log('register resize');
            window.addEventListener('resize', function (e) {
                e.preventDefault();
                model.onResize(window);
            })
            jqueryInit();
            model.onResize(window);
            model.loadSavedPreset();
        })
        console.log("ready")
    },
    methods: {
        findMulti: function () {
            var searchTerms = [];
            for (var s of this.findMultiSearchTerms.slice()) {
                if (!s.value || s.value.length <= 0) {
                    continue;
                }
                searchTerms.push({
                    'value': s.value
                });
            }
            this.searchDialog = false;
            this.searchs.push(searchTerms);
            this.active = (this.searchs.length - 1).toString();
            console.log("active: " + this.active);
            if ($("#theFooter").height() < 300) {
                $("#theFooter").height(300);
            }
        },
        jump: function (p) {
            this.position = {
                'value': p,
                'source': 'default',
                'showFiltered': false
            };
        },
        AddToHighlights: function (text) {
            let model = this;
            model.highlights.push({
                'value': "" + text
            });
        },
        removeSearch: function (s) {
            let index = this.searchs.indexOf(s);
            console.log("index: " + index + " len: " + this.searchs.length);
            var wasLast = false;
            if(index == (this.searchs.length-1))
            {
                wasLast = true;
            }
            console.log("index: " + index);
            this.searchs.splice(index, 1);
            setTimeout(() => {
                if(wasLast)
                {
                    this.active = (this.searchs.length-1).toString();
                }
                if (this.searchs.length <= 0) {
                    $("#theFooter").height(35);
                }
            }, 10);
        },
        finall: function () {
            this.searchs.push([{
                'value': "" + this.searchterm
            }]);
            this.active = (this.searchs.length - 1).toString();
            console.log("active: " + this.active);
            if ($("#theFooter").height() < 300) {
                $("#theFooter").height(300);
            }
        },
        addExFilter: function (event) {
            this.exfilters.push({
                'value': ''
            });
        },
        removeExFilter: function (index) {
            this.exfilters.splice(index, 1);
        },
        addFilter: function (event) {
            this.filters.push({
                'value': ''
            });
        },
        removeFilter: function (index) {
            this.filters.splice(index, 1);
        },
        addColor: function (event) {
            this.AddToHighlights('');
        },
        removeColor: function (index) {
            this.highlights.splice(index, 1);
        },
        loadSavedPreset: function () {
            console.log('loadFilters');
            //this.filters = [];
        },
        onResize: function (www) {
            //console.log('onResize!!!!!!!!!!!!!!!!!!!!!!!!!!');
            //console.log(www);
            document.getElementById('main-container').setAttribute("style", "max-width:" + www.innerWidth + "px");
            $('#main-content').css("padding-bottom", "30px");
            $('#main-content').css("padding-top", "30px");
        },
        up: function (e) {
            console.log("up");
            this.startPoint = -1;
        },
        down: function (e) {
            console.log("start point - down: " + e.pageY);
            this.startPoint = e.pageY;
            this.originalH = this.h;
        },
        move: function (e) {
            if (this.startPoint <= 0) {
                return;
            }
            //console.log(".")
            //console.log(this.theView)
            let y = this.startPoint - e.pageY;
            let x = this.originalH + this.startPoint - e.pageY;
            //console.log(x)
            this.theView.style.height = x + 'px';
            //this.h = x;
            //console.log(e.currentTarget)
            //e.currentTarget.height = x;
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;
        }
    },
    props: {
        source: String
    }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
#resizer {
  background: #343436;
  border-bottom: 1px solid black;
  box-shadow: 0 0 1px black;
  height: 17px;
  position: relative;
  z-index: 10;
  cursor: row-resize;
}
</style>
