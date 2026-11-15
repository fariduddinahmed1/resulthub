import Subject from "../models/Subject.js";

// Admins can manage any subject; teachers only subjects assigned to them.
// Used by every teacher-scoped endpoint so the rule lives in one place.
export const canManageSubject = async (user, subjectId) => {
  if (user.role === "admin") {
    return true;
  }

  return Boolean(
    await Subject.exists({ _id: subjectId, teacher: user._id })
  );
};
