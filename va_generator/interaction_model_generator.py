import json
import os

class InteractionModelGenerator():
	def __init__(self, conf):
		pass

	def get_invocation_name(self):
		pass

	def get_lang(self):
		pass

	def get_custom_intents(self):
		pass

	def get_mandatory_slots(self):
		pass

	def generate_slots(self, custom_dict):
		pass

	def get_slot_types(self, conf):
		pass

	def generate_interaction_model(self, conf, path):
		pass

class AlexaInteractionModelGenerator(InteractionModelGenerator):
	def __init__(self, conf):
		self.default_intents = [
			{
			    "name": "AMAZON.CancelIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.HelpIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.StopIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.NavigateHomeIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.MoreIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.NavigateSettingsIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.NextIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.PageUpIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.PageDownIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.PreviousIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.ScrollRightIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.ScrollDownIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.ScrollLeftIntent",
			    "samples": []
			},
			{
			    "name": "AMAZON.ScrollUpIntent",
			    "samples": []
			}
		]

		self.conf = conf

		self.invocation_name = self.conf.get("invocation_name")
		self.lang = self.conf.get("lang")

		script_dir = os.path.dirname(__file__)
		rel_path = self.lang+"_interaction_model_components.json"
		interaction_model_components_file = os.path.join(script_dir, rel_path)


		with open(interaction_model_components_file) as json_file:
			self.int_model_components = json.load(json_file)

		self.custom_intent_names = self.conf.get("intents")
		custom_intent_samples = self.int_model_components.get("intents")

		self.custom_intents = []
		for intent_name in self.custom_intent_names:
			self.custom_intents.append(custom_intent_samples.get(intent_name))

	def get_invocation_name(self):
		return self.invocationName

	def get_lang(self):
		return self.lang

	def get_custom_intents(self):
		return self.custom_intents

	def get_mandatory_slots(self):
		mandatory_slots = set()
		custom_intent_samples = self.int_model_components.get("intents")
		for intent_name in self.custom_intent_names:
			intent = custom_intent_samples.get(intent_name)
			if "slots" in intent:
				for slot in intent.get("slots"):
					mandatory_slots.add(slot.get("type"))

		return mandatory_slots


	def generate_slots(self, custom_dict):
		values = []
		for label, obj in custom_dict.items():
			value = {
				"name" : {
					"value" : label		
				}
			}

			if "synonyms" in obj:
				value["name"]["synonyms"] = obj.get("synonyms")

			values.append(value)

		return values


	def get_slot_types(self, conf):
		types = []

		mandatory_slots = self.get_mandatory_slots()

		custom_types_slots = ["entity", "property"]
		for custom_type in custom_types_slots:
			if custom_type in mandatory_slots:
				values_dict = {}
				if custom_type in conf:
					values_dict = conf.get(custom_type)

				slot_values = self.generate_slots(values_dict)
				slot = {
					"name" : custom_type,
					"values" : slot_values
				}
				types.append(slot)

		default_types_slots = self.int_model_components.get("slots")

		default_types = ["superlative", "symbol"]
		for default_type in default_types:
			if default_type in mandatory_slots:
				slot = default_types_slots.get(default_type)
				types.append(slot)

		return types


	def generate_interaction_model(self, conf, path):
		mandatory_slots = self.get_mandatory_slots()
		intents = self.default_intents + self.custom_intents

		#slot type
		types = self.get_slot_types(conf)

		#interaction model
		interaction_model = {
			"interactionModel" : {
				"languageModel" : {
					"invocationName" : self.invocation_name,
					"intents" : intents,
					"types" : types
				} 
			}
		}

		with open(path+"generated_interaction_model.json", "w") as write_file:
			json.dump(interaction_model, write_file, indent=4)
