def recover_last(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    split_str = " useEffect } from 'react';\nimport { useParams"
    
    idx = content.rfind(split_str)
    
    if idx == -1:
        print(f"Not found in {filepath}")
        return
        
    print(f"Found last split at {idx} in {filepath}")
    
    # Extract from the last occurrence onwards, prepend the missing 39 chars
    recovered = "import React, { useState, useCallback," + content[idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(recovered)
        
    print(f"Recovered {filepath} to ORIGINAL state. Size is now {len(recovered)} bytes.")

recover_last('frontend/src/pages/Parecer.jsx')
recover_last('frontend/src/pages/NotaTecnica.jsx')
recover_last('frontend/src/pages/NotaFinal.jsx')
