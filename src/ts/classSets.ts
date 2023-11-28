"use strict";

/**
 * 類別：CMID
 */
export class CMID {
    /**
     * 共用的 ContextMenu 選項「解析時間標記」的 ID 值
     */
    static ExtractTimestamp = "CMID_ExtractTimestamp";

    /**
     * 共用的 ContextMenu 選項「解析時間標記（自動附加結束標記）」的 ID 值
     */
    static ExtractTimestamp_AutoAppendEndToken = "CMID_ExtractTimestamp_AutoAppendEndToken";

    /**
     * 共用的 ContextMenu 選項「檢視此 YouTube 影片的預覽圖」的 ID 值
     */
    static ViewYtThumbnail = "CMID_ViewYtThumbnail";
}

/**
 * 類別：指令
 */
export class Command {
    /**
     * 指令：紀錄時間標記
     */
    static RecordTimestamp = "recordTimestamp";

    /**
     * 指令：拍攝截圖
     */
    static TakeScreenshot = "takeScreenshot";

    /**
     * 指令：解析時間標記
     */
    static ExtractTimestamp = "extractTimestamp";

    /**
     * 指令：解析時間標記（自動附加結束標記）
     */
    static ExtractTimestampAutoAppendEndToken = "extractTimestampAutoAddEndToken";

    /**
     * 指令：檢視此 YouTube 影片的預覽圖
     */
    static ViewYtThumbnail = "viewYtThumbnail";

    /**
     * 指令：倒轉
     */
    static Rewind = "rewind";

    /**
     * 指令：快轉
     */
    static FastForward = "fastForward";

    /**
     * 指令：不同步 / 同步時間標記
     */
    static PauseSync = "pauseSync";

    /**
     * 指令：取得目前的分頁
     */
    static GetCurrentTab = "getCurrentTab";
}

/**
 * 類別：鍵值名稱
 */
export class KeyName {
    /**
     * 已初始化
     */
    static Initiated = "Initiated";

    /**
     * 啟用紀錄輸出
     */
    static EnableOutputLog = "EnableOutputLog";

    /**
     * 啟用聲音效果
     */
    static EnableSoundEffect = "EnableSoundEffect";

    /**
     * 啟用輸出格式化的 YouTube 時間標記
     */
    static EnableFormattedYTTimestamp = "EnableFormattedYTTimestamp";

    /**
     * 啟用 YouTube 歌回模式
     */
    static EnableYTUtaWakuMode = "EnableYTUtaWakuMode";

    /**
     * 啟用傳統按鍵監聽模式
     */
    static EnableLegacyKeyListener = "EnableLegacyKeyListener";

    /**
     * 否啟用左側填補空白（預設是在右側填補空白）
     */
    static EnableLeftSideSpacePadding = "EnableLeftSideSpacePadding";

    /**
     * 啟用自動在註解列的尾端補上"（開始）"、"（結束）"標記
     */
    static EnableAppendingStartEndToken = "EnableAppendingStartEndToken";

    /**
     * MIME
     */
    static MIME = "MIME";

    /**
     * 啟用加入動畫瘋彈幕
     */
    static EnableAddAniGamerDanMu = "EnableAddAniGamerDanMu";

    /**
     * 附加秒數（Function.DefaultAppendSeconds）
     */
    static AppendSeconds = "AppendSeconds";

    /**
     * 預設時間標記資料鍵值名稱
     */
    static DefaultTimestampDataKeyName = "TimestampData";
}

/**
 * 類別：分隔符號
 */
export class Seperators {
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
}

/**
 * 類別：鍵組
 */
export class KeySet {
    /**
     * 網址
     */
    url: string = "";

    /**
     * 鍵值
     */
    key: string = "";

    /**
     * 是否為 YouTube 影片
     */
    isYouTubeVideo: boolean = false;

    /**
     * 是否為 Twitch 影片
     */
    isTwitchVideo: boolean = false;

    /**
     * 是否為動畫瘋影片
     */
    isGamerAniVideo: boolean = false;

    /**
     * 是否為 Bilibili 影片
     */
    isBilibiliVideo: boolean = false;

    /**
     * 是否為本機影片
     */
    isLocalHostVideo: boolean = false;

    /**
     * 是否為擴充功能影片
     */
    isExtensionPage: boolean = false;
}

/**
 * 訊息
 */
export class Message {
    /**
     * 訊息：醒來
     */
    static WakeUp = "wakeUp";

    /**
     * 訊息：查詢目前的分頁
     */
    static QueryCurrentTab = "queryCurrentTab";
}