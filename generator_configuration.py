from nltk.corpus import wordnet as wn
import json
from pyinflect import getAllInflections, getInflection
import re
import inflect
import urllib.parse
from SPARQLWrapper import SPARQLWrapper, JSON
from urllib.parse import quote
from py_thesaurus import Thesaurus

WN_NOUN = 'n'
WN_VERB = 'v'
WN_ADJECTIVE = 'a'
WN_ADJECTIVE_SATELLITE = 's'
WN_ADVERB = 'r'


classes = {}
properties = {}


def nounify(verb_word):
    """ Transform a verb to the closest noun: die -> death """
    verb_synsets = wn.synsets(verb_word, pos="v")

    # Word not found
    if not verb_synsets:
        return []

    # Get all verb lemmas of the word
    verb_lemmas = []
    for s in verb_synsets:
        for l in s.lemmas():
            if s.name().split('.')[1] == 'v':
                verb_lemmas.append(l)

    print(verb_lemmas)


    # Get related forms
    derivationally_related_forms = [(l, l.derivationally_related_forms()) \
                                    for l in    verb_lemmas]

    # filter only the nouns
    related_noun_lemmas = [l for drf in derivationally_related_forms \
                           for l in drf[1] if l.synset().name().split('.')[1] == 'n']

    # Extract the words from the lemmas
    words = [l.name() for l in related_noun_lemmas]
    len_words = len(words)

    # Build the result in the form of a list containing tuples (word, probability)
    result = [(w, float(words.count(w))/len_words) for w in set(words)]
    result.sort(key=lambda w: -w[1])

    # return all the possibilities sorted by probability
    return result


def convert(word, from_pos, to_pos):    
    """ Transform words given from/to POS tags """

    synsets = wn.synsets(word, pos=from_pos)

    # Word not found
    if not synsets:
        return []

    # Get all lemmas of the word (consider 'a'and 's' equivalent)
    lemmas = []
    for s in synsets:
        for l in s.lemmas():
            if s.name().split('.')[1] == from_pos or from_pos in (WN_ADJECTIVE, WN_ADJECTIVE_SATELLITE) and s.name().split('.')[1] in (WN_ADJECTIVE, WN_ADJECTIVE_SATELLITE):
                lemmas += [l]

    # Get related forms
    derivationally_related_forms = [(l, l.derivationally_related_forms()) for l in lemmas]

    # filter only the desired pos (consider 'a' and 's' equivalent)
    related_noun_lemmas = []

    for drf in derivationally_related_forms:
        for l in drf[1]:
            if l.synset().name().split('.')[1] == to_pos or to_pos in (WN_ADJECTIVE, WN_ADJECTIVE_SATELLITE) and l.synset().name().split('.')[1] in (WN_ADJECTIVE, WN_ADJECTIVE_SATELLITE):
                related_noun_lemmas += [l]

    # Extract the words from the lemmas
    words = [l.name() for l in related_noun_lemmas]
    len_words = len(words)

    # Build the result in the form of a list containing tuples (word, probability)
    result = [(w, float(words.count(w)) / len_words) for w in set(words)]
    result.sort(key=lambda w:-w[1])

    # return all the possibilities sorted by probability
    return result

def clean_value(value):

    value = value.lower()

    value = value.replace("$", "dollar ")
    value = value.replace("€", "euro ")
    
    temp = ''
    for word in value.split():
        if word.startswith('%'):
            word = urllib.parse.unquote(word)
        temp = temp + " " + word
    value = temp

    value = re.sub(r"[%][a-zA-Z0-9]+", "", value)

    value = value.replace("&", "and")
    value = value.replace("/", " or ")
    value = re.sub(r"([(].*[)])", "", value)
    value = value.replace("'", "")
    value = value.replace('"', "")
    value = value.replace(':', "")
    value = value.replace(',', "")
    value = value.replace('<', "")
    value = value.replace('>', "")
    value = value.replace('(', "")
    value = value.replace(')', "")
    value = value.replace('!', "")
    value = value.replace('\\', "")
    value = value.replace('+', " ")
    value = value.replace("_", " ")

    p = inflect.engine()
    temp = ''
    for word in value.split():
        if word.isdigit() or bool(re.match('^([0-9]|[,]|[.])*$',word)):
            word = p.number_to_words(word)
        temp = temp + " " + word
    value = temp

    value = value.strip()
    value = re.sub(r"[ \s\n\t]+", " ", value)

    return value

def contains_special_characters(value):
    return not bool(re.match('^([a-zA-Z]|[ ]|[-])*$',value))

