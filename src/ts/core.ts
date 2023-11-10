"use strict";

import { Command, Function, KeyName, Seperators } from "./function";

document.addEventListener("DOMContentLoaded", () => {
    document.onreadystatechange = async () => {
        if (document.readyState === "complete") {
            await Function.initExtension();

            // 傳送訊息至 Background.js
            chrome.runtime.sendMessage(Function.MessageWakeUp);

            // 用來應對 Vivaldi 網頁瀏覽器，還不支援擴充功能自定義快速鍵的狀況。
            const enableLegacyKeyListener = await Function.checkEnableLegacyKeyListener();

            if (enableLegacyKeyListener === true) {
                registerEventListener();
            }

            // 延後執行注入 HTML 元素。
            const timer = setTimeout(() => {
                injectElemToVideoPlayerControl();
                injectWebUIForYouTube();

                clearTimeout(timer);
            }, Function.CommonTimeout);
        }
    };
});

// 針對 YouTube 的事件加入監聽器。
document.addEventListener("yt-navigate-finish", () => {
    // 傳送訊息至 Background.js
    chrome.runtime.sendMessage(Function.MessageWakeUp);

    // 延後執行注入 HTML 元素。
    const timer = setTimeout(function () {
        injectElemToVideoPlayerControl();
        injectWebUIForYouTube();

        clearTimeout(timer);
    }, Function.CommonTimeout);
});

/**
 * 註冊事件監聽器
 */
function registerEventListener(): void {
    window.addEventListener("keydown", (event) => {
        const currentUrl = window.location.href;
        // 非嚴謹判斷目前的網頁的網址。
        const isYouTubeVideo = currentUrl.indexOf("watch?v=") !== -1;
        const isTwitchVideo = currentUrl.indexOf("twitch.tv/") !== -1;
        const isGamerAniVideo = currentUrl.indexOf("ani.gamer.com.tw/animeVideo.php?sn=") !== -1;
        const isBilibiliVideo = currentUrl.indexOf("bilibili.com/video/") !== -1;
        const isLocalHostVideo = currentUrl.indexOf("file:///") !== -1;
        // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
        const key = KeyName.DefaultTimestampDataKeyName;

        if (event.shiftKey && event.code === "KeyZ" &&
            (isYouTubeVideo || isTwitchVideo || isBilibiliVideo || isLocalHostVideo)) {
            // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + Z 鍵。
            recordTimestamp(currentUrl);
        } else if (event.shiftKey && event.code === "KeyX" &&
            (isYouTubeVideo || isTwitchVideo || isBilibiliVideo || isGamerAniVideo || isLocalHostVideo)) {
            // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + X 鍵。
            takeScreenshot(currentUrl);
        } else if (event.shiftKey && event.code === "KeyS" &&
            (isYouTubeVideo || isTwitchVideo || isBilibiliVideo || isGamerAniVideo || isLocalHostVideo)) {
            // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + S 鍵。
            doVideoRewind(key, false, Function.CommonSeconds);
        } else if (event.shiftKey && event.code === "KeyD" &&
            (isYouTubeVideo || isTwitchVideo || isBilibiliVideo || isGamerAniVideo || isLocalHostVideo)) {
            // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + D 鍵。
            doVideoRewind(key, true, Function.CommonSeconds);
        } else if (event.shiftKey && event.code === "KeyA" &&
            (isYouTubeVideo || isTwitchVideo || isBilibiliVideo || isLocalHostVideo)) {
            // 判斷目前所在頁面的網址及按下的按鍵是否為 Shift + A 鍵。
            syncTimestamp(key, Function.PauseSyncSeconds, true);
        } else {
            // 不進行任何的操作。
        }
    });
}

/**
 * 接收來自 background.js 的訊息
 */
chrome.runtime.onMessage.addListener((response, _sender, _sendResponse) => {
    // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
    const key = KeyName.DefaultTimestampDataKeyName;
    const currentUrl = window.location.href;

    if (response === Command.RecordTimestamp) {
        recordTimestamp(currentUrl);
    } else if (response === Command.TakeScreenshot) {
        takeScreenshot(currentUrl);
    } else if (response === Command.ExtractTimestamp) {
        extractTimestamp(currentUrl, false);
    } else if (response === Command.ExtractTimestampAutoAppendEndToken) {
        extractTimestamp(currentUrl, true);
    } else if (response === Command.ViewYtThumbnail) {
        viewYtThumbnail(currentUrl);
    } else if (response === Command.Rewind) {
        doVideoRewind(key, false, Function.CommonSeconds);
    } else if (response === Command.FastForward) {
        doVideoRewind(key, true, Function.CommonSeconds);
    } else if (response === Command.PauseSync) {
        syncTimestamp(key, Function.PauseSyncSeconds, true);
    } else {
        // 不進行任何的操作。
    }
});

/**
 * 在 YouTube、Twitch 以及 Bilibili 等網站的影片播放器注入 HTML 元素
 */
