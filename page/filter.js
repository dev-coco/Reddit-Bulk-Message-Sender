const filterRegex = document.getElementById('filterRegex')
const importBox = document.getElementById('importBox')
const status = document.getElementById('status')

let filterData = {}
let database

// 初始化
async function init () {
  // 获取数据库排重用
  if (!database) {
    const param = await new Promise(resolve => {
      chrome.storage.local.get('getScriptUrl', data => resolve(data))
    })
    status.innerText = '加载数据库中'
    fetch(`${param.getScriptUrl}?type=database`).then(response => response.json()).then(json => {
      database = json
      status.innerText = '加载完成'
      setTimeout(() => status.innerText = '', 2000)
    })
  }
  // 获取配置
  const param = await new Promise(resolve => {
    chrome.storage.local.get(['commentList', 'getFilterRegex'], data => resolve(data))
  })
  // 记录收集的评论列表
  filterData = param.commentList || {}
  filterRegex.value = param.getFilterRegex || ''
  // const sortedArr = Object.values(filterData).sort((a, b) => a.postUrl - b.postUrl)
  const sortedArr = Object.values(filterData).sort((a, b) => a.postUrl.localeCompare(b.postUrl));
  // 创建 table
  let html = ''
  for (const data of sortedArr) {
    // const { userLink, commentDate, badge, content, activeTime, recommendTime, postUrl, title } = filterData[userID]
    const { userName, userLink, commentDate, badge, content, activeTime, recommendTime, postUrl, title } = data
    html += `<tr>
    <td><input class="form-check-input filter-input" type="checkbox" id="${userName}" checked></td>
    <td><a href="${userLink}" target="_blank">${userName}</a></td>
    <td>${commentDate.replace(/ ago|\.|/g, '')}</td>
    <td>${badge}</td>
    <td>${recommendTime || ''}</td>
    <td><div class="box">${activeTime || ''}</div></td>
    <td><div class="box">Title: <a href="${postUrl}" target="_blank">${title}</a><br>${content.replace(/\n/g, '<br>')}</div></td>
  </tr>`
  }
  // 如果评论列表有数据就隐藏导入框
  if (html) importBox.style.display = 'none'
  document.getElementById('filterTable').innerHTML = html
  // 每个 tr 都设置监听器，点击 tr 控制选项框
  const tr = document.querySelectorAll('tbody > tr')
  tr.forEach(el => {
    el.addEventListener('click', () => {
      const checkbox = el.querySelector('input')
      checkbox.checked = !checkbox.checked
    })
  })
}
init()

// 清空列表
const cleanCommentList = document.getElementById('cleanCommentList')
cleanCommentList.addEventListener('click', () => {
  chrome.storage.local.set({ commentList: {} })
  init()
})

// 获取活跃时间
const queryActiveTime = document.getElementById('queryActiveTime')
queryActiveTime.addEventListener('click', async () => {
  const authorization = 'Bearer ' + await getToken()
  const checkedBox = document.querySelectorAll('.filter-input:checked')
  for (const data of checkedBox) {
    const json = await fetch(`https://gateway.reddit.com/desktopapi/v1/user/${data.id}/conversations?rtj=only&emotes_as_images=true&allow_quarantined=true&redditWebClient=web2x&app=web2x-client-production&allow_over18=1&include=identity&sort=new&layout=card&t=all`, {
      headers: {
        accept: 'application/json',
        authorization,
        'content-type': 'application/json',
      },
      credentials: 'include'
    }).then(response => response.json())
    // 按照从新到旧的时间排序
    const newArr = Object.values(json.posts).sort((a, b) => b.created - a.created)
    // 获取近期发帖时间 YYYY/mm/dd 格式
    const activeTime = newArr.map(x => new Date(x.created).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })).join('\n')
    // 计算出重复次数最多的小时
    const recommend = processTimestamps(newArr.map(x => x.created)).mostRepeatedHour
    // 获取的数据写入页面
    const td = data.parentNode.parentNode.getElementsByTagName('td')
    td[4].innerText = recommend
    td[5].querySelector('.box').innerText = activeTime
    // 储存查询后的数据
    filterData[data.id].recommendTime = recommend
    filterData[data.id].activeTime = activeTime
    chrome.storage.local.set({ commentList: filterData })
    await delay()
  }
})

