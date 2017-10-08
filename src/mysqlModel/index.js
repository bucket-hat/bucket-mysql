const assert = require('assert');

module.exports = option =>{
    assert(('mysql' in option), 'mysql module not in option');

    const mysql = option.mysql;
    class Model {
        constructor({dataBase, table, toCame = false}){
            this.db = mysql.get(dataBase);
            this.table = this.db.getTableName(table);
            this.toCame = toCame; // 数据库字段从下划线转驼峰
        }

        async query({sql, values}){
            return await this.db.query(sql, values);
        }

        async select({table, column, where, sort, offset=0, top=1000}){
            if(!table)
                table = this.table;
            return await this.db.select(table, column, where, sort, offset, top, this.toCame);
        }

        async count({table, where}){
            if(!table)
                table = this.table;
            return await this.db.count(table, this.toCame);
        }

        async getOne({table, column, where}){
            if(!table)
                table = this.table;
            return await this.db.getOne(table, column, where, this.toCame);
        }

        async insert({table, value}){
            if(!table)
                table = this.table;
            return await this.db.insert(table, value, this.toCame);
        }

        async update({table, value, where}){
            if(!table)
                table = this.table;
            return await this.db.update(table, value, where, this.toCame);
        }

        async delete({table, where, limit}){
            if(!table)
                table = this.table;
            return await this.db.update(table, where, limit, this.toCame);
        }

        toJsonStringify(obj){
            return typeof obj === 'object' ?  JSON.stringify(obj) : obj;
        }

    }
    return Model;
}