function injectElemToVideoPlayerControl(): void {
    const selectorYT = ".ytp-left-controls";
    const selectorTH = ".player-controls__left-control-group";
    const selectorGamerAni = ".control-bar-leftbtn";
    const selectorBilibili1 = ".bilibili-player-video-control-bottom-left";
    const selectorBilibili2 = ".web-player-controller-wrap";
    const selectorBilibili3 = ".squirtle-controller-wrap-left";
    const selectorBilibili4 = ".bpx-player-control-bottom-center";

    const currentUrl = window.location.href;
    const isLocalHostVideo = currentUrl.indexOf("file:///") !== - 1;

    const elemVideo = document.querySelector("video") as HTMLVideoElement;
    const elemYTLeftCtrl = document.querySelector(selectorYT) as HTMLDivElement;
    // 2022-11-16 針對 Twitch 網站的備註。
    // 因 Twitch 網站網頁設計之緣故，他們的頁面載入機制疑似為 Partial Page Loading。
    // 所以當影片切換時，按鈕無法重新再被注入一次，需要手動使用 Ctrl + F5 重新載入頁面。
    const elemTwitchLeftCtrl = document.querySelectorAll(selectorTH) as NodeList;
    const elemGamerAniLeftCtrl = document.querySelector(selectorGamerAni) as HTMLDivElement;

    // 2022-02-03 針對 Bilibili 網站的備註。
    // 因 Bilibili 網站網頁設計之緣故，他們的頁面載入機制疑似為 Partial Page Loading。
    // 所以當影片切換時，按鈕無法重新再被注入一次，需要手動使用 Ctrl + F5 重新載入頁面。
    // 另，因 Bilibili 網站的影片播放機制是使用他們自家自製的播放器，
    // 故在大部分的時候，本擴充功能的功能會無法使用。
    let elemBiliBiliLeftCtrl = document.querySelector(selectorBilibili1) as HTMLDivElement;

    // 針對 Bilibili 網站的直播。（Fallback）
    if (elemBiliBiliLeftCtrl === undefined || elemBiliBiliLeftCtrl === null) {
        elemBiliBiliLeftCtrl = document.querySelector(selectorBilibili2) as HTMLDivElement;
    }

    // 針對 Bilibili 網站的番劇。（Fallback）
    if (elemBiliBiliLeftCtrl === undefined || elemBiliBiliLeftCtrl === null) {
        elemBiliBiliLeftCtrl = document.querySelector(selectorBilibili3) as HTMLDivElement;
    }

    // 針對 Bilibili 網站的影片。（Fallback）
    if (elemBiliBiliLeftCtrl === undefined || elemBiliBiliLeftCtrl === null) {
        elemBiliBiliLeftCtrl = document.querySelector(selectorBilibili4) as HTMLDivElement;
    }

    if (isLocalHostVideo) {
        const elemNewDiv = document.createElement("div");

        elemNewDiv.id = "injectButtons";
        elemNewDiv.style.zIndex = "2";
        elemNewDiv.style.position = "relative";

        if (elemVideo !== undefined && elemVideo !== null) {
            elemVideo.insertAdjacentElement("afterend", elemNewDiv);
        }
    }

    const elemInjectButtons = document.getElementById("injectButtons");
    const elemBtnRecordTimestamp = document.getElementById("btnRecordTimestamp");

    if (elemBtnRecordTimestamp === undefined || elemBtnRecordTimestamp === null) {
        const elemTempAnchor = createAnchor(
            "btnRecordTimestamp",
            "stringRecordTimestamp",
            function () {
                const currentUrl = window.location.href;

                recordTimestamp(currentUrl);
            });

        if (elemYTLeftCtrl !== undefined && elemYTLeftCtrl !== null) {
            elemYTLeftCtrl.appendChild(elemTempAnchor);
        }

        if (elemTwitchLeftCtrl !== undefined && elemTwitchLeftCtrl !== null) {
            elemTwitchLeftCtrl.forEach((item) => {
                // 來源：https://stackoverflow.com/a/64410132
                // 來源：https://pawelgrzybek.com/cloning-dom-nodes-and-handling-attached-events/
                const elemClonedAnchor: HTMLAnchorElement = elemTempAnchor.cloneNode(true) as HTMLAnchorElement;

                elemClonedAnchor.style.setProperty("opacity", "1", "important");
                elemClonedAnchor.style.setProperty("visibility", "visible", "important");

                // 重新附加事件。
                elemClonedAnchor.addEventListener("mouseover", function (this: HTMLElement) {
                    this.style.setProperty("color", "#FF0000", "important");
                });
                elemClonedAnchor.addEventListener("mouseout", function (this: HTMLElement) {
                    this.style.setProperty("color", "#FFFFFF", "important");
                });
                elemClonedAnchor.onclick = elemTempAnchor.onclick;

                item.appendChild(elemClonedAnchor);
            });
        }

        if (elemInjectButtons !== undefined && elemInjectButtons !== null) {
            elemInjectButtons.appendChild(elemTempAnchor);
        }

        if (elemBiliBiliLeftCtrl !== undefined && elemBiliBiliLeftCtrl !== null) {
            // 針對 Bilibili 網站調整 CSS 設定。
            elemTempAnchor.style.float = "left";
            elemTempAnchor.style.marginLeft = "4px";

            elemBiliBiliLeftCtrl.appendChild(elemTempAnchor);
        }
    }

    const elemBtnTakeScreenshot = document.getElementById("btnTakeScreenshot");

    if (elemBtnTakeScreenshot === undefined || elemBtnTakeScreenshot === null) {
        const elemTempAnchor = createAnchor(
            "btnTakeScreenshot",
            "stringTakeScreenshot",
            function () {
                const currentUrl = window.location.href;

                takeScreenshot(currentUrl);
            });

        if (elemYTLeftCtrl !== undefined && elemYTLeftCtrl !== null) {
            elemYTLeftCtrl.appendChild(elemTempAnchor);
        }

        if (elemTwitchLeftCtrl !== undefined && elemTwitchLeftCtrl !== null) {
            elemTwitchLeftCtrl.forEach((item) => {
                // 來源：https://stackoverflow.com/a/64410132
                // 來源：https://pawelgrzybek.com/cloning-dom-nodes-and-handling-attached-events/
                const elemClonedAnchor: HTMLAnchorElement = elemTempAnchor.cloneNode(true) as HTMLAnchorElement;

                elemClonedAnchor.style.setProperty("opacity", "1", "important");
                elemClonedAnchor.style.setProperty("visibility", "visible", "important");

                // 重新附加事件。
                elemClonedAnchor.addEventListener("mouseover", function (this: HTMLElement) {
                    this.style.setProperty("color", "#FF0000", "important");
                });
                elemClonedAnchor.addEventListener("mouseout", function (this: HTMLElement) {
                    this.style.setProperty("color", "#FFFFFF", "important");
                });
                elemClonedAnchor.onclick = elemTempAnchor.onclick;

                item.appendChild(elemClonedAnchor);
            });
        }

        if (elemInjectButtons !== undefined && elemInjectButtons !== null) {
            elemInjectButtons.appendChild(elemTempAnchor);
        }

        if (elemGamerAniLeftCtrl !== undefined && elemGamerAniLeftCtrl !== null) {
            // 針對動畫瘋網站調整 CSS 設定。
            elemTempAnchor.style.float = "left";
            elemTempAnchor.style.marginTop = "10px";

            elemGamerAniLeftCtrl.appendChild(elemTempAnchor);
        }

        if (elemBiliBiliLeftCtrl !== undefined && elemBiliBiliLeftCtrl !== null) {
            // 針對 Bilibili 網站調整 CSS 設定。
            elemTempAnchor.style.float = "left";

            elemBiliBiliLeftCtrl.appendChild(elemTempAnchor);
        }
    }

    // 因應 Twitch 網站的 CSS 異動使用。
    if (elemTwitchLeftCtrl !== undefined && elemTwitchLeftCtrl !== null) {
        const targetCssClasses = document.querySelectorAll(".stream-display-ad__wrapper-hidden");

        targetCssClasses.forEach((elem: Element) => {
            (elem as HTMLElement).style.opacity = "1";
        });
    }
}

