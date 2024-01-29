// chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: 'https://chat.reddit.com' }))

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') chrome.tabs.create({url: 'https://dev-coco.github.io/post/Reddit-Bulk-Message-Sender/' })
})

chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
  const action = message[0]
  const init = {
    'init': () => getInit().then(data => sendResponse(data)),
    'sendMessage': () => sendMessage(...message[1]).then(data => sendResponse(data)),
    'request': () => request(message[1]).then(data => sendResponse(data)),
    'postData': () => postData(...message[1]).then(data => sendResponse(data)),
    'fillNote': () => sendResponse(fillNote(...message[1])),
    'setStorage': () => sendResponse(setStorage(...message[1]))
  }
  init[action]()
  return true
})

async function fillNote (userID, note, postUrl) {
  const init = await getInit()
  const obj = {
    sheetUrl: init.getSheetUrl,
    type: 'fillNote',
    userID,
    note,
    postUrl
  }
  fetch(`${init.getScriptUrl}?${new URLSearchParams(obj).toString()}`)
  closeTab()
  return true
}

function closeTab () {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => chrome.tabs.remove(tabs[0].id))
}

async function fillSheet (userID, country, status, note) {
  const obj = {
    sheetUrl: await getSheetUrl(),
    type: 'fill',
    userID,
    country,
    status,
    note
  }
  const text = await fetch(`${api}?${new URLSearchParams(obj).toString()}`).then(response => response.text())
  return text
}

/**
 * @description 储存数据
 * @param {string} objName - 键名 
 * @param {*} data - 内容
 * @returns 
 */
function setStorage (objName, data) {
  chrome.storage.local.set({ [objName]: data })
  return
}

// 获取配置信息
async function getInit () {
  return new Promise(resolve => {
    chrome.storage.local.get(null, data => resolve(data))
  })
}

async function request (url) {
  return await fetch(url).then(response => response.text())
}

// 发送消息
async function sendMessage (url, content, authorization) {
  try {
    const text = await fetch(url).then(response => response.text())
    const userName = url.replace(/.+user\/|\//g, '')
    let userID = ''
    if (text.includes('window.___r')) {
      // 旧版本
      const userData = JSON.parse(text.match(/(?<=window.___r = ){.*}/g)[0])
      const init = Object.values(userData.users.models)[0]
      userID = init.id
    } else {
      // 新版本
      userID = text.match(/(?<=author-id=").*?(?=")/g)[0]
    }
    const json = await fetch('https://matrix.redditspace.com/_matrix/client/r0/createRoom', {
      headers: {
        accept: 'application/json',
        authorization,
        'content-type': 'application/json',
      },
      body: `{"preset":"reddit_dm","invite":["@${userID}:reddit.com"]}`,
      method: 'POST',
      credentials: 'include'
    }).then(response => response.json())
    const obj = {
      msgtype: 'm.text',
      body: content.replace(/@@@/g, userName.trim()).replace(/\\n/g, '\n')
    }
    if (!json.room_id) return 'failed'
    const sendText = await fetch(`https://matrix.redditspace.com/_matrix/client/r0/rooms/${json.room_id}/send/m.room.message/m${new Date().getTime()}.0`, {
      headers: {
        accept: 'application/json',
        authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify(obj),
      method: 'PUT',
      credentials: 'include'
    }).then(response => response.json())
    console.log(sendText.event_id)
    return sendText.event_id ? 'success' : 'failed'
  } catch {
    return 'failed'
  }
}
