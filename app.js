const Koa = require('koa');
const onError = require('koa-onerror');
const setting = require('./config');
const logger = require('./modules/logger');
const blacklist = require('./modules/blacklist');
const staticFilter = require('./modules/staticFilter');
const summersMock = require('summers-mock');
const mockLogger = require('./modules/mockLogger');
const staticCache = require('koa-static-cache');
const path = require('path');



module.exports = (summerCompiler)=> {
    const app = new Koa();

    // error handler
    onError(app);
    app.use(blacklist());
    // static middle
    app.use(staticFilter());
    // static router
    let staticTargetPath = setting.staticTargetPath;

    if (staticTargetPath) {
        if (!path.isAbsolute(staticTargetPath)) {
            staticTargetPath = path.resolve(__dirname, staticTargetPath);
        }

        app.use(staticCache(staticTargetPath, {
            maxAge: setting.staticExpires * 24 * 60 * 60,
            dynamic: true
        }));
    }
    // summers mock middle wave
    try {
        if (summersMock) {
            summersMock.registrySummersCompiler(summerCompiler);
            app.use(mockLogger());
            app.use(summersMock.middleware);
        }
    } catch (err) {
        console.error(err);
        throw Error('summersMock exec error');
    }

    // error-handling
    app.on('error', (err, ctx) => {
        logger.error('server error', err, ctx)
    });

    return app;
};
