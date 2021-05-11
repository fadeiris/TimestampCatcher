# 時間標記抓取器

提供取得特定網站的影片時間標記資訊、截圖等功能。

## 建置

### 更新相依性函式庫

> `npm run update`

### 同步版本號

- 將 package.json 內 version 的值同步至 manifest.json、manifestFx.json
  > `npm run updateVersion`

### 建置方式

- Google Chrome、Microsoft Edge
  > `npm run build`

- Mozilla Firefox
  > `npm run buildFx`

※關於 `Mozilla Firefox` 的部分，請自行至
[Firefox 附加元件站（zh-TW）](https://addons.mozilla.org/)上傳並簽屬自我發布型的 `*.xpi` 安裝檔案。

## 注意事項

1. 使用上列指令所輸出的檔案，會被放置於 `dist` 資料夾內。
2. 本擴充功能並非使用 `WebExtension API` 撰寫，對於非 `Google Chrome` 網頁瀏覽器的支援是利用其自身實作的相容性功能達成。

## 參考內容

- Mozilla Firefox
  - [Manifest V3 Firefox Developer Preview — how to get involved](https://blog.mozilla.org/addons/2022/06/08/manifest-v3-firefox-developer-preview-how-to-get-involved/)
  - [Manifest V3 migration guide](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)
