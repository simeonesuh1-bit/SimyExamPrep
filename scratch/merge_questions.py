import json
import re

def extract_tricky_from_md(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Simple regex block extraction for the md format
    # #### 1. PMG313 (Project Scope Management)
    # **Question**: ...
    # - A. ...
    # - B. ...
    # - ...
    # - **Correct**: B ...
    
    questions = []
    # This is a bit complex for a regex, I'll just manually add the 10 from the md
    # to the final list in the JS file to be 100% sure of formatting.
    return []

def extract_tricky_from_cjs(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Look for finalTricky = [ ... ]
    match = re.search(r'finalTricky = (\[.*?\]);', content, re.DOTALL)
    if match:
        try:
            # We need to handle the fact that JS isn't exactly JSON (single quotes, no quotes on keys)
            # For simplicity, I'll just grab the string and I'll use it in my JS injection.
            return match.group(1)
        except:
            return "[]"
    return "[]"

# I'll just load all_questions.json and I will manually append the others in the JS edit.
all_q = json.load(open('all_questions.json'))
print(json.dumps(all_q, indent=4))
