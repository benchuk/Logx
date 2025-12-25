<template>
<div class="fast-text-view-wrapper" style="position: relative; height: 100%; width: 100%; max-width: 100%; min-width: 0; overflow: hidden;">
    
    <!-- <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <link rel="stylesheet" href="/resources/demos/style.css"> -->
    <div v-bind:id="'slider-vertical-'+ factory.myInitId" style="position: absolute; right: 4px;"></div>
    <v-progress-linear v-bind:id="'logx-progress' + factory.myInitId" :indeterminate="true" style="height:2px"></v-progress-linear>
    <div v-bind:id="'fast-text-view-' + factory.myInitId" :class="['fast-text-view-class', { 'wrap-lines': wrap }]">
        <div align=left v-bind:id="'logs-container-' + factory.myInitId" class='logrow'>
            <div class='rownumber'>[0]</div>no data default

        </div>
    </div>
    <!-- ======== SCROLL TO TOP ======================================== -->
    <v-btn v-if="showScrollToTop" color="green" absolute dark fab top right small @click.stop="jumpToPosition(0)">
        <v-icon small>vertical_align_top</v-icon>
    </v-btn>
    <!-- ======== SCROLL TO BOTTOM (Auto-Scroll) ======================================== -->
    <v-btn v-if="!autoScroll" color="blue" absolute dark fab bottom right small style="bottom: 40px; right: 30px; z-index: 1;" @click.stop="scrollToBottom">
        <v-icon small>arrow_downward</v-icon>
    </v-btn>
</div>
</template>

