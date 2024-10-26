import pandas as pd
import yfinance as yf
import datetime
from statsmodels.tsa.arima.model import ARIMA
import requests

# LM Studio API URL
LM_STUDIO_API_URL = "http://127.0.0.1:1233/v1/chat/completions"

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
        "model": "mistral-7b-instruct-v0.2",
        "messages": [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": predictions}
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

    except requests.exceptions.RequestException as e:
        print(f"An error occurred while getting insight from LM Studio: {e}")

if __name__ == "__main__":
   
    start_date_input = "01-01-2019"
    end_date_input = "01-10-2024"

    start_date = datetime.datetime.strptime(start_date_input, '%d-%m-%Y')
    end_date = datetime.datetime.strptime(end_date_input, '%d-%m-%Y')

    conversion_rate = 83.0 
    data = fetch_steel_prices(start_date, end_date, conversion_rate)

    if data is not None:
       
        prediction_start_date_input = input("Enter the start date for prediction (dd-mm-yyyy): ").strip()
        prediction_end_date_input = input("Enter the end date for prediction (dd-mm-yyyy): ").strip()

        try:
            prediction_start_date = datetime.datetime.strptime(prediction_start_date_input, '%d-%m-%Y')
            prediction_end_date = datetime.datetime.strptime(prediction_end_date_input, '%d-%m-%Y')
            
            num_periods = (prediction_end_date - prediction_start_date).days + 1
            
            if num_periods < 1:
                print("The end date must be after the start date.")
                raise ValueError
            
            frequency = 'daily'  
            print(f"Predictions will be made from {prediction_start_date.strftime('%d/%m/%Y')} to {prediction_end_date.strftime('%d/%m/%Y')}.")

     
            predictions = predict_price_with_arima(data, num_periods, frequency, conversion_rate, prediction_start_date)
           
            user_prompt = f"What is the price of steel from {prediction_start_date_input} to {prediction_end_date_input}?"
            
            get_llm_insight(predictions, user_prompt)
            
        except ValueError as ve:
            print(f"Invalid input: {ve}")