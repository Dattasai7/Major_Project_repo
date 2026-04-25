import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def generate_latency_chart(csv_file):
    # Load the results from your recent run
    df = pd.read_csv(csv_file)
    
    # Calculate Averages
    avg_rag = df['RAG_Latency'].mean()
    avg_std = df['STD_Latency'].mean()
    
    # Setup the plot style
    plt.figure(figsize=(10, 6))
    sns.set_theme(style="whitegrid")
    
    # Create the Bar Plot
    categories = ['Standard LLM (Baseline)', 'Proposed Medical RAG System']
    values = [avg_std, avg_rag]
    colors = ['#94a3b8', '#4f46e5'] # Grey vs Indigo (matches your UI theme)
    
    bars = plt.bar(categories, values, color=colors, width=0.6)
    
    # Add labels and title
    plt.ylabel('Latency (Seconds)', fontsize=12, fontweight='bold')
    plt.title('End-to-End System Latency Comparison', fontsize=14, fontweight='bold')
    
    # Add data labels on top of bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.5, f'{yval:.2f}s', 
                 ha='center', va='bottom', fontsize=12, fontweight='bold')

    plt.tight_layout()
    plt.savefig("latency_comparison.png", dpi=300)
    print("📈 Latency chart saved as 'latency_comparison.png'")

if __name__ == "__main__":
    generate_latency_chart("comprehensive_results.csv")