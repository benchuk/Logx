<template>
<div>
    <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <link rel="stylesheet" href="/resources/demos/style.css">
    <div v-bind:id="'slider-vertical-'+ factory.myInitId" style="position: absolute; right: 4px;"></div>
    <v-progress-linear v-bind:id="'logx-progress' + factory.myInitId" :indeterminate="true" style="height:2px"></v-progress-linear>
    <div v-bind:id="'fast-text-view-' + factory.myInitId" class="fast-text-view-class">
        <div align=left id='logs-container' class='logrow'>
            <div class='rownumber'>[0]</div>no data default

        </div>
    </div>
</div>
</template>

<script>
var $ = global.jQuery = require('jquery');
var jQuery = require('jquery')
require('jquery-ui-dist/jquery-ui')

var myID = 0;

import {
    EventBus
} from './event-bus.js';
import {
    parse
} from 'querystring';

Array.prototype.unique = function () {
    var a = [];
    for (var i = 0; i < this.length; i++) {
        var current = this[i];
        if (a.indexOf(current) < 0 && current != undefined && current.value != "") {
            a.push(current);
        }
    }
    return a;
}

var exfiltersHandler;
export default {
    name: "fast-text-view",
    props: ['lines', 'position', 'height', 'highlights', 'filters', 'exfilters', 'ident', 'parentid', 'useFilters', 'useExFilters', 'useColors', 'showFiltered'],
    watch: {
        showFiltered(val, oldval) {
            let model = this;
            //console.log(" :  ^^^^ showFiltered watch: ", val);
            if (this.showFilteredInternal == val) {
                console.log("ignore show filter logic");
                return;
            }

            this.showFilteredInternal = val;
            //console.log("this.positionInternal", this.positionInternal);
            if (model.useFiltersInternal) {
                this.handlePosition(val);
            }
            model.setupSlider();
            model.refreshView();
        },
        position(val, oldval) {
            let model = this;
            //console.log('------ position changed');
            //console.log('position for src id ' + val.source + " my id: " + model.factory.myInitId);
            if (val.source == this.factory.myInitId) {
                console.log('skip self generated event');
                return;
            }

            setTimeout(() => {
                EventBus.$emit('showingFiltered', true);
            }, 0);

            this.showFilteredInternal = true;

            let parsedPosition = parseInt(val.value);
            setTimeout(() => {
                console.log("anim 1 for src id: " + this.factory.myInitId);
                $("#" + parsedPosition).fadeOut("slow", function () {
                    $("#" + parsedPosition).fadeIn("slow", function () {
                        // Animation complete   
                    });
                });
            }, 0);
            model.targetJump = parsedPosition;
            // model.positionInternal = parsedPosition;
            // model.handlePosition()
            model.jumpToPosition(parsedPosition);
        },
        lines(val, oldval) {
            console.log("new lines data")
            let model = this;
            if (!model.ready) {
                console.error("update lines model before ready")
                return;
            }

            if (val === undefined || val.length <= 0) {
                console.error("invalid data lines ????");
                //console.error(model.ident + " : ~~~~~~~~~~~~~~~~~ !invalid data lines watch: " + val);
                model.factory.setModel(["no data 3"]);
                model.factory.setModelFiltered(["no data 3"]);
                model.factory.setOriginalModel(["no data 3"]);
            }

            model.positionInternal = 0;
            model.updateLinesModel(true);
            model.setupSlider();
            model.onParentResize();
            model.refreshView();
        },
        'useFilters': {
            handler: function (val) {
                if (!this.ready) {
                    console.error("skip... useFilters - model not ready");
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- useFilters watch: " + val);
                model.useFiltersInternal = val;
                //should not handle position transition between models if we are on NONE-FILTERD model - in such a case this is only coloring issue
                if (!this.showFilteredInternal) {
                    model.handlePosition(!val)
                }
                model.setupSlider();
                model.refreshView();
            },
            deep: true
        },
        'useExFilters': {
            handler: function (val) {
                if (!this.ready) {
                    console.error("skip... useExFilters - model not ready");
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- exfiltersInternal watch: " + val);
                model.exfiltersInternal = val ? model.exfilters : [];
                //model.updateLinesModel(true);
                model.refreshView();
            },
            deep: true
        },
        'useColors': {
            handler: function (val) {
                if (!this.ready) {
                    console.error("skip... useColors - model not ready");
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- useColors watch: " + val);
                model.highlightsInternal = val ? model.highlights : [];
                //model.updateLinesModel(true);
                model.refreshView();
            },
            deep: true
        },
        'highlights': {
            handler: function (val) {
                if (!this.ready) {
                    console.error("skip... highlights - model not ready");
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- highlights watch: " + val);
                model.highlightsInternal = val ? val : [];
                model.refreshView();
            },
            deep: true
        },
        'exfilters': {
            handler: function (val) {
                let model = this;
                clearTimeout(exfiltersHandler);
                exfiltersHandler = setTimeout(function () {
                    //console.log(model.ident + " : !!!!!!!!!!!!!!!!!!!! ex--filters watch: " + val);
                    if (val && val[val.length - 1] && (val[val.length - 1].value == undefined || val[val.length - 1].value.length <= 0)) {
                        console.error("skip... ex filter");
                        return;
                    }
                    model.exfiltersInternal = val;
                    model.updateLinesModel(true);
                    model.refreshView();
                }, 500);

            },
            deep: true
        },
        'filters': {
            handler: function (val) {
                let model = this;
                $('#logx-progress' + model.factory.myInitId).height(2).css("visibility", "visible").css("margin", "4px");;
                clearTimeout(model.filtersHandler);
                model.filtersHandler = setTimeout(function () {
                    //console.log(model.ident + " : !!!!!!!!!!!!!!!!!!!! filters watch: " + val);
                    if (val && val[val.length - 1] && (val[val.length - 1].value == undefined || val[val.length - 1].value.length <= 0)) {
                        console.error("skip... filter");
                        return;
                    }
                    model.filtersInternal = val;
                    model.updateLinesModel(true);
                    model.refreshView();
                    $('#logx-progress' + model.factory.myInitId).height(0).css("visibility", "hidden").css("margin", "0px");
                }, 100);
            },
            deep: true
        }
    },
    data() {
        return {
            prevDisplayrowscount: -1,
            prevLower: -1,
            prevUpper: -1,
            filtersHandler: undefined,
            exfiltersHandler: undefined,
            targetJump: -1,
            lasStopPosition: -1,
            prevPosition: -1,
            showFilteredInternal: false,
            ready: false,
            factory: {},
            displayrowscount: 20,
            lowerPosition: 0,
            upperPosition: 0,
            highlightsInternal: [],
            filtersInternal: [],
            exfiltersInternal: [],
            useFiltersInternal: true,
            useExFiltersInternal: true,
            prevHeight: -1
        }
    },
    methods: {
        handlePosition: function (shouldMoveFromFilteredToFull) {
            console.log("->handlePosition");
            let model = this;
            if (shouldMoveFromFilteredToFull) {
                //get position in full model
                var lineData = model.factory.getModelFiltered()[this.positionInternal];
                if (lineData !== undefined) {
                    this.positionInternal = lineData.rowid;
                    console.log("restore original position for rowid: " + this.positionInternal);
                    let pos2 = this.positionInternal;
                    setTimeout(() => {
                        console.log("anim 2 for src id: " + this.factory.myInitId);
                        $("#" + pos2).fadeOut("slow", function () {
                            $("#" + pos2).fadeIn("slow", function () {
                                // Animation complete   
                            });
                        });
                    }, 0);
                } else {
                    this.positionInternal = 0;
                }
            } else {
                let lines = model.factory.getModelFiltered()

                var prevIndex = this.positionInternal;
                var newDisplayRowId = -1;

                let currentLineRowId = model.factory.getModel()[this.positionInternal].rowid;
                //console.log(currentLineRowId);
                var index = 0;
                while (index < lines.length) {
                    var lineData = lines[index];
                    if (lineData.rowid >= currentLineRowId) {
                        newDisplayRowId = lineData.rowid;
                        this.positionInternal = index;
                        break;
                    }
                    index++;
                }
                if (newDisplayRowId > 0) {
                    var topViewIndex = prevIndex + this.displayrowscount;
                    var c = 0;
                    for (var i = prevIndex; i < topViewIndex; i++) {
                        c++;
                        if (model.factory.getModel()[i] !== undefined) {
                            if (newDisplayRowId == model.factory.getModel()[i].rowid) {
                                setTimeout(() => {
                                    let pos = newDisplayRowId;
                                    console.log("anim 3");
                                    $("#" + pos).fadeOut("slow", function () {
                                        $("#" + pos).fadeIn("slow", function () {
                                            // Animation complete   
                                        });
                                    });
                                }, 0);
                                let newPosScreen = this.positionInternal - c + 1;
                                this.positionInternal = newPosScreen >= 0 ? newPosScreen : 0;
                                break;
                            }
                        }
                    }
                }
            }
        },
        updateLinesModel: function (shouldInitIndex) {
            console.log("updateLinesModel")
            let model = this;
            //wraping this with a function make performance better!
            //https://stackoverflow.com/questions/29387950/performance-of-google-chrome-vs-nodejs-v8
            function run() {
                var t0 = performance.now();
                if (model.useFilters == undefined) {
                    model.useFilters = true; //default
                }
                if (model.useExFilters == undefined) {
                    model.useExFilters = false; //default
                }

                if (model.exfiltersInternal == undefined || model.exfiltersInternal.length <= 0 || (model.exfiltersInternal.length == 1 && model.exfiltersInternal[0].value == "")) {
                    model.useExFiltersInternal = false;
                } else {
                    model.useExFiltersInternal = true;
                }
                model.useExFiltersInternal = model.useExFiltersInternal && model.useExFilters;

                if (model.filtersInternal == undefined || model.filtersInternal.length <= 0 || (model.filtersInternal.length == 1 && model.filtersInternal[0].value == "")) {
                    model.useFiltersInternal = false;
                } else {
                    model.useFiltersInternal = true;
                }

                model.useFiltersInternal = model.useFiltersInternal && model.useFilters;

                model.factory.setOriginalModel(model.lines);
                model.factory.setModel([]);
                model.factory.setModelFiltered([]);
                let m = model.factory.getModel();
                let modelFiltered = model.factory.getModelFiltered();
                var counter = -1;
                var didPositionInit = !shouldInitIndex;
                var theFilters = model.filtersInternal ? model.filtersInternal.unique() : [];
                var theExFilters = model.exfiltersInternal ? model.exfiltersInternal.unique() : [];
                let LINES = model.lines;
                let LINES_LEN = LINES.length;
                var line = "";
                for (var counter = 0; counter < LINES_LEN; counter++) {

                    line = LINES[counter];
                    var skipLine = false;
                    if (model.useExFiltersInternal) {
                        for (var exf of theExFilters) {

                            if (line.toLowerCase().includes(exf.value.toLowerCase())) {
                                skipLine = true; //this line is excluded - move to next line
                            }
                        }

                        if (skipLine) {
                            m.push({
                                'line': line,
                                "rowid": counter,
                                'skip': true
                            });
                            continue;
                        }
                    }

                    var addToView = false;

                    for (var f of theFilters) {
                        if (line.toLowerCase().includes(f.value.toLowerCase())) {
                            addToView = true;
                            break;
                        }
                    }

                    if (addToView) //add line only once if any of the filters apply
                    {
                        m.push({
                            'line': line,
                            'rowid': counter,
                            'skip': false
                        });
                        modelFiltered.push({
                            'line': line,
                            'rowid': counter,
                            'skip': false
                        });
                    } else {
                        m.push({
                            'line': line,
                            'rowid': counter,
                            'skip': true
                        });
                    }

                }
                var t1 = performance.now();
            }
            run();
        },
        jumpToPosition: function (newPosition) {
            //console.log("jumpToPosition", newPosition);
            let showSkip = this.showFilteredInternal;
            let model = this;
            let lines = (showSkip || !this.useFiltersInternal) ? this.factory.getModel() : this.factory.getModelFiltered();
            let len = lines.length;
            let spaceToEnd = len - this.displayrowscount;

            let POSITION = parseInt(newPosition);

            if (POSITION >= spaceToEnd || POSITION >= len) {
                this.positionInternal = spaceToEnd;
                console.log("Skip jump - nothing to render - reached end of files: " + POSITION);
                this.positionInternal = spaceToEnd;
                POSITION = spaceToEnd;
            }

            if (POSITION < 0) {
                console.log("invalid position - setting to zero");
                this.positionInternal = 0;
                POSITION = 0;
            }

            if (POSITION == this.positionInternal) {
                console.log("Skip jump - nothing to render - position is the same: " + POSITION);
            }

            this.positionInternal = POSITION;

            var modelLen = 0
            if (this.showFilteredInternal || !this.useFiltersInternal) {
                modelLen = this.factory.getModel().length
            } else {
                modelLen = this.factory.getModelFiltered().length
            }
            var sliderPostion = POSITION;
            //console.log("------------- WHEEL");
            //console.log(this.factory.getModel().length);
            //console.log(this.factory.getModelFiltered().length);
            //console.log("modelLen: " + modelLen);
            //console.log("sliderPostion: " + sliderPostion);
            // var silderValue = Math.floor(((modelLen - sliderPostion) / modelLen) * 100)
            // console.log("silderValue: " + silderValue);
            jQuery('#slider-vertical-' + model.factory.myInitId).slider("value", modelLen - model.displayrowscount - sliderPostion /*silderValue*/ );
            model.refreshView();
        },
        refreshView: function () {
            let POSITION = parseInt(this.positionInternal);
            if (isNaN(POSITION) || POSITION < 0) {
                this.positionInternal = 0;
                POSITION = 0;
            }
            console.log('refresh view new POSITION', POSITION);
            //console.log('refresh view new');

            let showSkip = this.showFilteredInternal || !this.useFiltersInternal;
            let model = this;
            let lines = showSkip ? this.factory.getModel() : this.factory.getModelFiltered();
            let len = lines.length;
            console.log("lines count", len);
            let spaceToEnd = len - this.displayrowscount;
            console.log("this.displayrowscount", this.displayrowscount);
            //if havily filtered then the minimum display is 'displayrowscount'
            if (spaceToEnd < this.displayrowscount) {
                spaceToEnd = this.displayrowscount
            }
            var backupHtml = model.container.innerHTML;
            model.container.innerHTML = "";

            var data = "";
            let counter = this.displayrowscount;
            while (POSITION >= 0 && POSITION < len && counter > 0) {
                var line = lines[POSITION];
                if (line !== undefined) {
                    var skipOrNotId = "rowdata";
                    if (this.showFilteredInternal) {
                        if (this.useFiltersInternal && line.skip) {
                            skipOrNotId = "skipline";
                        }
                    }
                    let lineContentEscaped = line.line.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                        return '&#' + i.charCodeAt(0) + ';';
                    });
                    var l = "<div id='" + line.rowid + "'>" + "<div class='rowIndex unselectable'> [" + line.rowid + "] </div><div id='" + skipOrNotId + "' class='theline-" + this.factory.myInitId + "'>" + lineContentEscaped + "</div></div>";
                    data += l;
                }
                POSITION++;
                counter--;
            }

            //model.container.innerHTML = data;
            document.getElementById('fast-text-view-' + model.factory.myInitId).innerHTML = data;

            var i = 1;
            if (this.useColors) {
                for (var f of this.highlightsInternal) {
                    if (f == undefined || f.value == undefined || f.value == "") {
                        continue;
                    }
                    //console.log('start');
                    $('.theline-' + this.factory.myInitId).each(function (index) {
                        //console.log('refresh..?');
                        $(this).highlight(f.value, "highlight" + i);
                    });
                    i++;
                }
            }
            //after render register for line click //todo unregister prev clicks - not sure needed.
            setTimeout(() => {
                $('#' + model.targetJump).css("background-color", "#2C2B2B");
                $('.theline-' + model.factory.myInitId).click(function () {
                    console.log("search click: for src id: " + model.factory.myInitId)
                    EventBus.$emit('jumpto', {
                        'value': $(this).parent().attr('id'),
                        'source': model.factory.myInitId,
                        'showFiltered': true
                    });
                });
            }, 1);

        },
        onParentResize: function () {
            console.log("onParentResize")
            let model = this

            var parentH = 0;
            if (!model.parentid) {
                parentH = document.documentElement.clientHeight - 64;
            } else {
                parentH = $('#' + model.parentid).height();
            }

            let newHeight = parentH;
            if (model.prevHeight != newHeight) {
                console.log("update height");
                model.prevHeight = newHeight;
                model.currentHeight = newHeight
                model.matchHeight();
            }
        },
        matchHeight: function () {
            console.log("matchHeight")
            let reqHeight = this.currentHeight;

            let rowElement = document.getElementById('rowdata');
            var v;
            var rowHeight = 21; //default
            if (rowElement) {
                v = rowElement.clientHeight;
                rowHeight = v > 0 ? v : 21;
            }
            this.displayrowscount = Math.round(reqHeight / rowHeight) - 4; //temp hack
            if (this.displayrowscount <= 0) {
                this.displayrowscount = 10;
            }
            console.log("Setting new displayrowscount", this.displayrowscount);
            jQuery('#slider-vertical-' + this.factory.myInitId).height(this.displayrowscount * rowHeight);
            this.refreshView();
        },
        setupSlider: function () {
            console.info("update Slider");
            let model = this
            let len = 0;
            if (model.showFilteredInternal || !model.useFiltersInternal) {
                len = model.factory.getModel().length
            } else {
                len = model.factory.getModelFiltered().length
            }
            jQuery('#slider-vertical-' + model.factory.myInitId).slider({
                orientation: "vertical",
                range: "min",
                min: 0,
                max: (len - model.displayrowscount),
                value: len - model.displayrowscount - model.positionInternal,
                slide: function (event, ui) {
                    var lineNum = parseInt(ui.value);
                    model.jumpToPosition(len - model.displayrowscount - lineNum, 0);
                }
            });
        }
    },
    created() {
        this.factory = (function () {
            let that = {};
            that.myInitId = myID;
            console.log('fast text view Created with id: ' + that.myInitId);
            myID++
            that.getModel = function () {
                return that.m;
            }
            that.setModel = function (model) {
                that.m = model.slice();
            }
            that.setModelFiltered = function (model) {
                that.modelFiltered = model.slice();
            }
            that.getModelFiltered = function (model) {
                return that.modelFiltered;
            }
            that.setOriginalModel = function (model) {
                that.origianlModel = model.slice();
            }
            that.getOriginalModel = function () {
                return that.origianlModel;
            }
            return that;
        })();
    },
    mounted: function () {
        console.log("fast text view mounted for id: " + this.factory.myInitId);
        let model = this;

        $('#logx-progress' + model.factory.myInitId).height(0).css("visibility", "hidden").css("margin", "0px");
        var hasFocus = false;
        $('#fast-text-view-' + model.factory.myInitId).mouseover(function () {
            //console.log('mouseover');
            hasFocus = true;
        });

        $('#fast-text-view-' + model.factory.myInitId).mouseout(function () {
            //console.log('mouseout');
            hasFocus = false;
        });

        $(window).keydown(function (event) {
            if (!hasFocus) {
                //console.log('skip key');
                return;
            }
            console.log("keyCode", event.keyCode)
            if (event.keyCode == 40) {
                //arrow up
                var up = model.positionInternal + 1;
                console.log("up", up)
                model.jumpToPosition(up);
            } else if (event.keyCode == 38) {
                //arrow down
                var down = model.positionInternal - 1;
                model.jumpToPosition(down);
            } else if (event.keyCode == 36) {
                //Home
                var pos = 0;
                console.log("Home clicked jump to: " + pos);
                model.jumpToPosition(pos);
            } else if (event.keyCode == 35) {
                //End
                var pos = model.showFilteredInternal || !model.useFiltersInternal ? (model.factory.getModel().length - 1) : (model.factory.getModelFiltered().length - 1)
                console.log("End clicked jump to: " + pos);
                model.jumpToPosition(pos);
            } else if (event.keyCode == 33) {
                //page up
                var up = model.positionInternal - model.displayrowscount;
                model.jumpToPosition(up);
            } else if (event.keyCode == 34) {
                //page down
                var down = model.positionInternal + model.displayrowscount;
                model.jumpToPosition(down);
            }
        });

        //save reference to container to render all line to
        model.container = document.getElementById('fast-text-view-' + model.factory.myInitId);
        //let mainC = $('#fast-text-view-' + model.factory.myInitId);
        var preEvent;
        $(document).ready(function () {
            console.log("TextView: html ready - Render");
            model.updateLinesModel(true);
            model.setupSlider();
            setTimeout(() => {
                model.onParentResize();
            }, 0);
        });
        $(document).on("mousedown", function (event) {
            let found = $(".fast-text-view-class").has(event.target).length > 0;
            if (found) {
                return;
            }
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize mousedown');
                model.onParentResize();
            }, 300);
        });
        $(document).on("mouseup", function (event) {
            let found = $(".fast-text-view-class").has(event.target).length > 0;
            if (found) {
                return;
            }
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.error('onParentResize mouseup');
                model.onParentResize();
            }, 300);
        });
        window.addEventListener('resize', function (e) {
            e.preventDefault();
            console.log("window resize");
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize resize');
                model.onParentResize();
            }, 300);
        });
        // setTimeout(() => {
        //     model.onParentResize();
        // }, 350);

        if (!model.lines || model.lines.length <= 0) {
            model.factory.setModel(["no data 2"]);
            model.factory.setOriginalModel(["no data 2"]);
            model.factory.setModelFiltered(["no data 2"]);
        } else {
            model.factory.setModel(model.lines);
            model.factory.setOriginalModel(model.lines)
            model.factory.setModelFiltered(model.lines);
        }
        model.highlightsInternal = model.highlights ? model.highlights : [];
        model.filtersInternal = model.filters ? model.filters : [];
        model.exfiltersInternal = model.exfilters ? model.exfilters : [];

        this.$nextTick(function () {
            init(model.factory);
            model.ready = true;
            console.log("register double click to highlight color a word");
            $('#fast-text-view-' + model.factory.myInitId).dblclick(function () {
                var seltxt = getSelText();
                EventBus.$emit('textSelection', seltxt);
            });
        })

        var prevDelta = 0;
        var lastEventTimestamp = 0;

        function mouseWheelEvent(e) {
            ////console.log("wheel");
            var currentTimestamp = Date.now();
            if (currentTimestamp - lastEventTimestamp < 50) {
                ////console.log(" skip: " + (currentTimestamp - lastEventTimestamp));
                return;
            }
            var inrowEvents = (currentTimestamp - lastEventTimestamp < 100);
            if (!inrowEvents) {
                prevDelta = 0;
            }
            lastEventTimestamp = currentTimestamp;
            //console.log("====================================");
            //console.log(" -e.detail: " + -e.detail);
            //console.log(" -e.wheelDelta: " + -e.wheelDelta);
            //console.log(" event.deltaX: " + event.deltaX);
            //console.log(" event.deltaY: " + event.deltaY);
            //console.log(" event.deltaMode: " + event.deltaMode);
            //var delta = e.wheelDelta ? e.wheelDelta : -e.detail;
            var delta = -event.deltaY;
            let direction = delta > 0 ? -1 : 1;
            //console.log("delta: " + delta);
            //console.log("direction: " + model.direction);
            if ((prevDelta + delta) > 5 || (prevDelta + delta) < -5) {
                //console.log(" event.deltaMode: " + event.deltaMode);
                delta = prevDelta + delta;
                prevDelta = 0;
            }
            if (delta >= 0 && delta <= 5) {
                prevDelta += delta;
                //console.log(" prevDelta: " + prevDelta);
                return;
            }
            if (delta <= 0 && delta >= -5) {
                prevDelta += delta;
                //console.log(" prevDelta: " + prevDelta);
                return;
            }
            delta = Math.round(delta / 3.0);
            //console.log(" delta: " + delta);
            //delta+=prevDelta;
            let newPosition = model.positionInternal + Math.round(delta * -1);
            model.jumpToPosition(newPosition);
        }
        console.log("register mouse wheel");
        document.getElementById('fast-text-view-' + model.factory.myInitId).addEventListener('mousewheel', mouseWheelEvent);
    }
}

