import json 

class SyntaxChecker:
	def __init__(self):
		pass

	def is_valid(self, conf_file):
		pass

	def get_conf_from_file(self, conf_file):
		pass

class JsonSyntaxChecker:
	def __init__(self):
		pass

	def is_valid(self, conf_file):
		with open(conf_file) as json_file:
			try: 
				json_object = json.load(json_file) 
				return True
			except ValueError as e: 
			    return False

	def get_conf_from_file(self, conf_file):
		with open(conf_file) as json_file:
			try: 
				json_object = json.load(json_file)
				return json_object
			except ValueError as e: 
				print("Not valid json file")
				return None

	'''
	def is_json(string):
		try: 
			json_object = json.loads(string) 
			return True
		except ValueError as e: 
			print("Not valid json")
			return False

	def get_json(string):
		if not is_json(string):
			print("Not valid json")
			return None
		return json.loads(string) 
	'''


