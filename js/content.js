const element = document.createElement('div')
element.innerHTML = chrome.runtime.id
element.id = 'RedditBulkMessageSender'
element.style.display = 'none'
document.documentElement.appendChild(element)
const script = document.createElement('script')
const d = document.head || document.documentElement
const url = location.href

if (url.includes('https://chat.reddit.com/')) {
  // 消息
  script.src = chrome.runtime.getURL('/js/chat.js')
} else if (url.includes('https://www.reddit.com/user')) {
  // 用户主页
  script.src = chrome.runtime.getURL('/js/fillSheetBox.js')
} else if (url.includes('https://www.reddit.com/r/')) {
  // 帖文界面
  script.src = chrome.runtime.getURL('/js/exportComment.js')
}
d.appendChild(script)