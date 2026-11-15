
import mongoose from "mongoose";
import Result from "../models/Result.js";
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import { canManageSubject } from "../utils/subjectAccess.js";

// 1. Overall performance analytics (Admin)
export const getOverallAnalytics = async (req, res) => {
  try {
    const [summaryResult, gradeResults] = await Promise.all([
      Result.aggregate([
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            averagePercentage: { $avg: "$percentage" },
            passedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Pass"] }, 1, 0]
              }
            },
            failedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Fail"] }, 1, 0]
              }
            }
          }
        }
      ]),
      Result.aggregate([
        {
          $group: {
            _id: "$grade",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const summary = summaryResult[0] || {
      totalResults: 0,
      averagePercentage: 0,
      passedResults: 0,
      failedResults: 0
    };

    const gradeDistribution = {
      "A+": 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0
    };

    gradeResults.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(gradeDistribution, item._id)) {
        gradeDistribution[item._id] = item.count;
      }
    });

    const passRate = summary.totalResults > 0
      ? (summary.passedResults / summary.totalResults) * 100
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalResults: summary.totalResults,
        averagePercentage: Number(summary.averagePercentage?.toFixed(2) || 0),
        passedResults: summary.passedResults,
        failedResults: summary.failedResults,
        passRate: Number(passRate.toFixed(2)),
        gradeDistribution
      }
    });
  } catch (error) {
    console.error("Overall analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch overall analytics."
    });
  }
};


// 2. Subject-wise performance analytics (Admin)
export const getSubjectAnalytics = async (req, res) => {
  try {
    const subjects = await Result.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },
      {
        $lookup: {
          from: "subjects",
          localField: "exam.subject",
          foreignField: "_id",
          as: "subject"
        }
      },
      { $unwind: "$subject" },
      {
        $group: {
          _id: "$subject._id",
          subjectName: { $first: "$subject.name" },
          subjectCode: { $first: "$subject.subjectCode" },
          averagePercentage: { $avg: "$percentage" },
          totalResults: { $sum: 1 },
          passedResults: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pass"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          subjectName: 1,
          subjectCode: 1,
          averagePercentage: {
            $round: ["$averagePercentage", 2]
          },
          totalResults: 1,
          passedResults: 1,
          passRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$passedResults", "$totalResults"] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { averagePercentage: -1 } }
    ]);

    res.status(200).json({
      success: true,
      subjects,
      highestPerformingSubject: subjects[0] || null,
      lowestPerformingSubject: subjects[subjects.length - 1] || null
    });
  } catch (error) {
    console.error("Subject analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subject analytics."
    });
  }
};


// 3. Individual student performance insights (Student)
export const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(String(req.user._id));

    const [summaryResult, subjectResults, examTrend] = await Promise.all([
      Result.aggregate([
        { $match: { student: studentId } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            averagePercentage: { $avg: "$percentage" },
            passedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Pass"] }, 1, 0]
              }
            },
            failedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Fail"] }, 1, 0]
              }
            }
          }
        }
      ]),

      Result.aggregate([
        { $match: { student: studentId } },
        {
          $lookup: {
            from: "exams",
            localField: "exam",
            foreignField: "_id",
            as: "exam"
          }
        },
        { $unwind: "$exam" },
        {
          $lookup: {
            from: "subjects",
            localField: "exam.subject",
            foreignField: "_id",
            as: "subject"
          }
        },
        { $unwind: "$subject" },
        {
          $group: {
            _id: "$subject._id",
            subjectName: { $first: "$subject.name" },
            subjectCode: { $first: "$subject.subjectCode" },
            averagePercentage: { $avg: "$percentage" },
            totalResults: { $sum: 1 }
          }
        },
        { $sort: { averagePercentage: -1 } },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            subjectName: 1,
            subjectCode: 1,
            averagePercentage: {
              $round: ["$averagePercentage", 2]
            },
            totalResults: 1
          }
        }
      ]),

      Result.aggregate([
        { $match: { student: studentId } },
        {
          $lookup: {
            from: "exams",
            localField: "exam",
            foreignField: "_id",
            as: "exam"
          }
        },
        { $unwind: "$exam" },
        {
          $lookup: {
            from: "subjects",
            localField: "exam.subject",
            foreignField: "_id",
            as: "subject"
          }
        },
        { $unwind: "$subject" },
        {
          $project: {
            _id: 1,
            examTitle: "$exam.title",
            examDate: "$exam.examDate",
            subjectName: "$subject.name",
            percentage: 1,
            grade: 1,
            status: 1
          }
        },
        { $sort: { examDate: 1 } }
      ])
    ]);

    const summary = summaryResult[0] || {
      totalResults: 0,
      averagePercentage: 0,
      passedResults: 0,
      failedResults: 0
    };

    res.status(200).json({
      success: true,
      analytics: {
        totalResults: summary.totalResults,
        averagePercentage: Number(summary.averagePercentage?.toFixed(2) || 0),
        passedResults: summary.passedResults,
        failedResults: summary.failedResults,
        strongestSubject: subjectResults[0] || null,
        examTrend
      }
    });
  } catch (error) {
    console.error("Student analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student analytics."
    });
  }
};


