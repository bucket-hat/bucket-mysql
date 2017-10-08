module.exports = option =>{
    const mysql = require('./mysql')(option);
    const mysqlConfig = Object.assign({}, option.config);

    class db{
        constructor(){
            this.db = {};
        }

        get(db='default'){
            if(!this.db.hasOwnProperty(db))
                this.db[db] = new mysql(mysqlConfig[db]);
            return this.db[db];
        }

    };

    return new db();
}