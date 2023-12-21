const extensionID = document.getElementById('RedditBulkMessageSender').outerText
const sendBackground = data => new Promise(resolve => chrome.runtime.sendMessage(extensionID, data, res => { resolve(res) }))

/**
 * @description 指定范围生成随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

/**
 * @description 延时 上下 30% 随机浮动
 * @param {(string|number)} delayTime - 延迟时间/秒
 */
const delay = (delayTime) => new Promise((resolve) => {
  setTimeout(
    resolve,
    getRandom(Number(delayTime) * 700, Number(delayTime) * 1300),
  )
})

/**
 * @description 功能界面横幅提示
 * @param {string} str - 显示的内容
 */
const banner = str => {
  const topBanner = html.getElementById('banner')
  topBanner.style.opacity = '1'
  topBanner.innerHTML = str
}

const messageList = {}

// 设置监听器
async function init () {
  try {
    // 左上角 logo
    const chatLogo = document.querySelector('body > faceplate-app > rs-app').shadowRoot.querySelector('div.container > rs-rooms-nav').shadowRoot.querySelector('div.flex.items-center.px-md.py-sm > span')
    // 监听 logo，点击加载菜单
    chatLogo.addEventListener('click', createMenu)

    // 将列表写入 messageList
    let observer = new MutationObserver(() => {
      const chatList = document.querySelector('body > faceplate-app > rs-app').shadowRoot.querySelector('div.container > rs-rooms-nav').shadowRoot.querySelector('rs-virtual-scroll').shadowRoot.querySelectorAll('[room*="reddit.com"]')
      for (const info of chatList) {
        try {
          const userName = info.shadowRoot.querySelector('.room-name').outerText
          const content = info.shadowRoot.querySelector('.last-message').outerText
          messageList[userName] = content
        } catch {}
      }
    })
    // 聊天用户列表
    const chatList = document.querySelector('body > faceplate-app > rs-app').shadowRoot.querySelector('div.container > rs-rooms-nav').shadowRoot.querySelector('rs-virtual-scroll').shadowRoot
    // 监听列表变动
    observer.observe(chatList, { childList: true, subtree: true })
    
    console.log('加载成功')
  } catch (error) {
    // 可能会因为网络问题加载失败，每隔 1 秒循环一次直到加载成功
    console.log('加载失败', error)
    await delay(1)
    init()
  }
}
setTimeout(init, 3000)

