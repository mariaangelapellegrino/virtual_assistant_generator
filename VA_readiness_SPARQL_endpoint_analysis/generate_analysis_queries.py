# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from argparse import ArgumentParser
from argparse import RawDescriptionHelpFormatter
from SPARQLWrapper import JSON, SPARQLWrapper

program_description = '''
generate_analysis_queries.py -- a CLI for the generation of analysis queries

generate_analysis_queries.py provides a CLI for generating the analysis queries 
which retrieve all the classes, relations, and resources from a SPARQL 
endpoint and the related label (if any). In a nutshell, this program collects 
all the classes and relations we desire to evaluate and stores them as JSON files.
While the entities (and resources) files are stored in a folder named
`slot_entities`, relations are stored in a folder named `slot_predicates`.

@author:     Lewis McGibbney
@license:    Apache License v2
@contact:    https://github.com/mariaangelapellegrino/virtual_assistant_generator/issues
'''

queries = ["./analysis_queries/classes/class_union_query.sparql",
           "./analysis_queries/properties/property_union_query.sparql",
           "./analysis_queries/resources/triple_subjects.sparql"]


def setup(name: str):
    import errno
    import os
    try:
        example_str = './example/{}'
        os.makedirs(example_str.format(name))
        os.makedirs(example_str.format(name + '/slot_entities'))
        os.makedirs(example_str.format(name + '/slot_properties'))
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise


def execute_sparql(name: str, sparql_endpoint: str):
    count = 0
    target_results = ['classes.json', 'resources.json', 'properties.json']
    for file in queries:
        with open(file, 'r') as f:
            lines = f.readlines()
            sparql = SPARQLWrapper(sparql_endpoint)
            sparql.setReturnFormat(JSON)
            sparql_str = ' '.join([str(elem) for elem in lines])
            sparql.setQuery(sparql_str)
            try:
                results = sparql.query().convert()
            except Exception as e:
                print(e)
        with open('./example/{}'.format(name + '/' + target_results[count]), 'w') as target_file:
            target_file.write(json.dumps(results, indent=4))
            target_file.close()
            count = count + 1


def main():
    parser = ArgumentParser(description=program_description,
                            formatter_class=RawDescriptionHelpFormatter)
    parser.add_argument("-n", "--name", dest="name",
                        help="The name of the analysis job you are running i.e. cor.esipfed.org")
    parser.add_argument("-se", "--sparql_endpoint", dest="sparql",
                        help="A SPARQL endpoint to run against i.e. http://cor.esipfed.org/sparql")

    # Process arguments
    args = parser.parse_args()
    experiment_name = args.name
    sparql_endpoint = args.sparql
    setup(experiment_name)
    execute_sparql(experiment_name, sparql_endpoint)


if __name__ == '__main__':
    main()