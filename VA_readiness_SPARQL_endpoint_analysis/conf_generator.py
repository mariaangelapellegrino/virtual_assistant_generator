from string import printable
import json
import os
import re
import urllib.parse
 
cur_path = os.getcwd()
output_path = "results/"

stats = {}

# it changes the current path
def set_path(path):
	global cur_path
	cur_path = urllib.parse.quote(path)
	
	global output_path
	output_path = cur_path+"/"+output_path

# it store results in the local path o in the set path, in the _results_ folder
def create_output_folder():
	try:
		os.mkdir(output_path)
	except OSError:
		print ("Creation of the directory %s failed" % cur_path+"/"+output_path)
	else:
		print ("Successfully created the directory %s " % cur_path+"/"+output_path)

'''
	it generates entity labels by URI localname
	INPUT: JSON slot {"s": {"value": <URI>}}
	OUTPUT: label lowercase where _ (if any) are substituted by a space 
''' 
def generate_entity_label(slot):
	parts = slot["s"]["value"].split("/")
	label = parts[-1]

	if "#" in label:
		parts = label.split("#")
		label = parts[-1]

	s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', label)
	label = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
	label = label.replace("_", " ")

	return label

'''
	it generates property labels by URI localname
	INPUT: JSON slot {"p": {"value": <URI>}}
	OUTPUT: label lowercase where _ (if any) are substituted by a space 
'''
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

# it check if the key _label_ is provided in the slot object
def is_there_label(slot):
	return "label" in slot and "value" in slot["label"] 

'''
	it generates the entity dictionary
	it looks for the *slot_entities* folder in the local path and merges all the JSON file content in the entity dictionary.
	The JSON file (UTF-8 encoded) must have the following sintax:
		{
			"results":{
				"bindings":[
					{"s":{
						"value": <URI>},
						"label":{"value": <LABEL>}
					}, {...}
				]
			}
		}
	It is a typical JSON returned by querying SPARQL endpoints and storing results in the JSON format.
	
	OUTPUT: It store_results is True, it stores the results in the local path, otherwise it returns the *slot_entities* dictionary 
		1. it stores <label>:{"urls" : [<URI> , ...]} in the *slot_entities* dictionary
		2. it stores the *slot_entities* dictionary in results/slot_entities.json
		3. it generates the label from entity URI localname and keeps track of the entities originally without labels in results/missing_entity_labels
		4. it stores it *stats["entities"]* the total number of entities, the number of entities originally with and without labels and how many labels have been successfully created
'''
def generate_entities(store_results = False):
	slot_entities = {}

	entity_count = 0
	missing_entity_labels = 0
	generated_entity_labels  = 0
	entity_labels_count = 0

	entity_with_missing_label = []
	
	path = cur_path + '/' + 'slot_entities/'

	files = []
	# r=root, d=directories, f = files
	for r, d, f in os.walk(path):
		for file in f:
			if '.json' in file:
				files.append(os.path.join(r, file))

	for f in files:
		with open(f,'r', encoding='utf8') as json_file:
			content = json.load(json_file)
			content = content["results"]["bindings"]

			entity_count += len(content)

			for index in range(len(content)):
				slot = content[index]

				if not is_there_label(slot):
					label = generate_entity_label(slot)
					if label is None:
						missing_entity_labels += 1
						entity_with_missing_label.append(slot["s"]["value"])
						continue
					else:
						generated_entity_labels += 1
				else:
					label = slot["label"]["value"]
					entity_labels_count +=1

				label = label.lower()

				if label not in slot_entities:
					slot_entities[label] = {"urls" : set()}

				slot_entities[label]["urls"].add("<"+slot["s"]["value"]+">")

	for entity in slot_entities:
		slot_entities[entity]["urls"] = list(slot_entities[entity]["urls"])


	stats["entities"] = {
		"count" : entity_count,
		"labels count" : entity_labels_count,
		"missing labels" : missing_entity_labels,
		"generated labels" : generated_entity_labels
	}		

	if store_results:
		with open(output_path+"slot_entities.json", "w") as write_file:
			json.dump(slot_entities, write_file, indent=4)

		with open(output_path+"ignored_entities.json", "w") as write_file:
			json.dump(entity_with_missing_label, write_file, indent=4)
			
	return slot_entities

