export const authorize = (permission: boolean, userRole: string, ...roles: string[]) => {
  const result = roles.includes(userRole);

  let setPermission = true;

  if (permission && !result) {
    setPermission = false;
  }

  if (!permission && result) {
    setPermission = false
  }

  return setPermission;
}