<script>
window.$ = window.jQuery = require('jquery');
require('jquery-ui-dist/jquery-ui')
require("jquery-ui-dist/jquery-ui.css");
require("jquery-ui-dist/jquery-ui.theme.css");
//window.$ = $.extend(require('jquery-ui'));

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
    props: ['lines', 'position', 'height', 'highlights', 'filters', 'exfilters', 'ident', 'parentid', 'useFilters', 'useExFilters', 'useColors', 'showFiltered', 'wrap'],
    computed: {
        showScrollToTop: function() {
            console.log('ssssss')
            let model = this
            if (!model.factory || !model.factory.getModel() || !model.factory.getModelFiltered()) {
                return false
            }
            if (model.showFilteredInternal || !model.useFiltersInternal) {
                return model.positionInternal / model.factory.getModel().length > 0.2
            } else {
                return model.positionInternal / model.factory.getModelFiltered().length > 0.2
            }

        }
    },
    watch: {
        wrap(val) {
            this.refreshView();
        },
        showFiltered(val, oldval) {
            let model = this;
            if (this.showFilteredInternal == val) {
                return;
            }

            this.showFilteredInternal = val;
            if (model.useFiltersInternal) {
                this.handlePosition(val);
            }
            model.setupSlider();
            model.refreshView();
        },
        position(val, oldval) {
            let model = this;
            if (val.source == this.factory.myInitId) {
                return;
            }

            setTimeout(() => {
                EventBus.$emit('showingFiltered', true);
            }, 0);

            this.showFilteredInternal = true;

            let parsedRowId = parseInt(val.value);
            
            // Find the index of this rowId in the current model
            let lines = (this.showFilteredInternal || !this.useFiltersInternal) ? this.factory.getModel() : this.factory.getModelFiltered();
            let targetIndex = -1;
            
            // Optimization: if we are in main logger and it's not filtered, index == rowid
            if (this.ident === 'main-logger' && !this.useFiltersInternal) {
                targetIndex = parsedRowId;
            } else {
                // Find index by rowid
                targetIndex = lines.findIndex(l => l.rowid === parsedRowId);
                
                // If not found (e.g. search tab doesn't have this exact line), 
                // find the NEAREST visible line to keep sync
                if (targetIndex === -1 && val.sync) {
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].rowid >= parsedRowId) {
                            targetIndex = i;
                            break;
                        }
                    }
                }
            }

            if (targetIndex !== -1) {
                if (!val.sync) {
                    setTimeout(() => {
                        $("#" + parsedRowId).fadeOut("slow", function () {
                            $("#" + parsedRowId).fadeIn("slow", function () {
                            });
                        });
                    }, 0);
                }
                model.targetJump = parsedRowId;
                model.jumpToPosition(targetIndex);
            }
        },
        lines(val, oldval) {
            let model = this;
            if (!model.ready) {
                return;
            }

            if (val === undefined || val.length <= 0) {
                model.factory.setModel(["no data 3"]);
                model.factory.setModelFiltered(["no data 3"]);
                model.factory.setOriginalModel(["no data 3"]);
                model.prevLineCount = 0;
                return;
            }

            // Vue 2 gotcha: When array is mutated, oldval and val are the same reference
            const currentLen = val.length;
            const prevLen = model.prevLineCount || 0;
            
            const isReferencePreserved = val === oldval;
            const isAppend = isReferencePreserved && prevLen > 0 && currentLen > prevLen;
            
            model.prevLineCount = currentLen;
            
            if (isAppend && model.autoScroll) {
                if (model.streamUpdateTimer) {
                    clearTimeout(model.streamUpdateTimer);
                }
                model.streamUpdateTimer = setTimeout(() => {
                    model.updateLinesModel(true);
                    let lines = (model.showFilteredInternal || !model.useFiltersInternal) ? model.factory.getModel() : model.factory.getModelFiltered();
                    let len = lines ? lines.length : 0;
                    model.positionInternal = Math.max(0, len - model.displayrowscount);
                    model.refreshView();
                }, 50);
            } else if (isAppend && !model.autoScroll) {
                if (model.streamUpdateTimer) {
                    clearTimeout(model.streamUpdateTimer);
                }
                model.streamUpdateTimer = setTimeout(() => {
                    model.updateLinesModel(true);
                    let lines = (model.showFilteredInternal || !model.useFiltersInternal) ? model.factory.getModel() : model.factory.getModelFiltered();
                    let len = lines ? lines.length : 0;
                    let newMax = Math.max(0, len - model.displayrowscount);
                    let slider = jQuery('#slider-vertical-' + model.factory.myInitId);
                    slider.slider("option", "max", newMax);
                    model.refreshView();
                }, 100);
            } else {
                model.updateLinesModel(false);
                model.positionInternal = 0;
                model.setupSlider();
                model.onParentResize();
                model.refreshView();
            }
        },
        'useFilters': {
            handler: function (val) {
                if (!this.ready) return;
                let model = this;
                model.useFiltersInternal = val;
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
                if (!this.ready) return;
                let model = this;
                model.exfiltersInternal = val ? model.exfilters : [];
                model.refreshView();
            },
            deep: true
        },
        'useColors': {
            handler: function (val) {
                if (!this.ready) return;
                let model = this;
                model.highlightsInternal = val ? model.highlights : [];
                model.refreshView();
            },
            deep: true
        },
        'highlights': {
            handler: function (val) {
                if (!this.ready) return;
                let model = this;
                console.log(model.ident + " : highlights prop watch: ", val);
                model.highlightsInternal = val ? val : [];
                if (model.useColorsInternal) {
                    model.refreshView();
                }
            },
            deep: true
        },
        'filters': {
            handler: function (val) {
                if (!this.ready) return;
                let model = this;
                console.log(model.ident + " : filters prop watch: ", val);
                model.filtersInternal = val ? val : [];
                if (model.useFiltersInternal) {
                    model.updateLinesModel(true);
                    model.setupSlider();
                    model.refreshView();
                }
            },
            deep: true
        },
        'exfilters': {
            handler: function (val) {
                if (!this.ready) return;
                let model = this;
                console.log(model.ident + " : exfilters prop watch: ", val);
                model.exfiltersInternal = val ? val : [];
                if (model.useExFiltersInternal) {
                    model.updateLinesModel(true);
                    model.setupSlider();
                    model.refreshView();
                }
            },
            deep: true
        }
    },
    data: () => ({
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
            positionInternal : 0,
            prevHeight: -1,
            autoScroll: true,
            streamUpdateTimer: null,
            prevLineCount: 0,
            mainFooterHeight: 0
        }),
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
                
                // DEBUG logging
                console.log("DEBUG - updateLinesModel running");
                console.log("DEBUG - filtersInternal:", JSON.stringify(model.filtersInternal));
                console.log("DEBUG - useFilters prop:", model.useFilters);
                console.log("DEBUG - useFiltersInternal:", model.useFiltersInternal);
                console.log("DEBUG - lines count:", model.lines ? model.lines.length : 0);

                model.factory.setOriginalModel(model.lines);
                model.factory.setModel([]);
                model.factory.setModelFiltered([]);
                let m = model.factory.getModel();
                let modelFiltered = model.factory.getModelFiltered();
                var counter = -1;
                var didPositionInit = !shouldInitIndex;
                var theFilters = model.filtersInternal ? model.filtersInternal.unique() : [];
                var theExFilters = model.exfiltersInternal ? model.exfiltersInternal.unique() : [];
                
                console.log("DEBUG - theFilters after unique():", theFilters);
                
                let LINES = model.lines;
                let LINES_LEN = LINES.length;
                var line = "";
                for (var counter = 0; counter < LINES_LEN; counter++) {

                    line = LINES[counter];
                    var skipLine = false;
                    if (model.useExFiltersInternal) {
                        for (var exf of theExFilters) {
                        if (exf && exf.value && line.toLowerCase().includes(exf.value.toLowerCase())) {
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
                    if (f && f.value && line.toLowerCase().includes(f.value.toLowerCase())) {
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
                //console.log("Skip jump - nothing to render - reached end of files: " + POSITION);
                this.positionInternal = spaceToEnd;
                POSITION = spaceToEnd;
            }

            if (POSITION < 0) {
                //console.log("invalid position - setting to zero");
                this.positionInternal = 0;
                POSITION = 0;
            }

            if (POSITION == this.positionInternal) {
                //console.log("Skip jump - nothing to render - position is the same: " + POSITION);
            }
            this.positionInternal = POSITION;
            
            this.positionInternal = POSITION;
            
            // Sync with other views REMOVED as per user request (independent scrolling)
            /*
            if (this.syncScrollTimer) {
                clearTimeout(this.syncScrollTimer);
            }
            this.syncScrollTimer = setTimeout(() => {
                let lines = (this.showFilteredInternal || !this.useFiltersInternal) ? this.factory.getModel() : this.factory.getModelFiltered();
                let topLine = lines[this.positionInternal];
                if (topLine && topLine.rowid !== undefined) {
                    EventBus.$emit('jumpto', {
                        'value': topLine.rowid,
                        'source': this.factory.myInitId,
                        'sourceIdent': this.ident,
                        'showFiltered': true,
                        'sync': true // Flag to skip animation
                    });
                }
            }, 50);
            */

            //console.log("this.positionInternal",this.positionInternal);

            //console.log("this.positionInternal",this.positionInternal);
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
            //console.log('refresh view new POSITION', POSITION);
            //console.log('refresh view new');

            let showSkip = this.showFilteredInternal || !this.useFiltersInternal;
            let model = this;
            let lines = showSkip ? this.factory.getModel() : this.factory.getModelFiltered();
            let len = lines.length;
            //console.log("lines count", len);
            let spaceToEnd = len - this.displayrowscount;
            //console.log("this.displayrowscount", this.displayrowscount);
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
                    var skipOrNotId = "rowdata-" + this.factory.myInitId;
                    if (this.showFilteredInternal) {
                        if (this.useFiltersInternal && line.skip) {
                            skipOrNotId = "skipline-" + this.factory.myInitId;
                        }
                    }
                    let lineContentEscaped = line.line.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                        return '&#' + i.charCodeAt(0) + ';';
                    });
                    
                    //lineContentEscaped = lineContentEscaped.replace(/ /g, '\u00a0');
                    //lineContentEscaped = lineContentEscaped.replace(/^\s+|\s+$/g, '\u00a0');
                    var l = "<div id='" + line.rowid + "'>" + "<div class='rowIndex unselectable'> [" + line.rowid + "] </div><div id='" + skipOrNotId + "' class='theline-" + this.factory.myInitId + "'>" + lineContentEscaped + "</div></div>";
                    data += l;
                }
                POSITION++;
                counter--;
            }

            model.container.innerHTML = data;
            //document.getElementById('fast-text-view-' + model.factory.myInitId).innerHTML = data;

            if (this.useColors) {
                this.highlightsInternal.forEach((f, idx) => {
                    if (f == undefined || f.value == undefined || f.value == "") {
                        return;
                    }
                    const highlightId = idx + 1;
                    $('.theline-' + this.factory.myInitId).each(function (index) {
                        $(this).highlight(f.value, "highlight" + highlightId);
                    });
                });
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
            
            // Calculate global timeline range for marker
            let startRowId = 0;
            let endRowId = 0;
            if (lines.length > 0) {
                let startIdx = parseInt(model.positionInternal);
                if (startIdx < 0) startIdx = 0;
                if (startIdx >= lines.length) startIdx = lines.length - 1;
                
                let endIdx = startIdx + model.displayrowscount;
                if (endIdx >= lines.length) endIdx = lines.length - 1;
                
                startRowId = lines[startIdx] ? lines[startIdx].rowid : 0;
                endRowId = lines[endIdx] ? lines[endIdx].rowid : 0;
            }

            this.$emit('view-scroll', { 
                startRowId: startRowId,
                endRowId: endRowId 
            });

        },
        onParentResize: function () {
            //console.log("onParentResize")
            let model = this

            var parentH = 0;
            if (!model.parentid) {
                // Determine top offset dynamically
                let topOffset = 64; // Default toolbar height
                if (model.$el) {
                    const rect = model.$el.getBoundingClientRect();
                    if (rect.top > 0) {
                        topOffset = rect.top;
                    }
                }
                
                // If main logger, subtract dynamic top offset AND dynamic footer height
                // Also subtract a small buffer (e.g., 5px) to prevent borderline overflow
                parentH = document.documentElement.clientHeight - topOffset - (model.mainFooterHeight || 0) - 5;
            } else {
                let parentEl = $('#' + model.parentid);
                if (parentEl.length > 0) {
                    parentH = parentEl.height() || 0;
                    
                    // If the parent is the footer, we need to subtract space for tabs and resizer
                    if (model.parentid === 'theFooter') {
                        parentH -= 65; // Approximate height for tabs header + resizer
                    }
                } else {
                    console.log("WARN - parent element not found:", model.parentid);
                    parentH = 0;
                }
                
                // Fallback: If measured parent height is suspiciously low but component is in DOM
                if ((!parentH || parentH < 100) && model.$el && model.$el.parentElement) {
                    let localH = model.$el.parentElement.clientHeight;
                    if (localH > parentH) {
                        console.log("DEBUG - using local parent height:", localH, "instead of", parentH);
                        parentH = localH;
                    }
                }
                
                // Final safety
                if (isNaN(parentH) || parentH < 0) parentH = 0;
                
                console.log("DEBUG - parentid:", model.parentid, "calculated parentH:", parentH);
            }

            let newHeight = parentH;
            if (model.prevHeight != newHeight || newHeight == 0) {
                console.log("update height to:", newHeight);
                model.prevHeight = newHeight;
                model.currentHeight = newHeight
                model.matchHeight();
            }
        },
        matchHeight: function () {
            let reqHeight = this.currentHeight;
            if (isNaN(reqHeight) || reqHeight <= 0) {
                console.log("matchHeight - invalid reqHeight:", reqHeight);
                reqHeight = 300; // Fallback height
            }

            let rowElement = document.getElementById('rowdata-' + this.factory.myInitId);
            var v;
            var rowHeight = 21; //default
            if (rowElement) {
                v = rowElement.clientHeight;
                rowHeight = v > 0 ? v : 21;
            } else {
                // If we don't have rows yet, try to find ANY row to guess height
                let anyRow = document.querySelector('[id^="rowdata-"]');
                if (anyRow) rowHeight = anyRow.clientHeight || 21;
            }
            
            this.displayrowscount = Math.round(reqHeight / rowHeight) - 2; 
            if (this.displayrowscount <= 0) {
                this.displayrowscount = 10;
            }
            console.log("matchHeight - reqHeight:", reqHeight, "rowHeight:", rowHeight, "count:", this.displayrowscount);
            jQuery('#slider-vertical-' + this.factory.myInitId).height(this.displayrowscount * rowHeight);
            this.refreshView();
            
            // If we guessed the row height (rowElement was null), re-match after render
            if (!rowElement && !this.reMatchAttempted) {
                this.reMatchAttempted = true;
                setTimeout(() => {
                    this.matchHeight();
                }, 200);
            }
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
        },
        updateSliderForStream: function() {
            // Incrementally update slider for streaming without full re-initialization
            let model = this;
            let len = 0;
            if (model.showFilteredInternal || !model.useFiltersInternal) {
                len = model.factory.getModel().length
            } else {
                len = model.factory.getModelFiltered().length
            }
            let newMax = Math.max(0, len - model.displayrowscount);
            
            // If auto-scroll is enabled, just update position to stay at bottom
            // Don't touch the slider at all to prevent visual jumping
            if (model.autoScroll) {
                model.positionInternal = newMax;
                // Only update slider max silently, without changing value visually
                let slider = jQuery('#slider-vertical-' + model.factory.myInitId);
                slider.slider("option", "max", newMax);
                // Keep slider handle at bottom (value 0 in inverted logic)
                slider.slider("option", "value", 0);
            } else {
                // User is scrolling manually - keep their position stable
                // Update max but recalculate value to keep same visual position
                let slider = jQuery('#slider-vertical-' + model.factory.myInitId);
                slider.slider("option", "max", newMax);
                // The visual position of the slider should stay where the user left it
                // positionInternal stays the same, so the value should reflect that
                let newValue = Math.max(0, newMax - model.positionInternal);
                slider.slider("option", "value", newValue);
            }
        },
        scrollToBottom: function() {
            let model = this;
            model.autoScroll = true;
            let lines = (model.showFilteredInternal || !model.useFiltersInternal) ? model.factory.getModel() : model.factory.getModelFiltered();
            let len = lines ? lines.length : 0;
            let targetPos = Math.max(0, len - model.displayrowscount);
            model.jumpToPosition(targetPos);
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
    beforeDestroy() {
        console.log("fast text view beforeDestroy for id: " + this.factory.myInitId);
        let model = this;
        
        // Unregister EventBus listeners
        EventBus.$off('footer-resized', this.onFooterResizedEvent);
        
        // Unregister jQuery document listeners
        $(document).off("mousedown", this.onDocumentMouseDown);
        $(document).off("mouseup", this.onDocumentMouseUp);
        
        const myEl = $('#fast-text-view-' + model.factory.myInitId);
        myEl.off('mouseover', this.onMouseOver);
        myEl.off('mouseout', this.onMouseOut);
        myEl.off('dblclick', this.onDoubleClick);
        
        // Unregister window listeners
        window.removeEventListener('resize', this.onWindowResize);
        $(window).off("keydown", this.onWindowKeyDown);
        
        // Unregister element wheel listener
        const scrollEl = document.getElementById('fast-text-view-' + model.factory.myInitId);
        if (scrollEl) {
            scrollEl.removeEventListener('wheel', this.onMouseWheel);
        }
        
        // Clear any pending timers
        if (this.streamUpdateTimer) clearTimeout(this.streamUpdateTimer);
        if (this.filtersHandler) clearTimeout(this.filtersHandler);
        if (this.syncScrollTimer) clearTimeout(this.syncScrollTimer);
    },
    mounted: function () {
        console.log("fast text view mounted for id: " + this.factory.myInitId);
        let model = this;

        $('#logx-progress' + model.factory.myInitId).height(0).css("visibility", "hidden").css("margin", "0px");
        var hasFocus = false;
        this.onMouseOver = function () {
            //console.log('mouseover');
            hasFocus = true;
        };
        $('#fast-text-view-' + model.factory.myInitId).on('mouseover', this.onMouseOver);

        this.onMouseOut = function () {
            //console.log('mouseout');
            hasFocus = false;
        };
        $('#fast-text-view-' + model.factory.myInitId).on('mouseout', this.onMouseOut);

        this.onWindowKeyDown = function (event) {
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
        };
        $(window).on("keydown", this.onWindowKeyDown);

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

        // Use named methods for listeners to allow cleanup
        this.onDocumentMouseDown = (event) => {
            let found = $(".fast-text-view-class").has(event.target).length > 0;
            if (found) {
                return;
            }
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize mousedown');
                model.onParentResize();
            }, 300);
        };
        $(document).on("mousedown", this.onDocumentMouseDown);

        this.onDocumentMouseUp = (event) => {
            let found = $(".fast-text-view-class").has(event.target).length > 0;
            if (found) {
                return;
            }
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.error('onParentResize mouseup');
                model.onParentResize();
            }, 300);
        };
        $(document).on("mouseup", this.onDocumentMouseUp);

        this.onWindowResize = (e) => {
            e.preventDefault();
            console.log("window resize");
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize resize');
                model.onParentResize();
            }, 300);
        };
        window.addEventListener('resize', this.onWindowResize);

        this.onFooterResizedEvent = (newHeight) => {
            console.log("FastTextView received footer-resized event for ID:", model.factory.myInitId, "Height:", newHeight);
            model.mainFooterHeight = newHeight;
            model.onParentResize();
        };
        EventBus.$on('footer-resized', this.onFooterResizedEvent);

        // Initial model setup
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
        model.showFilteredInternal = model.showFiltered !== undefined ? model.showFiltered : false;
        model.useFiltersInternal = model.useFilters !== undefined ? model.useFilters : false;
        model.useExFiltersInternal = model.useExFilters !== undefined ? model.useExFilters : true;
        model.useColorsInternal = model.useColors !== undefined ? model.useColors : true;
        model.wrapInternal = model.wrap !== undefined ? model.wrap : false;

        this.$nextTick(function () {
            init(model.factory);
            model.ready = true;
            
            // Critical: Force initial layout and filter application
            setTimeout(() => {
                model.onParentResize();
                if (model.useFiltersInternal) {
                    console.log("Initial updateLinesModel for filters");
                    model.updateLinesModel(true);
                }
                model.refreshView();
            }, 100);
            
            console.log("register double click to highlight color a word");
            this.onDoubleClick = function () {
                var seltxt = getSelText();
                EventBus.$emit('textSelection', seltxt);
            };
            $('#fast-text-view-' + model.factory.myInitId).on('dblclick', this.onDoubleClick);

            console.log("register wheel event");
            const scrollEl = document.getElementById('fast-text-view-' + model.factory.myInitId);
            if (scrollEl) {
                // Ensure we use the named function for removal support
                scrollEl.addEventListener('wheel', this.onMouseWheel, {
                    passive: false
                });
            }
        });

        var prevDelta = 0;
        var lastEventTimestamp = 0;

        this.onMouseWheel = function (e) {
            // Prevent default browser scroll behavior immediately to stop bubbling
            e.preventDefault();
            e.stopPropagation();

            var currentTimestamp = Date.now();
            if (currentTimestamp - lastEventTimestamp < 30) {
                return;
            }

            var inrowEvents = (currentTimestamp - lastEventTimestamp < 100);
            if (!inrowEvents) {
                prevDelta = 0;
            }
            lastEventTimestamp = currentTimestamp;
            
            var delta = -e.deltaY;
            let direction = delta > 0 ? -1 : 1;
            
            if ((prevDelta + delta) > 5 || (prevDelta + delta) < -5) {
                delta = prevDelta + delta;
                prevDelta = 0;
            }
            if (delta >= 0 && delta <= 5) {
                prevDelta += delta;
                return;
            }
            if (delta <= 0 && delta >= -5) {
                prevDelta += delta;
                return;
            }
            delta = Math.round(delta / 3.0);
            let newPosition = model.positionInternal + Math.round(delta * -1);
            
            // Pause auto-scroll when user scrolls up
            if (delta > 0) { // Scrolling up
                model.autoScroll = false;
            } else { // Scrolling down
                let lines = (model.showFilteredInternal || !model.useFiltersInternal) ? model.factory.getModel() : model.factory.getModelFiltered();
                let len = lines ? lines.length : 0;
                let bottomPos = Math.max(0, len - model.displayrowscount);
                if (newPosition >= bottomPos) {
                    model.autoScroll = true;
                }
            }
            
            model.jumpToPosition(newPosition);
        }
        
        // Removed: Registration now happens in $nextTick above for better reliability
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
    jQuery.fn.removeHighlight = function () {
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
                var new_node = node.ownerDocument.createTextNode(combined_text);
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
                    middlebit.splitText(pat.length);
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
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    margin: 0;
    color: greenyellow;
    font-size: 14px;
    white-space: nowrap;
    background-color: black;
}

.fast-text-view-class.wrap-lines {
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-all;
}

.fast-text-view-class.wrap-lines .rowIndex {
    vertical-align: top;
}

.fast-text-view-class.wrap-lines [id^='rowdata-'], 
.fast-text-view-class.wrap-lines [id^='skipline-'] {
    display: inline;
    white-space: pre-wrap;
    word-break: break-all;
}

.fast-text-view-class::-webkit-scrollbar {
    height: 8px;
    background-color: #343436;
}

.fast-text-view-class::-webkit-scrollbar-thumb {
    background: gray;
    border-radius: 4px;
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

[id^='rowdata-'] {
    display: inline-block;
    display: inline-block;
    color: greenyellow;
}

[id^='skipline-'] {
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
