var WordNet = require('node-wordnet');
require('wndb-with-exceptions')
var wordnet = new WordNet()


var word = 'produce'

wordnet.lookup(word, function(results){

	if(results){

		var synsetOffsets = [];
		for(var result_index in results){
			var result = results[result_index];

			if(result.pos == 'v'){
				for(var related_index in result.ptrs){
					related_term = result.ptrs[related_index]

					if(related_term.pos == 'n'){
						synsetOffsets.push(related_term.synsetOffset);	
					}	
				}		
			}
		}

		var promises = [];
		var words = []

		for(var i in synsetOffsets){
			var synsetOffset = synsetOffsets[i]
	
			var promise = wordnet.getAsync(synsetOffset, 'n');
			promise.then(function(result){
				//console.log(result.lemma)
				words.push(result.lemma);
				
			});

			promises.push(promise);

		}

		Promise.all(promises).then(function(){

			//var words_set = [...new Set(words)]
			
			var occurrences = { };
			for(var i = 0; i < words.length; ++i) {
			    if(!occurrences[words[i]])
				occurrences[words[i]] = 0;
			    ++occurrences[words[i]];
			}

			var items = Object.keys(occurrences).map(function(key) {
			  return [key, occurrences[key]];
			});

			items.sort(function(first, second) {
			  return second[1] - first[1];
			});
			
			console.log(items)//.slice(0, 5));
		})
		
	}
})


  

