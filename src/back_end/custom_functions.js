class custom_functions{
    constructor(){
        var fs = require('fs');
        require("./conf.json")
        this.conf_file = JSON.parse(fs.readFileSync('./conf.json').toString());

        this.entities = {}
        if("entity" in this.conf_file)
            this.entities = this.conf_file["entity"]

        this.properties = {}
        if("property" in this.conf_file)
            this.properties = this.conf_file["property"]

        this.lang = this.conf_file["lang"]

        this.limitResults = 5
        if("result_limit" in this.conf_file)
            this.limitResults = this.conf_file["result_limit"]

        this.invocationName = this.conf_file["invocation_name"]

        this.endpoint = this.conf_file["endpoint"]

    }

    getLang(){
        return this.lang;
    }

    getLimitResults(){
        return this.limitResults;
    }

    getInvocationName(){
        return this.invocationName;
    }

    getProperty(property){
        console.log(property)
        console.log(this.properties[property].urls)
        if (property in this.properties){
            return this.properties[property].urls;
        }
    }

    getEntity(entity){
        console.log(entity)
        console.log(this.entities[entity].urls)
        if (entity in this.entities){
            return this.entities[entity].urls;
        }
    }

    extractLabel(url){
        console.log("extractLabel");
        console.log(url);
        var parts = url.split("/");
        var localName = parts[parts.length-1];
        var label = localName
        if (localName.includes("-")){
            parts = localName.split("-");
            label = parts[1];
        }
        console.log(label);
         
        return label;
    }

    runSelectQuery (sparql){
        const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&format=json";
        console.log(url)

        var request = require('sync-request');
        var res = request('GET', url, {
            headers: {
                'user-agent': 'example-user-agent',
            },
        });

        var b = JSON.parse(res.getBody());
        return b.results.bindings;
    }

    runAskQuery (sparql){
        const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&format=json";

        var request = require('sync-request');
        var res = request('GET', url, {
            headers: {
                'user-agent': 'example-user-agent',
            },
        });

        var b = JSON.parse(res.getBody());
        return b.boolean;
    }

    getLocationPredicates (){
        return this.getProperty("location");
    }

    getInstancesPredicates (){
        return this.getProperty("instanceOf")
    }

    getImgPredicates (){
        return this.getProperty("img")
    }

    getDescriptionPredicates (){
        return this.getProperty("description")
    }

    getLabelPredicates(){
        return this.getProperty("label")
    }
}

module.exports = custom_functions