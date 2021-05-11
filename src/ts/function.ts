"use strict";

import "./dateExt";

/**
 * 列舉：播放清單的類型
 */
export const enum PlaylistType {
    // 時間標記。
    Timestamps = 1,
    // 秒數。
    Seconds = 2
}

export class Function {
    /**
     * 訊息：醒來
     */
    static MessageWakeUp = "wakeUp";

    /**
     * 指令：紀錄時間標記
     */
    static CommandRecordTimestamp = "recordTimestamp";

    /**
     * 指令：拍攝截圖
     */
    static CommandTakeScreenshot = "takeScreenshot";

    /**
     * 指令：解析時間標記
     */
    static CommandExtractTimestamp = "extractTimestamp";

    /**
     * 指令：解析時間標記（自動附加結束標記）
     */
    static CommandExtractTimestampAutoAppendEndToken = "extractTimestampAutoAddEndToken";

    /**
     * 指令：檢視此 YouTube 影片的預覽圖
     */
    static CommandViewYtThumbnail = "viewYtThumbnail";

    /**
     * 指令：倒轉
     */
    static CommandRewind = "rewind";

    /**
     * 指令：快轉
     */
    static CommandFastForward = "fastForward";

    /**
     * 指令：不同步 / 同步時間標記
     */
    static CommandPauseSync = "pauseSync";

    /**
     * 共用的 ContextMenu 選項「解析時間標記」的 ID 值
     */
    static CMID_ExtractTimestamp = "CMID_ExtractTimestamp";

    /**
     * 共用的 ContextMenu 選項「解析時間標記（自動附加結束標記）」的 ID 值
     */
    static CMID_ExtractTimestamp_AutoAppendEndToken = "CMID_ExtractTimestamp_AutoAppendEndToken";

    /**
      * 共用的 ContextMenu 選項「檢視此 YouTube 影片的預覽圖」的 ID 值
      */
    static CMID_ViewYtThumbnail = "CMID_ViewYtThumbnail";

    /**
     * 通用逾時毫秒數
     */
    static CommonTimeout: number = 300;

    /**
     * 通用秒數 (倒轉、快轉)
     */
    static CommonSeconds: number = 2;

    /**
     * 註解符號 "#"
     */
    static CommentToken = "#";

    /**
     * 分隔符號 1 "｜"
     */
    static Seperator1 = "｜";

    /**
     * 分隔符號 2 "^"
     */
    static Seperator2 = "^";

    /**
     * 分隔符號 3 ","
     */
    static Seperator3 = ",";

    /**
     * 分隔符號 4 "-------"
     */
    static Seperator4 = "-------";

    /**
     * 初始化擴充功能
     */
    static initExtension(): void {
        chrome.storage.sync.get(["Initiated"], (items) => {
            if (chrome.runtime.lastError?.message) {
                console.log(chrome.runtime.lastError?.message);

                alert(chrome.runtime.lastError?.message);
            } else {
                if (items.Initiated === undefined) {
                    chrome.storage.sync.set({
                        "Initiated": true,
                        "EnableOutputLog": false,
                        "EnableSoundEffect": true,
                        "EnableFormattedYTTimestamp": false,
                        "EnableYTUtaWakuMode": false,
                        "EnableLegacyKeyListener": false,
                        "EnableLeftSideSpacePadding": false,
                        "EnableAppendingStartEndToken": true,
                        "MIME": "image/png",
                        "EnableAddAniGamerDanMu": false
                    }, () => {
                        if (chrome.runtime.lastError?.message) {
                            console.log(chrome.runtime.lastError?.message);

                            alert(chrome.runtime.lastError?.message);
                        }
                    });

                    // 針對 "TimestampData" 只使用 local。
                    chrome.storage.local.set({
                        "TimestampData": ""
                    }, () => {
                        if (chrome.runtime.lastError?.message) {
                            console.log(chrome.runtime.lastError?.message);

                            alert(chrome.runtime.lastError?.message);
                        }
                    });
                }
            }
        });
    }