'''
	it generates the property dictionary
	it looks for the *slot_property* folder in the local path and merges all the JSON file content in the property dictionary.
	The JSON file (UTF-8 encoded) must have the following sintax:
		{
			"results":{
				"bindings":[
					{"p":{
						"value": <URI>},
						"label":{"value": <LABEL>}
					}, {...}
				]
			}
		}
	It is a typical JSON returned by querying SPARQL endpoints and storing results in the JSON format.
	
	OUTPUT: It store_results is True, it stores the results in the local path, otherwise it returns the *slot_properties* dictionary 
		1. it stores <label>: {"urls" : [<URI> , ...]} in the *slot_properties* dictionary
		2. it stores the *slot_properties* dictionary in results/slot_properties.json
		3. it generates the label from property URI localname and keeps track of the properties originally without labels in results/missing_property_labels
		4. it stores it *stats["properties"]* the total number of properties, the number of properties originally with and without labels and how many labels have been successfully created
'''
def generate_properties(store_results = False):
	slot_properties = {}

	property_count = 0
	missing_property_labels = 0
	generated_property_labels  = 0
	property_labels_count = 0

	property_with_missing_label = []

	path = cur_path + '/' + 'slot_properties/'

	files = []
	# r=root, d=directories, f = files
	for r, d, f in os.walk(path):
		for file in f:
			if '.json' in file:
				files.append(os.path.join(r, file))

	for f in files:
		with open(f, 'r', encoding='utf8') as json_file:
			content = json.load(json_file)
			content = content["results"]["bindings"]

			property_count += len(content)
			for index in range(len(content)):
				slot = content[index]

				if not is_there_label(slot):
					label = generate_property_label(slot)
					if label is None:
						missing_property_labels += 1
						property_with_missing_label.append(slot["p"]["value"])
						continue
					else:
						generated_property_labels += 1
				else:
					label = slot["label"]["value"]
					property_labels_count += 1

				label = label.lower()

				if label not in slot_properties:
					slot_properties[label] = {"urls" : set()}

				slot_properties[label]["urls"].add("<"+slot["p"]["value"]+">")

	for prop in slot_properties:
		slot_properties[prop]["urls"] = list(slot_properties[prop]["urls"])

	stats["properties"] = {
		"count" : property_count,
		"labels count" : property_labels_count,
		"missing labels" : missing_property_labels,
		"generated labels" : generated_property_labels
	}

	if store_results:
		with open(output_path+"slot_properties.json", "w") as write_file:
			json.dump(slot_properties, write_file, indent=4)

		with open(output_path+"ignored_properties.json", "w") as write_file:
			json.dump(property_with_missing_label, write_file, indent=4)
			
	return slot_properties

'''
	It estimates the SPARQL endpoint Virtual Assistant Readiness score 
	It stores stats results in results/stats.json if store_results is True, otherwise it simply returns it
'''				
def estimate_quality(slot_entities, slot_properties, store_results=False):	
	entity_readability_issues = 0
	max_url_entities = 0
	more_url_count = 0

	entity_readability_issues_list = []

	for entity in slot_entities:
		if any(c for c in entity if not c.isalnum() and not c.isspace()):
			entity_readability_issues += 1
			entity_readability_issues_list.append(entity)

		url_count = len(slot_entities[entity]["urls"])

		if url_count>1:
			more_url_count += 1

		if url_count>max_url_entities:
			max_url_entities = url_count
		
	entity_ambiguity = more_url_count / len(slot_entities)

	entity_label_initial_coverage = stats["entities"]["labels count"]/stats["entities"]["count"]
	entity_label_coverage = (stats["entities"]["labels count"] + stats["entities"]["generated labels"])/stats["entities"]["count"]

	stats["entities"]["readability"] = (len(slot_entities) - entity_readability_issues) / len(slot_entities)
	stats["entities"]["uniqueness"] = 1- entity_ambiguity
	stats["entities"]["max_ambiguity_level"] = max_url_entities
	stats["entities"]["initial_coverage"] = entity_label_initial_coverage
	stats["entities"]["coverage"] = entity_label_coverage

	property_readability_issues = 0
	max_url_properties = 0
	more_url_count = 0

	property_readability_issues_list = []

	for prop in slot_properties:
		if any(c for c in prop if not c.isalnum() and not c.isspace()):
			property_readability_issues += 1
			property_readability_issues_list.append(prop)


		s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', prop)
		label = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

		if prop != label:
			property_readability_issues += 1
			property_readability_issues_list.append(prop)

		url_count = len(slot_properties[prop]["urls"])

		if url_count>1:
			more_url_count += 1

		if url_count>max_url_properties:
			max_url_properties = url_count
		
	property_ambiguity = more_url_count / len(slot_properties)

	property_label_initial_coverage = stats["properties"]["labels count"]/stats["properties"]["count"]
	property_label_coverage = (stats["properties"]["labels count"] + stats["properties"]["generated labels"])/stats["properties"]["count"]

	stats["properties"]["readability"] = (len(slot_properties) - property_readability_issues) / len(slot_properties)
	stats["properties"]["uniqueness"] = 1- property_ambiguity
	stats["properties"]["max_ambiguity_level"] = max_url_properties
	stats["properties"]["initial_coverage"] = property_label_initial_coverage
	stats["properties"]["coverage"] = property_label_coverage

	min_readability = min(stats["entities"]["readability"], stats["properties"]["readability"])
	min_uniqueness = min(stats["entities"]["uniqueness"], stats["properties"]["uniqueness"])
	min_initial_coverage = min(stats["entities"]["initial_coverage"], stats["properties"]["initial_coverage"])
	va_readiness_score = 0.4*min_readability + 0.4*min_initial_coverage + 0.2*min_uniqueness
	stats["virtual_assistant_readiness_score"] = va_readiness_score
	
	if store_results:
		with open(output_path+"property_readability_issues.json", "w") as write_file:
			json.dump(property_readability_issues_list, write_file, indent=4)

		with open(output_path+"entity_readability_issues.json", "w") as write_file:
			json.dump(entity_readability_issues_list, write_file, indent=4)
			
		with open(output_path+"stats.json", "w") as write_file:
			json.dump(stats, write_file, indent=4)
			
	return stats

def main():
	set_path("example/UNESCO")
	create_output_folder()
	slot_entities = generate_entities(store_results=True)
	slot_properties = generate_properties(store_results=True)
	estimate_quality(slot_entities, slot_properties, store_results=True)

if __name__ == "__main__":
	main()	