chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: 'https://chat.reddit.com' }))

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') chrome.tabs.create({url: 'https://dev-coco.github.io/post/Reddit-Bulk-Message-Sender/' })
})

chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
  const action = message[0]
  const init = {
    'init': () => getInit().then(data => sendResponse(data)),
    'sendMessage': () => sendMessage(...message[1]).then(data => sendResponse(data)),
    'request': () => request(message[1]).then(data => sendResponse(data))
  }
  init[action]()
  return true
})

// 获取配置信息
async function getInit () {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['getContent', 'getDelayTime'], async ({ getContent, getDelayTime }) => {
      resolve({ getContent, getDelayTime })
    })
  })
}

async function request (url) {
  return await fetch(url).then(response => response.text())
}

async function sendMessage (url, content, authorization) {
  try {
    const text = await fetch(url).then(response => response.text())
    const userData = JSON.parse(text.match(/(?<=window.___r = ){.*}/g)[0])
    // const userName = text.match(/(?<=<h1 class="_3LM4tRaExed4x1wBfK1pmg">).*?(?=<\/h1>)/g)[0].trim()
    const init = Object.values(userData.users.models)[0]
    const userName = Object.values(userData.profiles.models)[0].title || init.displayText
    const userID = init.id
    // const userID = text.match(/(?<="id":").*?(?=","isEmployee")/g)[0].replace(/.+id":"/g, '')
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
      body: content.replace(/@@@/g, userName.trim())
    }
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
    console.log(sendText)
    return 'success'
  } catch {
    return 'failed'
  }
}
