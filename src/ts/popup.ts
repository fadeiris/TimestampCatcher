"use strict";

import { Function, KeyName, PlaylistType } from "./function";

let elemBtnRemoveAll: HTMLButtonElement | null = null;
let elemBtnReload: HTMLButtonElement | null = null;
let elemSelExportType: HTMLSelectElement | null = null;
let elemBtnExport: HTMLButtonElement | null = null;
let elemTimestampData: HTMLTextAreaElement | null = null;
let elemBtnDownloadLocalVideoPlayer: HTMLAnchorElement | null = null;

document.addEventListener("DOMContentLoaded", () => {
    document.onreadystatechange = async () => {
        if (document.readyState === "complete") {
            await Function.initExtension();

            initPopupGlobalVariable();

            loadPopupUIi18n();

            registerPopupListenEvent();

            const timer = setTimeout(async () => {
                const keySet = await Function.getKeySet();

                // TODO: 2023/11/13 測試用待移除。
                alert(`鍵值：${keySet.key}`);

                await loadTimestampData(keySet.key);

                clearTimeout(timer);
            }, Function.CommonTimeout);
        }
    };
});

/**
 * 初始化全域變數
 */
function initPopupGlobalVariable(): void {
    elemBtnRemoveAll = document.getElementById("btnRemoveAll") as HTMLButtonElement;
    elemBtnReload = document.getElementById("btnReload") as HTMLButtonElement;
    elemSelExportType = document.getElementById("selExportType") as HTMLSelectElement;
    elemBtnExport = document.getElementById("btnExport") as HTMLButtonElement;
    elemTimestampData = document.getElementById("timestampData") as HTMLTextAreaElement;
    elemBtnDownloadLocalVideoPlayer = document.getElementById("btnDownloadLocalVideoPlayer") as HTMLAnchorElement;
}

/**
 * 載入 UI 的 i18n 字串
 */
function loadPopupUIi18n(): void {
    document.title = chrome.i18n.getMessage("appName");

    const elemTitle = document.getElementById("title");

    if (elemTitle !== null) {
        elemTitle.textContent = chrome.i18n.getMessage("stringTitle");
    }

    if (elemBtnRemoveAll !== null) {
        elemBtnRemoveAll.textContent = chrome.i18n.getMessage("stringBtnRemoveAll");
        elemBtnRemoveAll.title = chrome.i18n.getMessage("stringBtnRemoveAll");
    }

    if (elemBtnReload !== null) {
        elemBtnReload.textContent = chrome.i18n.getMessage("stringBtnReload");
        elemBtnReload.title = chrome.i18n.getMessage("stringBtnReload");
    }

    if (elemSelExportType !== null) {
        elemSelExportType.title = chrome.i18n.getMessage("stringSelExportType");
    }

    const elemOptTimestamp = document.getElementById("optTimestamp");

    if (elemOptTimestamp !== null) {
        elemOptTimestamp.textContent = chrome.i18n.getMessage("stringOptTimestamp");
    }

    const elemOptYtComment = document.getElementById("optYtComment");

    if (elemOptYtComment !== null) {
        elemOptYtComment.textContent = chrome.i18n.getMessage("stringOptYtComment");
    }

    const elemOptYtTimestampUrls = document.getElementById("optYtTimestampUrls");

    if (elemOptYtTimestampUrls !== null) {
        elemOptYtTimestampUrls.textContent = chrome.i18n.getMessage("stringOptYtTimestampUrls");
    }

    const elemOptCustomYTPlayerPlaylist_Timestamps = document.getElementById("optCustomYTPlayerPlaylist_Timestamps");

    if (elemOptCustomYTPlayerPlaylist_Timestamps !== null) {
        elemOptCustomYTPlayerPlaylist_Timestamps.textContent = chrome.i18n.getMessage("stringOptCustomYTPlayerPlaylist_Timestamps");
    }

    const elemOptCustomYTPlayerPlaylist_Seconds = document.getElementById("optCustomYTPlayerPlaylist_Seconds");

    if (elemOptCustomYTPlayerPlaylist_Seconds !== null) {
        elemOptCustomYTPlayerPlaylist_Seconds.textContent = chrome.i18n.getMessage("stringOptCustomYTPlayerPlaylist_Seconds");
    }

    const elemOptJsoncPlaylist = document.getElementById("optJsoncPlaylist");

    if (elemOptJsoncPlaylist !== null) {
        elemOptJsoncPlaylist.textContent = chrome.i18n.getMessage("stringOptJsoncPlaylist");
    }

    const elemOptCueSheet = document.getElementById("optCueSheet");

    if (elemOptCueSheet !== null) {
        elemOptCueSheet.textContent = chrome.i18n.getMessage("stringOptCueSheet");
    }

    if (elemBtnExport !== null) {
        elemBtnExport.textContent = chrome.i18n.getMessage("stringBtnExport");
        elemBtnExport.title = chrome.i18n.getMessage("stringBtnExport");
    }

    if (elemTimestampData !== null) {
        elemTimestampData.title = chrome.i18n.getMessage("stringTimestampTitle");
    }

    if (elemBtnDownloadLocalVideoPlayer !== null) {
        elemBtnDownloadLocalVideoPlayer.textContent = chrome.i18n.getMessage("stringBtnDownloadLocalVideoPlayer");
        elemBtnDownloadLocalVideoPlayer.title = chrome.i18n.getMessage("stringBtnDownloadLocalVideoPlayer");
    }

    const elemNotice = document.getElementById("notice");

    if (elemNotice !== null) {
        elemNotice.innerHTML = chrome.i18n.getMessage("stringNotice");
        elemNotice.title = chrome.i18n.getMessage("stringNoticeTitle");
    }
}

