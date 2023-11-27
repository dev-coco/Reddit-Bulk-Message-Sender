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

// 设置监听器
async function init () {
  try {
    const chatLogo = document.querySelector('body > faceplate-app > rs-app').shadowRoot.querySelector('div.container > rs-rooms-nav').shadowRoot.querySelector('div.flex.items-center.px-md.py-sm > span')
    chatLogo.addEventListener('click', createMenu)
    console.log('加载成功')
  } catch (erro) {
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
    <style>*{margin:0;padding:0;box-sizing:border-box}textarea{outline:0;border:none}button{outline:0!important;border:none;background:0 0}button:hover{cursor:pointer}.contact{z-index:999999;width:100%;min-height:100%;padding:15px;background:#009bff;background:-webkit-linear-gradient(left,#0072ff,#00c6ff);background:-o-linear-gradient(left,#0072ff,#00c6ff);background:-moz-linear-gradient(left,#0072ff,#00c6ff);background:linear-gradient(left,#0072ff,#00c6ff)}.contact-center{position:absolute;left:50%;top:50%;-webkit-transform:translate(-50%,-50%)}.container-contact{width:1163px;background:#fff;border-radius:10px;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;flex-wrap:wrap;justify-content:space-between;align-items:center;padding:50px 130px 50px 148px}.contact-div{width:390px}.contact-div-title{display:block;font-size:24px;color:#333;line-height:1.2px;text-align:center;padding-bottom:44px}.contact-div .wrap .textarea{min-height:350px;border-radius:25px;padding:12px 30px}.contact-div .wrap{position:relative;width:100%;z-index:1;margin-bottom:20px}.textarea{display:block;width:100%;background:#e6e6e6;font-family:Montserrat-Bold;font-size:15px;line-height:1.5;color:#666}.div-btn{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;flex-wrap:wrap;justify-content:center}.contact-btn{min-width:193px;height:50px;border-radius:25px;background:#57b846;font-family:Montserrat-Bold;font-size:15px;line-height:1.5;color:#fff;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;justify-content:center;align-items:center;padding:0 25px;-webkit-transition:.4s;-o-transition:.4s;-moz-transition:.4s;transition:.4s}#banner{margin:0 auto;background:#fff;width:fit-content;padding:4px 13px 4px 13px;border-radius:10px;margin-bottom:15px}</style>
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
  authorization = 'Bearer '+ document.querySelector('body > faceplate-app > rs-app').token.token
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
    const activeTime = [...div.querySelectorAll('._3CecFEZvC8MFSvLsfuVYUs [data-testid="comment_timestamp"]')].map(x => x.outerText)
    const result = activeTime.slice(0, 10).join('\t')
    output.value += result + '\n'
    outputCache += result + '\n'
    await delay(3)
  }
  banner('完成')
}
