const Batch = require("../models/Batch");

const sameId = (left, right) => left && right && left.toString() === right.toString();

const getBatchCourseIds = (batch) => {
    const ids = [];
    if (batch?.courseId) ids.push(batch.courseId._id || batch.courseId);
    (batch?.assignedCourses || []).forEach((courseId) => {
        if (courseId) ids.push(courseId._id || courseId);
    });

    return [...new Set(ids.map((id) => id.toString()))];
};

const getStudentBatches = async (user) => {
    const studentObjectId = user._id || user.id;
    const batchQuery = user.batchId
        ? { $or: [{ students: studentObjectId }, { _id: user.batchId }] }
        : { students: studentObjectId };

    return Batch.find(batchQuery).select("_id courseId assignedCourses students").lean();
};

const getStudentCourseScope = async (user, { includeLegacyEnrollment = false } = {}) => {
    const batches = await getStudentBatches(user);
    const batchIds = batches.map((batch) => batch._id);
    const courseIds = batches.flatMap(getBatchCourseIds);

    if (includeLegacyEnrollment) {
        (user.enrolledCourses || []).forEach((courseId) => {
            if (courseId) courseIds.push((courseId._id || courseId).toString());
        });
    }

    return {
        batches,
        batchIds,
        courseIds: [...new Set(courseIds)]
    };
};

const getStudentBatchForCourse = async (user, courseId) => {
    const scope = await getStudentCourseScope(user);
    return scope.batches.find((batch) => getBatchCourseIds(batch).some((id) => sameId(id, courseId))) || null;
};

module.exports = {
    getBatchCourseIds,
    getStudentBatches,
    getStudentBatchForCourse,
    getStudentCourseScope,
    sameId
};
