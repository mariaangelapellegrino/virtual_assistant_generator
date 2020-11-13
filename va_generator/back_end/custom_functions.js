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
        var t0 = new Date().getTime();
        //console.log(property)
        //console.log(this.properties[property].urls)

        var result = null;
        if (property in this.properties){
            result = this.properties[property].urls;
        }

        var t1 = new Date().getTime();
        console.log("Call to resolve "+ property + " as " + result + " took " + (t1 - t0) + " milliseconds.")

        return result
    }

    getEntity(entity){
        var t0 = new Date().getTime();
        //console.log(entity)
        //console.log(this.entities[entity].urls)

        var result = null;
        if (entity in this.entities){
            result = this.entities[entity].urls;
        }

        var t1 = new Date().getTime();
        console.log("Call to resolve "+ entity + " as " + result + " took " + (t1 - t0) + " milliseconds.")

        return result
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
        var t0 = new Date().getTime();
        const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&format=json";
        //console.log(url)

        var request = require('sync-request');
        var res = request('GET', url, {
            headers: {
                'user-agent': 'example-user-agent',
            },
        });

        var b = JSON.parse(res.getBody());
        var result =  b.results.bindings;

        var t1 = new Date().getTime();
        console.log("Call to runSelectQuery took " + (t1 - t0) + " milliseconds.")

        return result
    }

    runAskQuery (sparql){
        var t0 = new Date().getTime();
        const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&format=json";

        var request = require('sync-request');
        var res = request('GET', url, {
            headers: {
                'user-agent': 'example-user-agent',
            },
        });

        var b = JSON.parse(res.getBody());
        var result = b.boolean;

        var t1 = new Date().getTime();
        console.log("Call to runAskQuery took " + (t1 - t0) + " milliseconds.")

        return result
    }

    getLocationPredicates (){
        return this.getProperty("location");
    }

    getInstancesPredicates (){
        return this.getProperty("instanceof")
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