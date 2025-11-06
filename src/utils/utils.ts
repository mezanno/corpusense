export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function onlyLettersAndNumbers(str: string) {
  return /^[A-Za-z0-9]*$/.test(str);
}
