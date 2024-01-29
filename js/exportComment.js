const extensionID = document.getElementById('RedditBulkMessageSender').outerText
const sendBackground = data => new Promise(resolve => chrome.runtime.sendMessage(extensionID, data, res => { resolve(res) }))

const div = document.createElement('div')
div.innerHTML = `<button style="outline:none;color:white;background-color:#0079D3;position:fixed;font-weight:700;right:2%;top:20%;border-radius: 30px;z-index:9999;width:120px;height:35px;" id="exportComment">复制评论</button>`
document.body.appendChild(div)

const exportBtn = document.getElementById('exportComment')
exportBtn.addEventListener('click', () => {
  const newVersion = document.querySelector('body.v2')
  newVersion ? exportCommentNew() : exportComment()
})

async function exportComment () {
  const init = await sendBackground(['init'])
  const commentList = init.commentList || {}
  console.log('commentList', commentList)
  const commentBlock = document.getElementsByClassName('_3tw__eCCe7j-epNCKGXUKk')
  const title = document.getElementsByClassName('_eYtD2XCVieq6emjKBH3m _2SdHzo12ISmrC8H86TgSCp _29WrubtjAcKqzJSPdQqQ4h')[0].outerText
  for (const x of commentBlock) {
    try {
      const userLink = x.querySelector('[data-testid="comment_author_link"]').href
      const userName = userLink.replace(/.+user\/|\//g, '')
      const commentDate = x.querySelector('[data-testid="comment_timestamp"]').outerText
      const badge = x.getElementsByClassName('_3w527zTLhXkd08MyacMV9H')[0] || ''
      let content = x.querySelector('[data-testid="comment"]').outerText
      // if (content.includes('\n')) content = `"${content.replace(/"/g, '""')}"`

      commentList[userName] = {
        userLink,
        userName,
        commentDate,
        badge: badge ? badge.outerText: '',
        content,
        postUrl: location.href,
        recommendTime: '',
        activeTime: '',
        title
      }
    } catch (error) {
      console.log(error)
    }
  }
  console.log('commentList-in', commentList)
  await sendBackground(['setStorage', ['commentList', commentList]])
  exportBtn.innerText = '已收集 ' + Object.values(commentList).length
  setTimeout(() => {
    exportBtn.innerText = '收集评论'
  }, 2000)
}

async function exportCommentNew () {
  const init = await sendBackground(['init'])
  const commentList = init.commentList || {}
  console.log('commentList', commentList)
  const commentBlock = document.querySelectorAll('#comment-tree shreddit-comment')
  const title = document.querySelector('[slot="title"]').outerText
  for (const x of commentBlock) {
    try {
      const userLink = x.querySelector('faceplate-tracker[class="contents"] a[aria-label*="avatar"]').href
      const userName = userLink.replace(/.+user\/|\//g, '')
      const commentDate = x.querySelector('time').outerText
      const badge = x.querySelector('author-flair-event-handler') || ''
      let content = x.querySelector('[slot="comment"]').outerText
      // if (content.includes('\n')) content = `"${content.replace(/"/g, '""')}"`

      commentList[userName] = {
        userLink,
        userName,
        commentDate,
        badge: badge ? badge.outerText: '',
        content,
        postUrl: location.href,
        recommendTime: '',
        activeTime: '',
        title
      }
    } catch (error) {
      console.log(error)
    }
  }
  console.log('commentList-in', commentList)
  await sendBackground(['setStorage', ['commentList', commentList]])
  exportBtn.innerText = '已收集 ' + Object.values(commentList).length
  setTimeout(() => {
    exportBtn.innerText = '收集评论'
  }, 2000)
}
