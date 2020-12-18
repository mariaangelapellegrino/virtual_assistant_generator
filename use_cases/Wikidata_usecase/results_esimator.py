import json

def wikidata_comparison():
	gold_standard = "qald-7-train-en-wikidata.json"
	system_replies = "wikidata_skill_replies.json"
	compare_results(gold_standard, system_replies)
	
def compare_results(gold_standard, system_replies):
	# it reads gold standard file and stores the correct replies
	with open(gold_standard, 'r', encoding = "utf-8") as json_file:
		dataset = json.load(json_file)

	questions = dataset["questions"]
	correct_answers_dict = {}
	correct_answers_set = set()
	
	keys = ["uri", "date", "total", "num", "s", "val", "height", "count" , "literal", "c", "string"] 

	for question in questions:
		question_id = question["id"]
		correct_answers = question["answers"][0]

		if "results" in question["answers"][0]:
			correct_answers = correct_answers["results"]["bindings"]

			correct_answers_set = set()
			
			for correct_answer in correct_answers:
				found = False
				for key in keys:
					if key in correct_answer:
						found = True
						correct_answers_set.add(correct_answer[key]["value"])
					
				if not found:
					exit(correct_answer)
						
		else:
			correct_answers = correct_answers["boolean"]
			correct_answers_set = set([correct_answers])
		
		correct_answers_dict[question_id] = correct_answers_set

	# it reads the system replies and stores the actual replies
	with open(system_replies, 'r', encoding = "utf-8") as json_file:
		dataset = json.load(json_file)

	questions = dataset["questions"]
	anwsers_dict = {}
	answers_set = set()

	for question in questions:
		question_id = question["id"]

		if "results" in question["answers"][0]:
			answers = question["answers"][0]["results"]["bindings"]

			answers_set = set()
			keys = ["uri", "date", "total", "num", "s", "val", "height", "count"]
			for answer in answers:
				for key in keys:
					if key in answer:
						answers_set.add(answer[key]["value"])
		
		elif "boolean" in answers:
			answers = answers["boolean"]
			answers_set = set([answers])
	

		anwsers_dict[question_id] = answers_set

	# results computation
	macro_results = {}

	total_precision = 0
	total_recall = 0
	total_f_measure = 0

	mean_macro_results = {}

	micro_results = {}

	all_correct_answers = set()
	all_answers = set()

	for key in correct_answers_dict:
		correct_answers_set = correct_answers_dict[key]
		if key not in anwsers_dict:
			answers_set = set()
		else:
			answers_set = anwsers_dict[key]

		all_correct_answers = all_correct_answers.union(correct_answers_set)
		all_answers = all_answers.union(answers_set)

		insersect_set = correct_answers_set.intersection(answers_set)

		if len(answers_set) == 0 and len(correct_answers_set) == len(answers_set):
			precision = 1
			recall = 1
			f_measure = 0
		elif len(answers_set) == 0:
			precision = 0
			recall = len(insersect_set) / len(correct_answers_set)
		elif len(correct_answers_set) == 0:
			precision = len(insersect_set) / len(answers_set)
			recall = 0
		else:
			precision = len(insersect_set) / len(answers_set)
			recall = len(insersect_set) / len(correct_answers_set)

		if (precision+recall)==0:
			f_measure = 0
		else:
			f_measure = 2*(precision*recall)/(precision+recall)
		

		macro_results[key] = {
			'precision' : precision,
			'recall' : recall,
			'f_measure' : recall
		}

		total_precision += precision
		total_recall += recall
		total_f_measure += f_measure

	insersect_set = all_correct_answers.intersection(all_answers)

	precision = len(insersect_set) / len(all_answers)
	recall = len(insersect_set) / len(all_correct_answers)
	f_measure = 2*(precision*recall)/(precision+recall)

	micro_results = {
		'precision' : precision,
		'recall' : recall,
		'f_measure' : f_measure
	}

	num_questions = len(correct_answers_dict)

	mean_macro_results = {
		'precision' : total_precision/num_questions,
		'recall' : total_recall/num_questions,
		'f_measure' : total_f_measure/num_questions,
	}
	
	print("Number of questions: ")
	print(num_questions)
	
	print("micro results")
	print(micro_results)

	print("macro results")
	print(mean_macro_results)

if __name__ == "__main__":
	wikidata_comparison()



