import { useState, useRef, useCallback } from 'react';
import { createKey } from '../services/keyService';

const COOLDOWN_SECONDS = 30;

export function useKeygen() {
  const [generatedKey, setGeneratedKey] = useState(null);
  const [cooldown,     setCooldown]     = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef(null);

  const generate = useCallback(async (game) => {
    if (cooldown > 0 || !game) return;

    setIsGenerating(true);
    try {
      const { key } = await createKey({
        game:     game.id,
        gameName: game.name,
        type:     '1day',
        note:     'Public keygen',
        createdBy: 'public',
      });
      setGeneratedKey(key);

      // Start cooldown timer
      setCooldown(COOLDOWN_SECONDS);
      let s = COOLDOWN_SECONDS;
      timerRef.current = setInterval(() => {
        s -= 1;
        setCooldown(s);
        if (s <= 0) {
          clearInterval(timerRef.current);
          setCooldown(0);
        }
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  }, [cooldown]);

  const copyKey = useCallback(() => {
    if (generatedKey) navigator.clipboard.writeText(generatedKey);
  }, [generatedKey]);

  return { generatedKey, cooldown, isGenerating, generate, copyKey };
}