let html, inputCache, outputCache
// 创建菜单
function createMenu () {
  // 右侧边栏
  html = document.querySelector('body > faceplate-app > rs-app').shadowRoot.querySelector('div.container > rs-room-overlay-manager > rs-room').shadowRoot.querySelector('main > rs-timeline').shadowRoot.querySelector('rs-virtual-scroll-dynamic').shadowRoot
  // 加载页面
  html.innerHTML = `
    <style>*{margin:0;padding:0;box-sizing:border-box}textarea{outline:0;border:none}button{outline:0!important;border:none;background:0 0}button:hover{cursor:pointer}.contact{z-index:999999;width:100%;min-height:100%;padding:15px;background:#009bff;background:-webkit-linear-gradient(left,#0072ff,#00c6ff);background:-o-linear-gradient(left,#0072ff,#00c6ff);background:-moz-linear-gradient(left,#0072ff,#00c6ff);background:linear-gradient(left,#0072ff,#00c6ff)}.contact-center{position:absolute;left:50%;top:50%;-webkit-transform:translate(-50%,-50%)}.container-contact{width:1164px;background:#fff;border-radius:10px;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;flex-wrap:wrap;justify-content:space-between;align-items:center;padding:50px 130px 50px 148px}.contact-div{width:390px}.contact-div-title{display:block;font-size:24px;color:#333;line-height:1.2px;text-align:center;padding-bottom:44px}.contact-div .wrap .textarea{min-height:350px;border-radius:25px;padding:12px 30px}.contact-div .wrap{position:relative;width:100%;z-index:1}.textarea{display:block;width:100%;background:#e6e6e6;font-family:Montserrat-Bold;font-size:15px;line-height:1.5;color:#666}.div-btn{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;flex-wrap:wrap;justify-content:center;margin-top:20px;}.contact-btn{min-width:193px;height:50px;border-radius:25px;background:#57b846;font-family:Montserrat-Bold;font-size:15px;line-height:1.5;color:#fff;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;justify-content:center;align-items:center;padding:0 25px;-webkit-transition:.4s;-o-transition:.4s;-moz-transition:.4s;transition:.4s}#banner{margin:0 auto;background:#fff;width:fit-content;padding:4px 13px 4px 13px;border-radius:10px;margin-bottom:16px}</style>
    <div class="contact">
      <div class="contact-center">
        <p id="banner" class="shadow" style="opacity: 0;"></p>
        <div class="container-contact">
          <div class="contact-div">
            <div class="wrap">
              <textarea class="textarea" id="contactInput" placeholder="请输入用户链接"></textarea>
            </div>
            <div class="div-btn">
              <button class="contact-btn" id="detectActive">
                <span>检测活跃时间</span>
              </button>
            </div>
            <div class="div-btn">
              <button class="contact-btn" id="detectReply">
                <span>检测是否回复</span>
              </button>
            </div>
          </div>
          <div class="contact-div">
            <div class="wrap">
              <textarea class="textarea" id="contactOutput" placeholder="输出结果"></textarea>
            </div>
            <div class="div-btn">
              <button class="contact-btn" id="bulkMessage">
                <span>群发消息</span>
              </button>
            </div>
            <div class="div-btn">
              <button class="contact-btn" id="getPostData">
                <span>获取帖文数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  // 恢复缓存的内容
  html.getElementById('contactInput').value = inputCache || ''
  html.getElementById('contactOutput').value = outputCache || ''
  // 设置监听器
  const bulkMessageBtn = html.getElementById('bulkMessage')
  bulkMessageBtn.addEventListener('click', bulkMessage)
  const detectActiveBtn = html.getElementById('detectActive')
  detectActiveBtn.addEventListener('click', detectActive)
  const detectReplyBtn = html.getElementById('detectReply')
  detectReplyBtn.addEventListener('click', detectReply)
  const getPostDataBtn = html.getElementById('getPostData')
  getPostDataBtn.addEventListener('click', getPostData)
}

// 批量发送消息
async function bulkMessage () {
  const input = html.getElementById('contactInput').value
  const output = html.getElementById('contactOutput')
  inputCache = input
  outputCache = ''
  output.value = ''
  const userList = input.match(/.+/g)
  const init = await sendBackground(['init'])
  const delayTime = init.getDelayTime || 60
  if (!init.getContent) return alert('请设置发送内容')
  const contentList = init.getContent.split('\n')
  const authorization = 'Bearer ' + document.querySelector('body > faceplate-app > rs-app').token.token
  let index = 0
  for (const userLink of userList) {
    index++
    banner(`进行中：${index} / ${userList.length}`)
    const randomContent = contentList[getRandom(0 , contentList.length - 1)]
    const result = await sendBackground(['sendMessage', [userLink, randomContent, authorization]])
    if (result === 'success') {
      output.value += '已发送\n'
      outputCache += '已发送\n'
    } else {
      output.value += '发送失败\n'
      outputCache += '发送失败\n'
    }
    await delay(delayTime)
  }
  banner('完成')
}

// 检测活跃时间
async function detectActive () {
  const input = html.getElementById('contactInput').value
  const output = html.getElementById('contactOutput')
  inputCache = input
  outputCache = ''
  output.value = ''
  const userList = input.match(/.+/g)
  let index = 0
  const div = document.createElement('div')
  for (const userLink of userList) {
    index++
    banner(`进行中：${index} / ${userList.length}`)
    const text = await sendBackground(['request', [userLink]])
    div.innerHTML = text
    const karma = div.querySelector('[id="profile--id-card--highlight-tooltip--karma"]').outerText
    const activeTime = [...div.querySelectorAll('._3CecFEZvC8MFSvLsfuVYUs [data-testid="comment_timestamp"]')].map(x => x.outerText)
    const result = activeTime.slice(0, 10).join('\t')
    output.value += `${karma}\t${result}\n`
    outputCache += `${karma}\t${result}\n`
    await delay(3)
  }
  banner('完成')
}

// 检测是否回复
async function detectReply () {
  const input = html.getElementById('contactInput').value.match(/.+/g)
  const output = html.getElementById('contactOutput')
  const init = await sendBackground(['init'])
  const contentList = init.getContent.split('\n')
  let result = ''
  output.value = ''
  for (const userLink of input) {
    const userName = userLink.replace(/.+\/user\/|\//g, '')
    const contentWithName = contentList.map(r => 'You: ' + r.replace(/@@@/g, userName).match(/^.{5}/g)[0])
    const currentContent = messageList[userName]
    if (!currentContent) {
      result += '未检测到消息\n'
    } else if (contentWithName.includes(currentContent.match(/^.{10}/g)[0])) {
      result += '未回复\n'
    } else {
      result += '已回复\n'
    }
  }
  output.value = result
}

// 获取帖子数据
async function getPostData () {
  const input = html.getElementById('contactInput').value
  const output = html.getElementById('contactOutput')
  inputCache = input
  outputCache = ''
  output.value = ''
  const postLink = input.match(/.+/g)
  let index = 0
  const div = document.createElement('div')
  for (const link of postLink) {
    index++
    banner(`进行中：${index} / ${postLink.length}`)
    const text = await sendBackground(['request', [link]])
    div.innerHTML = text
    const upvote = div.getElementsByClassName('_1rZYMD_4xY3gRcSS3p8ODO _3a2ZHWaih05DgAOtvu6cIo _2iiIcja5xIjg-5sI4ECvcV')[0].outerText
    const comments = div.getElementsByClassName('_1UoeAeSRhOKSNdY_h3iS1O _3m17ICJgx45k_z-t82iVuO _3U_7i38RDPV5eBv7m4M-9J _2qww3J5KKzsD7e5DO0BvvU')[0].outerText.replace(/ comment.*/gi, '')
    output.value += `${upvote}\t${comments}\n`
    outputCache += `${upvote}\t${comments}\n`
    await delay(3)
  }
  banner('完成')
}
