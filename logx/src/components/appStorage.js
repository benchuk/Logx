var windowLocalStorage;
var windowID = 0;

function getLocalStorage() {
    if (windowLocalStorage != undefined) {
        return windowLocalStorage;
    }
    windowLocalStorage = JSON.parse(localStorage.getItem("logx-window-preferences-" + windowID));
    if (windowLocalStorage == undefined) {
        windowLocalStorage = {};
    }
    return windowLocalStorage;
}

function saveWindow() {
    localStorage.setItem("logx-window-preferences-" + windowID, JSON.stringify(getLocalStorage()));
}

function windowsPreferenceLoad(key) {
    return getLocalStorage()[key];
}

var appStorage = {

    saveExFilters(filters) {
        getLocalStorage()['exfilters'] = filters;
        saveWindow();
    },
    loadLastExFiltersList() {
        let res = getLocalStorage()['exfilters'];
        return res ? res : [{
            'value': ""
        }];
    },
    saveFilters(filters) {
        getLocalStorage()['filters'] = filters;
        saveWindow();
    },
    loadLastFiltersList() {
        let res = getLocalStorage()['filters'];
        return res ? res : [{
            'value': ""
        }];
    },
    saveHighlights(highlights) {
        getLocalStorage()['highlights'] = highlights;
        saveWindow();
    },
    loadLastHighlightsList() {
        let res = getLocalStorage()['highlights'];
        return res ? res : [];
    },
    saveFileListForWindow(fileListData) {
        getLocalStorage()['fileList'] = fileListData;
        saveWindow();
    },
    loadLastFileList() {
        let res = getLocalStorage()['fileList'];
        return res ? res : [];
    },
    setWindowId(id) {
        windowID = id;
    },
    timeParsersSetAndSave(timeParser) {
        windowLocalStorage[key] = valueObj;
        localStorage.setItem("timeParsers", JSON.stringify(timeParser));
    },
}

export default appStorage