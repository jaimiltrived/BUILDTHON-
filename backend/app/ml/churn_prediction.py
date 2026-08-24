import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from sklearn.ensemble import RandomForestClassifier
# pyrefly: ignore [missing-import]
from sklearn.model_selection import train_test_split
# pyrefly: ignore [missing-import]
from sklearn.metrics import accuracy_score, classification_report

class ChurnPredictionModel:
    """
    Layer B: ML Engine for Churn Prediction.
    Uses RandomForest to predict churn probability based on financial behavior.
    """
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        
    def train(self, historical_data: pd.DataFrame):
        """
        historical_data must contain features: 
        ['purchase_frequency', 'avg_order_value', 'recency_days', 'complaints_count', 'refunds_count', 'discount_dependency']
        and target: ['churned'] (1 or 0)
        """
        features = ['purchase_frequency', 'avg_order_value', 'recency_days', 'complaints_count', 'refunds_count', 'discount_dependency']
        
        # Ensure all required features are present
        if not all(col in historical_data.columns for col in features + ['churned']):
            raise ValueError("Missing required columns in dataset.")
            
        X = historical_data[features]
        y = historical_data['churned']
        
        # We can split to evaluate internally if needed, but we train on everything for the final model
        self.model.fit(X, y)
        self.is_trained = True
        return True
        
    def predict_churn_probability(self, customer_data: pd.DataFrame) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Model is not trained yet.")
            
        features = ['purchase_frequency', 'avg_order_value', 'recency_days', 'complaints_count', 'refunds_count', 'discount_dependency']
        X = customer_data[features]
        
        # Returns [prob_not_churn, prob_churn], we want prob_churn
        return self.model.predict_proba(X)[:, 1]
