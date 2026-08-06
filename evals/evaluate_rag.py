import pandas as pd
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
import plotly.graph_objects as go
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Ollama integrations
from langchain_ollama import ChatOllama, OllamaEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.run_config import RunConfig

# Ensure the results directory exists
os.makedirs("evals/results", exist_ok=True)

def run_evaluation():
    print("Running evaluation...")
    # 1. Define your test dataset (golden dataset)
    # In a real scenario, you would run these questions through your LangGraph pipeline
    # and populate the 'answer' and 'contexts' columns dynamically.
    test_data = {
        "question": [
            "What is SurrealDB?", 
            "How does LangGraph work?",
            "What is the main use case of Dyslexxy?"
        ],
        "answer": [
            "SurrealDB is a multi-model database that supports graph and vector search.", 
            "LangGraph is a library for building stateful multi-actor applications with LLMs.",
            "It acts as a research assistant to process documents and generate insights."
        ],
        "contexts": [
            ["SurrealDB is a powerful multi-model database.", "It has built-in vector search capabilities."], 
            ["LangGraph allows you to model workflows as graphs.", "It is built on top of LangChain."],
            ["Dyslexxy is an AI-powered research assistant.", "It is inspired by Google NotebookLM."]
        ],
        "ground_truth": [
            "SurrealDB is a multi-model database with vector search.", 
            "LangGraph is a stateful graph library for LLMs.",
            "An AI research assistant for analyzing documents."
        ]
    }

    # 2. Convert to HuggingFace Dataset required by Ragas
    dataset = Dataset.from_dict(test_data)

    # 3. Configure Ollama for Evaluation
    # Note: Make sure Ollama is running locally and you have pulled these models:
    # `ollama pull llama3.2` and `ollama pull nomic-embed-text`
    print("Initializing local Ollama models...")
    eval_llm = ChatOllama(model="llama3.2")
    eval_embeddings = OllamaEmbeddings(model="nomic-embed-text")
    
    ragas_llm = LangchainLLMWrapper(eval_llm)
    ragas_embeddings = LangchainEmbeddingsWrapper(eval_embeddings)

    print("Scoring responses using Ollama (this may take a while)...")
    try:
        results = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy, context_precision],
            llm=ragas_llm,
            embeddings=ragas_embeddings,
            run_config=RunConfig(max_workers=1, timeout=1200) # Prevents overloading your 4GB GPU
        )
        
        # 4. Save results to CSV
        if not hasattr(results, "to_pandas"):
            raise TypeError(f"Expected EvaluationResult, got {type(results)}")
            
        df = results.to_pandas()
        csv_path = "evals/results/eval_results.csv"
        df.to_csv(csv_path, index=False)
        print(f"✅ Evaluation complete! Results saved to {csv_path}")
        
        return df
    except Exception as e:
        print(f"❌ Evaluation failed. Make sure your LLM API keys are set correctly (e.g., OPENAI_API_KEY). Error: {e}")
        return None

def plot_radar_chart(df):
    """Creates a radar chart summarizing average performance"""
    print("Generating radar chart...")
    
    # Calculate means
    metrics = ['faithfulness', 'answer_relevancy', 'context_precision']
    
    # Ensure columns exist in df
    available_metrics = [m for m in metrics if m in df.columns]
    if not available_metrics:
        print("Metrics not found in the DataFrame.")
        return
        
    scores = df[available_metrics].mean().tolist()
    
    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=scores + [scores[0]], # Close the loop
        theta=available_metrics + [available_metrics[0]],
        fill='toself',
        name='Current Pipeline'
    ))

    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 1])),
        showlegend=True,
        title="Average RAG Evaluation Metrics"
    )
    
    # Save the figure
    chart_path = "evals/results/radar_chart.html"
    fig.write_html(chart_path)
    print(f"📊 Radar chart saved to {chart_path}")

def plot_distributions(df):
    """Creates a boxplot showing the distribution of scores"""
    print("Generating distribution box plots...")
    metrics = ['faithfulness', 'answer_relevancy', 'context_precision']
    available_metrics = [m for m in metrics if m in df.columns]
    
    # Melt the dataframe for seaborn
    melted_df = df.melt(value_vars=available_metrics, var_name='Metric', value_name='Score')
    
    plt.figure(figsize=(10, 6))
    sns.boxplot(x='Metric', y='Score', data=melted_df, palette='Set2')
    plt.title('Distribution of RAG Metrics Across Evaluation Dataset')
    plt.ylim(0, 1.1)
    
    # Save the figure
    chart_path = "evals/results/score_distributions.png"
    plt.savefig(chart_path)
    plt.close()
    print(f"📊 Distribution plots saved to {chart_path}")

if __name__ == "__main__":
    print("Starting AI Evaluation Pipeline...")
    df = run_evaluation()
    
    if df is not None:
        plot_radar_chart(df)
        plot_distributions(df)
