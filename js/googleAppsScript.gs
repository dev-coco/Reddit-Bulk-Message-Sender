function doGet (request) {
  const params = request.parameter
  const sheetUrl = params.sheetUrl
  const type = params.type
  if (type === 'fill') {
    const { userID, country, status, note } = params
    return ContentService.createTextOutput(fillForm(sheetUrl, userID, country, status, note))
  } else if (type === 'database') {
    return ContentService.createTextOutput(JSON.stringify(datebase()))
  }
}

function datebase () {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data')
  const data = sheet.getRange('A:A').getValues()
  const obj = {}
  for (const x of data) obj[x] = true
  return obj
}

function getSheet (sheetUrl) {
  const ss = SpreadsheetApp.openByUrl(sheetUrl)
  const gid = sheetUrl.match(/(?<=gid=).*[0-9]/g, '')[0]
  return ss.getSheets().find(function (s) {
    return s.getSheetId() === parseInt(gid)
  })
}

function fillForm (sheetUrl, userID, country, status, note) {
  const sheet = getSheet(sheetUrl)
  const findID = sheet.getRange('A:A').createTextFinder(userID).findNext()
  if (findID) {
    const range = findID.getRow()
    sheet.getRange('B' + range).setValue(country)
    sheet.getRange('C' + range).setValue(status)
    sheet.getRange('D' + range).setValue(note)
    sheet.getRange('E' + range).setValue(new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }))
    return 'success'
  } else {
    return 'fail'
  }
}
