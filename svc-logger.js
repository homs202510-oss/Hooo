const pino = require('pino');
const config = require('./config');

module.exports = pino({
    level: config.env === 'development' ? 'info' : 'warn',
    transport: config.env === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
        },
    } : undefined,
});