/**
 * 建立 Anchor
 *
 * @param {string} id HTML 元素的 ID 值。
 * @param {string} i18nStr I18N 字串。
 * @param {any} callbackFunc Callback 函式。
 * @returns {HTMLAnchorElement} HTML Anchor 元素。
 */
function createAnchor(id: string, i18nStr: string, callbackFunc: any): HTMLAnchorElement {
    const elemTempAnchor = document.createElement("a") as HTMLAnchorElement;

    elemTempAnchor.id = id;
    elemTempAnchor.title = chrome.i18n.getMessage(i18nStr);
    elemTempAnchor.text = `[${chrome.i18n.getMessage(i18nStr)}]`;
    elemTempAnchor.style.width = "auto";
    elemTempAnchor.style.marginRight = "4px";
    elemTempAnchor.style.textShadow = "1px 1px 2px #333333";
    elemTempAnchor.style.setProperty("color", "#FFFFFF", "important");
    elemTempAnchor.addEventListener("mouseover", function (this: HTMLElement) {
        this.style.setProperty("color", "#FF0000", "important");
    });
    elemTempAnchor.addEventListener("mouseout", function (this: HTMLElement) {
        this.style.setProperty("color", "#FFFFFF", "important");
    });
    elemTempAnchor.onclick = callbackFunc;

    return elemTempAnchor;
}

/**
 * 記錄時間標記
 *
 * @param {string} currentUrl 字串，目前的頁籤的網址。
 */
async function recordTimestamp(currentUrl: string): Promise<void> {
    // 當網址未包含 "file:///" 時才撥放音效，以避免發出 net::ERR_BLOCKED_BY_CLIENT。
    if (currentUrl.indexOf("file:///") === -1) {
        Function.playBeep(0);
    }

    const video = document.querySelector("video");

    let seconds = video?.currentTime ?? 0.0;

    // 2022-11-16 目前找不到方法取得 Bilibili 網站直播的目前時間。

    // 判斷是否為 Twitch 的頁面。
    if (currentUrl.indexOf("twitch.tv/") !== -1) {
        // 取得 Twitch 頁面上目前已直播的時間。
        const liveTimeText = document.querySelector(".live-time")?.textContent;

        if (liveTimeText !== undefined &&
            liveTimeText !== null &&
            liveTimeText !== "") {
            // 將 liveTimeText 轉換成秒數。
            const convertedSeconds = Function.convertTimeStringToSeconds(liveTimeText);
            let offsetSeconds = 0;

            // 當 convertedSeconds 大於 0 時。
            if (convertedSeconds > 0) {
                // 將 convertedSeconds 減去從 video 取得的 currentTime，以取得偏移秒數。
                offsetSeconds = convertedSeconds - seconds;
            }

            // 讓 seconds 加入偏移秒數。
            seconds += offsetSeconds;
        }
    }

    // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
    const key = KeyName.DefaultTimestampDataKeyName;
    const enableYTUtaWakuMode = await Function.checkEnableYTUtaWakuMode();
    const enableAppendingStartEndToken = await Function.checkEnableAppendingStartEndToken();
    const timestamp = await Function.getTimestamp(seconds);

    // 取得目前已儲存的時間標記資料。
    let savedValue = await Function.getSavedTimestampData(key);

    // 當鍵值對應的時間標記資料不存在時，先建立空資料，以利後續流程可以正常執行。。
    if (savedValue === undefined) {
        await Function.saveTimestampData(key, "");

        // 在空資料建立後再重新取值一次。
        savedValue = await Function.getSavedTimestampData(key);
    }

    // 移除不同步標記。
    let oldValue = Function.removeLastSeperator(savedValue);

    // 判斷是否啟用 YouTube 歌回模式。
    if (enableYTUtaWakuMode === true) {
        if (oldValue === "") {
            oldValue = `${chrome.i18n.getMessage("stringUrl")}${currentUrl}\n` +
                `\n` +
                `${chrome.i18n.getMessage("stringSongTimestamp")}\n`;
        } else {
            if (oldValue.indexOf(currentUrl) === -1) {
                oldValue = `${oldValue}\n\n` +
                    `${chrome.i18n.getMessage("stringUrl")}${currentUrl}\n` +
                    `\n` +
                    `${chrome.i18n.getMessage("stringSongTimestamp")}\n`;
            }
        }

        await Function.saveTimestampData(key, `${oldValue}${timestamp}\n`);
    } else {
        if (oldValue === "") {
            oldValue = `${chrome.i18n.getMessage("stringUrl")}${currentUrl}\n` +
                `${chrome.i18n.getMessage("stringFormatDescription")}\n` +
                `${chrome.i18n.getMessage("stringTimestamp")}\n`;
        } else {
            if (oldValue.indexOf(currentUrl) === -1) {
                oldValue = `${oldValue}\n\n` +
                    `${chrome.i18n.getMessage("stringUrl")}${currentUrl}\n` +
                    `${chrome.i18n.getMessage("stringFormatDescription")}\n` +
                    `${chrome.i18n.getMessage("stringTimestamp")}\n`;
            }
        }

        const startToken = enableAppendingStartEndToken === true ?
            chrome.i18n.getMessage("stringTimestampStart") :
            "";

        await Function.saveTimestampData(key, `${oldValue}${Function.CommentToken} ${startToken}\n${timestamp}\n`);
    }

    // 讓網頁 UI 重新載入時間標記資料。
    const timer = setTimeout(function () {
        // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
        const key = KeyName.DefaultTimestampDataKeyName;

        loadTimestampForWebUI(key);

        clearTimeout(timer);
    }, Function.CommonTimeout);
}

/**
 * 拍攝截圖
 *
 * @param {string} currentUrl 目前的頁籤的網址。
 */
