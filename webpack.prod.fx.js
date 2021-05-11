const path = require("path");
const package = require("./package.json");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "production",
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "./src/manifestFx.json",
                    to: "./manifest.json"
                }
            ]
        }),
        new ZipPlugin({
            path: path.resolve(__dirname, "dist"),
            filename: `timestamp_catcher_fx_v${package.version}_build_${getDateString()}.zip`,
            // 如果要發佈到應用程式商店，請註解下面一行。
            pathPrefix: "timestamp_catcher_fx"
        })
    ],
    output: {
        filename: "./[name].js",
        path: path.resolve(__dirname, "dist/timestamp_catcher_fx"),
    }
});

// 來源：https://gist.github.com/ntuaha/f4b16ad377505a8519c7
function pad(v) {
    return (v < 10) ? "0" + v : v
}

function getDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const min = pad(d.getMinutes());
    const sec = pad(d.getSeconds());

    return `${year}${month}${day}${hour}${min}${sec}`;
}