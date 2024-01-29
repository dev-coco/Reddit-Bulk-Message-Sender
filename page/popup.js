document.getElementById('bulkMessage').addEventListener('click', () => chrome.tabs.create({ url: 'https://chat.reddit.com' }))
document.getElementById('filterData').addEventListener('click', () => chrome.tabs.create({ url: '/page/filter.html' }))
document.getElementById('setting').addEventListener('click', () => chrome.tabs.create({ url: '/page/setting.html' }))