async function takeScreenshot(currentUrl: string): Promise<void> {
    try {
        // 當網址未包含 "file:///" 時才撥放音效，以避免發出 net::ERR_BLOCKED_BY_CLIENT。
        if (currentUrl.indexOf("file:///") === -1) {
            Function.playBeep(1);
        }

        const video = document.querySelector("video");
        const seconds = video?.currentTime ?? 0.0;
        const timestamp = Function.convertToTimestamp(seconds);

        if (video !== null) {
            // 參考來源：https://stackoverflow.com/a/13765373
            const canvas = document.createElement("canvas");

            // 當找不到影片的寬高時，最後使用 1280x720 (HD 720P)。
            canvas.width = video?.videoWidth ?? 1280;
            canvas.height = video?.videoHeight ?? 720;

            if (canvas.width === 0) {
                canvas.width = 1280;
            }

            if (canvas.height === 0) {
                canvas.height = 720;
            }

            const context = canvas.getContext("2d");

            context!.imageSmoothingEnabled = true;
            // 2022-09-20 Mozilla Firefox 不支援。
            //context!.imageSmoothingQuality = "high";
            context!.drawImage(video, 0, 0, canvas.width, canvas.height);

            const enableAddAniGamerDanMu = await Function.checkEnableAddAniGamerDanMu();

            // 僅在動畫瘋的網址下生效。
            if (currentUrl.indexOf("ani.gamer.com.tw") !== -1 &&
                enableAddAniGamerDanMu === true) {
                Function.addAniGamerDanMuToCanvas(context, canvas.width, canvas.height);
            }

            let mime = await Function.getMIME();

            // 如果變數 mime 為空值時，直接使用 "image/jpeg"。
            if (mime === "") {
                mime = "image/jpeg";
            }

            const blob = Function.dataURLtoBlob(canvas.toDataURL(mime, 1));
            const tempAnchor = document.createElement("a");

            tempAnchor.download = `Screenshot_${document.title}_${timestamp}_` +
                `${canvas.width}x${canvas.height}${Function.getExtName(mime)}`;

            tempAnchor.href = window.URL.createObjectURL(blob);
            tempAnchor.style.display = "none";

            document.body.appendChild(tempAnchor);

            tempAnchor.click();

            document.body.removeChild(tempAnchor);
        } else {
            Function.writeConsoleLog(chrome.i18n.getMessage("messageCanNotGetScreenshot"));

            alert(chrome.i18n.getMessage("messageCanNotGetScreenshot"));
        }
    } catch (error) {
        Function.writeConsoleLog(error);

        alert(error);
    }
}

/**
 * 解析時間標記
 *
 * @param {string} currentUrl 目前的頁籤的網址。
 * @param {boolean} autoAddEndToken 布林值，用於判斷是否將下一筆的開始時間當作是上一筆的結束時間，預設值為 false。
 */
async function extractTimestamp(currentUrl: string, autoAddEndToken: boolean = false): Promise<void> {
    try {
        // 當網址未包含 "file:///" 時才撥放音效，以避免發出 net::ERR_BLOCKED_BY_CLIENT。
        if (currentUrl.indexOf("file:///") === -1) {
            Function.playBeep(1);
        }

        // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
        const key = KeyName.DefaultTimestampDataKeyName;

        let oldValue = await Function.getSavedTimestampData(key);

        // 判斷 oldValue 是否為空白。
        if (oldValue !== "") {
            // 先詢問。
            const confirmResult = confirm(chrome.i18n.getMessage("messageDoYouWantToOverwriteTimestamp"));

            if (confirmResult === true) {
                doExtractYouTubeComment(key, autoAddEndToken);
            }
        } else {
            doExtractYouTubeComment(key, autoAddEndToken);
        }
    } catch (error) {
        Function.writeConsoleLog(error);

        alert(error);
    }
}

/**
 * 執行解析 YouTube 的評論內容
 *
 * @param {string} key 字串，鍵值。
 * @param {boolean} autoAddEndToken 布林值，用於判斷是否將下一筆的開始時間當作是上一筆的結束時間，預設值為 false。
 */
