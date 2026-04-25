import asyncio
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
from RAG_model import ai_diagnose 

# 1. Expanded Test Suite
test_suite = [
    {"input": "severe memory loss, getting lost in familiar places", "expected": "alzheimers"},
    {"input": "difficulty performing familiar tasks and personality changes", "expected": "alzheimers"},
    {"input": "struggling with abstract thinking and misplacing things constantly", "expected": "alzheimers"},
    {"input": "excessive thirst, frequent urination, blurry vision", "expected": "diabetes"},
    {"input": "unexplained weight loss and extreme hunger despite eating", "expected": "diabetes"},
    {"input": "slow-healing sores and frequent infections", "expected": "diabetes"},
    {"input": "sudden chest pain, shortness of breath, left arm pain", "expected": "heart attack"},
    {"input": "pressure or squeezing sensation in the center of the chest", "expected": "heart attack"},
    {"input": "cold sweat, nausea, and lightheadedness with chest discomfort", "expected": "heart attack"},
    {"input": "persistent wheezing and tight chest during exercise", "expected": "asthma"},
    {"input": "coughing fits at night and trouble catching breath", "expected": "asthma"},
    {"input": "shortness of breath triggered by pollen or cold air", "expected": "asthma"},
    {"input": "throbbing headache with light sensitivity and nausea", "expected": "migraine"},
    {"input": "seeing flashes of light or zig-zag lines before a bad headache", "expected": "migraine"},
    {"input": "intense pulsing pain on one side of the head", "expected": "migraine"}
]

def normalize_label(label):
    """Standardizes labels to prevent false mismatches."""
    synonyms = {
        "myocardial infarction": "heart attack", 
        "alzheimer's disease": "alzheimers",
        "alzheimer's": "alzheimers"
    }
    lowered = str(label).lower().strip()
    return synonyms.get(lowered, lowered)

async def generate_accuracy_matrix():
    results = []
    print("🚀 Running RAG Evaluation...")

    for case in test_suite:
        try:
            # Run the RAG pipeline
            rag_res = await ai_diagnose(case["input"], [], source_type="both")
            
            pred = normalize_label(rag_res.get("identified_condition", "unknown"))
            actual = normalize_label(case["expected"])

            results.append({
                "Expected": actual,
                "Predicted": pred
            })
            print(f"✅ Input processed. Expected: {actual} | Predicted: {pred}")

        except Exception as e:
            print(f"❌ Error processing case {case['expected']}: {e}")

    # --- GENERATE METRICS ---
    df = pd.DataFrame(results)
    labels = sorted(df["Expected"].unique())
    unique_labels = sorted(list(set(df["Expected"].unique()) | set(df["Predicted"].unique())))

    # 1. Print Text Report
    print("\n" + "="*30)
    print("      CLASSIFICATION REPORT")
    print("="*30)
    print(classification_report(df["Expected"], df["Predicted"], target_names=unique_labels))


    # 2. Generate Confusion Matrix Heatmap
    cm = confusion_matrix(df["Expected"], df["Predicted"], labels=unique_labels)
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=unique_labels, 
                yticklabels=unique_labels)
    
    plt.title("RAG Model: Disease Prediction Accuracy Matrix")
    plt.xlabel("Predicted Condition")
    plt.ylabel("Actual Condition")
    plt.tight_layout()
    
    plt.savefig("accuracy_matrix.png")
    print("\n📊 Accuracy Matrix saved as 'accuracy_matrix.png'")
    plt.show()

if __name__ == "__main__":
    asyncio.run(generate_accuracy_matrix())