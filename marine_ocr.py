import easyocr
import pandas as pd
import json
import re
import os


reader = easyocr.Reader(['en'], gpu=True)  


def extract_json_from_markdown(md_file):
    with open(md_file, 'r') as file:
        content = file.read()

    
    json_blocks = re.findall(r'```json\s*(.*?)\s*```', content, re.DOTALL)

    json_data = []
    for block in json_blocks:
        try:
            json_data.append(json.loads(block))
        except json.JSONDecodeError:
            print(f"Error decoding JSON: {block}")

    return json_data


def extract_structured_text(md_file, output_directory):
    with open(md_file, 'r') as file:
        content = file.read()

    
    text_blocks = re.findall(r'```(.*?)\s*```', content, re.DOTALL)


    text_filename = os.path.join(output_directory, f"{os.path.splitext(os.path.basename(md_file))[0]}.txt")
    with open(text_filename, 'w') as text_file:
        
        for block, text_block in enumerate(text_blocks):
            text_block=text_block.strip()
            text_file.write(text_block)


def save_json_to_excel(json_data, excel_file):
    flattened_data = []

    for item in json_data:
        flattened_item = {
            "name": item["name"],
            "type": item["type"],
            "significance": item["significance"]
        }
        
        for idx, coord in enumerate(item["coordinates"]):
            flattened_item[f'lat_{idx + 1}'] = coord["lat"]
            flattened_item[f'lon_{idx + 1}'] = coord["lon"]

        flattened_data.append(flattened_item)

    df = pd.DataFrame(flattened_data)
    df.to_excel(excel_file, index=False)


def main():
    input_directory = "C:\\Users\\Asus\\Downloads\\Maritime Situational Awareness-20241024T173531Z-001\\Maritime Situational Awareness"  
    output_directory_excel = "C:\\Users\\Asus\\Downloads\\Maritime Situational Awareness-20241024T173531Z-001\\Maritime Situational Awareness_extracted_excel\\excels"
    output_directory= "C:\\Users\\Asus\\Downloads\\Maritime Situational Awareness-20241024T173531Z-001\\Maritime Situational Awareness_extracted_excel\\logs"
    os.makedirs(output_directory, exist_ok=True)  

    
    for filename in os.listdir(input_directory):
        if filename.endswith('.md'):
            md_file = os.path.join(input_directory, filename)
            excel_file = os.path.join(output_directory_excel, f"{os.path.splitext(filename)[0]}.xlsx")  

            
            json_data = extract_json_from_markdown(md_file)

            
            if json_data:  
                save_json_to_excel(json_data, excel_file)
                print(f"Data from {filename} saved to {excel_file}")
                
            else:
                print(f"No JSON data found in {filename}")
                print("Default: (Json not found!) | Switching to log file extraction...")
                extract_structured_text(md_file, output_directory)
                print(f"Structured text from {filename} saved to {output_directory}")
                

if __name__ == "__main__":
    main()
