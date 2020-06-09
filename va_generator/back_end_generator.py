from zipfile import ZipFile 
import os

class BackEndGenerator():
	def __init__(self):
		script_dir = os.path.dirname(__file__)
		rel_path = "back_end/"
		
		self.source_path = os.path.join(script_dir, rel_path)

	def generate_back_end(self, conf_file, dest_path):
		pass

class AlexaBackEndGenerator(BackEndGenerator):
	def __init__(self):

		script_dir = os.path.dirname(__file__)
		rel_path = "back_end/"
		
		self.source_path = os.path.join(script_dir, rel_path)

	def generate_back_end(self, conf_file, dest_path):
		zipObj = ZipFile(dest_path + 'back_end.zip', 'w')

		zipObj.write(conf_file, 'conf.json')
		
		folderName = self.source_path+"node_modules"
		for root, dirs, files in os.walk(folderName):
			for filename in files:
				source_name = os.path.join(root, filename)
				dest_name = source_name[len(self.source_path):]

				zipObj.write(source_name, dest_name)

		custom_function_file = os.path.join(self.source_path, 'custom_functions.js')
		index_file = os.path.join(self.source_path, 'index.js')

		zipObj.write(custom_function_file, 'custom_functions.js')
		zipObj.write(index_file, 'index.js')

		zipObj.close()