async function doExtractYouTubeComment(key: string, autoAddEndToken: boolean = false): Promise<void> {
    // TODO: 2022/11/5 未來會需要再調整。
    let tempDataSet: string[] = [],
        composeStr = "",
        unknownNameCount = 1,
        tempNameStr = "";

    const selection = document.getSelection();
    const range = selection?.getRangeAt(0);
    const documentFragment = range?.cloneContents();

    let sourceNodeArray: ChildNode[] = [],
        // 手動分類節點的資料。
        tempNode2DArray: ChildNode[][] = [],
        tempNodeArray: ChildNode[] = [];

    const elemContentText = documentFragment?.querySelector("#content-text");

    if (elemContentText !== null) {
        sourceNodeArray = [...elemContentText?.childNodes!];
    } else {
        sourceNodeArray = [...documentFragment?.childNodes!];
    }

    sourceNodeArray.forEach((item, index, array) => {
        const tempElement = item as HTMLElement;
        const innerHTML = tempElement.innerHTML;

        // 當 innerHTML 的內容不為 "\n"、"\r" 時，
        // 才將結點加入至陣列。
        if (innerHTML !== "\n" &&
            innerHTML !== "\r") {
            // 排除圖片。
            if (item instanceof HTMLImageElement === false) {
                // 排除 Hash 標籤的連結。
                if (item instanceof HTMLAnchorElement === true &&
                    item?.textContent!.indexOf("#") === -1) {
                    tempNodeArray.push(item);
                } else {
                    tempNodeArray.push(item);
                }
            }
        } else {
            // 理論上 tempNodeArray 的子項目數量應大於 1。
            if (tempNodeArray.length > 1) {
                tempNode2DArray.push(tempNodeArray);

                // 重設 tempNodeArray。
                tempNodeArray = [];
                tempNodeArray.length = 0;
            }
        }

        // 當 index 為 array 的最後一個項目時。
        if (index == array.length - 1) {
            if (tempNodeArray.length > 0) {
                tempNode2DArray.push(tempNodeArray);

                // 重設 tempNodeArray。
                tempNodeArray = [];
                tempNodeArray.length = 0;
            }
        }
    });

    let totalPushCount = 0;

    tempNode2DArray.forEach((nodeArray) => {
        let pushCount = 0, overValue = -1;

        nodeArray.forEach((node, childIndex, array) => {
            if (node instanceof HTMLAnchorElement) {
                const textContent = node.textContent ?? "";

                // 時間標記連結。
                if (textContent.indexOf("#") === -1 &&
                    textContent.indexOf("http") === -1) {
                    const youTubeData = Function.getYouTubeIdAndStartSec(node.href);

                    composeStr += `${youTubeData[0]}${Seperators.Seperator2}${youTubeData[1]}${Seperators.Seperator2}`;

                    if (tempNameStr !== "") {
                        composeStr += tempNameStr;

                        tempDataSet.push(composeStr);

                        pushCount++;

                        // 清空 composeStr 供下一次使用。
                        composeStr = "";

                        // 清空 tempNameStr 供下一次使用。
                        tempNameStr = "";
                    }
                } else {
                    // # 標籤或網址連結。
                    tempNameStr += textContent;
                }
            } else if (node instanceof HTMLSpanElement) {
                // 判斷 array 的長度是否大於 3。
                if (array.length > 3) {
                    // 判斷 array 的長度是否大於 5。
                    if (array.length > 5) {
                        // 當 overValue 為 -1 時，設定 overValue 的值。
                        if (overValue === -1) {
                            overValue = array.length - 5;
                        }

                        // 判斷 childIndex 是否小於 overValue，
                        // 排除第一個時間標記前的任何字串。
                        if (childIndex <= overValue) {
                            // 不進行任何處理。
                            return;
                        } else {
                            // 重設 overValue。
                            overValue = -1;
                        }
                    } else {
                        // 排除第一個時間標記前的任何字串。
                        if (childIndex === 0) {
                            // 不進行任何處理。
                            return;
                        }
                    }
                }

                // 去掉換行字元跟移除開頭的空白。
                let trimedTextContent = node.textContent
                    ?.replace(/[\n\r]/g, "")
                    .trimStart();

                if (trimedTextContent !== undefined &&
                    trimedTextContent?.length > 0) {
                    // 判斷最後一個字元是否為 #。
                    if (trimedTextContent.slice(-1) === "#") {
                        // 移除字串尾巴的 #。
                        trimedTextContent = trimedTextContent.slice(0, -1).trimEnd();
                    }

                    if (composeStr === "") {
                        // 當 composeStr 為空白時，則表示時間標記不在字串前方，
                        // 而可能是在的中段或是最尾端。

                        // 將歌曲名稱指派給 tempNameStr。
                        tempNameStr += trimedTextContent;
                    } else {
                        // 判斷 composeStr 是否沒內容。
                        if (composeStr.indexOf(Seperators.Seperator2) !== -1) {
                            composeStr += trimedTextContent;

                            tempDataSet.push(composeStr);

                            pushCount++;

                            // 清空 composeStr 供下一次使用。
                            composeStr = "";

                            // 清空 tempNameStr 供下一次使用。
                            tempNameStr = "";
                        } else {
                            // 判斷 composeStr 是否沒內容。
                            if (composeStr === "" || composeStr.length <= 0) {
                                return;
                            } else {
                                // 針對只有時間標記的資料，補一個暫用的名稱。
                                composeStr += `${chrome.i18n.getMessage("stringUnknownName")} ${unknownNameCount}`;

                                unknownNameCount++;

                                tempDataSet.push(composeStr);

                                pushCount++;

                                // 清空 composeStr 供下一次使用。
                                composeStr = "";

                                // 清空 tempNameStr 供下一次使用。
                                tempNameStr = "";
                            }
                        }
                    }
                }
            } else {
                // 不進行任何處理。
                return;
            }

            // 當 childIndex 為 array 的內最後一個項目時，
            // 且 tempNameStr 不為空白時。
            if (childIndex === array.length - 1 &&
                tempNameStr !== "") {
                let targetIndex = totalPushCount - 1;

                if (pushCount >= 1) {
                    targetIndex += pushCount;
                }

                if (targetIndex < 0) {
                    targetIndex = 0;
                }

                // 將 tempNameStr 附加至 tempDataSet[targetIndex]。
                tempDataSet[targetIndex] += tempNameStr;

                // 清空 tempNameStr 供下一次使用。
                tempNameStr = "";
            }
        });

        totalPushCount += pushCount;
    });

    if (tempDataSet.length > 0) {
        const enableFormatted = await Function.checkEnableFormattedYTTimestamp();
        const enableAppendingStartEndToken = await Function.checkEnableAppendingStartEndToken();
        const startToken = enableAppendingStartEndToken === true ? chrome.i18n.getMessage("stringTimestampStart") : "",
            endToken = enableAppendingStartEndToken === true ? chrome.i18n.getMessage("stringTimestampEnd") : "";

        let outputStr = "",
            tempStr = "",
            previousSongName = "";

        tempDataSet.forEach(async (item, index) => {
            const data = item.split(Seperators.Seperator2),
                videoId = data[0],
                songName = Function.removeUrl(data[2]);

            let seconds = parseInt(data[1]);

            // 當為第一筆時，補上開頭內容。
            if (index === 0) {
                const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

                outputStr += `${chrome.i18n.getMessage("stringUrl")}${targetUrl}\n` +
                    `${chrome.i18n.getMessage("stringFormatDescription")}\n` +
                    `${chrome.i18n.getMessage("stringTimestamp")}\n`;
            }

            // 組成時間標記字串。
            let timestamp = `${Function.convertToTimestamp(seconds)}${Seperators.Seperator1}` +
                `${Function.convertToYTTimestamp(seconds, enableFormatted)}${Seperators.Seperator1}` +
                `${Math.round(seconds)}${Seperators.Seperator1}` +
                `${Function.convertToTwitchTimestamp(seconds)}`;

            // 當 tempStr 不為空值時，在補全 tempStr 後，清空 tempStr。
            if (tempStr !== "") {
                outputStr += `${tempStr.replace("{SongName}", songName)}` +
                    `${Function.CommentToken} ${songName}` +
                    `${endToken}\n` +
                    `${timestamp}\n\n`;

                // 清空以供下一次使用。
                tempStr = "";
            } else {
                let notMatchSeperatorCase = true;

                // 分隔符號案例。
                const seperatorCase = [
                    // 空值不是分隔符號。
                    "",
                    "-", "- ", " - ", " -",
                    "~", "~ ", " ~ ", " ~",
                    "、", "、 ", " 、 ", " 、",
                    "～", "～ ", " ～ ", " ～",
                    ",", ", ", " , ", " ,",
                    "，", "， ", " ， ", " ，"
                ];

                for (let i = 0; i < seperatorCase.length; i++) {
                    const seperator = seperatorCase[i];

                    if (songName === seperator) {
                        notMatchSeperatorCase = false;

                        break;
                    }
                }

                // 判斷 songName 是否不為空值、"-" 或是 "~"（以及相關的數種組合）。
                // 當 songName 為上列值時，則表示留言內是用該值分隔開始與結束時間。
                if (notMatchSeperatorCase) {
                    // 當不為第一筆資料，也不為最後一筆資料時，且 autoAddEndToken 的值為 true 時。
                    if ((index !== 0 && index <= tempDataSet.length - 1) &&
                        autoAddEndToken === true) {
                        outputStr += `${Function.CommentToken} ${previousSongName}` +
                            `${endToken}\n` +
                            `${timestamp}\n\n`;
                    } else {
                        // 幫第一筆之後的補上 "\n"。
                        if (index !== 0) {
                            outputStr += "\n";
                        }
                    }

                    outputStr += `${Function.CommentToken} ${songName}` +
                        `${startToken}\n` +
                        `${timestamp}\n`;

                    // 幫最後一筆的補上 "\n"。
                    if (index === tempDataSet.length - 1) {
                        // 當 autoAddEndToken 的值為 true 時，幫最後一個開始補上結束時間點。
                        if (autoAddEndToken === true) {
                            // TODO: 2022/10/3 待看是否要改為可以讓使用者自行設定。
                            // 自動附加秒數當作結束時間。
                            seconds += await Function.getAppendSeconds();

                            // 產生結束的時間標記字串。
                            timestamp = `${Function.convertToTimestamp(seconds)}${Seperators.Seperator1}` +
                                `${Function.convertToYTTimestamp(seconds, enableFormatted)}${Seperators.Seperator1}` +
                                `${Math.round(seconds)}${Seperators.Seperator1}` +
                                `${Function.convertToTwitchTimestamp(seconds)}`;

                            outputStr += `${Function.CommentToken} ${songName}` +
                                `${endToken}\n` +
                                `${timestamp}\n`;
                        }

                        outputStr += "\n";
                    }

                    // 設定 previousSongName 的值。
                    previousSongName = songName;
                } else {
                    // 將資料暫存至 tempStr。
                    tempStr += `${Function.CommentToken} {SongName}` +
                        `${startToken}\n` +
                        `${timestamp}\n`;
                }
            }
        });

        // 清空 previousSongName 的值。
        previousSongName = "";

        // 判斷 outputStr 是否為空值。
        if (outputStr !== "") {
            // 移除最尾端的換含字元。
            outputStr = outputStr.replace(/[\n\r]$/g, "");

            await Function.saveTimestampData(key, `${outputStr}`);

            // 讓網頁 UI 重新載入時間標記資料。
            const timer = setTimeout(async () => {
                await loadTimestampForWebUI(key);

                clearTimeout(timer);
            }, Function.CommonTimeout);
        } else {
            const errMsg2 = chrome.i18n.getMessage("messageTimestampParsedFailed");

            Function.writeConsoleLog(errMsg2);

            alert(errMsg2);
        }
    } else {
        const errMsg1 = chrome.i18n.getMessage("messageTheSelectionError");

        Function.writeConsoleLog(errMsg1);

        alert(errMsg1);
    }
}

