"use strict";

import { PlaylistType } from "./enumSets";
import { KeyName, Seperators, Message, KeySet } from "./classSets";
import "./dateExt";

/**
 * 函式
 */
export class Function {
    /**
     * 通用逾時毫秒數
     */
    static CommonTimeout: number = 300;

    /**
     * 通用秒數 (倒轉、快轉)
     */
    static CommonSeconds: number = 2;

    /**
     * 暫停同步用秒數
     */
    static PauseSyncSeconds: number = -1;

    /**
     * 註解符號 "#"
     */
    static CommentToken = "#";

    /**
     * 預設附加秒數（300 秒）
     */
    static DefaultAppendSeconds: number = 300;

    /**
     * 初始化擴充功能
     */
    static async initExtension(): Promise<void> {
        const initiated = await this.getSavedDataValueByKey(KeyName.Initiated, false);

        if (initiated === undefined) {
            chrome.storage.sync.set({
                [KeyName.Initiated]: true,
                [KeyName.EnableOutputLog]: false,
                [KeyName.EnableSoundEffect]: true,
                [KeyName.EnableFormattedYTTimestamp]: false,
                [KeyName.EnableYTUtaWakuMode]: false,
                [KeyName.EnableLegacyKeyListener]: false,
                [KeyName.EnableLeftSideSpacePadding]: false,
                [KeyName.EnableAppendingStartEndToken]: true,
                [KeyName.MIME]: "image/png",
                [KeyName.EnableAddAniGamerDanMu]: false,
                [KeyName.AppendSeconds]: this.DefaultAppendSeconds
            }, () => {
                this.processLastError();
            });

            // 設定 DefaultTimestampDataKeyName 的值。
            await this.saveTimestampData(KeyName.DefaultTimestampDataKeyName, "");
        }
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
            // TODO: 2022/5/5 不確定是否會有問題。
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

        const timer = setTimeout(() => {
            if (elemIndicator !== undefined && elemIndicator !== null) {
                elemIndicator.style.display = "none";
            }

            clearTimeout(timer);
        }, 1000);
    }

    /**
     * 透過特定鍵值來儲存時間標記的資料
     *
     * @param {string} key 字串，鍵值。
     * @param {string} value 字串，值。
     * @returns {Promise<boolean>} 布林值，儲存的結果，當值為 true 則表示儲存成功，若值為 false 則是儲存失敗。
     */
    static async saveTimestampData(key: string, value: string): Promise<boolean> {
        return new Promise(async resolve => {
            const isOkay = await this.saveTimestampDataByKey(key, value);

            resolve(isOkay);
        });
    }

    /**
     * 透過特定鍵值來儲存時間標記的資料
     *
     * @param {string} key 字串，鍵值。
     * @param {string} value 字串，值。
     * @returns {Promise<boolean>} 布林值，儲存的結果，當值為 true 則表示儲存成功，若值為 false 則是儲存失敗。
     */
    static saveTimestampDataByKey(key: string, value: string): Promise<boolean> {
        return new Promise(resolve => {
            chrome.storage.local.set({ [key]: value }, () => {
                this.processLastError(() => {
                    resolve(false);
                });

                this.writeConsoleLog(`${chrome.i18n.getMessage("stringRecordedTimestamp")}\n# \n${value}`);

                resolve(true);
            });
        });
    }

    /**
     * 透過特定鍵值來取得已儲存時間標記的資料
     *
     * @param {string} key 字串，鍵值。
     * @returns {Promise<string>} 字串，已儲存時間標記的資料。
     */
    static async getSavedTimestampData(key: string): Promise<string> {
        return new Promise(async resolve => {
            const savedTimestampData = await this.getSavedTimestampDataByKey(key);

            resolve(savedTimestampData);
        });
    }

    /**
     * 透過特定鍵值來取得已儲存時間標記的資料
     *
     * @param {string} key 字串，鍵值。
     * @returns {Promise<string>} 字串，已儲存時間標記的資料。
     */
    static async getSavedTimestampDataByKey(key: string): Promise<string> {
        return new Promise(resolve => {
            chrome.storage.local.get(key, items => {
                this.processLastError(() => {
                    resolve("");
                });

                resolve(items[key]);
            });
        });
    }

    /**
     * 透過特定鍵值來儲存資料
     *
     * @param {string} key 字串，鍵值。
     * @param {any} value 字串，值。
     * @param {boolean} useLocal 布林值，是否使用 local，預設值為 true，若是值為 false 則是使用 sync。
     * @returns {Promise<boolean>} 布林值，儲存的結果，當值為 true 則表示儲存成功，若值為 false 則是儲存失敗。
     */
    static saveDataValueByKey(key: string, value: any, useLocal: boolean = true): Promise<boolean> {
        return new Promise(resolve => {
            if (useLocal === true) {
                chrome.storage.local.set({ [key]: value }, () => {
                    this.processLastError(() => {
                        resolve(false);
                    });

                    this.writeConsoleLog(`${value}`);

                    resolve(true);
                });
            } else {
                chrome.storage.sync.set({ [key]: value }, () => {
                    this.processLastError(() => {
                        resolve(false);
                    });

                    this.writeConsoleLog(`${value}`);

                    resolve(true);
                });
            }
        });
    }

