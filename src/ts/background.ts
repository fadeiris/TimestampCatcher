"use strict";

import { CMID, Command, KeyName, Function } from "./function";

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
        // 2023/11/13 因使用情境之關係，故不以 alert() 顯示錯誤訊息內容。
        Function.processLastError(false);
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuExtractTimestampAutoAppendEndToken"),
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: CMID.ExtractTimestamp_AutoAppendEndToken
    }, () => {
        // 2023/11/13 因使用情境之關係，故不以 alert() 顯示錯誤訊息內容。
        Function.processLastError(false);
    });

    chrome.contextMenus.create({
        title: chrome.i18n.getMessage("stringContextMenuViewYtThumbnail"),
        contexts: ["page"],
        documentUrlPatterns: [
            "*://*.youtube.com/*"
        ],
        id: CMID.ViewYtThumbnail
    }, () => {
        // 2023/11/13 因使用情境之關係，故不以 alert() 顯示錯誤訊息內容。
        Function.processLastError(false);
    });
});

chrome.contextMenus.onClicked.addListener((
    info: chrome.contextMenus.OnClickData,
    _tab?: chrome.tabs.Tab): void => {
    if (info.menuItemId === CMID.ExtractTimestamp) {
        Function.sendMessage(Command.ExtractTimestamp, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === CMID.ExtractTimestamp_AutoAppendEndToken) {
        Function.sendMessage(Command.ExtractTimestampAutoAppendEndToken, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (info.menuItemId === CMID.ViewYtThumbnail) {
        Function.sendMessage(Command.ViewYtThumbnail, true).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === Command.RecordTimestamp) {
        Function.sendMessage(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.TakeScreenshot) {
        Function.sendMessage(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.Rewind) {
        Function.sendMessage(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.FastForward) {
        Function.sendMessage(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    } else if (command === Command.PauseSync) {
        Function.sendMessage(command, false).catch(error => {
            Function.writeConsoleLog(error);
        });
    }
});

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
    if (message === Function.MessageWakeUp) {
        await updateExtensionApperance();
    } else {
        Function.writeConsoleLog(message);
    }
});

/**
 * 更新擴充功能的外觀
 */
async function updateExtensionApperance(): Promise<void> {
    // 設定徽章。
    const enableYTUtaWakuMode = await Function.getSavedDataValueByKey(
        KeyName.EnableYTUtaWakuMode,
        false);

    Function.showYTUtaWakuMode(enableYTUtaWakuMode);

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