/**
 * 執行影片倒轉
 *
 * @param {string} key 字串，鍵值。
 * @param {boolean} fastForward 布林值，是否快轉，預設值為 false。
 * @param {number} seconds 數值，秒數，預設值來自 Function.CommonSeconds。
 */
async function doVideoRewind(
    key: string,
    fastForward: boolean = false,
    seconds: number = Function.CommonSeconds): Promise<void> {
    const video = document.querySelector("video");

    if (video !== undefined && video !== null) {
        const curSeconds = video.currentTime;

        let newSeconds = 0;

        if (fastForward) {
            newSeconds = curSeconds + seconds;
        } else {
            newSeconds = curSeconds - seconds;
        }

        if (newSeconds < 0) {
            newSeconds = 0;
        }

        video.currentTime = newSeconds;

        syncTimestamp(key, newSeconds, false);
    }
}

/**
 * 在 YouTube 頁面中注入自定義的 Web UI
 */
function injectWebUIForYouTube(): void {
    // 在 YouTube 右側聊天室下方插入時間標記的編輯區塊。
    // 會有因網站 RWD 設計而跑版的問題。（位置順序）
    const elemYTSecInner = document.getElementById("secondary-inner") as HTMLDivElement;

    if (elemYTSecInner !== undefined && elemYTSecInner !== null) {
        // 先加入必須的 CSS。
        const css1 = ".cube {" +
            "width: 60px;" +
            "height: 60px;" +
            "opacity: 0.85;" +
            "background-color: #0f4c81;" +
            "animation-name: spin;" +
            "animation-duration: 1000ms;" +
            "animation-iteration-count: infinite;" +
            "animation-timing-function: linear;" +
            "position: absolute;" +
            "left: 45%;" +
            "top: 35%;" +
            "transform: translate(-50%, -50%);" +
            "}";
        const css2 = "@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}";
        const css3 = "@media (prefers-color-scheme: dark) {" +
            "#tWebUITextarea {" +
            "background-color: #333333;" +
            "color: #eeeeee;" +
            "}" +
            ".extCustomButton {" +
            "background: #333333 !important;" +
            "color: #eeeeee;" +
            "}" +
            "}";
        const css4 = ".extCustomButton {" +
            "background: white;" +
            "height: 30px;" +
            "margin-right: 4px;" +
            "vertical-align: middle;" +
            "}";
        const css5 = ".extCustomButton:hover {" +
            "border: 2px solid goldenrod;" +
            "}";

        Function.insertStyleSheetRule(css1);
        Function.insertStyleSheetRule(css2);
        Function.insertStyleSheetRule(css3);
        Function.insertStyleSheetRule(css4);
        Function.insertStyleSheetRule(css5);

        const elemWebUIFrame = document.getElementById("dWebUIFrame") as HTMLDivElement;

        if (elemWebUIFrame === undefined || elemWebUIFrame === null) {
            const elemNewWebUIFrame = document.createElement("div") as HTMLDivElement;

            elemNewWebUIFrame.id = "dWebUIFrame";
            elemNewWebUIFrame.className = "style-scope ytd-watch-flexy";
            elemNewWebUIFrame.style.position = "relative";

            const elemBtnGroup = document.createElement("div") as HTMLDivElement;

            elemBtnGroup.id = "dBtnGroup";
            elemBtnGroup.title = chrome.i18n.getMessage("stringBtnGroup");
            elemBtnGroup.style.marginBottom = "4px";
            elemBtnGroup.style.backgroundColor = "#0f4c81";
            elemBtnGroup.style.padding = "4px";
            elemBtnGroup.style.borderRadius = "4px";
            elemBtnGroup.className = "CustomButton";
            elemBtnGroup.addEventListener("dblclick", (evt) => {
                if (evt.target instanceof HTMLElement) {
                    const elemId = evt.target.id;

                    // 當 elemId 為空白時，或等於 elemBtnGroup.id 時，則觸發點擊事件。
                    if (elemId === "" || elemId === elemBtnGroup.id) {
                        elemBtnHideToogle.click();
                    }
                }
            });

            const btnClassName = "extCustomButton";
            const elemBtnHideToogle = document.createElement("button") as HTMLButtonElement;

            elemBtnHideToogle.id = "btnHideToogle";
            elemBtnHideToogle.textContent = chrome.i18n.getMessage("stringWebUIBtnHideToogle");;
            elemBtnHideToogle.title = chrome.i18n.getMessage("stringBtnHideToggle");
            elemBtnHideToogle.className = btnClassName;
            elemBtnHideToogle.addEventListener("click", () => {
                const elemWebUITextarea = document.getElementById("tWebUITextarea") as HTMLTextAreaElement;

                if (elemWebUITextarea !== undefined && elemWebUITextarea !== null) {
                    const displyValue = elemWebUITextarea.style.display;

                    if (displyValue === "none") {
                        elemWebUITextarea.style.display = "block";
                    } else {
                        elemWebUITextarea.style.display = "none";
                    }
                }
            });

            elemBtnGroup.appendChild(elemBtnHideToogle);

            const elemBtnRemoveAll = document.createElement("button") as HTMLButtonElement;

            elemBtnRemoveAll.id = "btnRemoveAll";
            elemBtnRemoveAll.textContent = chrome.i18n.getMessage("stringWebUIBtnRemoveAll");
            elemBtnRemoveAll.title = chrome.i18n.getMessage("stringBtnRemoveAll");
            elemBtnRemoveAll.className = btnClassName;
            elemBtnRemoveAll.addEventListener("click", async () => {
                const confirmDelete = confirm(chrome.i18n.getMessage("messageConfirmClearAll"));

                if (confirmDelete === true) {
                    // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                    const key = KeyName.DefaultTimestampDataKeyName;
                    const isOkay = await Function.removeSavedDataByKey(key);

                    if (isOkay === true) {
                        Function.writeConsoleLog(chrome.i18n.getMessage("messageTimestampDataUpdated"));
                        Function.playBeep(0);

                        loadTimestampForWebUI(key);
                    }
                }
            });

            elemBtnGroup.appendChild(elemBtnRemoveAll);

            const elemBtnReload = document.createElement("button") as HTMLButtonElement;

            elemBtnReload.id = "btnReload";
            elemBtnReload.textContent = chrome.i18n.getMessage("stringWebUIBtnReload");
            elemBtnReload.title = chrome.i18n.getMessage("stringBtnReload");
            elemBtnReload.className = btnClassName;
            elemBtnReload.addEventListener("click", () => {
                // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                const key = KeyName.DefaultTimestampDataKeyName;

                Function.playBeep(0);

                loadTimestampForWebUI(key);
            });

            elemBtnGroup.appendChild(elemBtnReload);

            const elemBtnRewind = document.createElement("button") as HTMLButtonElement;

            elemBtnRewind.id = "btnRewind";
            elemBtnRewind.textContent = "<<";
            elemBtnRewind.title = chrome.i18n.getMessage("stringBtnRewind");
            elemBtnRewind.className = btnClassName;
            elemBtnRewind.addEventListener("click", () => {
                // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                const key = KeyName.DefaultTimestampDataKeyName;

                doVideoRewind(key, false, Function.CommonSeconds);
            });

            elemBtnGroup.appendChild(elemBtnRewind);

            const elemBtnFastForward = document.createElement("button") as HTMLButtonElement;

            elemBtnFastForward.id = "btnFastForward"
            elemBtnFastForward.textContent = ">>";
            elemBtnFastForward.title = chrome.i18n.getMessage("stringBtnFastForward");
            elemBtnFastForward.className = btnClassName;
            elemBtnFastForward.addEventListener("click", () => {
                // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                const key = KeyName.DefaultTimestampDataKeyName;

                doVideoRewind(key, true, Function.CommonSeconds);
            });

            elemBtnGroup.appendChild(elemBtnFastForward);

            const elemBtnPauseSync = document.createElement("button") as HTMLButtonElement;

            elemBtnPauseSync.id = "btnPauseSync"
            elemBtnPauseSync.textContent = chrome.i18n.getMessage("stringWebUIBtnPauseSync");
            elemBtnPauseSync.title = chrome.i18n.getMessage("stringBtnPauseSync");
            elemBtnPauseSync.className = btnClassName;
            elemBtnPauseSync.addEventListener("click", () => {
                // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                const key = KeyName.DefaultTimestampDataKeyName;

                syncTimestamp(key, Function.PauseSyncSeconds, true);
            });

            elemBtnGroup.appendChild(elemBtnPauseSync);

            const elemBtnRecordTimestamp = document.createElement("button") as HTMLButtonElement;

            elemBtnRecordTimestamp.id = "btnRecordTimestamp";
            elemBtnRecordTimestamp.textContent = chrome.i18n.getMessage("stringWebUIBtnRecordTimestamp");
            elemBtnRecordTimestamp.title = chrome.i18n.getMessage("stringRecordTimestamp");
            elemBtnRecordTimestamp.className = btnClassName;
            elemBtnRecordTimestamp.addEventListener("click", () => {
                const currentUrl = window.location.href;

                recordTimestamp(currentUrl);
            });

            elemBtnGroup.appendChild(elemBtnRecordTimestamp);

            const elemExtName = document.createElement("label") as HTMLLabelElement;

            elemExtName.textContent = chrome.i18n.getMessage("appName");
            elemExtName.title = chrome.i18n.getMessage("appName");
            elemExtName.style.color = "#FFFFFF";

            elemBtnGroup.appendChild(elemExtName);

            elemNewWebUIFrame.appendChild(elemBtnGroup);

            const elemIndicator = document.createElement("div") as HTMLDivElement;

            elemIndicator.id = "indicator";
            elemIndicator.className = "cube";
            elemIndicator.style.display = "none";

            elemNewWebUIFrame.appendChild(elemIndicator);

            const elemWebUITextarea = document.createElement("textarea") as HTMLTextAreaElement;

            elemWebUITextarea.id = "tWebUITextarea";
            elemWebUITextarea.title = chrome.i18n.getMessage("stringTimestampTitle");
            //elemWebUITextarea.cols = 57;
            elemWebUITextarea.rows = 15;
            // 預設先隱藏不顯示。
            elemWebUITextarea.style.display = "none";
            elemWebUITextarea.style.marginBottom = "4px";
            elemWebUITextarea.style.borderRadius = "4px";
            elemWebUITextarea.style.width = "99%";
            elemWebUITextarea.addEventListener("change", async () => {
                // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                const key = KeyName.DefaultTimestampDataKeyName;
                const value = elemWebUITextarea?.value ?? "";
                const isOkay = await Function.saveTimestampData(key, value);

                if (isOkay === true) {
                    Function.writeConsoleLog(chrome.i18n.getMessage("messageTimestampDataUpdated"));
                    Function.playBeep(0);

                    loadTimestampForWebUI(key);
                }
            });

            elemNewWebUIFrame.appendChild(elemWebUITextarea);

            // 插入在倒數第二個位置。
            elemYTSecInner.insertBefore(elemNewWebUIFrame, elemYTSecInner.firstChild);

            // 第一次載入。
            const timer = setTimeout(function () {
                // TODO: 2023/11/10 從影片網址取得影片 ID 來當作鍵值。
                const key = KeyName.DefaultTimestampDataKeyName;

                loadTimestampForWebUI(key);

                clearTimeout(timer);
            }, Function.CommonTimeout);
        }
    }
}