/**
 * 註冊監聽事件
 */
function registerPopupListenEvent(): void {
    elemBtnRemoveAll?.addEventListener("click", async () => {
        const confirmDelete = confirm(chrome.i18n.getMessage("messageConfirmClearAll"));

        if (confirmDelete === true) {
            const keySet = await Function.getKeySet();
            const isOkay = await Function.removeSavedDataByKey(keySet.key);

            if (isOkay === true) {
                Function.writeConsoleLog(chrome.i18n.getMessage("messageTimestampDataUpdated"));
                Function.playBeep(0);

                loadTimestampData(keySet.key);
            }
        }
    });

    elemBtnReload?.addEventListener("click", async () => {
        Function.playBeep(0);

        const keySet = await Function.getKeySet();

        loadTimestampData(keySet.key);
    });

    elemBtnExport?.addEventListener("click", async () => {
        const keySet = await Function.getKeySet();
        const selectedValue = elemSelExportType?.value;

        switch (selectedValue) {
            case "Timestamp":
                Function.exportTimestamp(keySet.key);
                break;
            case "YtComment":
                Function.exportYtComment(keySet.key);
                break;
            case "YtTimestampUrls":
                Function.exportYtTimestampUrls(keySet.key);
                break;
            case "CustomYTPlayerPlaylist_Timestamps":
                Function.exportSpeicalFormat(keySet.key, false, PlaylistType.Timestamps);
                break;
            case "CustomYTPlayerPlaylist_Seconds":
                Function.exportSpeicalFormat(keySet.key, false, PlaylistType.Seconds);
                break;
            case "JsoncPlaylist":
                Function.exportSpeicalFormat(keySet.key, true, PlaylistType.Seconds);
                break;
            case "CueSheet":
                Function.exportCueSheet(keySet.key);
                break;
            default:
                Function.exportTimestamp(keySet.key);
                break;
        }
    });

    elemTimestampData?.addEventListener("change", async () => {
        const keySet = await Function.getKeySet();
        const value = elemTimestampData?.value ?? "";
        const isOkay = await Function.saveTimestampData(keySet.key, value);

        if (isOkay === true) {
            Function.writeConsoleLog(chrome.i18n.getMessage("messageTimestampDataUpdated"));
            Function.playBeep(0);

            loadTimestampData(keySet.key);
        }
    });

    elemBtnDownloadLocalVideoPlayer?.addEventListener("click", () => {
        Function.playBeep(0);

        const tempAnchor = document.createElement("a");

        tempAnchor.download = "local_video_player.html";
        tempAnchor.href = "../html/local_video_player.html";
        tempAnchor.style.display = "none";

        document.body.appendChild(tempAnchor);

        tempAnchor.click();

        document.body.removeChild(tempAnchor);
    });
}

/**
 * 載入時間標記資料
 *
 * @param {string} key 字串，鍵值。
 */
async function loadTimestampData(key: string): Promise<void> {
    try {
        Function.showAnimation();

        const timestampData = await Function.getSavedTimestampData(key);
        const enableYTUtaWakuMode = await Function.getSavedDataValueByKey(KeyName.EnableYTUtaWakuMode, false);

        if (elemTimestampData !== null) {
            let newTimestampData = "";

            if (timestampData !== undefined) {
                newTimestampData = timestampData;
            }

            elemTimestampData.value = newTimestampData;
            elemTimestampData.scrollTop = elemTimestampData.scrollHeight;

            Function.writeConsoleLog(chrome.i18n.getMessage("messageLoadedTimestampData"));

            if (enableYTUtaWakuMode !== undefined) {
                Function.showYTUtaWakuMode(enableYTUtaWakuMode);
            }
        } else {
            Function.writeConsoleLog(chrome.i18n.getMessage("messageCanNotFindTextarea"));
        }
    } catch (error) {
        Function.writeConsoleLog(error);

        alert(`${error}`);
    }
}