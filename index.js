const debug = require('debug')('bucket:mysql')
const mysql = require('./src/mysql')
const mysqlModel = require('./src/mysqlModel')

module.exports = option => {

    let logger;
    let config;

    if('logger' in option){
        logger = option.logger;
    }else{
        logger = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : debug
        });
    }

    config = Object.assign({}, option.config)

    return mysqlModel({
        mysql: mysql({
            logger,
            config
        })
    })

}
