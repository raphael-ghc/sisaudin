def recover_file2(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    split_str = " useEffect } from 'react';\nimport { useParams"
    idx1 = content.find(split_str)
    idx2 = content.find(split_str, idx1 + 1)
    
    if idx2 == -1:
        print(f"idx2 not found in {filepath}. Maybe already fixed?")
        return
        
    print(f"Found idx2 at {idx2} in {filepath}")
    
    # Extract from idx2 onwards, prepend the missing 39 chars
    recovered = "import React, { useState, useCallback," + content[idx2:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(recovered)
        
    print(f"Recovered {filepath} to pre-fix_nota state. Size is now {len(recovered)} bytes.")

recover_file2('frontend/src/pages/Parecer.jsx')
recover_file2('frontend/src/pages/NotaTecnica.jsx')
recover_file2('frontend/src/pages/NotaFinal.jsx')
recover_file2('frontend/src/pages/Nota.jsx')
