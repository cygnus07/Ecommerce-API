export const withRetry = async <T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    delayMs: number
  ): Promise<T> => {
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempt++;
      }
    }
    throw new Error('Max retry attempts reached');
  };