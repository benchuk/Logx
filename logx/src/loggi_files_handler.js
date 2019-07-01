/* eslint-disable no-console */
//'use strict'

import fs from 'fs'

console.log("Loading Files Handler...")
function init(app)
{
    app.on('load-files', (event, arg) => {


        console.log("load files... " + arg)
        let logLines = [];
        let filesPaths = arg.files
        filesPaths = filesPaths.sort((a, b) => b.localeCompare(a));
    
        let stack = [];
    
        for (let i in filesPaths) {
            console.log("Searching old file: " + filesPaths[i]);
            if (fs.existsSync(filesPaths[i])){
                stack.push(i);
            }else{
                console.log("skipping old file, not found: " + filesPaths[i]);
            }
        }

        if (stack.length == 0) {
            console.log("no files")
            event.sender.send('load-files-reply', 'drag files here\n');
            return;
        }    
        let i = stack.pop();
    
        //console.log("i: " + i)
    
        function done() {
        if (stack.length == 0) {
            //console.log("replay" + i)
            event.sender.send('load-files-reply', logLines.join('\n'));
            //console.log('end');
        } else {
            i = stack.pop();
            //console.log("ii" + i)
            readLines(filesPaths[i], logLines, i, done)
        }
        }
    
        readLines(filesPaths[i], logLines, i, done)
    
    });
    
    function readLines(file, logLines, index, done) {
        var remaining = '';
        var input = fs.createReadStream(file);
        console.log("read file: " + file);
        logLines.push("------------>>>>>>>>>>>> [ " + file.split('\\').pop().split('/').pop() + " ] <<<<<<<<<<<<------------");
        input.on('data', function (data) {
        //console.log(data);
        remaining += data;
        var index = remaining.indexOf('\n');
        var last = 0;
        while (index > -1) {
            var line = remaining.substring(last, index);
            // line = line.replace(/[\n\r\t]/g, "");
            // line = line.replace(/^\s+|\s+$/g, '');
            // //line = line.trim();
            last = index + 1;
            logLines.push(line);
            index = remaining.indexOf('\n', last);
        }
        remaining = remaining.substring(last);
        });
    
        input.on('end', function () {
        if (remaining.length > 0) {
            // remaining = remaining.replace(/[\n\r\t]/g, "");
            // remaining = remaining.replace(/^\s+|\s+$/g, '');
            // remaining = remaining.trim();
            logLines.push(remaining);
        }
        done()
        });
    }

}
export default init;