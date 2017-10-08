exports.camelCase2UnderScore = (str)=>{
    return str.replace(/([^A-Z])([A-Z])/g,  ($0, $1, $2)=>{
        return $1 + "_" + $2.toLowerCase();
    });
};

exports.underScore2CamelCase = (str)=>{
    return str.replace(/_([a-z])/g,  ($0, $1)=>{
        return $1.toUpperCase();
    });
};

exports.underScore2CamelCase4Key = (obj)=>{
    if(obj instanceof Array){
        let _obj = [];
        for(let rows of obj){
            _obj.push(this.underScore2CamelCase4Key(rows));
        }
        return _obj;
    }
    if(typeof obj === 'object'){
        let row = {};
        for(let key in obj){
            row[this.underScore2CamelCase(key)] = obj[key];
        }
        return row;
    }
    return obj;
};

exports.camelCase2UnderScore4Key = (obj)=>{
    if(obj instanceof Array){
        let _obj = [];
        for(let rows of obj){
            _obj.push(this.camelCase2UnderScore4Key(rows));
        }
        return _obj;
    }
    if(typeof obj === 'object'){
        let row = {};
        for(let key in obj){
            row[this.camelCase2UnderScore(key)] = obj[key];
        }
        return row;
    }
    return obj;
};

exports.firstUpperCase = (str)=>{
    return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
};

exports.padStart = (str, targetLength, padString) =>{
    str = String(str);
    padString = String(padString);
    while(str.length < targetLength){
        str = padString + str;
    }
    return str;
};