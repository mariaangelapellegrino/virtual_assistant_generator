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

        this.label_predicates = []

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
        if(this.isURL(url)){
            var parts = url.split("/");
            var localName = parts[parts.length-1];
            var label = localName
            if (localName.includes("-")){
                parts = localName.split("-");
                label = parts[1];
            }
            console.log(label);
        }else
            label = url;
         
        return label;
        
    }

    isURL(str) {
      var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return pattern.test(str);
    }

    runSelectQuery (sparql){
        console.log(sparql)

        var t0 = new Date().getTime();
        const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&format=json";
        //const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&resultFormat=json";
        //console.log(url)

        var request = require('sync-request');
        var res = request('GET', url, {
            headers: {
                'user-agent': 'example-user-agent',
            },
        });

        var b = JSON.parse(res.getBody());
        var result =  b.results.bindings;

        console.log(result)

        var t1 = new Date().getTime();
        console.log("Call to runSelectQuery took " + (t1 - t0) + " milliseconds.")

        return result
    }

    runAskQuery (sparql){

        console.log(sparql)

        var t0 = new Date().getTime();
        const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&format=json";
        //const url = this.endpoint+"?query="+ encodeURIComponent(sparql) +"&resultFormat=json";


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
        return this.getProperty("type")
    }

    getImgPredicates (){
        return this.getProperty("img")
    }

    getDescriptionPredicates (){
        return this.getProperty("description")
    }

    getLabelPredicates(){
        if (this.label_predicates.length==0){
            var prop_labels = this.getProperty("label")

            console.log("getLabelPredicates " + prop_labels.length)

            if(prop_labels.length>1){

                var most_used_label = null;
                var most_used_label_count = 0;
                
                for (var i=0; i<prop_labels.length; i++){
                    var prop_label = prop_labels[i];
                    var query = "SELECT DISTINCT * WHERE { ?s " + prop_label + " ?o. }" ;

                    const url = this.endpoint+"?query="+ encodeURIComponent(query) +"&format=json";
                    //const url = this.endpoint+"?query="+ encodeURIComponent(query) +"&resultFormat=json";

                    var request = require('sync-request');
                    try{
                        var res = request('GET', url, {
                            headers: {
                                'user-agent': 'example-user-agent',
                            },
                        });
                    } catch(error){
                        return [prop_labels[0]]
                    }

                    var b = JSON.parse(res.getBody());
                    var result =  b.results.bindings;
                    console.log("getPropLabel,query result number" + result.length)
                    if(len(result)>most_used_label_count){
                        most_used_label = prop_label;
                        most_used_label_count = result.length;
                    }

                }
                
                this.label_predicates = [most_used_label]
            }
            else{
                this.label_predicates = prop_labels[0]
            }
        }
        console.log("label predicates : " + this.label_predicates)
        return [this.label_predicates];           
    }
}

module.exports = custom_functions