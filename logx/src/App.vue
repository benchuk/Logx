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
      </v-navigation-drawer>-->
        <v-toolbar color="black" dark fixed app clipped-right>
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-toolbar-title>log(x)</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items class="hidden-sm-and-down">
                <v-text-field style="margin:15px;width=:600px;" @click:append="() => {}" solo-inverted class="mx-3" flat id="findall" placeholder="New Search Tab" single-line append-icon="search" v-model="searchterm" color="white" @keyup.enter="finall" hide-details></v-text-field>
                <v-btn color="blue darken-1" flat @click.native="searchDialog = true">Find multiple</v-btn>
                <v-btn color="blue darken-1" flat @click.stop="jump(0)">Top</v-btn>
                
                <!-- <v-btn color="blue darken-1" flat @click.stop="dialog = true">Settings</v-btn> -->
                <!-- <v-toolbar-side-icon @click.stop="drawerRight = !drawerRight"></v-toolbar-side-icon> -->
            </v-toolbar-items>
        </v-toolbar>
        <v-navigation-drawer fixed v-model="drawer" app>
            <v-layout justify-center align-center>
                <v-flex>
                    <v-switch class="mt-3 pa-0 ml-3" :label="`${showFiltered?'Showing All Lines':'Showing Filtered Lines'}`" v-model="showFiltered"></v-switch>
                </v-flex>
            </v-layout>
            <v-expansion-panel v-model="panel" expand>
                <!-- ======= FILTERS ================================================= -->
                <v-expansion-panel-content :value="panel[0]">
                    <div slot="header">Filters {{filters?'('+filters.length+')':""}}</div>
                    <v-layout row justify-center align-center>
                        <v-switch class="mt-0 mb-0 pa-0 ml-3" :label="`${useFilters?'On':'Off'}`" v-model="useFilters"></v-switch>
                        <v-btn class="mt-0 mr-0" v-on:click="addFilter" small dark>Add Filter<v-icon dark class="ml-1">playlist_add</v-icon>
                        </v-btn>
                        <v-btn class="mt-0 ml-0" v-on:click="removeFilter(-1)" flat icon color='error'>
                            <v-icon dark>delete_outline</v-icon>
                        </v-btn>
                    </v-layout>
                    <v-layout class="ml-3 mr-3" row v-for="(item, index) in filters" :key="index">
                        <v-text-field class="mt-0 pt-0" append-icon="color_lens" @click:append="colorFromFilter(index)" append-outer-icon="delete_outline" @click:append-outer="removeFilter(index)" v-model.lazy="item.value"></v-text-field>

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
                        <v-text-field class="mt-0 pt-0" append-icon="call_made" @click:append="filterFromColor(index)"  :background-color="stylesCache[index+1]" append-outer-icon="delete_outline" @click:append-outer="removeColor(index)" v-model.lazy="item.value"></v-text-field>
                    </v-layout>

                </v-expansion-panel-content >
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
        <v-content fill-height fluid grid-list-sm id="main-content">
            <v-container id="main-container" fill-height fluid grid-list-sm>
                <v-layout justify-left align-top style="padding-top:30px">
                    <v-flex>
                        <fast-text-view :lines="logLines" :position="position" :height="logsHeight" :highlights="highlights" :ident="'main-logger'" :filters="filters" :parentid="'main-container'" :exfilters="exfilters" :useExFilters="useExFilters" :useFilters="useFilters" :useColors="useColors" :showFiltered="showFiltered"></fast-text-view>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <v-navigation-drawer right temporary v-model="right" fixed></v-navigation-drawer>
        <v-footer inset app fixed id="theFooter" height="30">
            <v-container fluid fill-height pa-0>
                <v-layout justify-left align-left>
                    <v-flex xs12>
                        <div id="resizer"></div>
                        <v-tabs show-arrows dark slider-color="yellow" v-model="active">
                            <!-- <v-tabs-slider color="yellow"></v-tabs-slider> -->
                            <v-tab v-for="(s,index) in searchs" ripple v-bind:key="index">
                                <v-btn class="ml-0 pl-0" fab flat small v-on:click="removeSearch(s)">
                                    <v-icon dark color="grey">close</v-icon>
                                </v-btn>
                                {{ s[0].value.length>13 ? s[0].value.substring(0, 10) + "...":s[0].value }}

                            </v-tab>
                            <v-tabs-items>
                                <v-tab-item v-for="(s,index) in searchs" v-bind:key="index">
                                    <v-card flat>
                                        <fast-text-view class="ma-1" :showFiltered="false" :lines="logLines" :height="100" :highlights="highlights" :useExFilters="false" useFilters="true" :filters="s" :ident="'s-tab'" :parentid="'theFooter'"></fast-text-view>
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
                                        <v-text-field v-model.lazy="f.value" solo-inverted class="mx-3" flat single-line append-icon="search" color="white" @keyup.enter="findMulti()" hide-details></v-text-field>
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
import appStorage from "./components/appStorage";
import JQuery from "jquery";
let $ = JQuery;
import {
    ipcRenderer
} from "electron";

