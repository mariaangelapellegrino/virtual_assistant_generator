from SPARQLWrapper import SPARQLWrapper
import json

class AbstractValidator:
	def __init__(self):
		pass

	def validate(self, conf):
		pass

class Validator:
	def __init__(self):
		self.mandatory_fields = ["invocation_name", "lang", "intents", "endpoint"] #, "result_limit"]
		self.available_langs = ["en", "it"]
		self.intents_constraints = {
			'getDescription' : ['description'],
			'getLocation' : ['location'],
			'getImg' : ['img'],
			'getClassInstances' : ['instanceof', 'label'],
			'getNumericFilter' : ['label'],
			'getNumericFilterByClass' : ['instanceof'],
			'getDateFilter' : ['label'],
			'getDateFilterByClass' : ['instanceof', 'label'],
			'getPropertySubjectByClass' : ['instanceof', 'label'],
			'getSuperlative' : ['instanceof', 'label'],
			'getPropertyObject' : ['label'],
			'getPropertySubject' : ['label']
		}

	def validate(self, conf):
		is_valid = True

		is_valid = is_valid and self.check_mandatory_fields(conf)
		is_lang_valid = self.check_lang(conf)

		if is_lang_valid:
			lang = conf.get("lang")
			with open(lang+"_interaction_model_components.json") as json_file:
				int_model_components = json.load(json_file)
			is_valid = is_valid and self.check_intents(conf, int_model_components)
			is_valid = is_valid and self.check_slots(conf, int_model_components)

		is_valid = is_valid and is_lang_valid
		is_valid = is_valid and self.check_specific_slots(conf)
		is_valid = is_valid and self.check_endpoint(conf)
		is_valid = is_valid and self.check_resultsLimit(conf)

		return is_valid


	def check_mandatory_fields(self, conf):
		for field in self.mandatory_fields:
			if field not in conf:
				print(field, "is missing")
				return False

		return True

	def check_mandatory_field(self, conf, field):
		if field not in conf:
			print(field, " is missing")
			return False
		else:
			return True

	def check_lang(self, conf):
		if self.check_mandatory_field(conf, "lang"):
			lang = conf.get("lang")
			if lang not in self.available_langs:
				print(lang, " is not a valid lang")
				print("Available options are: ")
				print(self.available_langs)
				return False
			return True
		return False

	def check_intents(self, conf, int_model_components):
		available_intents = int_model_components.get("intents").keys()
		if self.check_mandatory_field(conf, "intents"):
			intents = conf.get("intents")

			for intent in intents:
				if not intent in available_intents:
					print(intent, " is not a valid intent name")
					print("Available options are: ")
					print(available_intents)
					return False
			return True
		return False

	def check_endpoint(self, conf):
		if self.check_mandatory_field(conf, "endpoint"):
			queryString = 'SELECT * WHERE { ?s ?p ?o. } LIMIT 1'
			endpoint = conf.get("endpoint")
			sparql = SPARQLWrapper(endpoint)
			sparql.setQuery(queryString)
			try :
				ret = sparql.query() 
				return True
			except:
				print(endpoint, " does not accept queries")
				return False
		return False

	def check_resultsLimit(self, conf):
		if self.check_mandatory_field(conf, "result_limit"):
			result_limit = conf.get("result_limit")
			if result_limit>0:
				return True
			else:
				print(result_limit, " must be positive")
		return False

	def check_slots(self, conf, int_model_components):
		if self.check_mandatory_field(conf, "intents"):
			custom_intent_names = conf.get("intents")

			custom_intent_samples = int_model_components.get("intents")

			custom_intents = []
			for intent_name in custom_intent_names:
				custom_intents.append(custom_intent_samples.get(intent_name))

			#mandatory slots
			mandatory_slots = set()
			for intent_name in custom_intent_names:
				intent = custom_intent_samples.get(intent_name)
				if "slots" in intent:
					for slot in intent.get("slots"):
						mandatory_slots.add(slot.get("type"))

			custom_types_slots = ["entity", "property"]
			for custom_type in custom_types_slots:
				if custom_type in mandatory_slots:
					if not custom_type in conf:
						print(custom_type, " is required")
						return False

			return True

	
	def check_specific_slots(self, conf):
		if self.check_mandatory_field(conf, "intents"):
			intents = conf.get("intents")

			for constraint in self.intents_constraints:
				if constraint in intents:
					predicates_list = self.intents_constraints[constraint]

					if not self.check_mandatory_field(conf, 'property'):
						print('property key is missing in the conf file')
						return False
					else:
						for predicate in predicates_list:
							if not predicate in conf.get('property'):
								print(predicate, ' is required. Add it in the property object in the conf file')
								return False

			return True
		return False

	