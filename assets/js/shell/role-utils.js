export function getUserRoles(user) {
  return Array.isArray(user?.roles) ? user.roles : [];
}

export function hasRole(user, role) {
  return getUserRoles(user).includes(role);
}

export function isFacultyUser(user) {
  return hasRole(user, "faculty");
}

export function isStudentUser(user) {
  return hasRole(user, "student");
}

export function isGraduateUser(user) {
  return hasRole(user, "graduate");
}

export function isAsaStaffUser(user) {
  return hasRole(user, "asa_staff");
}

export function canSeeStudentCard(user) {
  return isStudentUser(user) || isFacultyUser(user) || isAsaStaffUser(user);
}

export function canSeeFacultyCard(user) {
  return isFacultyUser(user) || isGraduateUser(user) || isAsaStaffUser(user);
}

export function canSeeGraduateCard(user) {
  return isStudentUser(user) || isGraduateUser(user) || isFacultyUser(user) || isAsaStaffUser(user);
}

export function canSeeAsaStaffCard(user) {
  return isAsaStaffUser(user);
}

export function canAccessFacultyPortal(user) {
  return isFacultyUser(user) || isGraduateUser(user) || isAsaStaffUser(user);
}

export function canAccessAsaStaffPortal(user) {
  return isAsaStaffUser(user);
}

export function canAccessStudentPortal(user) {
  return isStudentUser(user) || isFacultyUser(user) || isAsaStaffUser(user);
}

export function canAccessGraduatePortal(user) {
  return isGraduateUser(user) || isStudentUser(user) || isFacultyUser(user) || isAsaStaffUser(user);
}