    /**
     * 取得所有已儲存資料的鍵值
     *
     * @param {boolean} useLocal 布林值，是否使用 local，預設值為 true，若是值為 false 則是使用 sync。
     * @returns {Promise<string[] | undefined>} 字串陣列或是 undefined，已儲存資料的鍵值。
     */
    static async getSavedDataKeys(useLocal: boolean = true): Promise<string[] | undefined> {
        return new Promise(resolve => {
            if (useLocal === true) {
                chrome.storage.local.get(null, items => {
                    this.processLastError(() => {
                        resolve(undefined);
                    });

                    resolve(Object.keys(items));
                });
            } else {
                chrome.storage.sync.get(null, items => {
                    this.processLastError(() => {
                        resolve(undefined);
                    });

                    resolve(Object.keys(items));
                });
            }
        });
    }

    /**
     * 透過特定鍵值來取得已儲存資料的值
     *
     * @param {string} key 字串，鍵值。
     * @param {boolean} useLocal 布林值，是否使用 local，預設值為 true，若是值為 false 則是使用 sync。
     * @returns {Promise<any>} any，已儲存資料的值，值有可能會等於 undefined。
     */
    static async getSavedDataValueByKey(key: string, useLocal: boolean = true): Promise<any> {
        return new Promise(resolve => {
            if (useLocal === true) {
                chrome.storage.local.get([key], items => {
                    this.processLastError(() => {
                        resolve(undefined);
                    });

                    resolve(items[key]);
                });
            } else {
                chrome.storage.sync.get([key], items => {
                    this.processLastError(() => {
                        resolve(undefined);
                    });

                    resolve(items[key]);
                });
            }
        });
    }

    /**
     * 透過特定鍵值組來取得已儲存資料的值
     *
     * @param {string[]} keys 字串陣列，鍵值組。
     * @param {boolean} useLocal 布林值，是否使用 local，預設值為 true，若是值為 false 則是使用 sync。
     * @returns {Promise<any>} any，已儲存資料的值，值有可能會等於 undefined。
     */
    static async getSavedDataValueByKeys(keys: string[], useLocal: boolean = true): Promise<any> {
        return new Promise(resolve => {
            if (useLocal === true) {
                chrome.storage.local.get(keys, items => {
                    this.processLastError(() => {
                        resolve(undefined);
                    });

                    resolve(items);
                });
            } else {
                chrome.storage.sync.get(keys, items => {
                    this.processLastError(() => {
                        resolve(undefined);
                    });

                    resolve(items);
                });
            }
        });
    }

    /**
     *  透過特定鍵值來刪除已儲存的資料
     *
     * @param {string} key 字串，鍵值。
     * @returns {Promise<boolean>} 布林值，儲存的結果，當值為 true 則表示儲存成功，若值為 false 則是儲存失敗。
     */
    static removeSavedDataByKey(key: string): Promise<boolean> {
        return new Promise(resolve => {
            chrome.storage.local.remove(key, () => {
                this.processLastError(() => {
                    resolve(false);
                });

                resolve(true);
            });
        });
    }

    /**
     * 更新 contextMenus 的標題
     *
     * @param {string} key 字串，鍵值。
     * @param {string} title 字串，標題。
     */
    static updateContextMenusTitle(key: string, title: string) {
        chrome.contextMenus.update(key, {
            title: title,
        }, () => {
            // background.js 不能使用 alert()，故於此處關閉。
            this.processLastError(undefined, false);
        });
    }