//console.log($);
function refreshView(filesPaths) {
    if (filesPaths == undefined || filesPaths.length <= 0) {
        return;
    }
    var params = {
        files: filesPaths
    };
    filesPaths.forEach((f)=>{console.log("File: ", f);})
    
    var res = ipcRenderer.send("load-files", params);
}
//console.error("-------------------------------------------");
var filesPaths = appStorage.loadLastFileList();
refreshView(filesPaths);

function random_rgba() {
    return 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
}
let calls = 1;
let arr = [10, 20, 50, 100, 155];

function random_rgba2(id) {
    let cell = id % 4;
    return 'rgb(' + Math.min(255, (id)) + ',' + Math.min(255, (id * id)) + ',' + Math.min(255, (arr[cell])) + ')';
}

function jqueryInit() {
    var startPoint = 0;
    var orgHeight = 0;

    function onDrop(e) {
        filesPaths = [];
        e.preventDefault();
        e.stopPropagation();
        var dt =
            e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer);
        var files = e.target.files || (dt && dt.files);
        //console.error(e);
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
                //console.log("start");
                document.getElementById("area").innerHTML = text;
                //console.log("end");
            };
            reader.readAsText(f);
        }
    }
    //console.log("!!!!!!!!!!!!!!!!! ready for drop");
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
    document.addEventListener("drop", function (e) {
        //console.log("drop!");
        onDrop(e);
    });

    function mousemove(e) {
        //console.log(".");
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
        //console.log("mouseup");
        $("body,html").off("mousemove", mousemove);
        $("body,html,#resizer").off("mouseup", mouseup);
    }

    function mousedown(e) {
        //console.log("mousedown!!!!!!!!!!!!!");
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
} from "./components/event-bus";
import FastTextView from "./components/FastTextView";
export default {
    name: "logxmain-page",
    components: {
        FastTextView
    },
    computed: {
        canAddColor() {
         
            return this.highlights == null || this.highlights.length==0 || this.highlights[this.highlights.length-1].value.trim().length>0;
        }
    },
    watch: {
        highlights: {
            handler: function (val) {
                //console.log("saving highlights");
                //console.error(val);
                let model = this;
                appStorage.saveHighlights(val);
            },
            deep: true
        },
        filters: {
            handler: function (val) {
                //console.log("saving filters");
                //console.error(val);
                let model = this;
                appStorage.saveFilters(val);
            },
            deep: true
        },
        exfilters: {
            handler: function (val) {
                //console.log("saving ex-filters");
                //console.error(val);
                let model = this;
                appStorage.saveExFilters(val);
            },
            deep: true
        }
    },
    data() {
        return {
            findMultiSearchTerms: [{
                    value: ""
                },
                {
                    value: ""
                },
                {
                    value: ""
                },
                {
                    value: ""
                },
                {
                    value: ""
                },
                {
                    value: ""
                }
            ],
            searchDialog: false,
            showFiltered: false,
            position: {
                value: 0,
                source: "default",
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
            logsHeight: 10,
            highlights: [],
            logLines: [],
            originalH: 35,
            startPoint: -1,
            theView: undefined,
            drawer: true,
            panel: [true, true,false],
            items: [{
                    action: "15 min",
                    headline: "Brunch this weekend?",
                    title: "Ali Connors",
                    subtitle: "1"
                },
                {
                    action: "2 hr",
                    headline: "Summer BBQ",
                    title: "me, Scrott, Jennifer",
                    subtitle: "2"
                },
                {
                    action: "6 hr",
                    headline: "Oui oui",
                    title: "Sandra Adams",
                    subtitle: "3"
                },
                {
                    action: "12 hr",
                    headline: "Birthday gift",
                    title: "Trevor Hansen",
                    subtitle: "4"
                },
                {
                    action: "18hr",
                    headline: "Recipe to try",
                    title: "Britta Holt",
                    subtitle: "asdasdasd"
                }
            ],
            searchReasultsContent: ["3", "5"],
            searchterm: "",
            searchs: []
        };
    },
    beforeCreate() {
        //console.log('Nothing gets called before me!')
    },
    created() {
        //model.$forceUpdate();
        let model = this;
        let highlights = appStorage.loadLastHighlightsList();
        if (highlights) {
            highlights.forEach(function (h) {
                model.AddToHighlights(h.value);
            })
        }
        model.filters = appStorage.loadLastFiltersList();
        model.exfilters = appStorage.loadLastExFiltersList();
        //console.log('Component Created');
        ipcRenderer.on("load-files-reply", (event, arg) => {
            //console.log("done");
            let lines = arg.split("\n");
            //document.getElementById('area').innerHTML = lines[0];
            model.logLines = lines;
            //console.log(model);
            model.onResize(window);
        });
        EventBus.$on("textSelection", text => {
            //console.log("textSelection " + text);
            model.AddToHighlights(text);
            //model.filters = [{value:"start"}];
            // console.log("push!!!!!!!!");
            // console.error(model.filters[1]);
        });
        EventBus.$on("showingFiltered", showingFiltered => {
            //console.log("showingFiltered" + showingFiltered);
            model.showFiltered = showingFiltered;
        });
        EventBus.$on("jumpto", pos => {
            //console.log("jumpto: " + pos.value);
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
                model.searchterm = "";
                $("#findall").focus();
                $("#findall").val("");
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
        //console.log(model);
        // for (var i = 0; i <= 200; i++) {
        //     //console.log(i);
        //     model.logLines.push("" + i);
        // }
        this.$nextTick(function () {
            //console.log("register resize");
            window.addEventListener("resize", function (e) {
                e.preventDefault();
                model.onResize(window);
            });
            jqueryInit();
            model.onResize(window);
            model.loadSavedPreset();
        });
        //console.log("ready");
    },
    methods: {

        findMulti: function () {
            var searchTerms = [];
            for (var s of this.findMultiSearchTerms.slice()) {
                if (!s.value || s.value.length <= 0) {
                    continue;
                }
                searchTerms.push({
                    value: s.value
                });
            }
            this.searchDialog = false;
            this.searchs.push(searchTerms);
            this.active = (this.searchs.length - 1).toString();
            //console.log("active: " + this.active);
            if ($("#theFooter").height() < 300) {
                $("#theFooter").height(300);
            }
        },
        jump: function (p) {
            this.position = {
                value: p,
                source: "default",
                showFiltered: false
            };
        },
        filterFromColor: function(index){
            this.filters.unshift({
                value: this.highlights[index].value
            });
        },
        colorFromFilter: function(index){
            this.AddToHighlights(this.filters[index].value)
        },
        AddToHighlights: function (text) {
            let model = this;
            if(!this.canAddColor)
            {
              this.removeColor(model.highlights.length-1)
            }
            model.addStyle(model.highlights.length + 1)
            model.highlights.push({
                value: "" + text
            });
            //console.log(this.panel)
            this.panel[1]=true;
            //console.log(this.panel)           

        },
        getColor: function (index) {
            return stylesCache[index]
        },
        removeSearch: function (s) {
            let index = this.searchs.indexOf(s);
            //console.log("index: " + index + " len: " + this.searchs.length);
            var wasLast = false;
            if (index == this.searchs.length - 1) {
                wasLast = true;
            }
            //console.log("index: " + index);
            this.searchs.splice(index, 1);
            setTimeout(() => {
                if (wasLast) {
                    this.active = (this.searchs.length - 1).toString();
                }
                if (this.searchs.length <= 0) {
                    $("#theFooter").height(35);
                }
            }, 10);
        },
        finall: function () {
            this.searchs.push([{
                value: "" + this.searchterm
            }]);
            this.searchterm = "";
            this.active = (this.searchs.length - 1);
            //console.log("active: " + this.active);
            if ($("#theFooter").height() < 300) {
                $("#theFooter").height(300);
            }
        },
        addExFilter: function (event) {
            this.exfilters.unshift({
                value: ""
            });
        },
        removeExFilter: function (index) {
            if (index === -1) {
                this.exfilters = [];
                return;
            }
            this.exfilters.splice(index, 1);
        },
        addFilter: function (event) {
            this.filters.unshift({
                value: ""
            });
        },
        removeFilter: function (index) {
            //console.log("removeFilter: ", index);
            if (index === -1) {
                this.filters = [];
                return;
            }
            this.filters.splice(index, 1);
        },
        addColor: function (event) {
            this.AddToHighlights("");
        },
        removeColor: function (index) {
            if (index === -1) {
                this.highlights = [];
                return;
            }
            this.highlights.splice(index, 1);
        },
        loadSavedPreset: function () {
            //console.log("loadFilters");
            //this.filters = [];
        },
        onResize: function (www) {
            //console.log('onResize!!!!!!!!!!!!!!!!!!!!!!!!!!');
            //console.log(www);
            document
                .getElementById("main-container")
                .setAttribute("style", "max-width:" + www.innerWidth + "px");
            $("#main-content").css("padding-bottom", "30px");
            $("#main-content").css("padding-top", "30px");
        },
        up: function (e) {
            //console.log("up");
            this.startPoint = -1;
        },
        down: function (e) {
            //console.log("start point - down: " + e.pageY);
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
            this.theView.style.height = x + "px";
            //this.h = x;
            //console.log(e.currentTarget)
            //e.currentTarget.height = x;
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;
        },
        addStyle: function (id) {
            if (this.stylesCache[id]) {
                //console.log('skip');
                return;
            }
            let backColor = random_rgba(id);
            this.stylesCache[id] = backColor;
            //let color = random_rgba();
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML =
                `.highlight${id} {
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
        }`;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
    },
    props: {
        source: String
    }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

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