// 4. Single-subject class performance (Teacher owns the subject, Admin any)
export const getSubjectDetailAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID."
      });
    }

    const allowed = await canManageSubject(req.user, id);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You can only view analytics for your own subjects."
      });
    }

    const subject = await Subject.findById(id)
      .select("name subjectCode department semester credits");

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found."
      });
    }

    // Scope every aggregation to exams of this subject
    const exams = await Exam.find({ subject: id }).select("_id");
    const examIds = exams.map((exam) => exam._id);

    const [summaryResult, gradeResults, perExamResults] = await Promise.all([
      Result.aggregate([
        { $match: { exam: { $in: examIds } } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            averagePercentage: { $avg: "$percentage" },
            passedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Pass"] }, 1, 0]
              }
            },
            failedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Fail"] }, 1, 0]
              }
            }
          }
        }
      ]),

      Result.aggregate([
        { $match: { exam: { $in: examIds } } },
        {
          $group: {
            _id: "$grade",
            count: { $sum: 1 }
          }
        }
      ]),

      Result.aggregate([
        { $match: { exam: { $in: examIds } } },
        {
          $lookup: {
            from: "exams",
            localField: "exam",
            foreignField: "_id",
            as: "exam"
          }
        },
        { $unwind: "$exam" },
        {
          $group: {
            _id: "$exam._id",
            title: { $first: "$exam.title" },
            examType: { $first: "$exam.examType" },
            examDate: { $first: "$exam.examDate" },
            totalResults: { $sum: 1 },
            averagePercentage: { $avg: "$percentage" },
            passedResults: {
              $sum: {
                $cond: [{ $eq: ["$status", "Pass"] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            examType: 1,
            examDate: 1,
            totalResults: 1,
            averagePercentage: { $round: ["$averagePercentage", 2] },
            passedResults: 1,
            passRate: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$passedResults", "$totalResults"] },
                    100
                  ]
                },
                2
              ]
            }
          }
        },
        { $sort: { examDate: 1 } }
      ])
    ]);

    const summary = summaryResult[0] || {
      totalResults: 0,
      averagePercentage: 0,
      passedResults: 0,
      failedResults: 0
    };

    const gradeDistribution = {
      "A+": 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0
    };

    gradeResults.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(gradeDistribution, item._id)) {
        gradeDistribution[item._id] = item.count;
      }
    });

    const passRate = summary.totalResults > 0
      ? (summary.passedResults / summary.totalResults) * 100
      : 0;

    res.status(200).json({
      success: true,
      subject,
      analytics: {
        totalResults: summary.totalResults,
        averagePercentage: Number(summary.averagePercentage?.toFixed(2) || 0),
        passedResults: summary.passedResults,
        failedResults: summary.failedResults,
        passRate: Number(passRate.toFixed(2)),
        gradeDistribution,
        exams: perExamResults
      }
    });
  } catch (error) {
    console.error("Subject detail analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subject analytics."
    });
  }
};
