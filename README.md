# Virtual Assistant extensions Generator
It provides a Generator of Virtual Assistant extensions to reply Natural Language (NL) questions by querying SPARQL endpoints.
In its actual version (v. 1.0), our generator enables the generation of Alexa skills.
The implemented mechanism to move from NL to SPARQL queries is KG-independent. Thus, it can be applied to any SPARQL endpoint that enables GET requests and returns JSON results.
It simplifies the skill generation both for technical and lay-users. 
The effort is strictly related to the provision of queriable entities and predicates, while the generation of the Alexa skill is as simple as the call of a command.

We provide the generator as a command-line tool and as [API](https://pypi.org/project/virtual-assistant-generator/).


The generator is maintained by the [ISISLab](https://www.isislab.it/) of the University of Salerno.

## Generator structure and extension points

Our generator can create a VA extension according to the configuration file provided by the user. It takes as input a conf.json file, checks its syntax correctness and semantic validity and, finally, creates the VA extension. Each phase is kept separate by satisfying the modularity requirement, and it is implemented as an abstract module. The architecture of our general-purpose and multi speaking languages VA extension generator is reported in the figure below.

![generator](https://drive.google.com/file/d/1ZBMyxsji6cbwwwQQRx8S2LAXHjoIfoJd/view?usp=sharing)

The *Vocal Assistant Generator* module takes as input a configuration file to personalize the generated VA extension and conducts the entire generation workflow, i.e., it 1) checks the syntactical correctness of the configuration file by the *Syntax checker*; 2) validates the semantic correctness of the configuration by the *Validator*; 3) creates the interaction_model.json by the *Interaction Model Generator* containing configured intents, its utterances and the slot values personalized by the user; iv) generates the back-end code by the *Back-end generator* and it produces the zip file containing the intent implementation. 

While the syntax checker and the validator strictly depend on the configuration file, the interaction model and the back-end generator depend on the API provided by the VA to extend its features. We require a JSON configuration file. Therefore, the *JSON Syntax Checker* has to verify that the file is a valid JSON file, while the *Validator* checks if all the mandatory fields are provided, and the configuration is consistent, e.g., we verify that entities and properties are provided if there is at least one intent that uses them as a slot. 
Once validated the configuration file, the Alexa skills components (the JSON interaction model and the zip file implementing the skill back-end that can be upload on Amazon AWS) can be created. Thanks to the architecture modularity, it is easy to develop new VA providers support and extend the supported languages (English and Italian at the moment).

Due to the modularity of the implementation, the extensions point are:
1. the supported languages (by affecting the instance of Interaction Model Generator and by providing the interaction model components according to the desired language);
2. the Vocal Assistant (by providing a dedicated implementation of the Abstract Interaction Model and Abstract Back-end).

## Repository structure

- **va_generator** contains
    - **generator.py** containing both the Abstract PersonalAssistantGenerator and the Alexa implementation,
    - **syntax_checker.py** containing both the AbstractSyntaxChecker and the JSONSyntaxChecker,
    - **validator.py** containing both the AbstracValidator and the actual Validator,
    - **interaction_model_generator.py** containing both the InteractionModel abstract class and the AlexaInteractionModel,
    - **en_interaction_model_components.json** and **it_interaction_model_components.py** containing the interaction model components for the English and the Italian languages,
    - **back_end_generator.py** containing both the Abstract BackEndGenerator and the Alexa instance. It exploits the content of the back_end folder,
    - **back_end** folder, containing 
        - **index.js** contains the back_end code in JavaScript;
        - **custom_functions.js** contains the functions that the user may need to modify to personalize the entities and properties look-up (for instance, by exploiting API instead on pre-defined dictionaries),
        - **package-lock.json** and **package.json** to manage Node.js packages,
        - **node_modules** folder, containing all the required Node.js packages,
    - **conf.json** an exemplerary configuration file,    
    - **main.py** that starts the VA extension generation according to the configuration file.

- **use cases** contains 
    - the configuration file and the Alexa skill components (interaction model and back end) for DBpedia and Wikidata and general-purpose Knowledge Graphs (KGs), the UNESCO Thesaurus, the WarSampo and WordNet as special-purpose KGs.
      Each skill is provided in an individual folder.
    - the evaluation of the Wikidata and DBpedia Alexa skills against QLAD-7 and QALD-9 (respectively). We report the used datasets, the skill replies, the code used to compare gold standard and actual results, and the achieved results.
    
