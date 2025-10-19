import { useEffect, useState } from 'react';
import { getCritiques } from '../services/CriticService.js';

export function useCritiques(sectionId, deps = []) {
  const [critiques, setCritiques] = useState([]);

  useEffect(() => {
    setCritiques(getCritiques(sectionId));
  }, [sectionId, ...deps]);

  return critiques;
}


