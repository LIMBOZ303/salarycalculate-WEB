/**
 * Build a clean payload for PUT /api/employees/:employeeId
 * Only includes fields the backend allows updating.
 */
export function buildEmployeeUpdatePayload(form) {
  const payload = {};

  if (form.fullName?.trim()) payload.fullName = form.fullName.trim();
  if (form.phone?.trim()) payload.phone = form.phone.trim();
  if (form.email?.trim()) payload.email = form.email.trim();
  if (form.avatar?.trim()) payload.avatar = form.avatar.trim();
  if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
  if (form.address?.trim()) payload.address = form.address.trim();
  if (form.citizenId?.trim()) payload.citizenId = form.citizenId.trim();
  if (form.branchId) payload.branchId = String(form.branchId);
  if (form.position?.trim()) payload.position = form.position.trim();
  if (form.hourlyRate !== '' && form.hourlyRate != null) {
    payload.hourlyRate = Number(form.hourlyRate);
  }
  if (form.shiftId) payload.shiftId = String(form.shiftId);
  if (form.startDate) payload.startDate = form.startDate;
  if (form.note?.trim()) payload.note = form.note.trim();

  return payload;
}

/**
 * Build a clean payload for PUT /api/attendance/:id
 */
export function buildAttendanceUpdatePayload(form) {
  const payload = {};

  if (form.checkInTime) payload.checkInTime = form.checkInTime;
  if (form.checkOutTime) payload.checkOutTime = form.checkOutTime;
  if (form.breakMinutes !== '' && form.breakMinutes != null) {
    payload.breakMinutes = Number(form.breakMinutes);
  }
  if (form.status) payload.status = form.status;
  if (form.note?.trim()) payload.note = form.note.trim();
  if (form.reason?.trim()) payload.reason = form.reason.trim();

  return payload;
}
