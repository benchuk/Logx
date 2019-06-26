<template>
<div>
    <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <link rel="stylesheet" href="/resources/demos/style.css">
    <v-progress-linear v-bind:id="'logx-progress' + factory.myInitId" :indeterminate="true" style="height:2px"></v-progress-linear>

    <div v-bind:id="'fast-text-view-' + factory.myInitId" class="fast-text-view-class">

        <div align=left id='logs-container' class='logrow'>
            <div class='rownumber'>[0]</div>no data default

        </div>
    </div>
    <div id="slider-vertical" style="height:90%;  position: fixed;  top: 70px;right: 5px;"></div>

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

            //console.log(model.ident + " :  ^^^^ showFiltered watch: " + val);
            //console.log(val);
            this.showFilteredInternal = val;
            this.isJumping = val;
            model.refreshView();
        },
        position(val, oldval) {
            let model = this;

            //console.log(model.ident + " :  $ position watch: " + val);
            //console.log(val);
            if (val.source == this.factory.myInitId) {
                //console.log('skip self generated event');
                return;
            }
            if (model.lowerPosition == val.value) {
                //console.log('skip same position');
                return;
            }
            this.direction = 1;
            model.isJumping = true;
            //if (val.showFiltered) {
            EventBus.$emit('showingFiltered', true);
            //}
            let parsedPosition = parseInt(val.value);
            if (parsedPosition < 0) {
                parsedPosition = 0;
            }
            model.targetJump = parsedPosition;
            //console.log('position changed');
            model.jumpToPosition(parsedPosition, parsedPosition + this.displayrowscount);
        },
        height(val, oldval) {
            ////console.log(this.ident + " : !!!!!!!!!!!!!!!!!!!!!!!! height watch: " + val);
            //this.currentHeight = val;
            //this.matchHeight();
            //this.jumpToPosition(this.currentPosition);
        },
        lines(val, oldval) {
            ////console.log(this);
            let model = this;
            if (!model.ready) {
                return;
            }
            //console.log(model.ident + " : ~~~~~~~~~~~~~~~~~ lines watch: ");
            if (val === undefined || val.length <= 0) {
                //console.error(model.ident + " : ~~~~~~~~~~~~~~~~~ !invalid data lines watch: " + val);
                model.factory.setModel(["no data 3"]);
                model.factory.setOriginalModel(["no data 3"]);
                //console.log(model);
            } else {
                model.factory.setModel(val);
                model.factory.setOriginalModel(val);
            }
            this.direction = 1;
            model.updateLinesModel(true);
            model.refreshView();
        },
        'useFilters': {
            handler: function (val) {
                if (!this.ready) {
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- useFilters watch: " + val);
                model.filtersInternal = val ? model.filters : [];
                model.direction = 1;

                model.updateLinesModel(true);
                model.refreshView();
            },
            deep: true
        },
        'useExFilters': {
            handler: function (val) {
                if (!this.ready) {
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- exfiltersInternal watch: " + val);
                model.exfiltersInternal = val ? model.exfilters : [];
                model.direction = 1;

                model.updateLinesModel(true);
                model.refreshView();
            },
            deep: true
        },
        'useColors': {
            handler: function (val) {
                if (!this.ready) {
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- useColors watch: " + val);
                model.highlightsInternal = val ? model.highlights : [];
                //model.direction = 1;
                //model.updateLinesModel(true);
                model.refreshView();
            },
            deep: true
        },
        'highlights': {
            handler: function (val) {
                if (!this.ready) {
                    return;
                }
                let model = this;
                //console.log(model.ident + " : -------- highlights watch: " + val);
                model.highlightsInternal = val;
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
                        //console.log("skip... ex filter");
                        return;
                    }
                    //this.currentPosition = 0;
                    model.exfiltersInternal = val;
                    model.direction = 1;
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
                    //this.currentPosition = 0;
                    if (val && val[val.length - 1] && (val[val.length - 1].value == undefined || val[val.length - 1].value.length <= 0)) {
                        //console.log("skip... filter");
                        return;
                    }
                    model.filtersInternal = val;
                    model.direction = 1;

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
            direction: 1,
            showFilteredInternal: false,
            ready: false,
            factory: {},
            displayrowscount: 20,
            lowerPosition: 0,
            upperPosition: 0,
            currentHeight: 10,
            highlightsInternal: [],
            filtersInternal: [],
            exfiltersInternal: [],
            useFiltersInternal: true,
            useExFiltersInternal: true,
            isJumping: false
        }
    },
    methods: {
        updateLinesModel: function (shouldInitIndex) {

            let model = this;

            //wraping this with a function make performance better!
            //https://stackoverflow.com/questions/29387950/performance-of-google-chrome-vs-nodejs-v8
            function run() {

                //console.error("--------------------------------updateLinesModel " + shouldInitIndex);
                var t0 = performance.now();
                ////console.info("this.useFilters: " + this.useFilters);
                if (model.useFilters == undefined) {
                    model.useFilters = true; //default
                    ////console.info("useFilters default");
                }
                if (model.useExFilters == undefined) {
                    model.useExFilters = false; //default
                    ////console.info("useExFilters default");
                }

                if (model.exfiltersInternal == undefined || model.exfiltersInternal.length <= 0 || (model.exfiltersInternal.length == 1 && model.exfiltersInternal[0].value == "")) {
                    ////console.log("disable ex--filters");
                    model.useExFiltersInternal = false;
                } else {
                    model.useExFiltersInternal = true;
                }
                model.useExFiltersInternal = model.useExFiltersInternal && model.useExFilters;

                if (model.filtersInternal == undefined || model.filtersInternal.length <= 0 || (model.filtersInternal.length == 1 && model.filtersInternal[0].value == "")) {
                    ////console.log("disable filters");
                    model.useFiltersInternal = false;
                } else {
                    model.useFiltersInternal = true;
                }

                model.useFiltersInternal = model.useFiltersInternal && model.useFilters;

                if (!model.useFiltersInternal && !model.useFilters && !model.useExFiltersInternal && !model.useExFilters) {
                    ////console.info("no filters at all");
                    model.factory.setModel(model.lines);
                    model.factory.setOriginalModel(model.lines);
                    //this.refreshView();
                    return;
                }

                // //console.info("this.useExFiltersInternal: " + this.useExFiltersInternal);
                // //console.info("this.useExFilters: " + this.useExFilters);
                // //console.info("this.exfiltersInternal: " + this.exfiltersInternal);
                // //console.info(this.exfiltersInternal);

                // //console.info("this.useFiltersInternal: " + this.useFiltersInternal);
                // //console.info("this.useFilters: " + this.useFilters);
                // //console.info("this.filtersInternal: " + this.filtersInternal);
                // //console.info(this.filtersInternal);

                model.factory.setOriginalModel(model.lines);
                model.factory.setModel([]);
                model.factory.setModelFiltered([]);
                let m = model.factory.getModel();
                let modelFiltered = model.factory.getModelFiltered();
                var counter = -1;
                var didPositionInit = !shouldInitIndex;
                var theFilters = model.filtersInternal ? model.filtersInternal.unique() : [];
                var theExFilters = model.exfiltersInternal ? model.exfiltersInternal.unique() : [];
                let USE_FILTER = model.useFiltersInternal;
                let LINES = model.lines;
                let LINES_LEN = LINES.length;
                //for (let line of LINES) {
                var line = "";
                for (var counter = 0; counter < LINES_LEN; counter++) {
                    //counter++;
                    line = LINES[counter];
                    var skipLine = false;
                    if (model.useExFiltersInternal) {
                        for (var exf of theExFilters) {
                            // var patt = new RegExp(f.value));
                            // if (patt.test(line.toLowerCase())) {
                            //     skipLine = true;
                            // }
                            if (line.toLowerCase().includes(exf.value.toLowerCase())) {
                                ////console.log("exclude line: " + line + " for filter: " + f.value);
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

                    if (USE_FILTER) {
                        var addToView = false;

                        for (var f of theFilters) {
                            //827.824999999
                            // if (line.toLowerCase().indexOf(f.value)) {
                            //     addToView = true;
                            // }
                            //861.9399999999996
                            if (line.toLowerCase().includes(f.value.toLowerCase())) {
                                addToView = true;
                                break;
                            }
                            //729.329999999 ms
                            // var patt = new RegExp(f.value);
                            // if (patt.test(line.toLowerCase())) {
                            //     addToView = true;
                            // }
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
                            if (!didPositionInit) {
                                didPositionInit = true;
                                model.lowerPosition = counter;
                                m.startVisibleIndex = counter;
                                ////console.error("setting new index: " + counter);
                            }
                            m.endVisibleIndex = counter;
                        } else {
                            m.push({
                                'line': line,
                                'rowid': counter,
                                'skip': true
                            });
                        }
                    } else {
                        m.push({
                            'line': line,
                            'rowid': counter,
                            'skip': false
                        }); //do not use filters
                        modelFiltered.push({
                            'line': line,
                            'rowid': counter,
                            'skip': false
                        }); //do not use filters
                        if (!didPositionInit) {
                            didPositionInit = true;
                            model.lowerPosition = counter;
                            m.startVisibleIndex = counter;
                        }
                        m.endVisibleIndex = counter;
                    }
                }
                modelFiltered.startVisibleIndex = 0;
                modelFiltered.endVisibleIndex = modelFiltered.length - 1;

                model.upperPosition = model.lowerPosition + model.displayrowscount;
                // if (this.ready) {
                //     this.refreshView();
                // }
                var t1 = performance.now();
                //console.log("Call to updateLinesModel took " + (t1 - t0) + " milliseconds.")
                //console.error("-------------------------------- DONE updateLinesModel " + shouldInitIndex);

            }
            run();

        },
        jumpToPosition: function (newLowerPosition, newUpperPosition) {
            ////console.log("jumpToPosition-> newLowerPosition: " + newLowerPosition + " newUpperPosition: " + newUpperPosition);

            let model = this;
            //let max = this.factory.getModel().length - model.displayrowscount;
            ////console.log(this.factory.getModel().length);
            ////console.log(max);
            // if (newPosition >= max) {
            //   newPosition = max;
            // }

            if (model.lowerPosition == newLowerPosition && model.upperPosition == newUpperPosition) {
                //console.log('same position...');
                return;
            }

            if (newLowerPosition < 0) {
                newLowerPosition = 0;
                //console.error("bad new lower position");
            }
            if (newUpperPosition > this.factory.getModel().length - 1) {
                newLowerPosition = this.factory.getModel().length - 1;
                //console.error("bad new upper position");
            }

            model.lowerPosition = newLowerPosition;
            model.upperPosition = newUpperPosition;
            console.log("lowerPosition: " + model.lowerPosition);
            console.log("upperPosition: " + model.upperPosition);
            //EventBus.$emit('newPosition', newPosition);

            var sliderPostion = 0;
            var len = 0
            if(this.showFilteredInternal)
            {
                len = this.factory.getModel().length
            }
            else
            {
                len = this.factory.getModelFiltered().length
            }
            console.log("this.direction: " + this.direction);
            if(this.direction > 0)
            {
                sliderPostion = model.lowerPosition;
            }
            else
            {
                sliderPostion = model.upperPosition;
            }
            console.log("len: " + len);
            console.log("sliderPostion: " + sliderPostion);
            var silderValue = Math.floor( (  (len -  sliderPostion) / len) *100)
            console.log("silderValue: " + silderValue);
            if(silderValue > 97)
            {
                silderValue = 100;
            }
            else if(silderValue < 2)
            {
                silderValue = 0;
            }
            jQuery("#slider-vertical").slider("value",  silderValue);

            model.refreshView();
            //model.$forceUpdate()
        },
        refreshView: function () {
            ////console.log('refresh view');

            //if (this.prevLower == this.lowerPosition && this.prevUpper == this.upperPosition && this.prevDisplayrowscount == this.displayrowscount) {
            //    //console.error('skip refresh view - nothing changed');
            //    return;
            //}

            this.prevDisplayrowscount = this.displayrowscount;
            this.prevLower = this.lowerPosition;
            this.prevUpper = this.upperPosition;

            this.lowerPosition = parseInt(this.lowerPosition);
            this.upperPosition = parseInt(this.upperPosition);
            ////console.log("refresh fast View " + this.factory.myInitId + " lower: " + this.lowerPosition, " upper: " + this.upperPosition + " showing: " + this.displayrowscount);
            // if(this.lasStopPosition == this.currentPosition)
            // {
            //   //console.log("skip refresh: lasStopPosition: " + this.lasStopPosition + " currentPosition: " + this.currentPosition);
            //   return;
            // }
            let showSkip = this.showFilteredInternal;
            let model = this;
            //let lines = this.factory.getModel();
            let lines = showSkip ? this.factory.getModel() : this.factory.getModelFiltered();
            console.log("lines count", lines.length);
            let len = lines.length; //- this.displayrowscount;
            ////console.log("len:: " + len);
            ////console.log(this.linesData);
            var backupHtml = model.container.innerHTML;
            model.container.innerHTML = "";
            //var tagetJump = -1;
            //TBD: this logic is probably a bug
            if (model.isJumping) {
                //model.isJumping = false;
                //tagetJump = model.targetJump;
                //model.targetJump = -1;
                this.showFilteredInternal = true;
            } else {
                this.showFilteredInternal = false;
            }

            var POSITION = 0;
            if (this.direction > 0) {
                ////console.log("FW");
                POSITION = parseInt(this.lowerPosition);
                if (this.lowerPosition + this.displayrowscount > lines.endVisibleIndex && !model.isJumping) {
                    this.lowerPosition = lines.endVisibleIndex - this.displayrowscount;
                    if (this.lowerPosition < lines.startVisibleIndex) {
                        this.lowerPosition = lines.startVisibleIndex;
                        console.log("override lowerPosition",this.lowerPosition);
                    }
                    POSITION = this.lowerPosition;
                }
                let spaceToEnd = lines.length - this.displayrowscount;
                POSITION = this.lowerPosition > spaceToEnd ? spaceToEnd : this.lowerPosition;
            } else {
                ////console.log("BW");
                POSITION = parseInt(this.upperPosition);
                if (this.upperPosition - this.displayrowscount <= lines.startVisibleIndex & !model.isJumping) {
                    this.upperPosition = lines.startVisibleIndex + this.displayrowscount;
                    if (this.upperPosition > lines.endVisibleIndex) {
                        this.upperPosition = lines.endVisibleIndex;
                        console.log("override upperPosition",this.upperPosition);
                    }
                    POSITION = this.upperPosition;
                }
                POSITION = this.upperPosition < this.displayrowscount ? this.displayrowscount : this.upperPosition;
            }

            ////console.log("using c: " + c);
            var took = 0;
            var firstTookIndex = -1;
            

            if (POSITION < 0) {
                POSITION = 0;
            }
            var data = "";
            while (POSITION >= 0 && POSITION < len && took <= this.displayrowscount) {
                var line = lines[POSITION];
                if(line === undefined)
                {
                    line =  {skip:true}
                }
                
                if (line == undefined) {
                    ////console.log(c);
                }
                //console.log("POSITION", POSITION);
                if (line.skip) {
                    if (showSkip) {
                        var l = "<div id='" + line.rowid + "'>" + "<div class='rowIndex unselectable'> [" + line.rowid + "] </div><div id='skipline' class='theline-" + this.factory.myInitId + "'>" + line.line + "</div></div>";
                        if (this.direction > 0) {
                            //model.container.innerHTML += l;
                            data += l;
                        } else {
                            // let temp = model.container.innerHTML;
                            // model.container.innerHTML = l + temp;
                            let temp = data;
                            data = l + temp;
                        }

                        took++;
                        if (firstTookIndex < 0) {
                            firstTookIndex = POSITION;
                        }
                    }
                } else {
                    if (line === undefined) {
                        POSITION += this.direction;
                        continue;
                        // line = "";
                    }
                    var l2 = "<div id='" + line.rowid + "'>" + "<div class='rowIndex unselectable'> [" + line.rowid + "] </div><div id='rowdata' class='theline-" + this.factory.myInitId + "'>" + line.line + "</div></div>";
                    if (this.direction > 0) {
                        //model.container.innerHTML += l2;
                        data += l2;
                    } else {
                        // let temp = model.container.innerHTML;
                        // model.container.innerHTML = l2 + temp;
                        let temp = data;
                        data = l2 + temp;
                    }
                    took++;
                    if (firstTookIndex < 0) {
                        firstTookIndex = POSITION;
                    }
                }

                POSITION += this.direction;
            }

            if (this.direction > 0) {
                this.lowerPosition = firstTookIndex;
                this.upperPosition = POSITION;
            } else {
                this.upperPosition = firstTookIndex;
                this.lowerPosition = POSITION;
            }
            // if(this.lowerPosition != c)//there is no way more down - nothing to refresh - use last view which had more data
            // {
            //   //this.lowerPosition = c;
            //   model.container.innerHTML = data;
            // }
            // else{
            //   model.container.innerHTML = backupHtml;
            // }

            model.container.innerHTML = data;

            //This happen when at the end of all files/data we need to backup a little to render the right amount of lines
            //Else while scrolling the data will disappear and user will see nothing.
            //So: add missing line if took too litle
            //if we are moving fw and cannot get more data then add to the start and move the lower bound more down
            if (took < this.displayrowscount) {
                var tempHtml = ""; //model.container.innerHTML;
                if (this.direction > 0) {
                    let upTo = this.displayrowscount - took;
                    var took2 = 1;
                    var index = 0;
                    while (took2 < upTo && (this.lowerPosition - index > lines.startVisibleIndex)) //add elements at the begging of the html
                    {
                        index++;
                        var line = lines[this.lowerPosition - index]; //take prev lines
                        if (line.skip) {
                            if (showSkip) {
                                var l = "<div id='" + line.rowid + "'>" + "<div class='rowIndex'> [" + line.rowid + "] </div><div id='skipline' class='theline-" + this.factory.myInitId + "'>" + line.line + "</div></div>";
                                var tttt = tempHtml;
                                tempHtml = l + tttt;
                                took2++;
                            }
                        } else {
                            if (line === undefined) {
                                continue;
                            }
                            var l2 = "<div id='" + line.rowid + "'>" + "<div class='rowIndex'> [" + line.rowid + "] </div><div id='rowdata' class='theline-" + this.factory.myInitId + "'>" + line.line + "</div></div>";
                            var tttt = tempHtml;
                            tempHtml = l2 + tttt;
                            took2++;
                        }
                    }
                    this.lowerPosition = this.lowerPosition - index;
                    let ttt = model.container.innerHTML;
                    model.container.innerHTML = tempHtml + ttt; //add to the start
                } else //if we are moving bw and cannot get more data then add to the end and move the upper bound more up
                {
                    var took2 = 1;
                    let upTo = this.displayrowscount - took + 1;
                    var index = 0;
                    while (took2 <= upTo && (this.upperPosition + index < lines.endVisibleIndex)) //add elements at the begging of the htmls
                    {
                        index++;
                        var line = lines[this.upperPosition + index];
                        if (line == undefined) {
                            break;
                        }
                        if (line.skip) {
                            if (showSkip) {
                                var l = "<div id='" + line.rowid + "'>" + "<div class='rowIndex'> [" + line.rowid + "] </div><div id='skipline' class='theline-" + this.factory.myInitId + "'>" + line.line + "</div></div>";
                                if (this.direction > 0) {
                                    //model.container.innerHTML += l;
                                    tempHtml += l;
                                    took2++;
                                }
                            }
                        } else {
                            if (line === undefined) {
                                continue;
                            }
                            var l2 = "<div id='" + line.rowid + "'>" + "<div class='rowIndex'> [" + line.rowid + "] </div><div id='rowdata' class='theline-" + this.factory.myInitId + "'>" + line.line + "</div></div>";
                            tempHtml += l2;
                            took2++;
                        }
                    }
                    this.upperPosition = this.upperPosition + (took - this.displayrowscount); //take the upper part more up
                    let ttt = model.container.innerHTML;
                    model.container.innerHTML = ttt + tempHtml; //add to the end
                }
            }

            ////console.log("new lower: " + this.lowerPosition);
            ////console.log("new upper: " + this.upperPosition);

            var i = 1;
            ////console.error('tag', this.highlightsInternal);
            if (this.useColors) {
                for (var f of this.highlightsInternal) {
                    if (f == undefined || f.value == undefined || f.value == "") {
                        continue;
                    }

                    ////console.log('start');
                    $('.theline-' + this.factory.myInitId).each(function (index) {
                        ////console.log('refresh..?');
                        $(this).highlight(f.value, "highlight" + i);
                    });
                    i++;
                }
            }
            //after render register for line click //todo unregister prev clicks - not sure needed.
            setTimeout(() => {
                $('#' + model.targetJump).css("background-color", "#2C2B2B");
                $('.theline-' + this.factory.myInitId).click(function () {
                    EventBus.$emit('jumpto', {
                        'value': $(this).parent().attr('id'),
                        'source': model.factory.myInitId,
                        'showFiltered': true
                    });
                });
            }, 1);
            ////console.log('refresh view done');
        },
        matchHeight: function () {
            //todo optimized when there is no actual height change - then do not render.
            let reqHeight = this.currentHeight;
            let rowElement = document.getElementById('rowdata');
            var v;
            var rowHeight = 21; //default
            if (rowElement) {
                v = rowElement.clientHeight;
                rowHeight = v > 0 ? v : 21;
            }

            ////console.log(this.factory.myInitId + " reqHeight (parent height): " + reqHeight);
            ////console.log(this.factory.myInitId + " rowHeight: " + rowHeight);
            this.displayrowscount = Math.round(reqHeight / rowHeight) - 4; //temp hack
            if (this.displayrowscount <= 0) {
                this.displayrowscount = 10;
            }
            ////console.log(this.factory.myInitId + " this.displayrowscount: " + this.displayrowscount);
            this.refreshView();
        }
    },
    created() {
        //model.$forceUpdate();
        //console.log('fast text view Created');
        this.factory = (function () {
            // let m = ["model init"];
            // let origianlModel = ["original model init"];
            let that = {};
            that.myInitId = myID;
            myID++
            that.getModel = function () {
                return that.m;
            }
            that.setModel = function (model) {
                ////console.log("asdasdasdasdasdasdasdasdasd");
                that.m = model.slice();
            }
            that.setModelFiltered = function(model)
            {
                that.modelFiltered = model.slice();
            }
            that.getModelFiltered = function(model)
            {
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
        ////console.log(this);// = JSON.parse(JSON.stringify(["no data created"]));
    },
    mounted: function () {
        ////console.log("fast text view mounted");
        let model = this;

        $('#logx-progress' + model.factory.myInitId).height(0).css("visibility", "hidden").css("margin", "0px");
        var hasFocus = false;
        $('#fast-text-view-' + model.factory.myInitId).mouseover(function () {
            ////console.log('mouseover');
            hasFocus = true;
        });

        $('#fast-text-view-' + model.factory.myInitId).mouseout(function () {
            ////console.log('mouseout');
            hasFocus = false;
        });

        // window.getElementById('fast-text-view-' + model.factory.myInitId).addEventListener("focusout", function()
        // {
        //     //console.log('focusout');
        //     hasFocus = false;
        // });
        $(function () {
                //console.log(model.ident + " : !!!!!!!!!!!!!!!!!!!! ex--filters watch: " + val);
                setTimeout(() => {
                
                    jQuery("#slider-vertical").slider({
                        orientation: "vertical",
                        range: "min",
                        min: 0,
                        max: 100,
                        value: 100,
                        slide: function (event, ui) {
                            //max: model.lines.length,
                            // var lineNum = parseInt(ui.value);
                            // console.log("adding silder: " +lineNum )
                            // model.jumpToPosition(lineNum, 0);
                            //$( "#amount" ).val( ui.value );
                            let len = 0;
                            if(model.showFilteredInternal)
                            {
                                len = model.factory.getModel().length
                            }
                            else
                            {
                                len = model.factory.getModelFiltered().length
                            }
                            console.log("using len: " + len)
                            var lineNumPrecentage = parseInt(ui.value)/100;
                            var lineNum = len - Math.floor(len*lineNumPrecentage)
                            //console.log("adding silder: " +lineNum )
                            model.jumpToPosition(lineNum, 0);
                            
                        }
                    });
                    console.log("adding silder")
                }, 300);
                //$( "#amount" ).val( $( "#slider-vertical" ).slider( "value" ) );
            });

        $(window).keydown(function (event) {
            if (!hasFocus) {
                ////console.log('skip key');
                return;
            }
            
            //console.error("event.keyCode: " + event.keyCode);
            if (event.keyCode == 40) {
                //arrow up
                model.direction = 1;
                var up = model.lowerPosition + 1;
                if (up > model.lines.length) {
                    up = model.lines.length;
                }
                model.jumpToPosition(up, 0);
            } else if (event.keyCode == 38) {
                //arrow down
                model.direction = -1;
                var down = model.upperPosition - 1;
                if (down < 0) {
                    down = 0;
                }
                model.jumpToPosition(0, down);
            } else if (event.keyCode == 36) {
                //Home
                model.direction = 1;

                var pos = 0;
                // if(!model.showFiltered)
                // {
                //     pos = model.factory.m.startVisibleIndex;
                // }
                console.log("Home clicked jump to: " + pos);
                model.jumpToPosition(pos, 0);
            } else if (event.keyCode == 35) {
                //End
                model.direction = 1;
                var pos = model.factory.m.endVisibleIndex;
                model.jumpToPosition(pos, 0);
            } else if (event.keyCode == 33) {
                //page up
                model.direction = 1;
                var up = model.lowerPosition - model.displayrowscount;
                if (up <= model.factory.m.startVisibleIndex) {
                    up = model.factory.m.startVisibleIndex;
                }
                model.jumpToPosition(up, 0);
            } else if (event.keyCode == 34) {
                //page down
                model.direction = 1;
                var down = model.lowerPosition + model.displayrowscount;;
                if (down >= model.factory.m.endVisibleIndex) {
                    down = model.factory.m.endVisibleIndex;
                }
                model.jumpToPosition(down, 0);
            }

        });
        model.container = document.getElementById('fast-text-view-' + model.factory.myInitId);
        //.log("model.parentid: " + model.parentid);
        var parent;
        var parentHTML;
        if (!model.parentid) {
            parent = $('#fast-text-view-' + model.factory.myInitId).parent();
            parentHTML = document.getElementById('fast-text-view-' + model.factory.myInitId);
        } else {
            parent = $('#' + model.parentid);
            parentHTML = document.getElementById(model.parentid);
        }
        ////console.log("parent??: " + parent);
        ////console.log(parent);
        ////console.log("the height" + parent.height());
        var prevHeight = -1;;
        let mainC = $('#fast-text-view-' + model.factory.myInitId);

        function onParentResize() {
            //ole.log("onParentResize: " + parent.height());
            let newHeight = parent.height();
            if (prevHeight != newHeight) {
                prevHeight = newHeight;
                model.currentHeight = newHeight
                model.matchHeight();
                //console.log("onParentResie");
            }
        }
        //  parent.resize(onParentResize);
        //   //console.log("parent resize");
        //   setTimeout(() => {
        //     onParentResize();
        //  }, 1);
        //  parent.addEventListener('resize', function(e){
        //      e.preventDefault();
        //       //console.log("parent resize2");
        //         setTimeout(() => {
        //           onParentResize();
        //         }, 1);
        //   });
        var preEvent;
        $(document).ready(function () {
            //console.log('document $(document).ready: ' + model.factory.myInitId);
            // clearTimeout(preEvent);
            // preEvent = setTimeout(() => {
            //     //console.log('onParentResize $(document).ready');
            //      model.updateLinesModel(true);
            //     //model.refreshView();
            //     onParentResize();

            // }, 10);
            model.updateLinesModel(true);
            //     //model.refreshView();
            onParentResize();
        });
        $(document).on("mousedown", function (event) {
            let found = $(".fast-text-view-class").has(event.target).length > 0;
            if (found) {
                return;
            }
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize mousedown');
                onParentResize();
            }, 300);
        });
        $(document).on("mouseup", function (event) {
            let found = $(".fast-text-view-class").has(event.target).length > 0;
            if (found) {
                return;
            }
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize mouseup');
                onParentResize();
            }, 300);
        });
        //  $( document ).mousemove(function() {
        //     setTimeout(() => {
        //         onParentResize();
        //       }, 1);
        // });
        window.addEventListener('resize', function (e) {
            e.preventDefault();
            ////console.log("window resize");
            clearTimeout(preEvent);
            preEvent = setTimeout(() => {
                //console.log('onParentResize resize');
                onParentResize();
            }, 300);
        });
        // //console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!  register !!!!!!!!!!!!!!!!");//
        // document.getElementById('fast-text-view-'+ model.factory.myInitId).addEventListener('onmousedown', function(e){
        //    //e.preventDefault();
        //       //console.log("window onmouseover");
        //       setTimeout(() => {
        //         onParentResize();
        //       }, 1);
        // });
        if (!model.lines || model.lines.length <= 0) {
            this.factory.setModel(["no data 2"]);
            model.factory.setOriginalModel(["no data 2"]);
        } else {
            this.factory.setModel(model.lines);
            this.factory.setOriginalModel(model.lines)
        }
        model.highlightsInternal = model.highlights;
        ////console.log("--------------------------");
        ////console.log(model.filters);
        ////console.log("--------------------------");
        model.filtersInternal = model.filters;
        model.exfiltersInternal = model.exfilters;
        //model.currentPosition = model.position ? model.position.value : 0;

        // if(!model.highlights || model.highlights.length <=0)
        // {
        //   //model.highlightsInternal = model.highlightsInternal.slice(0, model.highlightsInternal.length);s
        // }
        // else{
        //   const res = model.highlights.slice(0).map(x => x.value).filter(x => x != undefined || x != "");
        //   //console.error('h',res);
        //   model.highlightsInternal = res
        // }
        this.$nextTick(function () {
            init(model.factory);
            model.ready = true;
            // model.updateLinesModel(true);
            // ////console.error("init");
            // //model.jumpToPosition(model.currentPosition)
            // model.refreshView();
            ////console.error("register dbclick");
            $('#fast-text-view-' + model.factory.myInitId).dblclick(function () {
                var seltxt = getSelText();
                ////console.error('selected text:' + seltxt);
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
            // //console.log("====================================");
            // //console.log(" -e.detail: " + -e.detail);
            // //console.log(" -e.wheelDelta: " + -e.wheelDelta);
            // //console.log(" event.deltaX: " + event.deltaX);
            // //console.log(" event.deltaY: " + event.deltaY);
            // //console.log(" event.deltaMode: " + event.deltaMode);
            //var delta = e.wheelDelta ? e.wheelDelta : -e.detail;
            var delta = -event.deltaY;
            model.direction = delta > 0 ? -1 : 1;
            ////console.log("delta: " + delta);
            ////console.log("direction: " + model.direction);
            if ((prevDelta + delta) > 5 || (prevDelta + delta) < -5) {
                ////console.log(" event.deltaMode: " + event.deltaMode);
                delta = prevDelta + delta;
                prevDelta = 0;
            }
            if (delta >= 0 && delta <= 5) {
                prevDelta += delta;
                ////console.log(" prevDelta: " + prevDelta);
                return;
            }
            if (delta <= 0 && delta >= -5) {
                prevDelta += delta;
                ////console.log(" prevDelta: " + prevDelta);
                return;
            }
            delta = Math.round(delta / 3.0);
            ////console.log(" delta: " + delta);
            //delta+=prevDelta;

            ////console.log("mouseWheelEvent: model.currentPosition: " + model.currentPosition);
            //var newPosition =-1;
            var lower = 0;
            var upper = 0;
            ////console.log("mouseWheelEvent: Math.round(delta * -1: " + Math.round(delta * -1));
            if (model.direction > 0) {
                ////console.log("mouseWheelEvent: before 1: " + model.lowerPosition);
                lower = model.lowerPosition + Math.round(delta * -1);
                ////console.log("mouseWheelEvent: after 1: " + model.lowerPosition);
            } else {
                ////console.log("mouseWheelEvent: before 2: " + model.upperPosition);
                upper = model.upperPosition + Math.round(delta * -1);
                ////console.log("mouseWheelEvent: after 2: " + model.upperPosition);
            }

            ////console.log("mouseWheelEvent: lower: " + lower + " upper: " + upper);
            model.jumpToPosition(lower, upper);
            ////console.log(model.position);
            ////console.log(model.lines);
        }
        ////console.log("register to: " + 'fast-text-view-' + model.factory.myInitId);
        // var containerE = document.getElementById('fast-text-view-main');
        // containerE.addEventListener('mousewheel', mouseWheelEvent);
        document.getElementById('fast-text-view-' + model.factory.myInitId).addEventListener('mousewheel', mouseWheelEvent);
    }
}

function getSelText() {
    
    // get selected text
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function init(factory) {
    ////console.log("init highlight jquery");
    ////console.log($);
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
          user-select:      none;

   -khtml-user-select:      none;
  -webkit-user-select:      none;
     -moz-user-select: -moz-none;
       -o-user-select:      none;
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
