from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from datetime import datetime

app = FastAPI(
    title="Hedge Fund API",
    description="API for hedge fund data analysis and trading strategies",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load datasets
equity_data = pd.read_csv("data/raw/equity_dataset.csv")
macro_data = pd.read_csv("data/raw/macro_dataset.csv")
multi_asset_data = pd.read_csv("data/raw/multi_asset_dataset.csv")

@app.get("/")
async def root():
    return {"message": "Hedge Fund API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/datasets")
async def get_datasets():
    """Get available datasets"""
    return {
        "datasets": [
            {
                "name": "equity",
                "description": "Equity price and volume data",
                "columns": equity_data.columns.tolist(),
                "rows": len(equity_data)
            },
            {
                "name": "macro",
                "description": "Macroeconomic indicators",
                "columns": macro_data.columns.tolist(),
                "rows": len(macro_data)
            },
            {
                "name": "multi_asset",
                "description": "Multi-asset price data (Oil, Gold, Bonds)",
                "columns": multi_asset_data.columns.tolist(),
                "rows": len(multi_asset_data)
            }
        ]
    }

@app.get("/api/equity")
async def get_equity_data(limit: int = 100, offset: int = 0):
    """Get equity price data"""
    try:
        data = equity_data.iloc[offset:offset+limit].copy()
        # Replace NaN values with None for JSON serialization
        data = data.replace({np.nan: None})
        return {
            "data": data.to_dict(orient="records"),
            "total_rows": len(equity_data),
            "returned_rows": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/macro")
async def get_macro_data(limit: int = 100, offset: int = 0):
    """Get macroeconomic data"""
    try:
        data = macro_data.iloc[offset:offset+limit].copy()
        # Replace NaN values with None for JSON serialization
        data = data.replace({np.nan: None})
        return {
            "data": data.to_dict(orient="records"),
            "total_rows": len(macro_data),
            "returned_rows": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/multi_asset")
async def get_multi_asset_data(limit: int = 100, offset: int = 0):
    """Get multi-asset data"""
    try:
        data = multi_asset_data.iloc[offset:offset+limit].copy()
        # Replace NaN values with None for JSON serialization
        data = data.replace({np.nan: None})
        return {
            "data": data.to_dict(orient="records"),
            "total_rows": len(multi_asset_data),
            "returned_rows": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/equity/stats")
async def get_equity_stats():
    """Get basic statistics for equity data"""
    try:
        stats = {
            "price_stats": equity_data["Price"].describe().to_dict(),
            "volume_stats": equity_data["Volume"].describe().to_dict(),
            "returns_stats": equity_data["Returns"].dropna().describe().to_dict()
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/macro/stats")
async def get_macro_stats():
    """Get basic statistics for macro data"""
    try:
        stats = {}
        for col in ["Inflation", "Interest_Rate", "USD_Index", "Sentiment"]:
            stats[f"{col.lower()}_stats"] = macro_data[col].describe().to_dict()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/multi_asset/stats")
async def get_multi_asset_stats():
    """Get basic statistics for multi-asset data"""
    try:
        stats = {}
        for col in ["Oil", "Gold", "Bonds"]:
            stats[f"{col.lower()}_stats"] = multi_asset_data[col].describe().to_dict()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
