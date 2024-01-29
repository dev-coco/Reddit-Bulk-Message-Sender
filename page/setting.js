const content = document.getElementById('content')
const delayTime = document.getElementById('delayTime')
const messageNotify = document.getElementById('messageNotify')
const scriptUrl = document.getElementById('scriptUrl')
const sheetUrl = document.getElementById('sheetUrl')

content.addEventListener('keyup', () => {
  chrome.storage.local.set({ getContent: content.value })
})
sheetUrl.addEventListener('keyup', () => {
  chrome.storage.local.set({ getSheetUrl: sheetUrl.value })
})
scriptUrl.addEventListener('keyup', () => {
  chrome.storage.local.set({ getScriptUrl: scriptUrl.value })
})
delayTime.addEventListener('keyup', () => {
  chrome.storage.local.set({ getDelayTime: delayTime.value })
})

// 恢复设置的内容
chrome.storage.local.get(['getContent', 'getDelayTime', 'getScriptUrl', 'getSheetUrl'], ({ getContent, getDelayTime, getScriptUrl, getSheetUrl }) => {
  content.value = getContent || ''
  delayTime.value = getDelayTime || 60
  scriptUrl.value = getScriptUrl || ''
  sheetUrl.value = getSheetUrl || ''
})