/**
 * 網頁 UI 載入時間標記資料
 *
 * @param {string} key 字串，鍵值。
 */
async function loadTimestampForWebUI(key: string): Promise<void> {
    const textarea = document.getElementById("tWebUITextarea") as HTMLTextAreaElement;

    if (textarea !== undefined && textarea !== null) {
        // 在 tWebUITextarea 顯示時，才顯示動畫。
        if (textarea.style.display === "block") {
            Function.showAnimation();
        }

        const timestampData = await Function.getSavedTimestampData(key);

        if (textarea !== null) {
            let newTimestampData = "";

            if (timestampData !== undefined) {
                newTimestampData = timestampData;
            }

            textarea.value = newTimestampData;
            textarea.scrollTop = textarea.scrollHeight;

            Function.writeConsoleLog(chrome.i18n.getMessage("messageLoadedTimestampData"));
        } else {
            Function.writeConsoleLog(chrome.i18n.getMessage("messageCanNotFindTextarea"));
        }
    }
}

/**
 * 同步時間標記
 *
 * @param {string} key 字串，鍵值。
 * @param {number} newSeconds 數值，欲同步的秒數。
 * @param {boolean} pasueSyncMode 布林值，判斷是否要進入暫停同步模式，預設值為 false。
 */
async function syncTimestamp(
    key: string,
    newSeconds: number,
    pasueSyncMode: boolean = false): Promise<void> {
    const textarea = document.getElementById("tWebUITextarea") as HTMLTextAreaElement;

    if (textarea !== undefined && textarea !== null) {
        const content = textarea.value;

        // 以換行字元分割字串。
        const tempArray = content.split(/\r?\n/);

        // 取到倒數第一行。
        const actualLength = tempArray.length - 1;

        // 值不為空白的索引值，預設為 -1。
        let actualIdx = -1;

        // 由後往前循例。
        for (let i = actualLength; i--;) {
            const curValue = tempArray[i];

            // 當 curValue 不為空白時。
            if (curValue !== "") {
                // 將 i 指派至 actualIdx。
                actualIdx = i;

                // 中斷迴圈。
                break;
            }
        }

        // 當 actualIdx 不為 -1 時，即有找到值不為空白的索引值。
        if (actualIdx !== -1) {
            // 取出要保留的資料行，被保留的行將會從 tempArray 移除。
            const keepLines = tempArray.splice(0, actualIdx);

            // 初始化新變數。
            const leftLines = tempArray;

            // 最後一行。
            let lastLine = "";

            // 由後往前循例。
            for (let i = leftLines.length - 1; i--;) {
                const curValue = leftLines[i];

                // 當 curValue 不為空白時。
                if (curValue !== "") {
                    // 將 curValue 指派至 lastLine
                    lastLine = curValue;

                    // 中斷迴圈。
                    break;
                }
            }

            // 當 lastLine 不為空白時，即有找到有值的最後一行。
            if (lastLine !== "") {
                // 若 lastLine 內含有 "," 則不進行處裡。
                if (lastLine.indexOf(Seperators.Seperator3) === -1) {
                    // 排除註解行。
                    if (lastLine.indexOf(Function.CommentToken) !== 0 ||
                        lastLine.indexOf(Function.CommentToken) === -1) {
                        textarea.value = `${keepLines.join("\n")}\n`;

                        // 當 pasueSyncMode 為 true 時。
                        if (pasueSyncMode === true) {
                            // 當沒有 "," 時才補上。
                            if (lastLine.indexOf(Seperators.Seperator3) === -1) {
                                textarea.value += `${lastLine}${Seperators.Seperator3}\n`;
                            }
                        } else {
                            // 取得新的時間標記資訊。
                            const newTimestamp = await Function.getTimestamp(newSeconds);

                            textarea.value += `${newTimestamp}\n`;
                        }

                        // 回存時間標記。
                        await Function.saveTimestampData(key, textarea.value);
                    }
                } else {
                    // 當 pasueSyncMode 為 true 時。
                    if (pasueSyncMode === true) {
                        // 當有 "," 時移除 ","。
                        if (lastLine.indexOf(Seperators.Seperator3) !== -1) {
                            textarea.value = `${keepLines.join("\n")}\n`;
                            // 來源：https://thewebdev.info/2021/06/20/how-to-replace-the-last-occurrence-of-a-character-in-a-string-in-javascript/
                            textarea.value += `${lastLine.replace(/,([^,]*)$/, "$1")}\n`;

                            // 回存時間標記。
                            await Function.saveTimestampData(key, textarea.value);
                        }
                    }
                }
            }
        }
    }
}

