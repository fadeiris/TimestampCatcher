"use strict";

import { Function } from "./function";

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestamp"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_ExtractTimestamp
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestampAutoAppendEndToken"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_ExtractTimestamp_AutoAppendEndToken
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuViewYtThumbnail"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: Function.CMID_ViewYtThumbnail
    });
});

chrome.contextMenus.onClicked.addListener((
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab): void => {
    if (info.menuItemId === Function.CMID_ExtractTimestamp) {
        Function.sendMsg(Function.CommandExtractTimestamp, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === Function.CMID_ExtractTimestamp_AutoAppendEndToken) {
        Function.sendMsg(Function.CommandExtractTimestampAutoAppendEndToken, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === Function.CMID_ViewYtThumbnail) {
        Function.sendMsg(Function.CommandViewYtThumbnail, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === Function.CommandRecordTimestamp) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandTakeScreenshot) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandRewind) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandFastForward) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Function.CommandPauseSync) {
        Function.sendMsg(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message === Function.MessageWakeUp) {
        updateExtensionApperance();
    } else {
        Function.writeConsoleLog(message);
    }
});

/**
 * 更新擴充功能的外觀
 */
function updateExtensionApperance() {
    // 設定徽章。
    chrome.storage.sync.get(["EnableYTUtaWakuMode"], (items) => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);

            alert(chrome.runtime.lastError?.message);
        }

        Function.showYTUtaWakuMode(items.EnableYTUtaWakuMode);
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_ExtractTimestamp, {
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestamp"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_ExtractTimestamp_AutoAppendEndToken, {
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestampAutoAppendEndToken"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });

    // 更新 contextMenus 的 title。
    chrome.contextMenus.update(Function.CMID_ViewYtThumbnail, {
        title: chrome.i18n.getMessage("stringContextMenuViewYtThumbnail"),
    }, () => {
        if (chrome.runtime.lastError?.message) {
            Function.writeConsoleLog(chrome.runtime.lastError?.message);
        }
    });
}