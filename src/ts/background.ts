"use strict";

import { CMID, Command, KeyName, Function } from "./function";

chrome.runtime.onInstalled.addListener(() => {
    try {
        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("stringContextMenuExtractTimestamp"),
            contexts: ["selection"],
            documentUrlPatterns: [
                "*://*.youtube.com/*"
            ],
            id: CMID.ExtractTimestamp
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("stringContextMenuExtractTimestampAutoAppendEndToken"),
            contexts: ["selection"],
            documentUrlPatterns: [
                "*://*.youtube.com/*"
            ],
            id: CMID.ExtractTimestamp_AutoAppendEndToken
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("stringContextMenuViewYtThumbnail"),
            contexts: ["page"],
            documentUrlPatterns: [
                "*://*.youtube.com/*"
            ],
            id: CMID.ViewYtThumbnail
        });
    } catch (error) {
        Function.writeConsoleLog(error);
    }
});

chrome.contextMenus.onClicked.addListener((
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab): void => {
    try {
        if (info.menuItemId === CMID.ExtractTimestamp) {
            Function.sendMsg(Command.ExtractTimestamp, true).catch(error => {
                Function.writeConsoleLog(error);
            });
        } else if (info.menuItemId === CMID.ExtractTimestamp_AutoAppendEndToken) {
            Function.sendMsg(Command.ExtractTimestampAutoAppendEndToken, true).catch(error => {
                Function.writeConsoleLog(error);
            });
        } else if (info.menuItemId === CMID.ViewYtThumbnail) {
            Function.sendMsg(Command.ViewYtThumbnail, true).catch(error => {
                Function.writeConsoleLog(error);
            });
        }
    } catch (error) {
        Function.writeConsoleLog(error);
    }
});

chrome.commands.onCommand.addListener((command) => {
    try {
        if (command === Command.RecordTimestamp) {
            Function.sendMsg(command, false).catch(error => {
                Function.writeConsoleLog(error);
            });
        } else if (command === Command.TakeScreenshot) {
            Function.sendMsg(command, false).catch(error => {
                Function.writeConsoleLog(error);
            });
        } else if (command === Command.Rewind) {
            Function.sendMsg(command, false).catch(error => {
                Function.writeConsoleLog(error);
            });
        } else if (command === Command.FastForward) {
            Function.sendMsg(command, false).catch(error => {
                Function.writeConsoleLog(error);
            });
        } else if (command === Command.PauseSync) {
            Function.sendMsg(command, false).catch(error => {
                Function.writeConsoleLog(error);
            });
        }
    } catch (error) {
        Function.writeConsoleLog(error);
    }
});

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
    try {
        if (message === Function.MessageWakeUp) {
            await updateExtensionApperance();
        } else {
            Function.writeConsoleLog(message);
        }
    } catch (error) {
        Function.writeConsoleLog(error);
    }
});

/**
 * 更新擴充功能的外觀
 */
async function updateExtensionApperance(): Promise<void> {
    try {
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
    } catch (error) {
        Function.writeConsoleLog(error);
    }
}