- **SPARQL_endpoint_analysis** contains 
    - **analysis_queries.md** the used SPARQL queries to retrieve classes, properties and resources from KGs,
    - **conf_generator.md** the code to estimate the SPARQL endpoint readiness in being queried by Vocal Assistants. In calculating the VA_readiness_score, we took into account the coverage of labels, the readability of labels and the uniqueness of URLs attached to the same label,
    - **conf_generator_and_va_readiness_score.ipynb** provides a Jupyter Notebbok to test conf_generator.py on the UNESCO Thesaurus KG,
    - **analysis_results.md** contains the VA_readiness of 30 available SPARQL endpoints.
    
## Generator details

### Supported intents

The implemented intents, an example of provided utterance and the queried triples can be summarized as follows:

| Intent name                                          | Utterance                         | Triple                                                                  |
|------------------------------------------------------|-----------------------------------|-------------------------------------------------------------------------|
| getPropertyObject                                    | What is the {p} of {e}?           | &lt;e&gt; &lt;p&gt; ?                                                               |
| getDescription                                       | What/Who is {e}?                  | &lt;e&gt; &lt;definition&gt; ?                                                      |
| getLocation                                          | Where is {e}?                     | &lt;e&gt; &lt;location&gt; ?                                                        |
| getImg                                               | Show me &lt;e&gt;                 | &lt;e&gt; &lt;img&gt; ?                                                             |
| getPropertyObjectByClass                             | Which {c} is the {p} of {e}?      | &lt;e&gt; &lt;p&gt; ?. ? &lt;instanceof&gt; &lt;c&gt;                                           |
| getPropertySubject                                   | What has {e} as {p}?              | ? &lt;p&gt; &lt;e&gt;                                                               |
| getClassInstances                                    | What are the instances of {e}?    | ? &lt;instanceof&gt; &lt;e&gt;                                                      |
| getPropertySubjectByClass                            | Which {c} has {e} as {p}?         | ? &lt;instanceof&gt; &lt;c&gt;.&lt;br&gt;? &lt;p&gt; &lt;e&gt;.                                       |
| getNumericFilter                                     | What has {p} {symbol} {val}?      | ? &lt;p&gt; ?o. &lt;br&gt; FILTER(?o &lt;symbol&gt; &lt;val&gt;)                        |
| getNumeriFilterByClass                               | Which {c} has {p} {symbol} {val}? | ? &lt;instanceof&gt; &lt;c&gt;.? &lt;p&gt; ?o. &lt;br&gt; FILTER(?o &lt;symbol&gt; &lt;val&gt;) |
| getSuperlative                                       | What is the {c} with {sup} {p}?   | ? &lt;p&gt; ?o.&lt;br&gt; ORDER BY (?o).&lt;br&gt; LIMIT 1                |
| getTripleVerification                                | {s} has {o} as {p}                | ASK &lt;s&gt; &lt;p&gt; &lt;o&gt;                                                         |
| getAllResultsPreviousQuery                           | Give me all the results           | -                                                                       |

### Configuration file format

In its actual implementation, we require a JSON file with the following format:

{
	"invocation_name" : INVOCATION NAME,
	"endpoint" : SPARQL endpoint,
	"intents" : LIST OF THE DESIRED INTENTS,
	"lang" : EN|IT,
	"entities" : {...},
	"properties" : {...}
}

Entities and properties are modelled as dictionaries with the following format:

LABEL : {
    "urls" : LIST OF URLs [,
    "synonyms" : LIST OF SYNONYMS]
}

### Running details

To generate the Alexa skill, you have:
- provide the configuration file (e.g., conf.json),
- create an instance of the generator (i.e., AlexaSkillGenerator()),
- call the generate_personal_assistant function on the generator by providing the configuration file (e.g., generator.generate_personal_assistant("conf.json")).

### Results storage

The Alexa skill will be stored on the local path. The generator will create:
- a folder named as the &lt;INVOCATION_NAME&gt; provided in the configuration file, containing    
    - generated_interaction_model.json that is the interaction model as expected by the [Alexa Developer Console](https://developer.amazon.com/alexa/console)
    - a back_end.zip file containing the back end (implemented in JavaScript) that can be directly uploaded on [Amazon AWS](https://aws.amazon.com/).

## Dependencies
The generator is implemented in Python 3.0

## License
The code is Open-Source the MIT License applies to the provided source code.

## Permanent URI
A permanent version of this repository is provided on [Zenodo](https://zenodo.org/record/3839435).
