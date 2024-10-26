import pandas as pd
from haystack import Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
from haystack.components.builders import PromptBuilder
from haystack_integrations.components.generators.ollama import OllamaGenerator
from haystack import Pipeline
import json
import re
from flask import Flask, request, jsonify

app = Flask(__name__)

dataset = pd.read_csv(
    "/Users/archith25/Desktop/Data_PreProcessing/marine_ocr_output.csv"
)
docs1 = [
    {
        "content": f"{row['name']} - {row['significance']}. Coordinates: "
        f"Latitudes: [{row['lat_1']}, {row['lat_2']}, {row['lat_3']}, {row['lat_4']}], "
        f"Longitudes: [{row['lon_1']}, {row['lon_2']}, {row['lon_3']}, {row['lon_4']}]"
    }
    for index, row in dataset.iterrows()
]

docs = [Document(content=doc["content"]) for doc in docs1]

document_store = InMemoryDocumentStore()
document_store.write_documents(docs)
retriever_34 = InMemoryBM25Retriever(document_store)

template = """
Given the following context: 

{% for document in documents %}
    {{ document.content }}
{% endfor %}

You are a Maritime Situational Awareness system.
Parse through the input_text, and give Answer in the following format:

{
    Location: [<latitude, longitude>],
    Time: [<timestamp or time range>],
    Direction: [<north, east, west, south, etc.>],
    Object Type: [<ship, aircraft, submarine, etc.>],
    Object Description: [<size, color, movement, speed, direction, etc.>],
    Source: [<radar, satellite, human observation>],
    Confidence Level: [<high, medium, low>]
    Reference: "<Cross-reference the input_text with context>"
}

Input_Text: {{ input_text }}
Answer:
"""

template1 = """
Given the following context: 

{% for document in documents %}
    {{ document.content }}
{% endfor %}

Extract the following information from the input_text in the structured format:
(Give short answer)

{
    Location: [latitude, longitude],
    Time: [timestamp or time range],
    Direction: [north, east, west, south, etc.],
    Object Type: [ship, aircraft, submarine, etc.],
    Object Description: [size, color, movement, speed, direction, etc.],
    Source: [radar, satellite, human observation],
    Confidence Level: [high, medium, low]
    Refernce: 
}

If possible cross-reference the reports with information from context, if no cross-refernce return "no-cross reference".

You are a Maritime Situational Awareness model, give answers accordingly

Input_Text: {{ input_text }}
Answer:
"""

prompt_builder_34 = PromptBuilder(template=template)

generator_34 = OllamaGenerator(
    model="gemma2:2b",
    url="http://localhost:11434",
    generation_kwargs={"num_predict": -2, "temperature": 0.7},
    timeout=300,
)

basic_rag_pipeline = Pipeline()
basic_rag_pipeline.add_component("retriever", retriever_34)
basic_rag_pipeline.add_component("prompt_builder", prompt_builder_34)
basic_rag_pipeline.add_component("llm", generator_34)
basic_rag_pipeline.connect("retriever", "prompt_builder.documents")
basic_rag_pipeline.connect("prompt_builder", "llm")


def extract_json(output):
    json_str = re.search(r"\{.*\}", output, re.DOTALL)
    if json_str:
        json_text = json_str.group()
        return json.loads(json_text)
    else:
        return None


@app.route("/rag", methods=["POST"])
def submit_data():
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "Invalid input"}), 400  

    query = data["query"]

    response1 = basic_rag_pipeline.run(
        {"retriever": {"query": query}, "prompt_builder": {"input_text": query}}
    )

    json_data1 = extract_json(response1["llm"]["replies"][0])

    if json_data1 is None:
        return jsonify({"error": "Failed to extract JSON from response"}), 500

    return jsonify(json_data1), 200


if __name__ == "__main__":
    app.run(debug=True)