function getSelText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function init(factory) {
    console.log("init highlight jquery");
    global.jQuery.fn.removeHighlight = function () {
        function newNormalize(node) {
            for (var i = 0, children = node.childNodes, nodeCount = children.length; i < nodeCount; i++) {
                var child = children[i];
                if (child.nodeType == 1) {
                    newNormalize(child);
                    continue;
                }
                if (child.nodeType != 3) {
                    continue;
                }
                var next = child.nextSibling;
                if (next == null || next.nodeType != 3) {
                    continue;
                }
                var combined_text = child.nodeValue + next.nodeValue;
                new_node = node.ownerDocument.createTextNode(combined_text);
                node.insertBefore(new_node, child);
                node.removeChild(child);
                node.removeChild(next);
                i--;
                nodeCount--;
            }
        }
        return this.find("span").each(function () {
            var thisParent = this.parentNode;
            thisParent.replaceChild(this.firstChild, this);
            newNormalize(thisParent);
        }).end();
    };

    jQuery.fn.highlight = function (pat, cName) {
        function innerHighlight(node, pat) {
            var skip = 0;
            if (node.nodeType == 3) {
                var pos = node.data.toUpperCase().indexOf(pat);
                if (pos >= 0) {
                    var spannode = document.createElement('span');
                    spannode.className = cName; //'highlight';
                    var middlebit = node.splitText(pos);
                    var endbit = middlebit.splitText(pat.length);
                    var middleclone = middlebit.cloneNode(true);
                    spannode.appendChild(middleclone);
                    middlebit.parentNode.replaceChild(spannode, middlebit);
                    skip = 1;
                }
            } else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                for (var i = 0; i < node.childNodes.length; ++i) {
                    i += innerHighlight(node.childNodes[i], pat);
                }
            }
            return skip;
        }
        return this.each(function () {
            innerHighlight(this, pat.toUpperCase());
        });
    };
}
</script>

