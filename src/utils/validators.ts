export const isValidPhoneNumber = (phone: string) => {
  return /^0\d{9}$/.test(phone);
};

export const isValidPassword = (password: string, phone?: string) => {
  const hasSpecialCharacter = /[^a-zA-Z0-9]/.test(password);

  if (password.length < 6 || password.length > 10) {
    return false;
  }

  if (hasSpecialCharacter) {
    return false;
  }

  if (phone && password === phone) {
    return false;
  }

  return true;
};
