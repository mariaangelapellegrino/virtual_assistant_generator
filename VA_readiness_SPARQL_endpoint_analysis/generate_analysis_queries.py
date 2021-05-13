from SPARQLWrapper import SPARQLWrapper
import os

for filename in os.listdir("./analysis_queries"):
    if filename.endswith(".sparql"):
        print("Processing: {}".format(filename))
with open('readme.txt') as f:
    lines = f.readlines()

queryString = "SELECT * WHERE { ?s ?p ?o. }"
sparql = SPARQLWrapper("http://example.org/sparql")

sparql.setQuery(queryString)

try :
   ret = sparql.query()
   # ret is a stream with the results in XML, see <http://www.w3.org/TR/rdf-sparql-XMLres/>
except :
   deal_with_the_exception()