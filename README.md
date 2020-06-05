# Virtual Assistant extensions Generator
It provides a Generator of Virtual Assistant extensions to reply Natural Language (NL) questions by querying SPARQL endpoints.
In its actual version (v. 1.0), our generator enables the generation of Alexa skills.
The implemented mechanism to move from NL to SPARQL queries is KG-independent. Thus, it can be applied to any SPARQL endpoint that enable GET requests and returns JSON results.
It simpliefies the skill generation both for technical and lay-users. 
The effort is strictly related to the provision of quariable entities and predicates, while the generation of the Alexa skill is as simple as the call of a command.

## Generator structure and extension points

Our generator can create a VA extension according to the configuration file provided by the user. It takes as input a conf.json file, checks its syntax correctness and semantic validity and, finally, creates the VA extension. Each phase is kept separate by satisfying the modularity requirement, and it is implemented as an abstract module. The architecture of our general-purpose and multi speaking languages VA extension generator is reported in the figure below.

![generator](/images/generator_schema.png)

The *Vocal Assistant Generator* module takes as input a configuration file to personalize the generated VA extension and conducts the entire generation workflow, i.e., it 1) checks the syntactical correctness of the configuration file by the *Syntax checker*; 2) validates the semantic correctness of the configuration by the *Validator*; 3) creates the interaction_model.json by the *Interaction Model Generator* containing configured intents, its utterances and the slot values personalized by the user; iv) generates the back-end code by the *Back-end generator* and it produces the zip file containing the intent implementation. 

While the syntax checker and the validator strictly depend on the configuration file, the interaction model and the back-end generator depend on the API provided by the VA to extend its features. We require a JSON configuration file. Therefore, the *JSON Syntax Checker* has to verify that the file is a valid JSON file, while the *Validator* checks if all the mandatory fields are provided, and the configuration is consistent, e.g., we verify that entities and properties are provided if there is at least one intent that uses them as a slot. 
Once validated the configuration file, the Alexa skills components (the JSON interaction model and the zip file implementing the skill back-end that can be upload on Amazon AWS) can be created. Thanks to the architecture modularity, it is easy to develop new VA providers support and extend the supported languages (English and Italian at the moment).

Due to the modularity of the implementation, the extensions point are:
1. the supported languages (by affecting the instance of Interaction Model Generator and by providing the interaction model components according to the desired language);
2. the Vocal Assistant (by providing a dedicated implementation of the Abstract Interaction Model and Abstract Back-end).


