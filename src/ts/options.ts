"use strict";

import { PlaylistType } from "./enumSets";
import { KeyName } from "./classSets";
import { Function } from "./function";

let elemEnableOutputLog: HTMLInputElement | null = null;
let elemEnableSoundEffect: HTMLInputElement | null = null;
let elemEnableFormattedYTTimestamp: HTMLInputElement | null = null;
let elemEnableYTUtaWakuMode: HTMLInputElement | null = null;
let elemEnableLegacyKeyListener: HTMLInputElement | null = null;
let elemEnableLeftSideSpacePadding: HTMLInputElement | null = null;
let elemEnableAppendingStartEndToken: HTMLInputElement | null = null;
let elemSelectMIME: HTMLSelectElement | null = null;
let elemEnableAddAniGamerDanMu: HTMLInputElement | null = null;
let elemSelExportType: HTMLSelectElement | null = null;
let elemBtnExport: HTMLButtonElement | null = null;
let elemBtnDownloadLocalVideoPlayer: HTMLAnchorElement | null = null;
let elemBtnReloadKey: HTMLButtonElement | null = null;
let elemSelKey: HTMLSelectElement | null = null;
let elemBtnGoTo: HTMLButtonElement | null = null;
let elemBtnDeleteKey: HTMLButtonElement | null = null;
let elemTextTimestampDataPreview: HTMLTextAreaElement | null = null;

document.addEventListener("DOMContentLoaded", () => {
    document.onreadystatechange = async () => {
        if (document.readyState === "complete") {
            await Function.initExtension()
                .then(() => {
                    initOptionsGlobalVariables();
                    loadOptionsUIi18n();
                    registerOptionsListenEvent();
                }).then(() => {
                    const timer = setTimeout(async () => {
                        await loadOptionsData()
                            .then(async () => await loadSavedDataKeys());

                        clearTimeout(timer);
                    }, Function.CommonTimeout);
                });
        }
    };
});

/**
 * 初始化全域變數
 */
function initOptionsGlobalVariables(): void {
    elemEnableOutputLog = document.getElementById("enableOutputLog") as HTMLInputElement;
    elemEnableSoundEffect = document.getElementById("enableSoundEffect") as HTMLInputElement;
    elemEnableFormattedYTTimestamp = document.getElementById("enableFormattedYTTimestamp") as HTMLInputElement;
    elemEnableYTUtaWakuMode = document.getElementById("enableYTUtaWakuMode") as HTMLInputElement;
    elemEnableLegacyKeyListener = document.getElementById("enableLegacyKeyListener") as HTMLInputElement;
    elemEnableLeftSideSpacePadding = document.getElementById("enableLeftSideSpacePadding") as HTMLInputElement;
    elemEnableAppendingStartEndToken = document.getElementById("enableAppendingStartEndToken") as HTMLInputElement;
    elemSelectMIME = document.getElementById("selectMIME") as HTMLSelectElement;
    elemEnableAddAniGamerDanMu = document.getElementById("enableAddAniGamerDanMu") as HTMLInputElement;
    elemSelExportType = document.getElementById("selExportType") as HTMLSelectElement;
    elemBtnExport = document.getElementById("btnExport") as HTMLButtonElement;
    elemBtnDownloadLocalVideoPlayer = document.getElementById("btnDownloadLocalVideoPlayer") as HTMLAnchorElement;
    elemBtnReloadKey = document.getElementById("btnReloadKey") as HTMLButtonElement;
    elemSelKey = document.getElementById("selKey") as HTMLSelectElement;
    elemBtnGoTo = document.getElementById("btnGoTo") as HTMLButtonElement;
    elemTextTimestampDataPreview = document.getElementById("textTimestampDataPreview") as HTMLTextAreaElement;
    elemBtnDeleteKey = document.getElementById("btnDeleteKey") as HTMLButtonElement;
}

/**
 * 載入 UI 的 i18n 字串
 */
