import json

notebook = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# RAG Evaluation with Ragas and local Ollama\n",
    "This notebook sets up Ollama in the Colab background so you can run the exact same local evaluation using Colab's free T4 GPU!"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "!pip install -qU ragas plotly matplotlib seaborn pandas langchain-ollama datasets"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# 1. Install Ollama and start the server in the background\n",
    "!curl -fsSL https://ollama.com/install.sh | sh\n",
    "import subprocess\n",
    "import time\n",
    "# Start server\n",
    "subprocess.Popen([\"ollama\", \"serve\"])\n",
    "time.sleep(3) # wait for server to start\n",
    "\n",
    "# 2. Pull the models\n",
    "!ollama pull llama3.2\n",
    "!ollama pull nomic-embed-text"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\n",
    "from datasets import Dataset\n",
    "from ragas import evaluate\n",
    "from ragas.metrics import faithfulness, answer_relevancy, context_precision\n",
    "from langchain_ollama import ChatOllama, OllamaEmbeddings\n",
    "from ragas.llms import LangchainLLMWrapper\n",
    "from ragas.embeddings import LangchainEmbeddingsWrapper\n",
    "from ragas.run_config import RunConfig\n",
    "import plotly.graph_objects as go\n",
    "import matplotlib.pyplot as plt\n",
    "import seaborn as sns\n",
    "\n",
    "# Mock Dataset\n",
    "test_data = {\n",
    "    \"question\": [\n",
    "        \"What is SurrealDB?\", \n",
    "        \"How does LangGraph work?\",\n",
    "        \"What is the main use case of Open Notebook?\"\n",
    "    ],\n",
    "    \"answer\": [\n",
    "        \"SurrealDB is a multi-model database that supports graph and vector search.\", \n",
    "        \"LangGraph is a library for building stateful multi-actor applications with LLMs.\",\n",
    "        \"It acts as a research assistant to process documents and generate insights.\"\n",
    "    ],\n",
    "    \"contexts\": [\n",
    "        [\"SurrealDB is a powerful multi-model database.\", \"It has built-in vector search capabilities.\"], \n",
    "        [\"LangGraph allows you to model workflows as graphs.\", \"It is built on top of LangChain.\"],\n",
    "        [\"Open Notebook is an AI-powered research assistant.\", \"It is inspired by Google NotebookLM.\"]\n",
    "    ],\n",
    "    \"ground_truth\": [\n",
    "        \"SurrealDB is a multi-model database with vector search.\", \n",
    "        \"LangGraph is a stateful graph library for LLMs.\",\n",
    "        \"An AI research assistant for analyzing documents.\"\n",
    "    ]\n",
    "}\n",
    "dataset = Dataset.from_dict(test_data)\n",
    "\n",
    "print(\"Initializing Colab Ollama models...\")\n",
    "eval_llm = ChatOllama(model=\"llama3.2\")\n",
    "eval_embeddings = OllamaEmbeddings(model=\"nomic-embed-text\")\n",
    "\n",
    "ragas_llm = LangchainLLMWrapper(eval_llm)\n",
    "ragas_embeddings = LangchainEmbeddingsWrapper(eval_embeddings)\n",
    "\n",
    "print(\"Evaluating...\")\n",
    "results = evaluate(\n",
    "    dataset,\n",
    "    metrics=[faithfulness, answer_relevancy, context_precision],\n",
    "    llm=ragas_llm,\n",
    "    embeddings=ragas_embeddings,\n",
    "    # Colab T4 GPUs have 16GB VRAM, so you can bump max_workers!\n",
    "    run_config=RunConfig(max_workers=4, timeout=1200) \n",
    ")\n",
    "\n",
    "df = results.to_pandas()\n",
    "df.head()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Plot the distributions\n",
    "metrics = ['faithfulness', 'answer_relevancy', 'context_precision']\n",
    "available_metrics = [m for m in metrics if m in df.columns]\n",
    "melted_df = df.melt(value_vars=available_metrics, var_name='Metric', value_name='Score')\n",
    "\n",
    "plt.figure(figsize=(10, 6))\n",
    "sns.boxplot(x='Metric', y='Score', data=melted_df, palette='Set2')\n",
    "plt.title('Distribution of RAG Metrics Across Evaluation Dataset')\n",
    "plt.ylim(0, 1.1)\n",
    "plt.show()"
   ]
  }
 ],
 "metadata": {
  "language_info": {
   "name": "python"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}

with open("evals/Colab_Ragas_Evaluation.ipynb", "w") as f:
    json.dump(notebook, f, indent=1)
print("Notebook created successfully!")
