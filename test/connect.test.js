/*
test in your localhost machine

create database test123;
create table user(
    id int primary key auto_increment,
    name varchar(10) not null
);
*/

const assert = require('assert');
const bucketMysql = require('../index')


it("example test", (done)=>{
    const exampleMysql = bucketMysql({
        config: {
            default: {
                host            : 'localhost',
                port            : 3306,
                user            : 'root',
                password        : '',
                database        : 'test123'
            }
        }
    })

    const myModel = new exampleMysql({
        dataBase: 'default',
        table: 'user'
    });

    (async () => {
        
        let ret = await myModel.select({
            where: {
                'name': 'a'
            }
        })

    })().then(done).catch(done)
})