from va_generator.generator import AlexaSkillGenerator

if __name__ == "__main__":
	generator = AlexaSkillGenerator()

	generator.generate_personal_assistant("conf.json")