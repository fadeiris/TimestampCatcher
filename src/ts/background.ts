"use strict";

import { CMID, Command, Message, KeyName } from "./valueSets";
import { Function } from "./function";

chrome.runtime.onInstalled.addListener(() => {
    // 先移除 contextMenus。
    chrome.contextMenus.removeAll();

    // 再重新建立 contextMenus。
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestamp"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: CMID.ExtractTimestamp
    }, () => {
        // background.js 不能使用 alert()，故於此處關閉。
        Function.processLastError(undefined, false);
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestampAutoAppendEndToken"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: CMID.ExtractTimestamp_AutoAppendEndToken
    }, () => {
        // background.js 不能使用 alert()，故於此處關閉。
        Function.processLastError(undefined, false);
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuViewYtThumbnail"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: CMID.ViewYtThumbnail
    }, () => {
        // background.js 不能使用 alert()，故於此處關閉。
        Function.processLastError(undefined, false);
    });
});

chrome.contextMenus.onClicked.addListener((
    info: chrome.contextMenus.OnClickData,
    _tab?: chrome.tabs.Tab): void => {
    if (info.menuItemId === CMID.ExtractTimestamp) {
        Function.sendMessageToTab(Command.ExtractTimestamp, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === CMID.ExtractTimestamp_AutoAppendEndToken) {
        Function.sendMessageToTab(Command.ExtractTimestampAutoAppendEndToken, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === CMID.ViewYtThumbnail) {
        Function.sendMessageToTab(Command.ViewYtThumbnail, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === Command.RecordTimestamp) {
        Function.sendMessageToTab(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.TakeScreenshot) {
        Function.sendMessageToTab(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.Rewind) {
        Function.sendMessageToTab(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.FastForward) {
        Function.sendMessageToTab(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.PauseSync) {
        Function.sendMessageToTab(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

// 來源：https://stackoverflow.com/q/72494154
// 來源：https://stackoverflow.com/a/53024910
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message === Message.WakeUp) {
        updateExtensionApperance();
    } else if (message === Message.QueryCurrentTab) {
        Function.queryCurrentTab().then(tab => sendResponse(tab));

        // 為 sendResponse 保留訊息傳送頻道開啟。
        return true;
    } else {
        Function.writeConsoleLog(message);
    }
});

/**
 * 更新擴充功能的外觀
 */
function updateExtensionApperance(): void {
    // 設定徽章。
    Function.getSavedDataValueByKey(KeyName.EnableYTUtaWakuMode, false)
        .then(enableYTUtaWakuMode => Function.showYTUtaWakuMode(enableYTUtaWakuMode));

    // 更新 contextMenus 的標題。
    Function.updateContextMenusTitle(
        CMID.ExtractTimestamp,
        chrome.i18n.getMessage("stringContextMenuExtractTimestamp"));

    Function.updateContextMenusTitle(
        CMID.ExtractTimestamp_AutoAppendEndToken,
        chrome.i18n.getMessage("stringContextMenuExtractTimestampAutoAppendEndToken"));

    Function.updateContextMenusTitle(
        CMID.ViewYtThumbnail,
        chrome.i18n.getMessage("stringContextMenuViewYtThumbnail"));
}