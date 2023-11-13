"use strict";

interface Date {
    format: (format: string) => string;
}

/**
 * 格式化 Date 物件至指定格式的字串
 *
 * 來源：https://www.gushiciku.cn/pl/gHi4/zh-tw
 * 修改來源：https://stackoverflow.com/a/31906736
 *
 * @param {string} format 字串，格式。
 * @returns {string} 字串，格式化的字串。
 */
Date.prototype.format = function (format: string): string {
    const args: { [index: string]: any } = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        // Quarter.
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };

    if (/(y+)/.test(format)) {
        const resultText = (/(y+)/.exec(format) || [])[1] || "";

        format = format.replace(resultText, (this.getFullYear() + "").substring(4 - resultText.length));
    }

    for (let i in args) {
        const n = args[i];
        const regex = new RegExp("(" + i + ")");

        if (regex.test(format)) {
            const resultText = (regex.exec(format) || [])[1] || "";

            format = format.replace(resultText, resultText.length == 1 ? n : ("00" + n).substring(("" + n).length));
        }
    }

    return format;
};