// 排除重复
const duplicates = document.getElementById('duplicates')
duplicates.addEventListener('click', async () => {
  [...document.querySelectorAll('.filter-input:checked')].map(x => {
    if (database[x.id]) x.checked = false
  })
})

// 隐藏未勾选
const hideUnCheck = document.getElementById('hideUnCheck')
hideUnCheck.addEventListener('click', () => {
  hideUnCheck.classList.toggle('hide')
  if (hideUnCheck.className.includes('hide')) {
    const unCheck = document.querySelectorAll('.filter-input:not(:checked)')
    for (let i = 0; i < unCheck.length; i++) unCheck[i].parentNode.parentNode.style.display = 'none'
  } else {
    [...document.querySelectorAll('.filter-input')].map(el => el.parentNode.parentNode.style.display = '')
  }
})

// 复制信息
const copyInfo = document.getElementById('copyInfo')
copyInfo.addEventListener('click', () => {
  const userIDs = [...document.querySelectorAll('.filter-input:checked')].map(x => x.id)
  let result = ''
  for (const userID of userIDs) {
    let {
      badge,
      commentDate,
      content,
      postUrl,
      userLink,
      recommendTime,
      activeTime,
    } = filterData[userID]
    if (content.includes('\n')) content = `"${content.replace(/"/g, '""')}"`
    if (activeTime) activeTime = `"${activeTime.replace(/"/g, '""')}"`
    result += `${userID}\t${userLink}\t${commentDate}\t${badge}\t${recommendTime}\t${activeTime}\t${content}\t${postUrl}\n`
  }
  navigator.clipboard.writeText(result).then(() => alert('已复制'))
})

// 徽章筛选
const filterBadge = document.getElementById('filterBadge')
filterBadge.addEventListener('click', () => {
  const elements = document.querySelectorAll('#filterTable tr')
  for (const tr of elements) {
    const td = tr.getElementsByTagName('td')
    const checkbox = td[0].querySelector('.filter-input')
    if (new RegExp(filterRegex.value, 'gi').test(td[3].outerText)) checkbox.checked = false
  }
})

// 导入数据
const importData = document.getElementById('importData')
importData.addEventListener('click', () => {
  const importLink = document.getElementById('importLink')
  const userLinks = importLink.value.match(/.+/g)
  for (const link of userLinks) {
    const userName = link.replace(/.+user\/|\//g, '')
    // const { userName, userLink, commentDate, badge, content, activeTime, recommendTime, postUrl, title } = data
    
    filterData[userName] = {
      userLink: link,
      userName,
      commentDate: '',
      badge: '',
      content: '',
      postUrl: '',
      recommendTime: '',
      activeTime: '',
      title: ''
    }

  }
  chrome.storage.local.set({ commentList: filterData })
  init()
})

/**
 * @description 通过时间戳计算出重复次数最多的小时
 * @param {Array} timestamps - 时间戳
 * @returns 
 */
function processTimestamps (timestamps) {
  const hoursArray = timestamps.map(timestamp => new Date(timestamp).getHours())
  const hourCounts = hoursArray.reduce((counts, hour) => {
    counts[hour] = (counts[hour] || 0) + 1
    return counts
  }, {})
  let mostRepeatedHour
  let maxCount = 0
  for (const hour in hourCounts) {
    if (hourCounts[hour] > maxCount) {
      maxCount = hourCounts[hour]
      mostRepeatedHour = hour
    }
  }
  return {
    hoursArray,
    hourCounts,
    mostRepeatedHour: parseInt(mostRepeatedHour),
    maxCount
  }
}

// 获取账号 auth 凭证
async function getToken () {
  const div = document.createElement('div')
  div.innerHTML = await fetch('https://www.reddit.com/user/me').then(response => response.text())
  const json = JSON.parse(div.querySelector('#data').textContent.replace(/^window.___r = |;$/g, ''))
  return json.user.session.accessToken
}


filterRegex.addEventListener('input', () => {
  chrome.storage.local.set({ getFilterRegex: filterRegex.value })
})

// 全选/取消全选
const filterInputAll = document.getElementsByClassName('filter-input-all')[0]
filterInputAll.addEventListener('click', (e) => {
  [...document.getElementsByClassName('filter-input')].map(x => x.checked = e.target.checked)
})

// 延迟
function delay () {
  return new Promise(resolve => setTimeout(resolve, 3000))
}