def remove_ambiguities_slot_properties():
    with open('./augmented_slot_properties.json') as f:
        properties = json.load(f)

    all_properties_value = list(properties.keys())

    for key in properties:
        if 'synonyms' in properties[key]:
            synonyms = properties[key]['synonyms']

            new_synoynms= []
            for synonym in synonyms:
                if not synonym in all_properties_value:
                    all_properties_value.append(synonym)
                    new_synoynms.append(synonym)
            properties[key]['synonyms'] = new_synoynms

    with open("./augmented_slot_properties.json", "w") as write_file:
        json.dump(properties, write_file, indent=4)

def augment_slot_properties():

    with open('./cleaned_slot_properties.json') as f:
        properties = json.load(f)

    for key in properties:
        # nouns to verbs
        verb_tuples = convert(key, 'n', 'v')

        verb_form = []
        for verb_tuple in verb_tuples:
            value = verb_tuple[0]
            value = clean_value(value)
            verb_form.append(value)

        verb_form = set(verb_form)

        # add verb inflections
        for verb in verb_form:
            temp = getAllInflections(verb)
            
            inflections = []
            for t in temp:
                value = temp[t][0]
                value = clean_value(value)
                inflections.append(value)
            inflections = set(inflections)
            verb_form = verb_form.union(inflections)

        verb_form = set(verb_form)

        if key in verb_form:
            verb_form.remove(key)

        verb_form = list(verb_form)

        # nouns to adjectives
        adjective_tuples = convert(key, 'n', 'a')

        adjective_form = []
        for adjective_tuple in adjective_tuples:
            value = adjective_tuple[0]
            value = clean_value(value)
            adjective_form.append(value)
        adjective_form = set(adjective_form)

        if key in adjective_form:
            adjective_form.remove(key)

        adjective_form = list(adjective_form)

        '''
        # noun synonyms
        synonyms = [clean_value(l.name()) for synset in wn.synsets(key) for l in synset.lemmas()]
        synonyms = set(synonyms)

        temp = set()
        for s in synonyms:
            if not s in all_augmented_value:
                temp.add(s)

        #if key in temp:
        #     temp.remove(key)
        
        synonyms = list(temp)

        # combine all
        extended_synonyms = list(set(verb_form + synonyms + adjective_form))
        '''
        extended_synonyms = list(set(verb_form + adjective_form))

        if extended_synonyms:
            properties[key]["synonyms"] = extended_synonyms

    with open("./augmented_slot_properties.json", "w") as write_file:
        json.dump(properties, write_file, indent=4)

def clean_slot_properties():
    with open('./slot_properties.json') as f:
        properties = json.load(f)

    cleaned_properties = {}
    for key in properties:
        if contains_special_characters(key):
            new_key = clean_value(key)
        else:
            new_key = key

        if new_key and not contains_special_characters(new_key):
            if not new_key in cleaned_properties:
                cleaned_properties[new_key] = {'urls':[]}
            cleaned_properties[new_key]['urls'] = list(set(cleaned_properties[new_key]['urls'] + properties[key]['urls']))
            if 'synonyms' in properties[key]:
                if not 'synonyms' in cleaned_properties[new_key]:
                    cleaned_properties[new_key]['synonyms'] = []
                cleaned_properties[new_key]['synonyms'] = list(set(cleaned_properties[new_key]['synonyms'] + properties[key]['synonyms']))
    

    with open("./cleaned_slot_properties.json", "w") as write_file:
        json.dump(cleaned_properties, write_file, indent=4)



def augment_slot_entities():

    with open('./cleaned_slot_entities.json') as f:
        entities = json.load(f)

    for key in entities:
        synonyms = [clean_value(l.name()) for synset in wn.synsets(key) for l in synset.lemmas()]
        synonyms = set(synonyms)

        if key in synonyms:
             synonyms.remove(key)
        
        synonyms = list(synonyms)

        if synonyms:
            entities[key]["synonyms"] = synonyms

    with open("./augmented_slot_entities.json", "w") as write_file:
        json.dump(entities, write_file, indent=4)

def clean_slot_entities():
    with open('./slot_entities.json') as f:
        entities = json.load(f)

    cleaned_entities = {}
    for key in entities:
        if contains_special_characters(key):
            new_key = clean_value(key)
        else:
            new_key = key

        if new_key and not contains_special_characters(new_key):
            if not new_key in cleaned_entities:
                cleaned_entities[new_key] = {'urls':[]}
            cleaned_entities[new_key]['urls'] = list(set(cleaned_entities[new_key]['urls'] + entities[key]['urls']))
            if 'synonyms' in entities[key]:
                if not 'synonyms' in cleaned_entities[new_key]:
                    cleaned_entities[new_key]['synonyms'] = []
                cleaned_entities[new_key]['synonyms'] = list(set(cleaned_entities[new_key]['synonyms'] + entities[key]['synonyms']))

    with open("./cleaned_slot_entities.json", "w") as write_file:
        json.dump(cleaned_entities, write_file, indent=4)
 

