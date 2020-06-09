import sys
import os

from va_generator.syntax_checker import JsonSyntaxChecker
from va_generator.validator import Validator
from va_generator.interaction_model_generator import AlexaInteractionModelGenerator
from va_generator.back_end_generator import AlexaBackEndGenerator

class PersonalAssistantGenerator():
	def __init__(self):
		pass

	def generate_personal_assistant(self, conf_file, conf_file_format="json"):
		pass

class AlexaSkillGenerator(PersonalAssistantGenerator):
	def __init__(self):
		pass

	def generate_personal_assistant(self, conf_file, conf_file_format="json"):
		if conf_file_format == "json":
			self.syntax_checker = JsonSyntaxChecker()
		else:
			raise ValueError("Only JSON is supported")

		if not self.syntax_checker.is_valid(conf_file):
			sys.exit("Syntactic error")

		conf = self.syntax_checker.get_conf_from_file(conf_file)
		sem_validator = Validator()

		if not sem_validator.validate(conf):
			sys.exit("Validation error")

		skill_name = conf.get("invocation_name") 
		valid_directory_name = skill_name.replace(' ', '_')
		dest_path = os.getcwd() +"/"+valid_directory_name

		try:
			os.mkdir(dest_path)
		except OSError:
			sys.exit("Creation of the directory %s failed" % dest_path)

		dest_path = dest_path + "/"
		interaction_model_generator = AlexaInteractionModelGenerator(conf)
		interaction_model_generator.generate_interaction_model(conf, dest_path)

		back_end_generator = AlexaBackEndGenerator()
		back_end_generator.generate_back_end(conf_file, dest_path)