    /**
     * 檢查是否可以輸出
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkCanOutput(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableOutputLog, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否可以播放
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkCanPlay(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableSoundEffect, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否啟用輸出格式化的 YouTube 時間標記
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableFormattedYTTimestamp(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableFormattedYTTimestamp, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否啟用 YouTube 歌回模式
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableYTUtaWakuMode(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableYTUtaWakuMode, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否啟用傳統按鍵監聽模式
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableLegacyKeyListener(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableLegacyKeyListener, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否啟用左側填補空白（預設是在右側填補空白）
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableLeftSideSpacePadding(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableLeftSideSpacePadding, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否啟用自動在註解列的尾端補上"（開始）"、"（結束）"標記
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableAppendingStartEndToken(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableAppendingStartEndToken, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 取得 MIME
     *
     * @returns {Promise<string>} 字串，MIME。
     */
    static async getMIME(): Promise<string> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.MIME, false);

            if (savedDataValue === undefined) {
                resolve("");
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 檢查是否啟用加入動畫瘋彈幕
     *
     * @returns {Promise<boolean>} 布林值，值。
     */
    static async checkEnableAddAniGamerDanMu(): Promise<boolean> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.EnableAddAniGamerDanMu, false);

            if (savedDataValue === undefined) {
                resolve(false);
            } else {
                resolve(savedDataValue);
            }
        });
    }

    /**
     * 取得附加秒數
     *
     * @returns {Promise<number>} 數值，值。
     */
    static async getAppendSeconds(): Promise<number> {
        return new Promise(async resolve => {
            const savedDataValue = await this.getSavedDataValueByKey(KeyName.AppendSeconds, false);

            if (savedDataValue === undefined) {
                resolve(Function.DefaultAppendSeconds);
            } else {
                resolve(savedDataValue);
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

                customAudio.addEventListener("ended", () => {
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
     * 查詢目前的分頁
     *
     * 來源：https://developer.chrome.com/docs/extensions/reference/tabs/
     *
     * @returns {Promise<chrome.tabs.Tab | undefined>} chrome.tabs.Tab 或是 undefined。
     */
    static async queryCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
        return new Promise(async resolve => {
            const queryInfo: chrome.tabs.QueryInfo = {
                active: true,
                currentWindow: true
            };

            // `tab` will either be a `tabs.Tab` instance or `undefined`.
            let [tab] = await chrome.tabs.query(queryInfo);

            // background.js 不能使用 alert()，故於此處關閉。
            this.processLastError(() => {
                resolve(undefined);
            }, false);

            resolve(tab);
        });
    }

    /**
     * 傳送訊息到分頁
     *
     * @param {string} command 字串，指令。
     * @param {string} isContextMenu 布林值，是否為右鍵選單，預設值為 false。
     */
    static async sendMessageToTab(command: string, isContextMenu: boolean = false): Promise<void> {
        const tab = await this.queryCurrentTab();

        if (tab === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabsIsEmpty"));

            return;
        }

        const tabId = tab.id;

        if (tabId === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabIdIsUndefined"));

            return;
        }

        const useLegacyKeyListener = await this.checkEnableLegacyKeyListener();

        // 來自右側選單的訊息必須傳送。
        //
        // 判斷是否啟用「使用傳統按鍵監聽模式」，
        // 當啟用時不再傳送訊息至 core.js。
        if (isContextMenu === true || useLegacyKeyListener !== true) {
            chrome.tabs.sendMessage(tabId, command, (_response) => {
                // background.js 不能使用 alert()，故於此處關閉。
                this.processLastError(undefined, false);
            });
        }
    }

    /**
     * 傳送資料到分頁
     *
     * @param {string} command 字串，指令。
     * @param {string} data 字串，資料。
     */
    static async sendDataToTab(command: string, data: string): Promise<void> {
        const tab = await this.queryCurrentTab();

        if (tab === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabsIsEmpty"));

            return;
        }

        const tabId = tab.id;

        if (tabId === undefined) {
            this.writeConsoleLog(chrome.i18n.getMessage("messageTabIdIsUndefined"));

            return;
        }

        chrome.tabs.sendMessage(tabId, { "command": command, "data": data }, (_response) => {
            this.processLastError();
        });
    }

    /**
     * 取得目前的分頁網址
     *
     * @returns {Promise<string | undefined>} 字串或是 undefined，分頁的網址。
     */
    static async getCurrentTabUrl(): Promise<string | undefined> {
        return new Promise(resolve => {
            let currentTab: chrome.tabs.Tab | undefined;

            // 傳送訊息至 background.js
            // 查詢並取得分頁。
            chrome.runtime.sendMessage(Message.QueryCurrentTab, response => {
                this.processLastError(() => {
                    resolve(undefined);
                });

                if (response === undefined) {
                    this.writeConsoleLog(chrome.i18n.getMessage("messageTabsIsEmpty"));

                    resolve(undefined);
                }

                currentTab = response;

                const tabId: number | undefined = currentTab?.id;

                if (tabId === undefined) {
                    this.writeConsoleLog(chrome.i18n.getMessage("messageTabIdIsUndefined"));
                }

                // 回傳目前的分頁網址。
                resolve(currentTab?.url)
            });
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
                    tempOutputData = `${videoId}${Seperators.Seperator2}`;
                }

                // 分隔用行。
                if (line === Seperators.Seperator4) {
                    return;
                }

                if (line.indexOf(i18nUrl) !== -1) {
                    videoId = this.getYouTubeId(line.replace(i18nUrl, ""));

                    tempOutputData = `${videoId}${Seperators.Seperator2}`;

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
                    if (line.indexOf(this.CommentToken) !== -1) {
                        let clipName = "";

                        // 判斷是否為開始的點。
                        if (line.indexOf(i18nStart) !== -1) {
                            let separatorCount = [...tempOutputData!].filter(l => l === Seperators.Seperator2).length;

                            clipName = line.replace(this.CommentToken, "").replace(i18nStart, "").trimStart();

                            if (clipName === "") {
                                clipName = " ";
                            }

                            if (clipName !== undefined && clipName !== null && clipName !== "") {
                                // 針對連續的（開始）補上結束時間。
                                if (separatorCount === 1) {
                                    tempOutputData += `${songIdx}${Seperators.Seperator2}${clipName}${Seperators.Seperator2}`;
                                } else {
                                    tempOutputData += "0";

                                    timestampCount = 0;

                                    outputData.push(tempOutputData!);

                                    tempOutputData = `${videoId}${Seperators.Seperator2}${songIdx}${Seperators.Seperator2}${clipName}${Seperators.Seperator2}`;
                                }

                                songIdx++;
                            }
                        }
                    } else {
                        const timestampSet = line.split(Seperators.Seperator1);

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
                                        tempOutputData += `${timestampSet[2]}${Seperators.Seperator2}`;
                                    } else {
                                        tempOutputData += `${timestampSet[1]}${Seperators.Seperator2}`;
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

                                    if (lastChar === Seperators.Seperator2) {
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
     * @param {string | string[]} value 字串或字串陣列，值。
     */
    static insertStyleSheetRules(value: string | string[]): void {
        try {
            const sheets: StyleSheetList = document.styleSheets;

            if (sheets.length === 0) {
                const newStyle = document.createElement("style");

                newStyle.appendChild(document.createTextNode(""));

                document.head.appendChild(newStyle);
            }

            const sheet: CSSStyleSheet = sheets[sheets.length - 1];

            if (typeof value === 'string') {
                sheet.insertRule(value, sheet.cssRules.length);
            } else if (Array.isArray(value) === true) {
                value.forEach(item => {
                    sheet.insertRule(item, sheet.cssRules.length);
                });
            } else {
                this.writeConsoleLog("CSS 規則插入失敗，value 值的類型不為 string 或 string[]。");
            }
        } catch (error) {
            this.writeConsoleLog(error);
        }
    }

    /**
     * 取得時間標記
     *
     * @param {number} seconds 數值，秒數。
     * @returns {Promise<string>} 字串，時間標記。
     */
    static async getTimestamp(seconds: number): Promise<string> {
        let timestamp = "";

        const enableFormatted = await this.checkEnableFormattedYTTimestamp();
        const enableYTUtaWakuMode = await this.checkEnableYTUtaWakuMode();
        const enableLeftSideSpacePadding = await this.checkEnableLeftSideSpacePadding();

        // 判斷是否啟用 YouTube 歌回模式。
        if (enableYTUtaWakuMode === true) {
            let processedTimestamp = "";

            const rawTimestamp = this.convertToYTTimestamp(seconds, enableFormatted);

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
            timestamp = `${this.convertToTimestamp(seconds)}${Seperators.Seperator1}` +
                `${this.convertToYTTimestamp(seconds, enableFormatted)}${Seperators.Seperator1}` +
                `${Math.round(seconds)}${Seperators.Seperator1}` +
                `${this.convertToTwitchTimestamp(seconds)}`;
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
                if (lastLine.indexOf(this.CommentToken) !== 0 ||
                    lastLine.indexOf(this.CommentToken) === -1) {
                    // 當找到 "," 時，移除 ","。
                    if (lastLine.indexOf(Seperators.Seperator3) !== -1) {
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
     * @returns {Promise<{ width: number, height: number }>} 影像的寬、高的數值。
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
     * @returns {Promise<boolean>} 布林值，檢查結果。
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

    /**
    * 匯出時間標記
    *
    * @param {string} key 字串，鍵值。
    */
    static async exportTimestamp(key: string): Promise<void> {
        let timestampData = await this.getSavedTimestampData(key);

        if (timestampData !== "") {
            this.playBeep(0);

            let value = timestampData ?? "";

            // 移除不同步標記。
            value = this.removeLastSeperator(value);

            const blob = new Blob([value], { type: "text/plain;charset=utf8" });

            const tempAnchor = document.createElement("a");
            const tempDate = new Date();

            tempAnchor.download = `Exported_timestamps_${tempDate.format("yyyyMMddhhmmss")}.txt`;
            tempAnchor.href = window.URL.createObjectURL(blob);
            tempAnchor.style.display = "none";

            document.body.appendChild(tempAnchor);

            tempAnchor.click();

            document.body.removeChild(tempAnchor);
        } else {
            this.writeConsoleLog(chrome.i18n.getMessage("messageNoTimestampDataToExport"));

            alert(chrome.i18n.getMessage("messageNoTimestampDataToExport"));
        }
    }

    /**
     * 匯出 YouTube 留言
     *
     * @param {string} key 字串，鍵值。
     */
    static async exportYtComment(key: string): Promise<void> {
        let timestampData = await this.getSavedTimestampData(key);

        if (timestampData !== "") {
            this.playBeep(0);

            let value = timestampData ?? "";

            // 移除不同步標記。
            value = this.removeLastSeperator(value);

            // 儲存移除不同步標記的結果。
            await this.saveTimestampData(key, value);

            let outputYtCommentData = "";

            const dataSet = this.parseTimestamp(value, false);

            // 排除無效的時間標記資料。
            const filteredDataSet = dataSet.filter(item => {
                return item.indexOf("null") === -1 &&
                    item.indexOf("undefined") === -1;
            });

            const i18nCommentStart = chrome.i18n.getMessage("stringCommentStart");

            let tempYtCommentData = `${i18nCommentStart}\n`;

            filteredDataSet.forEach((value) => {
                let columns = value.toString().split("^");

                // 當遇到連續的（開始）時，在 split() 後，會產生長度為 7 的字串陣列，
                // 需要手動進行拆分成兩個。
                if (columns.length === 7) {
                    tempYtCommentData += `${columns[3]} ${columns[2]}\n`;
                    tempYtCommentData += `${columns[6]} ${columns[5]}\n`;
                } else {
                    // 判斷結束時間是否為 "0" 或 "00:00:00"。
                    if (columns[4] !== "0" && columns[4] !== "00:00:00") {
                        // 有（開始）跟（結束）。
                        tempYtCommentData += `${columns[3]} ~ ${columns[4]} ${columns[2]}\n`;
                    } else {
                        // 僅有（開始）。
                        tempYtCommentData += `${columns[3]} ${columns[2]}\n`;
                    }
                }
            });

            if (tempYtCommentData != "" && tempYtCommentData.length > 0) {
                if (outputYtCommentData.length > 0) {
                    outputYtCommentData += "\n";
                }

                outputYtCommentData += tempYtCommentData;
            }

            if (outputYtCommentData !== "" && outputYtCommentData.length > 0) {
                const blob = new Blob([outputYtCommentData], { type: "text/plain;charset=utf8" });

                const tempAnchor = document.createElement("a");
                const tempDate = new Date();

                tempAnchor.download = `Exported_YouTube_Comments_${tempDate.format("yyyyMMddhhmmss")}.txt`;
                tempAnchor.href = window.URL.createObjectURL(blob);
                tempAnchor.style.display = "none";

                document.body.appendChild(tempAnchor);

                tempAnchor.click();

                document.body.removeChild(tempAnchor);
            } else {
                this.writeConsoleLog(chrome.i18n.getMessage("messageNoCommentDataToExport"));

                alert(chrome.i18n.getMessage("messageNoCommentDataToExport"));
            }
        } else {
            this.writeConsoleLog(chrome.i18n.getMessage("messageNoTimestampDataToExport"));

            alert(chrome.i18n.getMessage("messageNoTimestampDataToExport"));
        }
    }

    /**
     * 匯出 YouTube 影片時間網址
     *
     * @param {string} key 字串，鍵值。
     */
    static async exportYtTimestampUrls(key: string): Promise<void> {
        let timestampData = await this.getSavedTimestampData(key);

        if (timestampData !== "") {
            this.playBeep(0);

            let value = timestampData ?? "";

            // 移除不同步標記。
            value = this.removeLastSeperator(value);

            // 儲存移除不同步標記的結果。
            await this.saveTimestampData(key, value);

            let outputUrlData = "";

            const dataSet = this.parseTimestamp(value, true);

            // 排除無效的時間標記資料。
            const filteredDataSet = dataSet.filter(item => {
                return item.indexOf("null") === -1 &&
                    item.indexOf("undefined") === -1;
            });

            let tempTimestampUrlData = "",
                tempEmbedUrlData = "",
                tempDiscordUrlData = "";

            filteredDataSet.forEach((value) => {
                let columns = value.toString().split("^");

                // 當遇到連續的（開始）時，在 split() 後，會產生長度為 7 的字串陣列，
                // 需要手動進行拆分成兩個。
                if (columns.length === 7) {
                    tempTimestampUrlData += `> ${columns[2]}\nhttps://www.youtube.com/watch?v=` +
                        `${columns[0]}&t=${columns[3]}s\n`;

                    tempTimestampUrlData += `> ${columns[5]}\nhttps://www.youtube.com/watch?v=` +
                        `${columns[0]}&t=${columns[6]}s\n`;
                } else {
                    // 有（開始）跟（結束）。
                    tempTimestampUrlData += `> ${columns[2]}\nhttps://www.youtube.com/watch?v=` +
                        `${columns[0]}&t=${columns[3]}s\n`;
                }

                // 當有（開始）跟（結束）時，在 split() 後，會產生長度為 5 的字串陣列。
                if (columns.length === 5) {
                    tempEmbedUrlData += `> ${columns[2]}\nhttps://www.youtube.com/embed/` +
                        `${columns[0]}?start=${columns[3]}&end=${columns[4]}\n`;

                    tempDiscordUrlData += `> ${columns[2]}\nhttps://www.youtube.com/watch?v=` +
                        `${columns[0]}&t=${columns[3]}&end=${columns[4]}\n`;
                }
            });

            if (tempTimestampUrlData != "" && tempTimestampUrlData.length > 0) {
                if (outputUrlData.length > 0) {
                    outputUrlData += "\n";
                }

                outputUrlData += tempTimestampUrlData;
            }

            if (tempEmbedUrlData != "" && tempEmbedUrlData.length > 0) {
                if (outputUrlData.length > 0) {
                    outputUrlData += "\n";
                }

                outputUrlData += tempEmbedUrlData;
            }

            if (tempDiscordUrlData != "" && tempDiscordUrlData.length > 0) {
                if (outputUrlData.length > 0) {
                    outputUrlData += "\n";
                }

                outputUrlData += tempDiscordUrlData;
            }

            if (outputUrlData !== "" && outputUrlData.length > 0) {
                const blob = new Blob([outputUrlData], { type: "text/plain;charset=utf8" });

                const tempAnchor = document.createElement("a");
                const tempDate = new Date();

                tempAnchor.download = `Exported_YouTube_Urls_${tempDate.format("yyyyMMddhhmmss")}.txt`;
                tempAnchor.href = window.URL.createObjectURL(blob);
                tempAnchor.style.display = "none";

                document.body.appendChild(tempAnchor);

                tempAnchor.click();

                document.body.removeChild(tempAnchor);
            } else {
                this.writeConsoleLog(chrome.i18n.getMessage("messageNoUrlDataToExport"));

                alert(chrome.i18n.getMessage("messageNoUrlDataToExport"));
            }
        } else {
            this.writeConsoleLog(chrome.i18n.getMessage("messageNoTimestampDataToExport"));

            alert(chrome.i18n.getMessage("messageNoTimestampDataToExport"));
        }
    }

    /**
     * 匯出特殊格式
     *
     * @param {string} key 字串，鍵值。
     * @param {boolean} isJsonc 布林值，判斷是否匯出 *.jsonc，預設值為 false。
     * @param {PlaylistType} type 列舉 PlaylistType，播放清單的類型，預設值為 Playlist.Timestamps。
     */
    static async exportSpeicalFormat(
        key: string,
        isJsonc: boolean = false,
        type: PlaylistType = PlaylistType.Timestamps): Promise<void> {
        let timestampData = await this.getSavedTimestampData(key);

        if (timestampData !== "") {
            this.playBeep(0);

            let value = timestampData ?? "";

            // 移除不同步標記。
            value = this.removeLastSeperator(value);

            // 儲存移除不同步標記的結果。
            await this.saveTimestampData(key, value);

            let outputData = "";

            const dataSet = this.parseTimestamp(value, true);

            // 排除無效的時間標記資料。
            const filteredDataSet = dataSet.filter(item => {
                return item.indexOf("null") === -1 &&
                    item.indexOf("undefined") === -1;
            });

            let tempOutputData = "";

            filteredDataSet.forEach((value, index) => {
                let columns = value.toString().split("^");

                // 當有（開始）跟（結束）時，在 split() 後，會產生長度為 5 的字串陣列。
                if (columns.length === 5) {
                    // 跳脫歌名中的「"」。
                    const escapedName = columns[2].replace(/\"/g, "\\\"");

                    if (isJsonc === true) {
                        tempOutputData += "    ";
                        tempOutputData += `["${columns[0]}", ${columns[3]}, ${columns[4]}, "${escapedName}"]`;
                    } else {
                        if (type === PlaylistType.Timestamps) {
                            const startTime = Function.convertToTimestamp(parseInt(columns[3]), false);
                            const endTime = Function.convertToTimestamp(parseInt(columns[4]), false);

                            tempOutputData += "  ";
                            tempOutputData += `{  ` +
                                `\n    "videoID": "${columns[0]}",` +
                                `\n    "name": "${escapedName}",` +
                                `\n    "startTime": "${startTime}",` +
                                `\n    "endTime": "${endTime}"` +
                                `\n  }`;
                        } else if (type === PlaylistType.Seconds) {
                            tempOutputData += "  ";
                            tempOutputData += `{  ` +
                                `\n    "videoID": "${columns[0]}",` +
                                `\n    "name": "${escapedName}",` +
                                `\n    "startSeconds": ${parseInt(columns[3])},` +
                                `\n    "endSeconds": ${parseInt(columns[4])}` +
                                `\n  }`;
                        }
                    }

                    if (index < filteredDataSet.length - 1) {
                        tempOutputData += ",\n";
                    } else {
                        tempOutputData += "\n";
                    }
                }
            });

            if (tempOutputData != "" && tempOutputData.length > 0) {
                if (outputData.length > 0) {
                    outputData += "\n";
                }

                // 來源：https://github.com/jim60105/Playlists/blob/BasePlaylist/Template/TemplateSongList.jsonc
                const jsoncHeader = "/**\n" +
                    " * 歌單格式為JSON with Comments\n" +
                    " * [\"VideoID\", StartTime, EndTime, \"Title\", \"SubSrc\"]\n" +
                    " * VideoID: 必須用引號包住，為字串型態。\n" +
                    " * StartTime: 只能是非負數。如果要從頭播放，輸入0\n" +
                    " * EndTime: 只能是非負數。如果要播放至尾，輸入0\n" +
                    " * Title?: 必須用引號包住，為字串型態\n" +
                    " * SubSrc?: 必須用雙引號包住，為字串型態，可選\n" +
                    " */\n";

                if (isJsonc === true) {
                    outputData += jsoncHeader;
                }

                outputData += "[\n";
                outputData += tempOutputData;
                outputData += "]";
            }

            if (outputData !== "" && outputData.length > 0) {
                const blob = new Blob([outputData], { type: "text/plain;charset=utf8" });

                const tempAnchor = document.createElement("a");
                const tempDate = new Date();
                const extName = isJsonc === true ? ".jsonc" : ".json";
                const fileName = isJsonc === true ? "SongList" : "CustomYTPlayer_Playlist";
                const appendFileName = type === PlaylistType.Timestamps ? "_Timestamps" : "_Seconds";

                tempAnchor.download = `Exported_${fileName}${isJsonc === false ? appendFileName : ""}_${tempDate.format("yyyyMMddhhmmss")}${extName}`;
                tempAnchor.href = window.URL.createObjectURL(blob);
                tempAnchor.style.display = "none";

                document.body.appendChild(tempAnchor);

                tempAnchor.click();

                document.body.removeChild(tempAnchor);
            } else {
                this.writeConsoleLog(chrome.i18n.getMessage("messageNoUrlDataToExport"));

                alert(chrome.i18n.getMessage("messageNoUrlDataToExport"));
            }
        } else {
            this.writeConsoleLog(chrome.i18n.getMessage("messageNoTimestampDataToExport"));

            alert(chrome.i18n.getMessage("messageNoTimestampDataToExport"));
        }
    }

    /**
     * 匯出 CUE 指令碼
     *
     * @param {string} key 字串，鍵值。
     */
    static async exportCueSheet(key: string): Promise<void> {
        let timestampData = await this.getSavedTimestampData(key);

        if (timestampData !== "") {
            this.playBeep(0);

            let value = timestampData ?? "";

            // 移除不同步標記。
            value = this.removeLastSeperator(value);

            // 儲存移除不同步標記的結果。
            await this.saveTimestampData(key, value);

            let outputData = "";

            const dataSet = this.parseTimestamp(value, true);

            // 排除無效的時間標記資料。
            const filteredDataSet = dataSet.filter(item => {
                return item.indexOf("null") === -1 &&
                    item.indexOf("undefined") === -1;
            });

            let tempOutputData = "";
            let actualIndex = 1;

            filteredDataSet.forEach((value, index) => {
                let columns = value.toString().split("^");

                // 當有（開始）跟（結束）時，在 split() 後，會產生長度為 5 的字串陣列。
                if (columns.length === 5) {
                    // 跳脫歌名中的「"」。
                    const escapedName = columns[2].replace(/\"/g, "\\\"");
                    const startTime = Function.convertToCueSheetTimestamp(parseInt(columns[3]), true);
                    const endTime = Function.convertToCueSheetTimestamp(parseInt(columns[4]), true);

                    const exportIndex = actualIndex.toString().padStart(2, "0");

                    tempOutputData += `TRACK ${exportIndex} AUDIO\n`;
                    tempOutputData += `  TITLE \"${escapedName}\"\n`;
                    tempOutputData += `  PERFORMER \"${chrome.i18n.getMessage("stringCuePerformer")}\"\n`;
                    tempOutputData += `  INDEX 01 ${startTime}\n`;

                    actualIndex++;

                    // 當 "columns[4]" 不為 "0" 時才輸出。
                    if (columns[4] !== "0") {
                        const exportIndex = actualIndex.toString().padStart(2, "0");

                        tempOutputData += `TRACK ${exportIndex} AUDIO\n`;
                        tempOutputData += `  TITLE \"${chrome.i18n.getMessage("stringCueSplitTitle")}\"\n`;
                        tempOutputData += `  PERFORMER \"${chrome.i18n.getMessage("stringCuePerformer")}\"\n`;
                        tempOutputData += `  INDEX 01 ${endTime}\n`;

                        actualIndex++;
                    }
                }
            });

            if (tempOutputData != "" && tempOutputData.length > 0) {
                if (outputData.length > 0) {
                    outputData += "\n";
                }

                const year = new Date().getFullYear();

                outputData += `REM GENRE \"${chrome.i18n.getMessage("stringCueGerne")}\"\n`;
                outputData += `REM DATE \"${year}\"\n`;
                outputData += `PERFORMER \"${chrome.i18n.getMessage("stringCuePerformer")}\"\n`;
                outputData += `TITLE \"${chrome.i18n.getMessage("stringCueTitle")}\"\n`;
                outputData += `FILE \"${chrome.i18n.getMessage("stringCueFile")}\" WAVE\n`;
                outputData += tempOutputData;
            }

            if (outputData !== "" && outputData.length > 0) {
                const blob = new Blob([outputData], { type: "text/plain;charset=utf8" });

                const tempAnchor = document.createElement("a");
                const tempDate = new Date();
                const extName = ".cue";
                const fileName = "CUE_Sheet";

                tempAnchor.download = `Exported_${fileName}_${tempDate.format("yyyyMMddhhmmss")}${extName}`;
                tempAnchor.href = window.URL.createObjectURL(blob);
                tempAnchor.style.display = "none";

                document.body.appendChild(tempAnchor);

                tempAnchor.click();

                document.body.removeChild(tempAnchor);
            } else {
                this.writeConsoleLog(chrome.i18n.getMessage("messageNoCueSheetDataToExport"));

                alert(chrome.i18n.getMessage("messageNoCueSheetDataToExport"));
            }
        } else {
            this.writeConsoleLog(chrome.i18n.getMessage("messageNoTimestampDataToExport"));

            alert(chrome.i18n.getMessage("messageNoTimestampDataToExport"));
        }
    }

    /**
     * 移除網址
     *
     * 來源：https://stackoverflow.com/a/23571059
     *
     * @param {string} value 輸入的字串。
     * @returns {string} 字串。
     */
    static removeUrl(value: string): string {
        if (value === undefined || value === null) {
            return "";
        }

        return value.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");
    }

    /**
     * 取得鍵組
     *
     * @param {boolean} useDefaultKey 布林值，是否使用預設鍵值，預設值為 false。
     * @returns {Promise<KeySet>} KeySet
     */
    static async getKeySet(
        useDefaultKey: boolean = false): Promise<KeySet> {
        return new Promise(async resolve => {
            const keySet = new KeySet();

            // 查詢目前的分頁的網址。
            let currentTabUrl = await this.getCurrentTabUrl();

            if (currentTabUrl === undefined) {
                // 在擴充功能頁面無法取得目前分頁的網址。
                currentTabUrl = window.location.href;
            }

            keySet.url = currentTabUrl;
            // 非嚴謹判斷目前的網頁的網址。
            keySet.isYouTubeVideo = currentTabUrl.indexOf("watch?v=") !== -1;
            keySet.isTwitchVideo = currentTabUrl.indexOf("twitch.tv/") !== -1;
            keySet.isGamerAniVideo = currentTabUrl.indexOf("ani.gamer.com.tw/animeVideo.php?sn=") !== -1;
            keySet.isBilibiliVideo = currentTabUrl.indexOf("bilibili.com/video/") !== -1;
            keySet.isLocalHostVideo = currentTabUrl.indexOf("file:///") !== -1;
            // Microsoft Edge："extension://"、其它："chrome-extension://"
            // "://extensions" -> 管理擴充功能頁面。
            keySet.isExtensionPage = (currentTabUrl.indexOf("://extensions") !== -1 ||
                currentTabUrl.indexOf("extension://") !== -1);

            if (useDefaultKey === true ||
                keySet.isGamerAniVideo ||
                keySet.isLocalHostVideo ||
                keySet.isExtensionPage) {
                // 判斷是否使用預設鍵值、是否為動畫瘋網站的網址、是否為本機影片網址或是否為擴充功能頁面。

                keySet.key = KeyName.DefaultTimestampDataKeyName;
            } else if (keySet.isYouTubeVideo ||
                keySet.isTwitchVideo ||
                keySet.isBilibiliVideo) {
                // 判斷是否為 YouTube 網站的網址、是否為 Twitch 網站的網址、是否為 Bilibili 網站的網址。

                keySet.key = `${currentTabUrl}`;
            } else {
                // Fallback。
                keySet.key = KeyName.DefaultTimestampDataKeyName;
            }

            resolve(keySet);
        });
    }

    /**
     * 處理 chrome.runtime.lastError
     *
     * @param {Function} callback 回呼函式，預設值是 undefined。
     * @param {boolean} useAlert 布林值，是否使用 alert()，預設值為 true。
     * @returns {string | undefined} 字串或是 undefined，最後的錯誤訊息。
     */
    static processLastError(callback?: Function, useAlert: boolean = true): string | undefined {
        let lastErrorMesssage = undefined;

        if (chrome.runtime.lastError) {
            lastErrorMesssage = chrome.runtime.lastError?.message;

            this.writeConsoleLog(lastErrorMesssage);

            if (useAlert === true) {
                alert(lastErrorMesssage);
            }

            callback;
        }

        return lastErrorMesssage;
    }
}