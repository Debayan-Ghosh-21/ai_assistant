from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness

test_data = {
    "question": ["What is SurrealDB?"],
    "answer": ["SurrealDB is a multi-model database that supports graph and vector search."],
    "contexts": [["SurrealDB is a powerful multi-model database.", "It has built-in vector search capabilities."]],
    "ground_truth": ["SurrealDB is a multi-model database with vector search."]
}
dataset = Dataset.from_dict(test_data)
# We won't run evaluate without API key but let's check its return type hint
import typing
print(typing.get_type_hints(evaluate))
