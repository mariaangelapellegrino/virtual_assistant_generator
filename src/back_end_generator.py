from zipfile import ZipFile 
import os

class BackEndGenerator():
	def __init__(self):
		self.source_path = "back_end/"

	def generate_back_end(self, conf_file, dest_path):
		pass

class AlexaBackEndGenerator(BackEndGenerator):
	def __init__(self):
		self.source_path = "back_end/"

	def generate_back_end(self, conf_file, dest_path):
		zipObj = ZipFile(dest_path + 'back_end.zip', 'w')

		zipObj.write(conf_file)
		
		folderName = self.source_path+"node_modules"
		for root, dirs, files in os.walk(folderName):
			for filename in files:
				source_name = os.path.join(root, filename)
				dest_name = source_name[len(self.source_path):]

				zipObj.write(source_name, dest_name)

		zipObj.write(self.source_path+'custom_functions.js', 'custom_functions.js')
		zipObj.write(self.source_path+'index.js', 'index.js')

		zipObj.close()
