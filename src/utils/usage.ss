// Example usage
if (userExists) {
  const error = Errors.alreadyExitUser(req);
  return next(new Error(error.message));
}

// For direct usage
if (tokenInvalid) {
  const error = Errors.InvalidToken();
  return next(new Error(error.message));
}