    /**
     * 將秒數格式化成 FFmpeg 的時間格式字串
     *
     * 參考：https://www.geeksforgeeks.org/how-to-convert-seconds-to-time-string-format-hhmmss-using-javascript/
     *
     * @param {number} secs 數值，HTML <video> 元素的 currentTime 屬性的值。
     * @param {boolean} allowDecimalPoint 布林值，是否允許輸出毫秒，預設值為 true。
     * @returns {string} 字串，FFmpeg 時間格式字串。
     */
    static convertToTimestamp(secs: number, allowDecimalPoint: boolean = true): string {
        const dateObj = new Date(secs * 1000);

        const hours = dateObj.getUTCHours();
        const minutes = dateObj.getUTCMinutes();
        let seconds = dateObj.getSeconds();
        const milliseconds = dateObj.getMilliseconds();

        let decimalPoint = "";

        if (allowDecimalPoint === true) {
            decimalPoint = `.${milliseconds.toString().padStart(3, "0")}`;
        } else {
            // 對毫秒進行四捨五入，當值大於等於 500 毫秒加 1 秒。
            if (milliseconds >= 500) {
                seconds = seconds + 1;
            }
        }

        return `${hours.toString().padStart(2, "0")}:` +
            `${minutes.toString().padStart(2, "0")}:` +
            `${seconds.toString().padStart(2, "0")}` +
            `${decimalPoint}`;
    }

    /**
     * 將秒數格式化成 CUE 指令碼的時間格式字串
     *
     * @param {number} secs 數值，HTML <video> 元素的 currentTime 屬性的值。
     * @param {boolean} allowDecimalPoint 布林值，是否允許輸出毫秒，預設值為 true。
     * @returns {string} 字串，CUE Sheet 時間格式字串。
     */
    static convertToCueSheetTimestamp(secs: number, allowDecimalPoint: boolean = true): string {
        const dateObj = new Date(secs * 1000);

        const hours = dateObj.getUTCHours();
        const minutes = dateObj.getUTCMinutes() + (hours * 60);
        let seconds = dateObj.getSeconds();
        const milliseconds = dateObj.getMilliseconds();

        let decimalPoint = "";

        if (allowDecimalPoint === true) {
            // TODO: 2022-05-05 不確定是否有問題。
            // 強制將 ".padStart(3, "0")" 改為 ".padStart(2, "0")"。
            decimalPoint = `:${milliseconds.toString().padStart(2, "0")}`;
        } else {
            // 對毫秒進行四捨五入，當值大於等於 500 毫秒加 1 秒。
            if (milliseconds >= 500) {
                seconds = seconds + 1;
            }
        }

        return `${minutes.toString().padStart(2, "0")}:` +
            `${seconds.toString().padStart(2, "0")}` +
            `${decimalPoint}`;
    }

    /**
     * 將秒數格式化成 YouTube 留言的時間格式字串
     *
     * @param {number} secs secs 數值，HTML <video> 元素的 currentTime 屬性的值。
     * @param {boolean} formated 布林值，用於判斷是否輸出格式化（hh:mm:ss）後的字串，預設值為 false。
     * @returns {string} 字串，YouTube 留言的時間格式（mm:ss）字串。
     */
    static convertToYTTimestamp(secs: number, formated: boolean = false): string {
        const dateObj = new Date(secs * 1000);

        const hours = dateObj.getUTCHours();
        const minutes = dateObj.getUTCMinutes();
        let seconds = dateObj.getSeconds();
        const milliseconds = dateObj.getMilliseconds();

        // 對毫秒進行四捨五入，當值大於等於 500 毫秒加 1 秒。
        if (milliseconds >= 500) {
            seconds = seconds + 1;
        }

        if (formated === true) {
            return `${hours.toString().padStart(2, "0")}:` +
                `${minutes.toString().padStart(2, "0")}:` +
                `${seconds.toString().padStart(2, "0")}`;
        } else {
            return `${hours > 0 ? (hours + ":") : ""}` +
                `${hours > 0 ? (minutes.toString().padStart(2, "0")) : minutes}:` +
                `${seconds.toString().padStart(2, "0")}`;
        }
    }

