CLASSES
-------

# used classes queries
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?class ?label WHERE { 
	?s a ?class. 
	OPTIONAL{
		?class rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	}
}

# owl:Classes
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
SELECT ?s ?label WHERE { 
	?s rdf:type owl:Class. 
	OPTIONAL{
		?s rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	}
}

# skos:Concept
PREFIX skos: <http://www.w3.org/2004/02/skos/core#> 
SELECT ?concept ?label WHERE {
  ?concept a skos:Concept.
  OPTIONAL{
	?concept skos:prefLabel ?label.
    OPTIONAL{
		FILTER(lang(?label)="en")
	}
} 

# rdfs:Class
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?class ?label WHERE { 
	?class a rdfs:Class. 
	OPTIONAL{
		?class rdfs:label ?label.
		OPTIONAL{
			FILTER(lang(?label)="en")
		}
	}
} 


 
PROPERTIES
----------

# used properties
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?p ?label WHERE { 
	?s ?p ?o. 
	OPTIONAL{
		?p rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	}
} 

# owl:datatype properties
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
SELECT ?p ?label WHERE { 
	?p rdf:type owl:DatatypeProperty. 
	OPTIONAL{
		?p rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	}
}

# owl:object properties
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
SELECT ?p ?label WHERE { 
	?p rdf:type owl:ObjectProperty. 
	OPTIONAL{
		?p rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	}
}

# rdf:property
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?p ?label WHERE { 
	?p rdf:type rdf:Property. 
	OPTIONAL{
		?p rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	} 
}



RESOURCES
---------

# triple subjects
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?s ?label WHERE { 
	?s ?p ?o. 
	OPTIONAL{
		?s rdfs:label ?label.
		OPTIONAL{
			FILTER(LANG(?label)="en")
		}
	}
} 