def generate_entity_label(slot):
    parts = slot["class"]["value"].split("/")
    label = parts[-1]

    if "#" in label:
        parts = label.split("#")
        label = parts[-1]

    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', label)
    label = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
    label = label.replace("_", " ")

    return label

def store_classes(result):
    for slot in result["results"]["bindings"]:
        if "label" not in slot or "value" not in slot["label"] :
            label = generate_entity_label(slot)
        else:
            label = slot["label"]["value"]

        label = label.lower()

        if len(label) < 140:
            if label not in classes:
                classes[label] = {"urls" : set()}

            classes[label]["urls"].add("<"+slot["class"]["value"]+">")

def query_skosConcepts(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint, defaultGraph=defaultGraph)

    query = ("PREFIX skos: <http://www.w3.org/2004/02/skos/core#> "
        "SELECT DISTINCT ?class ?label WHERE { "
        "?class a skos:Concept."
        "OPTIONAL{ "
            "?class skos:prefLabel ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "} ")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    result = sparql.query().convert()

    try:
        result = sparql.query().convert()
        store_classes(result)
        print("OK skos:concepts query")
    except:
        print("Failed skos:concepts query")
        pass

def query_rdfsClasses(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint, defaultGraph=defaultGraph)

    query = ("SELECT DISTINCT ?class ?label WHERE { "
        "?class a owl:Class. "
        "OPTIONAL{ "
            "?class rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "} ")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    result = sparql.query().convert()

    try:
        result = sparql.query().convert()
        store_classes(result)
        print("OK rdfs:classes query")
    except:
        print("Failed rdfs:classes query")
        pass


def query_owlClasses(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint, defaultGraph=defaultGraph)

    query = ("SELECT DISTINCT ?class ?label WHERE { "
        "?class a owl:Class. "
        "OPTIONAL{ "
            "?class rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "}")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    result = sparql.query().convert()

    try:
        result = sparql.query().convert()
        store_classes(result)
        print("OK owl classes query")
    except:
        print("Failed owl classes query")
        pass


def query_usedClasses(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint, defaultGraph=defaultGraph)

    query = ("SELECT DISTINCT ?class ?label WHERE { "
        "[] a ?class. "
        "OPTIONAL{ "
            "?class rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "} ")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    try:
        result = sparql.query().convert()
        store_classes(result)
        print("OK Used classes query")
    except:
        print("Failed used classes query")
        pass

def query_classes(sparql_endpoint, defaultGraph = "", lang="en"):
    query_usedClasses(sparql_endpoint, defaultGraph=defaultGraph, lang= lang)
    query_skosConcepts(sparql_endpoint,  defaultGraph=defaultGraph, lang= lang)
    query_rdfsClasses(sparql_endpoint,  defaultGraph=defaultGraph, lang= lang)
    query_owlClasses(sparql_endpoint, defaultGraph= defaultGraph, lang= lang)

    for c in classes:
        classes[c]["urls"] = list(classes[c]["urls"])

    with open("./slot_entities.json", "w") as write_file:
        json.dump(classes, write_file, indent=4)


def generate_property_label(slot):
    parts = slot["p"]["value"].split("/")
    label = parts[-1]

    if "#" in label:
        parts = label.split("#")
        label = parts[-1]

    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', label)
    label = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
    label = label.replace("_", " ")

    return label

def store_properties(result):
    for slot in result["results"]["bindings"]:
        if "label" not in slot or "value" not in slot["label"] :
            label = generate_property_label(slot)
        else:
            label = slot["label"]["value"]

        label = label.lower()

        if len(label) < 140:
            if label not in properties:
                properties[label] = {"urls" : set()}

            properties[label]["urls"].add("<"+slot["p"]["value"]+">")

def query_rdfProperty(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint,  defaultGraph=defaultGraph)

    query = ("PREFIX rdf:  <https://www.w3.org/1999/02/22-rdf-syntax-ns#>"
        "SELECT DISTINCT ?p ?label WHERE { "
        "?p rdf:type rdf:Property. "
        "OPTIONAL{ "
            "?p rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "}")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    try:
        result = sparql.query().convert()
        store_properties(result)
        print("OK rdf:Property query")
    except:
        print("Failed rdf:Property query")
        pass

def query_owlDatatypeProperties(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint,  defaultGraph=defaultGraph)

    query = ("PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"
        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
        "PREFIX owl:  <http://www.w3.org/2002/07/owl#>"
        "SELECT DISTINCT ?p ?label WHERE { "
        "?p rdf:type owl:DatatypeProperty. "
        "OPTIONAL{ "
            "?p rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "}")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    try:
        result = sparql.query().convert()
        store_properties(result)
        print("OK owl:DatatypeProperty query")
    except:
        print("failed owl:DatatypeProperty query")
        pass

