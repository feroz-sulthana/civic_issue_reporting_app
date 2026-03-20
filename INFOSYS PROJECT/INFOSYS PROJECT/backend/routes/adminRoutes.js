const express = require("express");
const router  = express.Router();

const Issue = require("../models/Issue");
const User  = require("../models/User");
const auth  = require("../middleware/authMiddleware");

/* ═══════════════════════════════════════════
   ADMIN ANALYTICS  —  GET /api/admin/analytics
═══════════════════════════════════════════ */

router.get("/analytics", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const totalComplaints = await Issue.countDocuments();
    const pending         = await Issue.countDocuments({ status: "pending" });
    const users           = await User.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = await Issue.countDocuments({
      status: "resolved",
      updatedAt: { $gte: today },
    });

    /* Issue type breakdown */
    const issueTypeStats = await Issue.aggregate([
      { $group: { _id: "$issueType", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]);

    /* Weekly trend */
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyRaw = await Issue.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:      { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          reported: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const DAY_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyTrend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key   = d.toISOString().slice(0, 10);
      const found = weeklyRaw.find((r) => r._id === key);
      weeklyTrend.push({
        day:      DAY_LABELS[d.getDay()],
        reported: found?.reported ?? 0,
        resolved: found?.resolved ?? 0,
      });
    }

    res.json({ totalComplaints, pending, users, resolvedToday, issueTypeStats, weeklyTrend });
  } catch (err) {
    console.error("ADMIN ANALYTICS ERROR:", err);
    res.status(500).json({
      totalComplaints: 0, pending: 0, users: 0, resolvedToday: 0,
      issueTypeStats: [], weeklyTrend: [],
    });
  }
});

/* ═══════════════════════════════════════════
   ALL USERS  —  GET /api/admin/users
═══════════════════════════════════════════ */

router.get("/users", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);

    const issues = await Issue.find({ user: { $in: userIds } })
      .select("user issueType status priority address createdAt upvotes comments")
      .lean();

    const issueMap = {};
    for (const issue of issues) {
      const uid = issue.user.toString();
      if (!issueMap[uid]) issueMap[uid] = [];
      issueMap[uid].push({
        _id:       issue._id,
        issueType: issue.issueType,
        status:    issue.status,
        priority:  issue.priority,
        address:   issue.address,
        createdAt: issue.createdAt,
        upvotes:   issue.upvotes,
        comments:  issue.comments?.map((c) => ({ _id: c._id })) ?? [],
      });
    }

    const result = users.map((u) => ({
      ...u,
      issues: issueMap[u._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

/* ═══════════════════════════════════════════
   REPORTS DATA
═══════════════════════════════════════════ */

router.get("/reports", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const {
      status,
      priority,
      issueType,
      dateFrom,
      dateTo,
      sort = "newest",
    } = req.query;

    const filter = {};
    if (status    && status    !== "all") filter.status    = status;
    if (priority  && priority  !== "all") filter.priority  = priority;
    if (issueType && issueType !== "all") filter.issueType = issueType;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    /* Sort */
    const PRIORITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
    let mongoSort = { createdAt: -1 };

    if (sort === "oldest")   mongoSort = { createdAt: 1 };
    if (sort === "votes")    mongoSort = { "upvotes.length": -1, createdAt: -1 };

    const issues = await Issue.find(filter)
      .populate("user", "name email state")
      .sort(mongoSort)
      .lean();


    if (sort === "priority") {
      issues.sort((a, b) =>
        (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
      );
    }

    /* Summarised analytics payload */
    const total      = issues.length;
    const resolved   = issues.filter((i) => i.status === "resolved").length;
    const pending    = issues.filter((i) => i.status === "pending").length;
    const inProgress = issues.filter((i) => i.status === "in-progress").length;
    const critical   = issues.filter((i) => i.priority === "critical").length;

    const byType = Object.entries(
      issues.reduce((acc, i) => {
        acc[i.issueType] = (acc[i.issueType] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({
      issues,
      summary: { total, resolved, pending, inProgress, critical },
      byType,
    });
  } catch (err) {
    console.error("ADMIN REPORTS ERROR:", err);
    res.status(500).json({ msg: "Failed to generate report", issues: [], summary: {}, byType: [] });
  }
});

/* ═══════════════════════════════════════════
   REPORT SUMMARY STATS
═══════════════════════════════════════════ */

router.get("/reports/summary", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const [total, resolved, pending, inProgress, critical] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: "resolved" }),
      Issue.countDocuments({ status: "pending" }),
      Issue.countDocuments({ status: "in-progress" }),
      Issue.countDocuments({ priority: "critical" }),
    ]);

    /* Monthly trend (last 6 months) */
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRaw = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:      { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          reported: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key   = d.toISOString().slice(0, 7);
      const found = monthlyRaw.find((r) => r._id === key);
      monthlyTrend.push({
        month:    MONTH_LABELS[d.getMonth()],
        reported: found?.reported ?? 0,
        resolved: found?.resolved ?? 0,
      });
    }

    /* Top issue types */
    const topTypes = await Issue.aggregate([
      { $group: { _id: "$issueType", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]);

    res.json({
      summary: { total, resolved, pending, inProgress, critical },
      monthlyTrend,
      topTypes,
    });
  } catch (err) {
    console.error("REPORTS SUMMARY ERROR:", err);
    res.status(500).json({ msg: "Failed to fetch report summary" });
  }
});

module.exports = router;