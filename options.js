const content = document.getElementById('content')
const delayTime = document.getElementById('delayTime')

content.addEventListener('keyup', () => {
  chrome.storage.local.set({ getContent: content.value })
})
delayTime.addEventListener('keyup', () => {
  chrome.storage.local.set({ getDelayTime: delayTime.value })
})

// 恢复设置的内容
chrome.storage.local.get(['getContent', 'getDelayTime'], ({ getContent, getDelayTime }) => {
  content.value = getContent || ''
  delayTime.value = getDelayTime || 60
})