/**
 * 檢視預覽圖
 *
 * @param {string} currentUrl 目前的頁籤的網址。
 */
async function viewYtThumbnail(currentUrl: string): Promise<void> {
    try {
        if (currentUrl.indexOf("watch?v=") !== -1) {
            const videoId = Function.getYouTubeId(currentUrl);
            const qualities = ["maxresdefault", "hqdefault", "mqdefault", "sddefault"];
            let imageUrl = "";

            for (let i = 0; i < qualities.length; i++) {
                const quality = qualities[i];
                const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
                // 檢查此畫質是否有效，沒有則繼續往下一個畫質檢查。
                const isOkay = await Function.checkImageDimensions(url);

                if (isOkay === true) {
                    imageUrl = url;

                    break;
                }
            }

            if (imageUrl !== "") {
                const tempAnchor = document.createElement("a");

                tempAnchor.href = imageUrl;
                tempAnchor.target = "_blank";
                tempAnchor.style.display = "none";

                document.body.appendChild(tempAnchor);

                tempAnchor.click();

                document.body.removeChild(tempAnchor);
            } else {
                alert(chrome.i18n.getMessage("messageThereIsNoThumbnailForThisYtVideo"));
            }
        } else {
            alert(chrome.i18n.getMessage("messagePleaseUseThisFeatureAfterViewingAValidYtVideoPage"));
        }
    } catch (error) {
        Function.writeConsoleLog(error);

        alert(error);
    }
}