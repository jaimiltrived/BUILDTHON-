import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
from sklearn.linear_model import LinearRegression

class RevenueForecaster:
    """
    Layer B: ML Engine for Revenue Forecasting.
    Uses simple linear regression for trend-based forecasting.
    Can be expanded to XGBoost or ARIMA.
    """
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        
    def train(self, historical_revenue_data: pd.DataFrame):
        """
        historical_revenue_data must contain:
        ['month_index', 'marketing_spend', 'active_customers'] as features
        ['revenue'] as target
        """
        features = ['month_index', 'marketing_spend', 'active_customers']
        
        if not all(col in historical_revenue_data.columns for col in features + ['revenue']):
            raise ValueError("Missing required columns in revenue dataset.")
            
        X = historical_revenue_data[features]
        y = historical_revenue_data['revenue']
        
        self.model.fit(X, y)
        self.is_trained = True
        return True
        
    def forecast_revenue(self, future_scenarios: pd.DataFrame) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Revenue forecaster is not trained yet.")
            
        features = ['month_index', 'marketing_spend', 'active_customers']
        X = future_scenarios[features]
        
        return self.model.predict(X)