def query_owlObjectProperties(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint,  defaultGraph=defaultGraph)

    query = ("PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"
        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
        "PREFIX owl:  <http://www.w3.org/2002/07/owl#>"
        "SELECT DISTINCT ?p ?label WHERE { "
        "?p rdf:type owl:ObjectProperty. "
        "OPTIONAL{ "
            "?p rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "}")


    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    try:
        result = sparql.query().convert()
        store_properties(result)
        print("OK owl:ObjectProperty query")
    except:
        print("failed owl:ObjectProperty query")
        pass

def query_usedProperties(sparql_endpoint, defaultGraph = "", lang="en"):
    sparql = SPARQLWrapper(sparql_endpoint,  defaultGraph=defaultGraph)

    query = ("PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
        "SELECT DISTINCT ?p ?label WHERE { "
        "?s ?p ?o. "
        "OPTIONAL{ "
            "?p rdfs:label ?label. "
             "FILTER(LANG(?label)='"+lang+"')" 
        "}" 
    "}")

    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    try:
        result = sparql.query().convert()
        store_properties(result)
        print("OK used property with labels query")
    except:
        print("failed used property with labels query")
        

        query = ("PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
            "SELECT DISTINCT ?p WHERE { ?s ?p ?o. }"
        )

        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        try:
            result = sparql.query().convert()
            store_properties(result)
            print("OK used property without labels query")
        except:
            print("failed used property without labels query")
            pass


def query_properties(sparql_endpoint, defaultGraph = "", lang="en"):
    query_usedProperties(sparql_endpoint, defaultGraph=defaultGraph, lang= lang)
    query_owlObjectProperties(sparql_endpoint,  defaultGraph=defaultGraph, lang= lang)
    query_owlDatatypeProperties(sparql_endpoint,  defaultGraph=defaultGraph, lang= lang)
    query_rdfProperty(sparql_endpoint, defaultGraph= defaultGraph, lang= lang)

    for p in properties:
        properties[p]["urls"] = list(properties[p]["urls"])

    with open("./slot_properties.json", "w") as write_file:
        json.dump(properties, write_file, indent=4)

if __name__ == "__main__":
    endpoint = "http://dbpedia.org/sparql"
    defaultGraph = "http://dbpedia.org"
    lang = "en"
    invocation_name = "my personal assistant"
    intents = [
        "getAllResultsPreviousQuery",
        "getQueryExplanation",
        "getFurtherDetails",
        "getPropertyObject",
        "getDescription",
        "getNumericFilter",
        "getNumericFilterByClass",
        "getClassInstances",
        "getTripleVerification",
        "getLocation",
        "getSuperlative",
        "getPropertySubjectByClass",
        "getPropertySubject"
    ]
    result_limit = 5

    '''
    print("Querying classes...")
    query_classes(endpoint, defaultGraph=defaultGraph, lang=lang)   
    print("Cleaning class labels...")     
    clean_slot_entities()
    #print("Augmenting class labels...")
    #augment_slot_entities()

    print("Querying properties...")
    query_properties(endpoint, defaultGraph=defaultGraph, lang=lang)
    print("Cleaning property labels...")
    clean_slot_properties()
    print("Augmenting property labels...")
    augment_slot_properties()
    
    remove_ambiguities_slot_properties()
    '''
    with open('./augmented_slot_properties.json') as f:
        properties = json.load(f)

    '''
    if "label" in properties and len(properties["label"]["urls"])>1:
        dict_label = {}

        for prop_label in properties["label"]["urls"]:
            sparql = SPARQLWrapper(endpoint,  defaultGraph=defaultGraph)

            query = ("SELECT COUNT(*) as ?count WHERE { "
                "?s " + prop_label + " ?o. "        
            "}")

            sparql.setQuery(query)
            sparql.setReturnFormat(JSON)
            try:
                result = sparql.query().convert()
                result = result['results']['bindings'][0]
                dict_label[prop_label] = result['count']['value']
            except:
                pass

        print(dict_label)
        key_max = max(dict_label, key= lambda x: dict_label[x]) 
        properties["label"]["urls"] = [key_max]
    '''

    with open('./cleaned_slot_entities.json') as f:
        entities = json.load(f)


    conf = {
        "invocation_name" : invocation_name,
        "intents" : intents,
        "lang" : lang,
        "result_limit" : result_limit,
        "endpoint" : endpoint,
        "entity" : entities,
        "property" : properties
    }

    with open("./conf.json", "w") as write_file:
        json.dump(conf, write_file, indent=4)

