def recover_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the split point
    split_str = " useEffect } from 'react';\nimport { useParams"
    idx = content.find(split_str)
    
    if idx == -1:
        print(f"Split string not found in {filepath}. Already recovered?")
        return
        
    print(f"Found split at index {idx} in {filepath}")
    
    # Recover the file
    recovered = "import React, { useState, useCallback," + content[idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(recovered)
        
    print(f"Recovered {filepath}")

recover_file('frontend/src/pages/Parecer.jsx')
recover_file('frontend/src/pages/NotaTecnica.jsx')
recover_file('frontend/src/pages/NotaFinal.jsx')
recover_file('frontend/src/pages/Nota.jsx')
