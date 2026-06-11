import { asaDepartment } from "./asa.js";
import { hrDepartment } from "./hr.js";
import { issaDepartment } from "./issa.js";

export const departments = Object.freeze([
  asaDepartment,
  hrDepartment,
  issaDepartment
]);

export function getDepartmentById(departmentId) {
  return departments.find((department) => department.id === departmentId) || null;
}

export function getDepartmentsForAudience(audience) {
  return departments.filter((department) =>
    department.audiences.includes(audience)
  );
}
