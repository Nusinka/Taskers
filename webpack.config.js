module.exports = {
    entry: [
        './public_src/dashboard.js'
    ],
    output: {
        path: './public/js/',
        filename: "dashboard.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.html$/, loader: 'html'}
        ]
    }
};
