module.exports = option =>{
    const mysql = require('mysql');

    const logger = option.logger;
    const utilString = require('./util-string');

    class database {

        constructor(config){
            this.pool = mysql.createPool({
                host            : config.host,
                port            : config.port,
                user            : config.user,
                password        : config.password,
                database        : config.database,
                charset         : config.charset ? config.charset : 'utf8',
                connectionLimit : config.connectionLimit,  //所允许立即创建的最大连接数量 (默认值: 10)
                queueLimit      : config.queueLimit,       //queueLimit（队列数量限制）: 在调用getConnection返回错误之前，连接池所允许入队列的最大请求数量。如设置为0， 则不限制。 (默认值: 0)
                //acquireTimeout  : 10000,   //获取连接时，触发连接超时之前的毫秒数。这与connectTimeout略有不同，因为从连接池获取连接并不总会创建连接 (默认值：10000)
                //multipleStatements : false, //多语句查询 (默认值：false)
                //supportBigNumbers : false, // When dealing with big numbers (BIGINT and DECIMAL columns) in the database, you should enable this option (Default: false).
                //bigNumberStrings : false,
                //dateStrings : false, // Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then inflated into JavaScript Date objects. Can be true/false or an array of type names to keep as strings. (Default: false)
            });

            this.config = config;
            this.tablePrefix = config.tablePrefix ? config.tablePrefix : '';
            this.queryTimeOut = config.queryTimeOut ? config.queryTimeOut : 3000;
        }

        queryFormat (sql, values){
            if (!values) return sql;
            return sql.replace(/(\:+)(\w+)/g, (txt, arg1, arg2)=>{
                if (values.hasOwnProperty(arg2))
                    return mysql.format( arg1.length >1 ? '??' : '?', values[arg2]);
                else
                    return txt;
            })
        }

        getTableName (table){
            const tablePrefix = 'tablePrefix' in this.config ? this.config.tablePrefix : ''
            return tablePrefix + table;
        }

        query(sql, values){
            if(values)
                if(values instanceof Array)
                    sql = mysql.format(sql, values);
                else
                    sql = this.queryFormat(sql, values);


            let beginTime = new Date().getTime();

            return new Promise((resolve, reject)=>{
                this.pool.getConnection((err, connection)=>{
                    if(err){
                        logger.error(err);
                        reject({code : 500, message : 'database connect error'});
                        return;
                    }
                    // Use the connection
                    connection.query({sql:sql,timeout:this.queryTimeOut}, (error, results, fields)=>{
                        // And done with the connection.
                        connection.release();
                        // Handle error after the release.
                        if (error){
                            logger.error(`[Mysql] Statement: ${sql}`, error);
                            reject({code : 500, message : 'database query error'});
                            return;
                        }
                        let endTime = new Date().getTime() - beginTime;
                        let res = fields ? results.length + ' rows' : JSON.stringify(results);
                        logger.info(`[Mysql] Statement: ${sql}; Time: ${endTime}ms; Result: ${res}`);

                        // Don't use the connection here, it has been returned to the pool.
                        resolve(results);
                    });
                });
            });
        }

        select(table, column, where, sort, offset=0, top=1000, toCame = false){
            let sql = '';
            let values = [];
            if(toCame && where){
                where = utilString.camelCase2UnderScore4Key(where);
            }
            if(column){
                if(toCame){
                    column = column.map(utilString.camelCase2UnderScore)
                }
                sql = 'select ?? from ?? ';
                values = [column, table];
            }else{
                sql = 'select * from ?? ';
                values = [table];
            }
            if(typeof where === 'object' && Object.keys(where).length){
                let whereSql = [];
                for(let key in where){
                    if(where[key] instanceof Array){
                        if(where[key][1] && where[key][1] instanceof Array ){
                            let inValue = where[key][1].map((v)=>{return mysql.format('?',v)}).join(',');
                            whereSql.push(mysql.format(`?? ${where[key][0]} (${inValue})`, [key]));
                        }else{
                            whereSql.push(mysql.format(`?? ${where[key][0]} ?`, [key, where[key][1]]));
                        }
                    }else{
                        whereSql.push(mysql.format(' ?? = ? ', [key, where[key]]));
                    }
                }
                sql += ` where ${whereSql.join(' and ')} `;
            }

            if(sort && typeof sort === 'object'){
                let orderSql = [];
                for(let key in sort){
                    key = utilString.camelCase2UnderScore(key);
                    key = mysql.format(' ?? ', key);
                    orderSql.push(key + ' ' + ((sort[key]!=='asc') ? 'desc' : 'asc') )
                }
                sql += ` order by ${orderSql.join(',')} ` ;
            }

            sql += ' limit ?,? ';
            values.push(Number(offset));
            values.push(Number(top));

            return this.query(sql, values).then((rows)=>{
                if(rows && toCame)
                    rows = utilString.underScore2CamelCase4Key(rows);
                return rows;
            });
        }

        count(table, where, toCame = false){
            let sql = '';
            let values = [];
            if(toCame && where){
                where = utilString.camelCase2UnderScore4Key(where);
            }

            sql = 'select count(1) as `c` from ?? ';
            values = [table];

            if(typeof where === 'object' && Object.keys(where).length){
                let whereSql = [];
                for(let key in where){
                    if(where[key] instanceof Array){
                        if(where[key][1] && where[key][1] instanceof Array ){
                            let inValue = where[key][1].map((v)=>{return mysql.format('?',v)}).join(',');
                            whereSql.push(mysql.format(`?? ${where[key][0]} (${inValue})`, [key]));
                        }else{
                            whereSql.push(mysql.format(`?? ${where[key][0]} ?`, [key, where[key][1]]));
                        }
                    }else{
                        whereSql.push(mysql.format(' ?? = ? ', [key, where[key]]));
                    }
                }
                sql += ` where ${whereSql.join(' and ')} `;
            }

            sql += ' limit 1';

            return this.query(sql, values).then((rows)=>{
                return rows[0].c;
            });
        }

        getOne(table, column, where, toCame = false){
            let sql = '';
            let values = [];
            if(toCame && where){
                where = utilString.camelCase2UnderScore4Key(where);
            }
            if(column){
                if(toCame){
                    column = column.map(utilString.camelCase2UnderScore)
                }
                sql = 'select ?? from ?? ';
                values = [column, table];
            }else{
                sql = 'select * from ?? ';
                values = [table];
            }

            if(where && typeof where === 'object'){
                let whereSql = [];
                for(let key in where){
                    if(where[key] instanceof Array){
                        if(where[key][1] && where[key][1] instanceof Array ){
                            let inValue = where[key][1].map((v)=>{return mysql.format('?',v)}).join(',');
                            whereSql.push(mysql.format(`?? ${where[key][0]} (${inValue})`, [key]));
                        }else{
                            whereSql.push(mysql.format(`?? ${where[key][0]} ?`, [key, where[key][1]]));
                        }
                    }else{
                        whereSql.push(mysql.format(' ?? = ? ', [key, where[key]]));
                    }
                }
                sql += ` where ${whereSql.join(' and ')} `;
            }else{
                return Promise.reject({code:400,message:'where error'})
            }

            sql += 'limit 1';

            return this.query(sql, values).then((rows)=>{
                if(rows && toCame)
                    rows = utilString.underScore2CamelCase4Key(rows);
                return rows.length ? rows[0] : null;
            });
        }

        getOneBySql(sql, values, toCame = false){
            return this.query(sql, values).then((rows)=>{
                if(rows && toCame)
                    rows = utilString.underScore2CamelCase4Key(rows);
                return rows.length ? rows[0] : null;
            });
        }

        /**
         * @description
         * results OkPacket {
         fieldCount: 0,
         affectedRows: 1,
         insertId: 0,
         serverStatus: 2,
         warningCount: 0,
         message: '(Rows matched: 1  Changed: 0  Warnings: 0',
         protocol41: true,
         changedRows: 0 }
         */
        insert(table, value, toUnder=false){
            let sql = 'insert into ?? set ? ';
            if(toUnder)
                value = utilString.camelCase2UnderScore4Key(value);

            return this.query(sql, [table, value]).then((results)=>{
                return {
                    insertId    :   results.insertId,
                }
            });
        }

        update(table, value, where, toUnder=false){
            let sql = 'update ?? set ? ';
            if(toUnder){
                value = utilString.camelCase2UnderScore4Key(value);
                where = utilString.camelCase2UnderScore4Key(where);
            }
            if(where && typeof where === 'object'){
                let whereSql = [];
                for(let key in where){
                    whereSql.push(mysql.format(' ?? = ? ', [key, where[key]]));
                }
                sql += ` where ${whereSql.join(' and ')} `;
            }else{
                return Promise.reject({code:400,message:'where error'}) // 强制加条件
            }

            return this.query(sql, [table, value]).then((results)=>{
                return {
                    affectedRows    :   results.affectedRows,
                    changedRows     :   results.changedRows,
                }
            });
        }

        delete(table, where, limit, toUnder=false){
            let sql = 'delete from ?? ';
            if(toUnder){
                where = utilString.camelCase2UnderScore4Key(where);
            }
            if(where && typeof where === 'object'){
                let whereSql = [];
                for(let key in where){
                    whereSql.push(mysql.format(' ?? = ? ', [key, where[key]]));
                }
                sql += ` where ${whereSql.join(' and ')} `;
            }else{
                return Promise.reject({code:400,message:'where error'}) // 强制加条件
            }
            if(limit && typeof limit === 'number'){
                sql += ` limit ${limit} `
            }

            return this.query(sql, [table]).then((results)=>{
                return {
                    affectedRows    :   results.affectedRows,
                    changedRows     :   results.changedRows,
                }
            });
        }

    };
    return database;
} 