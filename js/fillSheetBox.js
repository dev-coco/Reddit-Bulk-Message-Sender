async function init () {
  const extensionID = document.getElementById('RedditBulkMessageSender').outerText
  const sendBackground = data => new Promise(resolve => chrome.runtime.sendMessage(extensionID, data, res => { resolve(res) }))
  const params = await sendBackground(['init'])
  if (params.getScriptUrl && params.getSheetUrl) {
    const div = document.createElement('div')
    div.innerHTML = `
    <style>
      #fillSheetBox {
        top:50%;
        border: 1px solid;
        padding: 3px 12px;
        border-radius: 10px;
        color: #fff;
        background-color: #46bd62;
        right: 30px;
        z-index: 9999;
        position: fixed;
        font-size: 16px;
        max-width: 300px;
        -webkit-transform:translate(0%, -50%)
      }
      #fillSheetBox label,
      #fillSheetBox p {
        font-size: 16px;
        color: white;
        font-weight: bold;
      }
      #note {
        width: 100%;
        height: 35px;
        margin: 10px 0px
      }
    </style>
    <div id="fillSheetBox" translate="no">
      <p style="text-align:center;margin: 10px 0px;" id="title"></p>
      <label>备注</label>
      <input id="note" focus>
    </div>
    `
    document.body.appendChild(div)
    const userID = location.href.replace(/.+user\/|\//g, '')
    document.getElementById('title').innerText = userID
    const note = document.getElementById('note')
    const newVersion = document.querySelector('body.v2')
    // 没有私信按钮
    const buttons = document.querySelectorAll('._2q1wcTx60QKM_bQ1Maev7b._2iuoyPiKHN3kfOoeIQalDT._10BQ7pjWbeYP63SAPNS8Ts.HNozj_dKjQZ59ZsfEegz8')
    if (![...buttons].filter(x => x.outerText.includes('Chat')).length && !newVersion) {
      document.getElementById('fillSheetBox').style.backgroundColor = 'red'
      note.value = '没有私信按钮'
    } else if (newVersion && !document.querySelector('[aria-label="Open chat"]')) {
      document.getElementById('fillSheetBox').style.backgroundColor = 'red'
      note.value = '没有私信按钮'
    }
    document.onkeydown = function (e) {
      if (e.key === 'Escape') note.focus()
    }
    document.getElementById('note').addEventListener('keydown', event => {
      // 检查按下的键是否是回车键
      if (event.key === 'Enter') {
        sendBackground(['fillNote', [userID, note.value, document.referrer]])
      } // End if
    }) // End Listener
  } // End if
} // End Func
init()
