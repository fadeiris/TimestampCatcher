const CopyVersionPlugin = require("webpack-copy-version-plugin");

module.exports = {
    entry: {},
    mode: "production",
    plugins: [
        new CopyVersionPlugin({
            from: "./package.json",
            to: "./src/manifest.json"
        }),
        new CopyVersionPlugin({
            from: "./package.json",
            to: "./src/manifestFx.json"
        })
    ]
};