    /**
     * 將秒數格式化成 Twitch 網址的時間格式字串
     *
     * @param {number} secs secs 數值，HTML <video> 元素的 currentTime 屬性的值。
     * @returns {string} 字串，Twitch 網址的時間格式（_h_m_s）字串。
     */
    static convertToTwitchTimestamp(secs: number): string {
        const dateObj = new Date(secs * 1000);

        const hours = dateObj.getUTCHours();
        const minutes = dateObj.getUTCMinutes();
        let seconds = dateObj.getSeconds();
        const milliseconds = dateObj.getMilliseconds();

        // 對毫秒進行四捨五入，當值大於等於 500 毫秒加 1 秒。
        if (milliseconds >= 500) {
            seconds = seconds + 1;
        }

        return `${hours > 0 ? (hours + "h") : ""}` +
            `${minutes > 0 ? (minutes + "m") : ""}` +
            `${seconds}s`;
    }

    /**
     * 將時間字串轉換成秒數
     *
     * 參考：https://thewebdev.info/2021/05/23/how-to-convert-hhmmss-time-string-to-seconds-only-in-javascript/
     *
     * @param {string} hms 時間字串，格式：hh:mm:ss。
     * @returns {number} 秒數。
     */
    static convertTimeStringToSeconds(hms: string): number {
        const [hours, minutes, seconds] = hms.split(":");
        const totalSeconds = (+hours) * 60 * 60 + (+minutes) * 60 + (+seconds);

        return totalSeconds;
    }

    /**
     * 將 dataUrl 轉換成 Blob
     *
     * 來源：https://stackoverflow.com/a/30407840
     *
     * @param {string} dataUrl 資料網址。
     * @returns {Blob} Blob。
     */
    static dataURLtoBlob(dataUrl: string): Blob {
        let arr = dataUrl.split(","),
            mime = "",
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);

        const tempMime = arr[0].match(/:(.*?);/);