<style>
.fast-text-view-class {
    overflow-x: hidden;
    overflow-y: hidden;
    width: 100%;
    height: 100%;
    max-height: 100%;
    margin: 0;
    color: greenyellow;
    font-size: 14px;
    white-space: nowrap;
    background-color: black;
}

.unselectable {
    user-select: none;

    -khtml-user-select: none;
    -webkit-user-select: none;
    -moz-user-select: -moz-none;
    -o-user-select: none;
}

.rownumber {
    display: inline;
    margin-right: 5px;
    color: gray;
}

.rowIndex {
    display: inline-block;
    margin-right: 15px;
    color: gray;
}

#rowdata {
    display: inline-block;
    display: inline-block;
    color: greenyellow;
}

#skipline {
    display: inline-block;
    display: inline-block;
    color: grey;
}

.highlight1 {
    /* Opera 10.5+, IE 9.0 */
    color: black;
    background-color: #fff34d;
    /* Saf3.0+, Chrome */
    box-shadow: 0 1px 3px rgba(0, 0, 0, .7);
    /* Saf3-4 */
    border-radius: 3px;
    /* FF1+ */

    -webkit-border-radius: 3px;
    -moz-border-radius: 3px;
    /* FF3.5+ */
    -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, .7);
    /* Opera 10.5, IE 9, Saf5, Chrome */
    -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, .7);
}
</style>
