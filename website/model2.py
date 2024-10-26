from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import yfinance as yf
import datetime
from statsmodels.tsa.arima.model import ARIMA
import requests
from fastapi.middleware.cors import CORSMiddleware
import re

origins = [
    "*"  # Allow all origins (use with caution)
]

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,  # Allow cookies and authentication headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Constants
LM_STUDIO_API_URL = "http://127.0.0.1:1233/v1/chat/completions"  # Local URL for LM Studio API

# Request model for chatbot input
class ChatRequest(BaseModel):
    prompt: str
    start_date: str
    end_date: str
    

# Function to fetch steel prices
def fetch_steel_prices(start_date, end_date, conversion_rate):
    ticker = 'SLX' 

    data = yf.download(ticker, start=start_date, end=end_date)

    if data.empty:
        print("No data available for the specified date range.")
        return None

    data['Close (INR)'] = data['Close'] * conversion_rate

    output_data = data[['Close', 'Close (INR)', 'Volume']].copy()
    output_data.reset_index(inplace=True)
    output_data.rename(columns={'Date': 'Date'}, inplace=True)

    output_data.set_index('Date', inplace=True)
    output_data = output_data.asfreq('B')  

    print(f"Steel prices from {start_date.strftime('%d/%m/%Y')} to {end_date.strftime('%d/%m/%Y')}:")
    for index, row in output_data.iterrows():
        date = index
        print(f"{date.strftime('%d/%m/%Y')}: Close = ${row['Close']:.2f}, Close (INR) = ₹{row['Close (INR)']:.2f}, Volume = {row['Volume']}")

    return output_data

def predict_price_with_arima(data, num_periods, frequency, conversion_rate, prediction_start_date):
    model_data = data['Close']

    model = ARIMA(model_data, order=(5, 1, 0))
    model_fit = model.fit()

    forecast = model_fit.forecast(steps=num_periods)
    predictions = []

    last_price = model_data.iloc[-1]
    print(f"\nPredicted steel price changes from {prediction_start_date.strftime('%d/%m/%Y')}:")

    for i, price in enumerate(forecast):
        if frequency == 'daily':
            date = prediction_start_date + pd.DateOffset(days=i)
        elif frequency == 'monthly':
            date = prediction_start_date + pd.DateOffset(months=i)
        elif frequency == 'yearly':
            date = prediction_start_date + pd.DateOffset(years=i)

        price_inr = price * conversion_rate

        percentage_change = ((price - last_price) / last_price) * 100
        movement = "UP" if price > last_price else "DOWN"

        message = (f"{date.strftime('%d/%m/%Y')}: Predicted steel price will go {movement} "
                   f"by {abs(percentage_change):.2f}%")
        predictions.append(message)
        print(message)

        last_price = price  

    return "\n".join(predictions)

def filter_llm_response(prompt):
    """
    Ensures that the LLM only responds to steel price prediction queries.
    """
    allowed_phrases = ["steel price", "price of steel from", "Predicted steel price"]
    if any(phrase in prompt.lower() for phrase in allowed_phrases):
        return True
    else:
        return False




def get_llm_insight(predictions, prompt):
    if not filter_llm_response(prompt):
        print("The question is outside the scope of steel price prediction.")
        return

    print("Sending the following predictions to LM Studio API:")
    print(predictions)
  
    payload = {
        "model": "llama-3.2-1b-instruct",
        "messages": [
            {"role": "system", "content": "format the output in paragraph format so that dummies can understand in less than 3 lines, use markdown"},
            {"role": "user", "content": prompt},
            {"role": "user", "content": predictions}
        ],
        "temperature": 0.7,
        "max_tokens": 512
    }

    try:
        response = requests.post(LM_STUDIO_API_URL, json=payload)
        response.raise_for_status()

        result = response.json()
        print("LM Studio Insight:")
        print(result['choices'][0]['message']['content'])
        return result['choices'][0]['message']['content']

    except requests.exceptions.RequestException as e:
        print(f"An error occurred while getting insight from LM Studio: {e}")










@app.post("/chatbot/")
async def chatbot(request: ChatRequest):
    try:
        # Parse date inputs
        start_date = datetime.datetime.strptime(request.start_date, '%d-%m-%Y')
        end_date = datetime.datetime.strptime(request.end_date, '%d-%m-%Y')
        conversion_rate = 83.0  # Conversion rate as INR
        date_pattern = r'\b(\d{2}-\d{2}-\d{4})\b'

        matches = re.findall(date_pattern, request.prompt)
        if len(matches)>=2:
            prediction_start_date = datetime.datetime.strptime(matches[0], '%d-%m-%Y')
            prediction_end_date = datetime.datetime.strptime(matches[1], '%d-%m-%Y')
        else:
            return {"llm_output": "I can provide predictions for steel prices only if you give me the dates you want it for, please provide dates","arima_predictions": "lol nothing"}

        # Fetch steel prices
        data = fetch_steel_prices(start_date, end_date, conversion_rate)
        if data is None:
            raise HTTPException(status_code=404, detail="No steel price data found for the specified date range.")

        # Calculate number of periods for ARIMA model
        num_periods = (prediction_end_date - prediction_start_date).days + 1
        if num_periods < 1:
            raise HTTPException(status_code=400, detail="The end date must be after the start date.")

        # Get ARIMA predictions
        predictions = predict_price_with_arima(data, num_periods, 'daily', conversion_rate, prediction_start_date)

        # Send predictions to LLM and get insight
        llm_output = get_llm_insight(predictions, request.prompt)

        # Return response
        return {"llm_output": llm_output, "arima_predictions": predictions}

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {ve}")

# Example of how to run: Use `uvicorn filename:app --reload` to start the FastAPI app