        if (tempMime !== null) {
            mime = tempMime[1];
        }

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }

    /**
     * 顯示動畫
     */
    static showAnimation(): void {
        const elemIndicator = document.getElementById("indicator");

        elemIndicator?.style.removeProperty("display");

        const timer = setTimeout(function () {
            if (elemIndicator !== undefined && elemIndicator !== null) {
                elemIndicator.style.display = "none";
            }

            clearTimeout(timer);
        }, 1000);
    }

    /**
     * 儲存時間標記的資料
     *
     * @param {string} value 字串，值。
     */
    static saveTimestampData(value: string): void {
        chrome.storage.local.set({ "TimestampData": value }, () => {
            if (chrome.runtime.lastError?.message) {
                this.writeConsoleLog(chrome.runtime.lastError?.message);

                alert(chrome.runtime.lastError?.message);
            } else {
                this.writeConsoleLog(`${chrome.i18n.getMessage("stringRecordedTimestamp")}\n# \n${value}`);
            }
        });
    }

    /**
     * 檢查是否可以輸出
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkCanOutput(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableOutputLog"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableOutputLog);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否可以播放
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkCanPlay(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableSoundEffect"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableSoundEffect);
                })
            }
            catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否輸出格式化的 YouTube 時間標記
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableFormattedYTTimestamp(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableFormattedYTTimestamp"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableFormattedYTTimestamp);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否啟用 YouTube 歌回模式
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableYTUtaWakuMode(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableYTUtaWakuMode"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableYTUtaWakuMode);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否使用使用舊版按鍵監聽模式
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableLegacyKeyListener(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableLegacyKeyListener"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableLegacyKeyListener);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否啟用左側填補空白（預設是在右側填補空白）
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableLeftSideSpacePadding(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableLeftSideSpacePadding"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableLeftSideSpacePadding);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否啟用自動在註解列的尾端補上"（開始）"、"（結束）"標記
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableAppendingStartEndToken(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableAppendingStartEndToken"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableAppendingStartEndToken);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 取得 MIME
     *
     * @returns {Promise<string>} 字串，MIME。
     */
    static async getMIME(): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["MIME"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.MIME);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 檢查是否啟用加入動畫瘋彈幕
     *
     * @returns {Promise<boolean>} 布林值，
     */
    static async checkEnableAddAniGamerDanMu(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(["EnableAddAniGamerDanMu"], (items) => {
                    if (chrome.runtime.lastError?.message) {
                        this.writeConsoleLog(chrome.runtime.lastError?.message);

                        alert(chrome.runtime.lastError?.message);
                    }

                    resolve(items.EnableAddAniGamerDanMu);
                })
            } catch (ex) {
                reject(ex);
            }
        });
    }

    /**
     * 取得副檔名
     *
     * @param {string} mime 字串，MIME。
     * @returns {string} 字串，副檔名。
     */
    static getExtName(mime: string): string {
        let result = "";

        switch (mime) {
            case "image/webp":
                result = ".webp";
                break;
            case "image/png":
                result = ".png";
                break;
            case "image/jpeg":
                result = ".jpg";
                break;
            default:
                result = "";
                break;
        }

        return result;
    }

    /**
     * 播放 Beep 音效
     *
     * @param value 數值，目前止支援 0 和 1，其他數值會出現錯誤訊息。
     */
    static async playBeep(value: number): Promise<void> {
        try {
            let canplay = await this.checkCanPlay();

            if (canplay === true) {
                const array = ["audio/beep1.mp3", "audio/beep2.mp3"];

                let customAudio = new Audio();

                customAudio.src = chrome.runtime.getURL(array[value]);

                customAudio.addEventListener("ended", function () {
                    customAudio.remove();
                });

                const resultPlay = customAudio.play();

                resultPlay.catch((error) => {
                    this.writeConsoleLog(error);
                });
            }
        } catch (error) {
            this.writeConsoleLog(error);

            alert(`${error}`);
        }
    }

    /**
     * 寫 Console 記錄
     *
     * @param {any} value 訊息內容。
     */
    static async writeConsoleLog(value: any): Promise<void> {
        let canOutput = await this.checkCanOutput();

        if (canOutput === true) {
            console.log(`${value}`);
        }
    }

    /**
     * 顯示 YouTube 歌回模式啟用
     *
     * @param {boolean} enable 布林值，啟用。
     */
    static showYTUtaWakuMode(enable: boolean): void {
        if (enable === true) {
            chrome.action.setBadgeText({ text: "YT" });
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    }

    /**
     * 傳送訊息
     *
     * @param {string} command 字串，指令。
     * @param {string} isContextMenu 布林值，是否為右鍵選單，預設值為 false。
     */
    static async sendMsg(command: string, isContextMenu: boolean = false): Promise<void> {
        // 來自右側選單的訊息必須傳送。
        if (isContextMenu === true) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    const tabId = tabs[0].id;

                    if (tabId !== undefined) {
                        chrome.tabs.sendMessage(tabId, command);
                    } else {
                        console.error(chrome.i18n.getMessage("messageTabIdIsUndefined"));
                    }
                } else {
                    console.error(chrome.i18n.getMessage("messageTabsIsEmpty"));
                }
            });

            return;
        }

        const useLegacyKeyListener = await Function.checkEnableLegacyKeyListener();

        // 判斷是否啟用「使用舊版按鍵監聽模式」，
        // 當啟用時不再傳送訊息至 core.js。
        if (useLegacyKeyListener !== true) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    const tabId = tabs[0].id;

                    if (tabId !== undefined) {
                        chrome.tabs.sendMessage(tabId, command);
                    } else {
                        console.error(chrome.i18n.getMessage("messageTabIdIsUndefined"));
                    }
                } else {
                    console.error(chrome.i18n.getMessage("messageTabsIsEmpty"));
                }
            });

            return;
        }
    }

    /**
     * 傳送資料
     *
     * @param {string} command 字串，指令。
     * @param {string} data 字串，資料。
     */
    static async sendData(command: string, data: string): Promise<void> {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                const tabId = tabs[0].id;

                if (tabId !== undefined) {
                    chrome.tabs.sendMessage(tabId, { "command": command, "data": data });
                } else {
                    console.error(chrome.i18n.getMessage("messageTabIdIsUndefined"));
                }
            } else {
                console.error(chrome.i18n.getMessage("messageTabsIsEmpty"));
            }
        });
    }

    /**
      * 解析時間標記
      *
      * @param {string} content 字串，時間標記的文字內容。
      * @param {boolean} seconds 布林值，判斷是否輸出秒數，預設值為 true。
      * @returns {string[]} 字串陣列，解析過的時間標記字串。
      */
    static parseTimestamp(content: string, seconds: boolean = true): string[] {
        let outputData: string[] = [],
            canProgress = false,
            videoId = "",
            timestampCount = 0,
            songIdx = 1,
            // 來源：https://stackoverflow.com/a/40675710
            tempOutputData: string | null;

        const i18nStart = chrome.i18n.getMessage("stringTimestampStart"),
            i18nUrl = chrome.i18n.getMessage("stringUrl");

        // 當找不到（開始）時，不進行作業。
        if (content.indexOf(i18nStart) > -1) {
            const allLines = content.split(/\r?\n/);

            allLines.forEach((line, index) => {
                if (videoId !== undefined &&
                    videoId !== null &&
                    videoId !== "" &&
                    tempOutputData === null) {
                    tempOutputData = `${videoId}${Function.Seperator2}`;
                }

                // 分隔用行。
                if (line === Function.Seperator4) {
                    return;
                }

                if (line.indexOf(i18nUrl) !== -1) {
                    videoId = Function.getYouTubeId(line.replace(i18nUrl, ""));

                    tempOutputData = `${videoId}${Function.Seperator2}`;

                    return;
                }

                if (line === chrome.i18n.getMessage("stringTimestamp")) {
                    canProgress = true;

                    return;
                }

                if (canProgress &&
                    line !== undefined &&
                    line !== null &&
                    line !== "") {
                    // 判斷是否為備註列。
                    if (line.indexOf(Function.CommentToken) !== -1) {
                        let clipName = "";

                        // 判斷是否為開始的點。
                        if (line.indexOf(i18nStart) !== -1) {
                            let separatorCount = [...tempOutputData!].filter(l => l === Function.Seperator2).length;

                            clipName = line.replace(Function.CommentToken, "").replace(i18nStart, "").trimStart();

                            if (clipName === "") {
                                clipName = " ";
                            }

                            if (clipName !== undefined && clipName !== null && clipName !== "") {
                                // 針對連續的（開始）補上結束時間。
                                if (separatorCount === 1) {
                                    tempOutputData += `${songIdx}${Function.Seperator2}${clipName}${Function.Seperator2}`;
                                } else {
                                    tempOutputData += "0";

                                    timestampCount = 0;

                                    outputData.push(tempOutputData!);

                                    tempOutputData = `${videoId}${Function.Seperator2}${songIdx}${Function.Seperator2}${clipName}${Function.Seperator2}`;
                                }

                                songIdx++;
                            }
                        }
                    } else {
                        const timestampSet = line.split(Function.Seperator1);

                        if (timestampSet.length > 0 &&
                            timestampSet[0] !== undefined &&
                            timestampSet[0] !== null &&
                            timestampSet[0] !== "") {
                            if (tempOutputData !== undefined &&
                                tempOutputData !== null &&
                                tempOutputData !== "") {
                                // timestampCount 為 0 時。
                                if (timestampCount === 0) {
                                    if (seconds === true) {
                                        tempOutputData += `${timestampSet[2]}${Function.Seperator2}`;
                                    } else {
                                        tempOutputData += `${timestampSet[1]}${Function.Seperator2}`;
                                    }

                                    timestampCount++;
                                } else if (timestampCount === 1) {
                                    if (seconds === true) {
                                        tempOutputData += `${timestampSet[2]}`;
                                    } else {
                                        tempOutputData += `${timestampSet[1]}`;
                                    }

                                    // 重置 timestampCount 為 0，以供下一個流程使用。
                                    timestampCount = 0;

                                    outputData.push(tempOutputData);

                                    tempOutputData = null;
                                }

                                // 針對連續的（開始）處理最後一個項目，幫其補上結束時間。
                                if (index >= (allLines.length - 2) && tempOutputData !== null) {
                                    const lastChar = tempOutputData.charAt(tempOutputData.length - 1);

                                    if (lastChar === Function.Seperator2) {
                                        if (seconds === true) {
                                            tempOutputData += "0";
                                        } else {
                                            tempOutputData += "00:00:00";
                                        }

                                        // 重置 timestampCount 為 0。
                                        timestampCount = 0;

                                        outputData.push(tempOutputData);

                                        tempOutputData = null;
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        return outputData;
    }

    /**
     * 取得 YouTube 影片的 ID
     *
     * 來源：https://gist.github.com/takien/4077195
     *
     * @param {string} url 字串，YouTube 影片的網址。
     * @returns {string} 字串，影片的 ID 值。
     */
    static getYouTubeId(url: string): string {
        const array = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);

        return undefined !== array[2] ? array[2].split(/[^\w-]/i)[0] : array[0];
    }

    /**
     * 取得 YouTube 影片的 ID 以及開始秒數
     *
     * 來源：https://stackoverflow.com/a/28659996
     *
     * @param {string} url 字串，YouTube 影片的網址。
     * @returns {string[]} 字串陣列，影片的 ID 值。
     */
    static getYouTubeIdAndStartSec(url: string): string[] {
        const array = url.split(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)(?:(\?t|&start|&t)=(\d+))?.*/);

        const newArray: string[] = [];

        undefined !== array[2] ? newArray.push(array[2]) : newArray.push("");
        undefined !== array[4] ? newArray.push(array[4]) : newArray.push("");

        return newArray;
    }

    /**
     * 插入 CSS 規則
     *
     * 來源：https://stackoverflow.com/a/48941794
     *
     * @param {string} value 字串，值。
     */
    static insertStyleSheetRule(value: string): void {
        const sheets: StyleSheetList = document.styleSheets;

        if (sheets.length === 0) {
            const newStyle = document.createElement("style");

            newStyle.appendChild(document.createTextNode(""));

            document.head.appendChild(newStyle);
        }

        const sheet: CSSStyleSheet = sheets[sheets.length - 1];

        sheet.insertRule(value, sheet.cssRules.length);
    }

    /**
     * 取得時間標記
     *
     * @param {number} seconds 數值，秒數。
     * @returns {string} 字串，時間標記。
     */
    static async getTimestamp(seconds: number): Promise<string> {
        let timestamp = "";

        const enableFormatted = await Function.checkEnableFormattedYTTimestamp();
        const enableYTUtaWakuMode = await Function.checkEnableYTUtaWakuMode();
        const enableLeftSideSpacePadding = await Function.checkEnableLeftSideSpacePadding();

        // 判斷是否啟用 YouTube 歌回模式。
        if (enableYTUtaWakuMode === true) {
            let processedTimestamp = "";

            const rawTimestamp = Function.convertToYTTimestamp(seconds, enableFormatted);

            // 自動補空白對齊。
            if (rawTimestamp.length !== 8) {
                const whiteSpaceCount = (8 - rawTimestamp.length);

                if (whiteSpaceCount > 0) {
                    let whiteSpaceStr = "";

                    for (let i = 0; i < whiteSpaceCount; i++) {
                        whiteSpaceStr += " ";
                    }

                    if (enableLeftSideSpacePadding === true) {
                        processedTimestamp = `${whiteSpaceStr}${rawTimestamp}`;
                    } else {
                        processedTimestamp = `${rawTimestamp}${whiteSpaceStr}`;
                    }
                }
            } else {
                processedTimestamp = rawTimestamp;
            }

            timestamp = `${processedTimestamp} `;
        } else {
            timestamp = `${Function.convertToTimestamp(seconds)}${Function.Seperator1}` +
                `${Function.convertToYTTimestamp(seconds, enableFormatted)}${Function.Seperator1}` +
                `${Math.round(seconds)}${Function.Seperator1}` +
                `${Function.convertToTwitchTimestamp(seconds)}`;
        }

        return timestamp;
    }

    /**
     * 移除最後的分隔符號
     *
     * @param {string} value 字串，輸入值。
     * @returns {string} 字串，處理結果。
     */
    static removeLastSeperator(value: string): string {
        let resultValue = value;

        // 以換行字元分割字串。
        const tempArray = value.split(/\r?\n/);

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
                // 排除註解行。
                if (lastLine.indexOf(Function.CommentToken) !== 0 ||
                    lastLine.indexOf(Function.CommentToken) === -1) {
                    // 當找到 "," 時，移除 ","。
                    if (lastLine.indexOf(Function.Seperator3) !== -1) {
                        resultValue = `${keepLines.join("\n")}\n`;
                        // 來源：https://thewebdev.info/2021/06/20/how-to-replace-the-last-occurrence-of-a-character-in-a-string-in-javascript/
                        resultValue += `${lastLine.replace(/,([^,]*)$/, "$1")}\n`;
                    }
                }
            }
        }

        return resultValue;
    }

    /**
     * 取得圖檔的寬、高資訊
     *
     * @param {string} url 字串，圖檔的網址。
     * @returns {Promise<{ width: number, height: number }} Promise，影像的寬、高的數值。
     */
    static getImageDimensions = (url: string): Promise<{ width: number, height: number }> => {
        // 參考來源：https://stackoverflow.com/a/70544176
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve({
                width: img.width,
                height: img.height,
            });
            img.onerror = (error) => {
                this.writeConsoleLog(error);

                reject(error);
            };
            img.src = url;
        });
    };

    /**
     * 檢查圖檔的寬、高資訊
     *
     * @param {string} url 字串，圖檔的網址。
     * @returns {Promise<boolean>} Promise，布林值，檢查結果。
     */
    static async checkImageDimensions(url: string): Promise<boolean> {
        let isOkay = true;

        const { width, height } = await this.getImageDimensions(url);

        if (width === 120 && height === 90) {
            // 無此畫質的預覽圖。
            isOkay = false;
        }

        return isOkay;
    }

    /**
     * 將動畫瘋的彈幕加入至 CanvasRenderingContext2D（未完成）
     *
     * @param {CanvasRenderingContext2D} context Canvas 的 CanvasRenderingContext2D。
     * @param {number} canvasWidth 數值，Canvas 的寬。
     * @param {number} canvasHeight 數值，Canvas 的高。
     */
    static addAniGamerDanMuToCanvas(context: CanvasRenderingContext2D | null,
        canvasWidth: number,
        canvasHeight: number): void {
        if (context !== null) {
            const danmuSelector = "div[id^=\"danmu-manager-\"][class=\"danmu-warp\"]";
            const danmuWarp = document.querySelector(danmuSelector);

            if (danmuWarp !== undefined && danmuWarp !== null) {
                const danmuWarpClientWidth = danmuWarp.clientWidth;
                const danmuWarpClientHeight = danmuWarp.clientHeight;

                // 建立繪製彈幕用的 Canvas。
                const danmuCanvas = document.createElement("canvas");

                danmuCanvas.width = danmuWarpClientWidth;
                danmuCanvas.height = danmuWarpClientHeight;

                const danmuContext = danmuCanvas.getContext("2d");
                // 取得所有的彈幕內容。
                const danmuNodes = [...danmuWarp.childNodes].filter((childNode) => {
                    // 排除無 textContent 項目。
                    return childNode.textContent !== undefined &&
                        childNode.textContent !== null &&
                        childNode.textContent !== "";
                });

                // 循例每一個彈幕。
                danmuNodes.forEach((childNode: ChildNode) => {
                    const htmlElement = childNode as HTMLElement;
                    // 彈幕的文字內容。
                    const textContent = htmlElement.textContent;

                    // 部分 CSS 設定來自動畫瘋網站 .danmu 類別。
                    const boundingClientRect = htmlElement.getBoundingClientRect();
                    // 字體大小。
                    const fontSize = htmlElement.style.fontSize;
                    // 字體顏色。
                    const color = htmlElement.style.color;
                    // 透明度。
                    const opacity = htmlElement.style.opacity;
                    // 設定填充風格，將 rgb() 配合 opacity 轉換成 rgba()。
                    const fillStyle = color.replace("rgb(", "rgba(")
                        .replace(")", `, ${opacity})`);
                    // 設定字型。
                    const fontFamily = "Microsoft JhengHei, Heiti, Simhei, " +
                        "Simsun, wqy-zenhei, MS Mincho, Meiryo, Microsoft Yahei, monospace";

                    // 只能盡量還原彈幕的陰影效果，
                    // 在動畫瘋網站上實際上是 4 個方向的 50% 陰影。
                    danmuContext!.shadowBlur = 2;
                    danmuContext!.shadowColor = "rgba(0, 0, 0, 0.5)";
                    danmuContext!.shadowOffsetX = 1;
                    danmuContext!.shadowOffsetY = 1;

                    // 設定字型相關的設定。
                    danmuContext!.font = `bold ${fontSize} ${fontFamily}`;
                    danmuContext!.fillStyle = fillStyle;
                    danmuContext!.imageSmoothingEnabled = true;
                    // 2022-09-20 Mozilla Firefox 不支援。
                    //danmuContext!.imageSmoothingQuality = "high";

                    let x: number = boundingClientRect.left,
                        y: number = 0,
                        maxWidth = boundingClientRect.width;

                    // 高度的魔術數字。
                    const magicNumForHeight: number = Math.round(110 / 2);

                    // 調整繪製在 Canvas 上的 y。
                    if (htmlElement.style.top !== "") {
                        const actualHeight = parseInt(htmlElement.style.top) +
                            boundingClientRect.height;

                        y = actualHeight;
                    } else if (htmlElement.style.bottom !== "") {
                        const actualHeight = danmuWarpClientHeight -
                            (parseInt(htmlElement.style.bottom) +
                                boundingClientRect.height) -
                            magicNumForHeight;

                        y = actualHeight;
                    } else {
                        y = boundingClientRect.top;
                    }

                    // 繪製彈幕文字至彈幕的 Canvas。
                    danmuContext!.fillText(textContent!, x, y, maxWidth);
                });

                // 將彈幕的 Canvas 繪製至截圖的 Canvas。
                context.imageSmoothingEnabled = true;
                // 2022-09-20 Firefox 不支援。
                //context.imageSmoothingQuality = "high";
                context.drawImage(danmuCanvas, 0, 0, canvasWidth, canvasHeight);
            } else {
                this.writeConsoleLog("danmuWarp is null.");
            }
        } else {
            this.writeConsoleLog("context is null.");
        }
    }
}