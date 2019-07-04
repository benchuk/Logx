var windowLocalStorage
var windowID = 0

function pushToArray(arr, obj) {
  const index = arr.findIndex(e => e.name === obj.name)

  if (index === -1) {
    arr.push(obj)
  } else {
    arr[index] = obj
  }
}

function getLocalStorage() {
  if (windowLocalStorage != undefined) {
    return windowLocalStorage
  }
  windowLocalStorage = JSON.parse(
    localStorage.getItem('logx-window-preferences-' + windowID)
  )
  if (windowLocalStorage == undefined) {
    windowLocalStorage = {}
  }
  return windowLocalStorage
}

function saveWindow() {
  localStorage.setItem(
    'logx-window-preferences-' + windowID,
    JSON.stringify(getLocalStorage())
  )
}

function windowsPreferenceLoad(key) {
  return getLocalStorage()[key]
}

var appStorage = {
  deletePresetWithName(presetName) {
    var currentPresets = this.loadPresets()
    getLocalStorage()['presets'] = currentPresets.filter(
      p => p.name !== presetName
    )
    saveWindow()
  },
  savePreset(name, filters, excludeFilters, highlights) {
    console.log('savePreset')
    console.log('filters', filters)
    console.log('excludeFilters', excludeFilters)
    console.log('highlights', highlights)
    var currentPresets = this.loadPresets()
    pushToArray(currentPresets, {
      name: name,
      filters: filters,
      highlights: highlights,
      excludeFilters: excludeFilters
    })
    getLocalStorage()['presets'] = currentPresets
    saveWindow()
  },
  loadPresets() {
    let res = getLocalStorage()['presets']
    return res
      ? res
      : [
          {
            name: 'Default',
            filters: [{ value: 'Bluetooth' }],
            excludeFilters: [{ value: 'Exclude1' }],
            highlights: [{ value: 'Activity' }]
          }
        ]
  },
  saveLastUsedPresetName(name) {
    getLocalStorage()['lastUsedPresetName'] = name
    saveWindow()
  },
  getLastPresetsName() {
    let res = getLocalStorage()['lastUsedPresetName']
    return res ? res : 'Default'
  },
  saveFileListForWindow(fileListData) {
    getLocalStorage()['fileList'] = fileListData
    saveWindow()
  },
  loadParsingFilterList() {
    return getLocalStorage()['parsingFilterList'] || []
  },
  saveParsingFilterList(list) {
    console.log('saveParsingFilterList')
    console.log(list)
    getLocalStorage()['parsingFilterList'] = list
    saveWindow()
  },
  loadLastFileList() {
    let res = getLocalStorage()['fileList']
    return res ? res : []
  },
  setWindowId(id) {
    windowID = id
  },
  timeParsersSetAndSave(timeParser) {
    windowLocalStorage[key] = valueObj
    localStorage.setItem('timeParsers', JSON.stringify(timeParser))
  }
}

export default appStorage
