function refreshEcnNapcsInd() {
  const url = "https://api.census.gov/data/2022/ecnnapcsind?get=NAPCS2022,NAPCS2022_LABEL,NAPCSDOL,NAPCSDOL_F,LINEALL_PCT,LINEALL_PCT_F&for=us:*&NAICS2022=pseudo(N0600.00)&TAXSTAT=00&TYPOP=00" //your census API URL;

  const response = UrlFetchApp.fetch(url);
  const raw = JSON.parse(response.getContentText());

  // Add ID column
  const header = ["ID"].concat(raw[0]);
  const rows = raw.slice(1).map((row, i) => {
    return [i + 1].concat(row);
  });

  const data = [header].concat(rows);

  const ss = SpreadsheetApp.openById("1l-9vYC29S9-X7ihZ-6UStcs6qrjaY6MxMYhXEhqfYm8") //sheets URL; the crap between /d/ and /edit;
  const sheetName = "main" //your sheet name;
  const sheet =
    ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clearContents();
  sheet
    .getRange(1, 1, data.length, data[0].length)
    .setValues(data);
}
