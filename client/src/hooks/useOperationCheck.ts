// client/src/hooks/useOperationCheck.ts

export const useOperationCheck = () => {
  const checkOperation = async (file: File, pageIdentifier?: string) => {
    try {
      const response = await fetch('/api/check-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          pageIdentifier
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Operation check failed:', error);
      return { allowed: false, reason: 'Failed to check operation limits' };
    }
  };

  return { checkOperation };
};