function loadOptionsUIi18n(): void {
    document.title = chrome.i18n.getMessage("appName");

    const elemEnableOutputLogLabel = document.getElementById("enableOutputLogLabel");

    if (elemEnableOutputLogLabel !== null) {
        elemEnableOutputLogLabel.textContent = chrome.i18n.getMessage("stringEnableOutputLogLabel");
    }

    const elemEnableSoundEffectLabel = document.getElementById("enableSoundEffectLabel");

    if (elemEnableSoundEffectLabel !== null) {
        elemEnableSoundEffectLabel.textContent = chrome.i18n.getMessage("stringEnableSoundEffectLabel");
    }

    const elemEnableFormattedYTTimestampLabel = document.getElementById("enableFormattedYTTimestampLabel");

    if (elemEnableFormattedYTTimestampLabel !== null) {
        elemEnableFormattedYTTimestampLabel.textContent = chrome.i18n.getMessage("stringEnableFormattedYTTimestampLabel");
    }

    const elemEnableYTUtaWakuModeLabel = document.getElementById("enableYTUtaWakuModeLabel");

    if (elemEnableYTUtaWakuModeLabel !== null) {
        elemEnableYTUtaWakuModeLabel.textContent = chrome.i18n.getMessage("stringEnableYTUtaWakuModeLabel");
    }

    const elemelemEnableLegacyKeyListenerLabel = document.getElementById("enableLegacyKeyListenerLabel");

    if (elemelemEnableLegacyKeyListenerLabel !== null) {
        elemelemEnableLegacyKeyListenerLabel.textContent = chrome.i18n.getMessage("stringEnableLegacyKeyListenerLabel");
    }

    const enableLeftSideSpacePaddingLabel = document.getElementById("enableLeftSideSpacePaddingLabel");

    if (enableLeftSideSpacePaddingLabel !== null) {
        enableLeftSideSpacePaddingLabel.textContent = chrome.i18n.getMessage("stringEnableLeftSideSpacePaddingLabel");
    }

    const enableAppendingStartEndTokenLabel = document.getElementById("enableAppendingStartEndTokenLabel");

    if (enableAppendingStartEndTokenLabel !== null) {
        enableAppendingStartEndTokenLabel.textContent = chrome.i18n.getMessage("stringEnableAppendingStartEndTokenLabel");
    }

    const elemOutputFormat = document.getElementById("outputFormat");

    if (elemOutputFormat !== null) {
        elemOutputFormat.textContent = chrome.i18n.getMessage("stringOutputFormat");
    }

    const elemEnableAddAniGamerDanMuLabel = document.getElementById("enableAddAniGamerDanMuLabel");

    if (elemEnableAddAniGamerDanMuLabel !== null) {
        elemEnableAddAniGamerDanMuLabel.textContent = chrome.i18n.getMessage("stringEnableAddAniGamerDanMuLabel");
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

    if (elemBtnDownloadLocalVideoPlayer !== null) {
        elemBtnDownloadLocalVideoPlayer.textContent = chrome.i18n.getMessage("stringBtnDownloadLocalVideoPlayer");
        elemBtnDownloadLocalVideoPlayer.title = chrome.i18n.getMessage("stringBtnDownloadLocalVideoPlayer");
    }

    if (elemBtnReloadKey !== null) {
        elemBtnReloadKey.textContent = chrome.i18n.getMessage("stringBtnReloadKey");
        elemBtnReloadKey.title = chrome.i18n.getMessage("stringBtnReloadKey");
    }

    if (elemSelKey !== null) {
        elemSelKey.title = chrome.i18n.getMessage("stringSelKeyTitle");
    }

    const elemOptPleaseSelect = document.getElementById("optPleaseSelect");

    if (elemOptPleaseSelect !== null) {
        elemOptPleaseSelect.textContent = chrome.i18n.getMessage("stringPleaseSelect");
    }

    if (elemBtnGoTo !== null) {
        elemBtnGoTo.textContent = chrome.i18n.getMessage("stringBtnGoTo");
        elemBtnGoTo.title = chrome.i18n.getMessage("stringBtnGoTo");
    }

    if (elemBtnDeleteKey !== null) {
        elemBtnDeleteKey.textContent = chrome.i18n.getMessage("stringBtnDeleteKey");
        elemBtnDeleteKey.title = chrome.i18n.getMessage("stringBtnDeleteKey");
    }

    if (elemTextTimestampDataPreview !== null) {
        elemTextTimestampDataPreview.title = chrome.i18n.getMessage("stringTextTimestampDataPreviewTitle");
    }
}

/**
 * 註冊監聽事件
 */
function registerOptionsListenEvent(): void {
    elemEnableOutputLog?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableOutputLog,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemEnableSoundEffect?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableSoundEffect,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemEnableFormattedYTTimestamp?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableFormattedYTTimestamp,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemEnableYTUtaWakuMode?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableYTUtaWakuMode,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }

        Function.showYTUtaWakuMode(elem.checked);
    });

    elemEnableLegacyKeyListener?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableLegacyKeyListener,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemEnableLeftSideSpacePadding?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableLeftSideSpacePadding,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemEnableAppendingStartEndToken?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableAppendingStartEndToken,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemSelectMIME?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLOptionElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.MIME,
            elem.value,
            false);

        if (isOkay === true) {
            Function.playBeep(1);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemEnableAddAniGamerDanMu?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLInputElement;
        const isOkay = await Function.saveDataValueByKey(
            KeyName.EnableAddAniGamerDanMu,
            elem.checked,
            false);

        if (isOkay === true) {
            Function.playBeep(0);
            Function.writeConsoleLog(chrome.i18n.getMessage("messageSettingsSaved"));

            alert(chrome.i18n.getMessage("messageSettingsSaved"));
        }
    });

    elemBtnReloadKey?.addEventListener("click", (event) => {
        event.preventDefault();

        // 重新載入已儲存的資料鍵值。
        loadSavedDataKeys().then(() => {
            // 觸發鍵值下拉式選單的 "change" 事件。
            elemSelKey?.dispatchEvent(new Event("change"));
        });
    });

    elemSelKey?.addEventListener("change", async (event) => {
        const elem = event.currentTarget as HTMLSelectElement;
        const key = elem.value;
        const timestampData = await Function.getSavedTimestampData(key);

        if (elemTextTimestampDataPreview !== undefined && elemTextTimestampDataPreview !== null) {
            elemTextTimestampDataPreview.textContent = timestampData;
        }
    });

    elemBtnGoTo?.addEventListener("click", (event) => {
        event.preventDefault();

        const key = elemSelKey?.value ?? "";

        if (key === "" || key === "-1") {
            alert(chrome.i18n.getMessage("messageSelectAValidKeyValue"));

            return;
        }

        window.open(key, "_blank");
    });

    elemBtnDeleteKey?.addEventListener("click", async (event) => {
        event.preventDefault();

        const key = elemSelKey?.value ?? "";

        if (key === "" || key === "-1") {
            alert(chrome.i18n.getMessage("messageSelectAValidKeyValue"));

            return;
        }

        const confirmDelete = confirm(chrome.i18n.getMessage("messageConfirmClearAll"));

        if (confirmDelete === true) {
            await Function.removeSavedDataByKey(key)
                .then(isOkay => {
                    if (isOkay === true) {
                        Function.playBeep(0);
                        Function.writeConsoleLog(chrome.i18n.getMessage("messageTimestampDataUpdated"));

                        // 重新載入已儲存的資料鍵值。
                        loadSavedDataKeys().then(() => {
                            // 觸發鍵值下拉式選單的 "change" 事件。
                            elemSelKey?.dispatchEvent(new Event("change"));
                        });
                    }
                });
        }
    });

    elemBtnExport?.addEventListener("click", async () => {
        const key = elemSelKey?.value ?? "";
        const selectedExportTypeValue = elemSelExportType?.value;

        if (key === "" || key === "-1") {
            alert(chrome.i18n.getMessage("messageSelectAValidKeyValue"));

            return;
        }

        switch (selectedExportTypeValue) {
            case "Timestamp":
                Function.exportTimestamp(key);
                break;
            case "YtComment":
                Function.exportYtComment(key);
                break;
            case "YtTimestampUrls":
                Function.exportYtTimestampUrls(key);
                break;
            case "CustomYTPlayerPlaylist_Timestamps":
                Function.exportSpeicalFormat(key, false, PlaylistType.Timestamps);
                break;
            case "CustomYTPlayerPlaylist_Seconds":
                Function.exportSpeicalFormat(key, false, PlaylistType.Seconds);
                break;
            case "JsoncPlaylist":
                Function.exportSpeicalFormat(key, true, PlaylistType.Seconds);
                break;
            case "CueSheet":
                Function.exportCueSheet(key);
                break;
            default:
                Function.exportTimestamp(key);
                break;
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
 * 載入設定資料
 */
async function loadOptionsData(): Promise<void> {
    const optionsData = await Function.getSavedDataValueByKeys([
        KeyName.EnableOutputLog,
        KeyName.EnableSoundEffect,
        KeyName.EnableFormattedYTTimestamp,
        KeyName.EnableYTUtaWakuMode,
        KeyName.EnableLegacyKeyListener,
        KeyName.EnableLeftSideSpacePadding,
        KeyName.EnableAppendingStartEndToken,
        KeyName.MIME,
        KeyName.EnableAddAniGamerDanMu,
        KeyName.AppendSeconds
    ],
        false);

    if (optionsData !== undefined) {
        if (elemEnableOutputLog !== null) {
            elemEnableOutputLog.checked = optionsData[KeyName.EnableOutputLog];
        }

        if (elemEnableSoundEffect !== null) {
            elemEnableSoundEffect.checked = optionsData[KeyName.EnableSoundEffect];
        }

        if (elemEnableFormattedYTTimestamp !== null) {
            elemEnableFormattedYTTimestamp.checked = optionsData[KeyName.EnableFormattedYTTimestamp];
        }

        if (elemEnableYTUtaWakuMode !== null) {
            elemEnableYTUtaWakuMode.checked = optionsData[KeyName.EnableYTUtaWakuMode];
        }

        if (elemEnableLegacyKeyListener !== null) {
            elemEnableLegacyKeyListener.checked = optionsData[KeyName.EnableLegacyKeyListener];
        }

        if (elemEnableLeftSideSpacePadding !== null) {
            elemEnableLeftSideSpacePadding.checked = optionsData[KeyName.EnableLeftSideSpacePadding];
        }

        if (elemEnableAppendingStartEndToken !== null) {
            elemEnableAppendingStartEndToken.checked = optionsData[KeyName.EnableAppendingStartEndToken];
        }

        if (elemSelectMIME !== null) {
            elemSelectMIME.value = optionsData[KeyName.MIME];
        }

        if (elemEnableAddAniGamerDanMu !== null) {
            elemEnableAddAniGamerDanMu.checked = optionsData[KeyName.EnableAddAniGamerDanMu];
        }
    }
}

/**
 * 載入已儲存的資料鍵值
 */
async function loadSavedDataKeys(): Promise<void> {
    // 需要排除的鍵值。
    const excludedKeys = [
        KeyName.EnableOutputLog,
        KeyName.EnableSoundEffect,
        KeyName.EnableFormattedYTTimestamp,
        KeyName.EnableYTUtaWakuMode,
        KeyName.EnableLegacyKeyListener,
        KeyName.EnableLeftSideSpacePadding,
        KeyName.EnableAppendingStartEndToken,
        KeyName.MIME,
        KeyName.EnableAddAniGamerDanMu,
        KeyName.AppendSeconds
    ];

    let keys = await Function.getSavedDataKeys();

    if (keys === undefined) {
        return;
    }

    keys = keys.filter((item) => {
        if (excludedKeys.indexOf(item) === -1) {
            return item;
        }
    });

    const keyPleaseSelect = chrome.i18n.getMessage("stringPleaseSelect");

    // 插入至陣列的第一筆。
    keys.unshift(keyPleaseSelect);

    // 移除現有的選項。
    // 來源：https://stackoverflow.com/a/40606838
    while (elemSelKey?.firstChild) {
        elemSelKey?.firstChild.remove()
    }

    // 重新插入選項。
    keys.forEach((item) => {
        const elemOption = document.createElement("option");

        if (item === keyPleaseSelect) {
            elemOption.id = "optPleaseSelect";
        }

        elemOption.value = item === keyPleaseSelect ? "-1" : item;
        elemOption.text = item;

        elemSelKey?.appendChild(elemOption);
    });
}