from langchain_ollama import ChatOllama
print("Initializing...")
llm = ChatOllama(model="llama3.2")
print("Invoking...")
print(llm.invoke("Hello!"))
