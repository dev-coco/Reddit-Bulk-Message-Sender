const div = document.createElement('div')
div.innerHTML = `<button style="outline:none;color:white;background-color:#0079D3;position:fixed;font-weight:700;right:2%;top:20%;border-radius: 30px;z-index:9999;width:120px;height:35px;" id="exportComment">复制评论</button>`
document.body.appendChild(div)

document.getElementById('exportComment').addEventListener('click', exportComment)

function exportComment () {
  let result = '', index = 0
  const commentBlock = document.getElementsByClassName('_3tw__eCCe7j-epNCKGXUKk')
  for (const x of commentBlock) {
    try {
      index++
      const userLink = x.querySelector('[data-testid="comment_author_link"]').href
      const userName = userLink.replace(/.+user\/|\//g, '')
      const commentDate = x.querySelector('[data-testid="comment_timestamp"]').outerText
      const vote = x.getElementsByClassName('_1rZYMD_4xY3gRcSS3p8ODO _25IkBM0rRUqWX5ZojEMAFQ _3ChHiOyYyUkpZ_Nm3ZyM2M')[0].outerText
      let content = x.querySelector('[data-testid="comment"]').outerText
      if (content.includes('\n')) content = `"${content.replace(/"/g, '""')}"`
      result += `${index}\t${userName}\t${userLink}\t${commentDate}\t${content}\t${vote}\t${location.href}\n`
    } catch {}
  }
  navigator.clipboard.writeText(result).then(() => alert('已复制评论'))
}
