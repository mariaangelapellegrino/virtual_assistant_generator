import setuptools
from setuptools import setup, find_packages

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="virtual_assistant_generator", 
    version="0.1.0",
    author="Maria Angela Pellegrino",
    author_email="mapellegrino@unisa.it",
    description="It provides access to a generator of virtual assistants extensions.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/mariaangelapellegrino/virtual_assistant_generator/va_generator",
    packages=setuptools.find_packages(include = ["va_generator"], exclude=["use_cases", "use_cases.*", "example", "example.*", "SPARQL_endpoint_analysis", "SPARQL_endpoint_analysis.*", "img", "img.*"]),
    include_package_data=True,
    packages_data={"": ["va_generator/*"] }, #.json", "*.js", "*.d.ts", "*.js.map"]},
    exclude_package_data={"": ["README.txt, SPARQL_endpoint_analysis/*", "img/*", "use_cases/*", "example/*", "slot_entities/classes.json", "slot_entities/resources.json","slot_properties/properties.json"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
    install_requires=[           
          'SPARQLWrapper'
    ]
)