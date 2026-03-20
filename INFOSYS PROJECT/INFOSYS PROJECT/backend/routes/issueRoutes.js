const express = require("express");
const router = express.Router();

const Issue = require("../models/Issue");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/issueUpload");

/* ═══════════════════════════════════════════
   CREATE ISSUE
═══════════════════════════════════════════ */

router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    const {
      issueType,
      priority,
      address,
      landmark,
      description,
      observedOn,
      latitude,
      longitude,
    } = req.body;

    if (!issueType || !priority || !address || !latitude || !longitude) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const imagePaths = req.files
      ? req.files.map((file) => file.path || file.secure_url)
      : [];

    const newIssue = await Issue.create({
      user: req.user.id,
      issueType,
      priority,
      address,
      landmark,
      description,
      observedOn: observedOn ? new Date(observedOn) : null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      images: imagePaths,
    });

    res.status(201).json(newIssue);
  } catch (err) {
    console.error("CREATE ISSUE ERROR:", err);
    res.status(500).json({ msg: "Failed to create issue" });
  }
});

/* ═══════════════════════════════════════════
   GET MY ISSUES
═══════════════════════════════════════════ */

router.get("/my", auth, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: "Unauthorized" });

    const issues = await Issue.find({ user: req.user.id })
      .populate("comments.user", "name role")
      .sort({ createdAt: -1 });

    res.json(issues || []);
  } catch (err) {
    console.error("FETCH MY ISSUES ERROR:", err);
    res.status(500).json([]);
  }
});

/* ═══════════════════════════════════════════
   GET ALL ISSUES
═══════════════════════════════════════════ */

router.get("/", auth, async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("user", "name email")
      .populate("comments.user", "name role")
      .sort({ createdAt: -1 });

    res.json(issues || []);
  } catch (err) {
    console.error("FETCH ALL ISSUES ERROR:", err);
    res.status(500).json([]);
  }
});

/* ═══════════════════════════════════════════
   UPVOTE
═══════════════════════════════════════════ */

router.post("/:id/upvote", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    const userId = req.user.id;

    if (issue.upvotes.includes(userId)) {
      issue.upvotes.pull(userId);
    } else {
      issue.upvotes.push(userId);
      issue.downvotes.pull(userId);
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    console.error("UPVOTE ERROR:", err);
    res.status(500).json({ msg: "Upvote failed" });
  }
});

/* ═══════════════════════════════════════════
   DOWNVOTE
═══════════════════════════════════════════ */

router.post("/:id/downvote", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    const userId = req.user.id;

    if (issue.downvotes.includes(userId)) {
      issue.downvotes.pull(userId);
    } else {
      issue.downvotes.push(userId);
      issue.upvotes.pull(userId);
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    console.error("DOWNVOTE ERROR:", err);
    res.status(500).json({ msg: "Downvote failed" });
  }
});

/* ═══════════════════════════════════════════
   ADMIN UPDATE STATUS
═══════════════════════════════════════════ */

router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Admin only action" });
    }

    const { status } = req.body;

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" }
    );

    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    const io = req.app.get("io");
    io.emit("issueStatusUpdated", issue);

    res.json(issue);
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ msg: "Status update failed" });
  }
});

/* ═══════════════════════════════════════════
   GET COMMENTS  —  GET /api/issues/:id/comments
   Returns comments newest-first.
   Frontend handles "Top" sort (by likes) client-side.
═══════════════════════════════════════════ */

router.get("/:id/comments", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .select("comments")
      .populate("comments.user", "name role");

    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    // Return newest first (reverse of stored order)
    const sorted = [...issue.comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(sorted);
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ msg: "Failed to fetch comments" });
  }
});

/* ═══════════════════════════════════════════
   ADD COMMENT  —  POST /api/issues/:id/comments
   Only non-admin users can post comments.
═══════════════════════════════════════════ */

router.post("/:id/comments", auth, async (req, res) => {
  try {
    // Admins are read-only for comments
    if (req.user.role === "admin") {
      return res.status(403).json({ msg: "Admins cannot post comments" });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Comment text is required" });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ msg: "Comment must be 500 characters or less" });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    issue.comments.push({
      user: req.user.id,
      text: text.trim(),
      likes: [],
    });

    await issue.save();

    // Populate and return only the new comment
    await issue.populate("comments.user", "name role");
    const newComment = issue.comments[issue.comments.length - 1];

    res.status(201).json(newComment);
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    res.status(500).json({ msg: "Failed to add comment" });
  }
});

/* ═══════════════════════════════════════════
   DELETE COMMENT  —  DELETE /api/issues/:id/comments/:commentId
   Comment owner or admin can delete.
═══════════════════════════════════════════ */

router.delete("/:id/comments/:commentId", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    // Only comment owner or admin may delete
    const isOwner = comment.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await issue.save();

    res.json({ msg: "Comment deleted", commentId: req.params.commentId });
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ msg: "Failed to delete comment" });
  }
});

/* ═══════════════════════════════════════════
   LIKE / UNLIKE COMMENT 
═══════════════════════════════════════════ */

router.post("/:id/comments/:commentId/like", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ msg: "Issue not found" });

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const userId = req.user.id;

    if (comment.likes.includes(userId)) {
      // Already liked → unlike
      comment.likes.pull(userId);
    } else {
      // Not liked → like
      comment.likes.push(userId);
    }

    await issue.save();
    await issue.populate("comments.user", "name role");

    // Return the updated comment
    const updated = issue.comments.id(req.params.commentId);
    res.json(updated);
  } catch (err) {
    console.error("LIKE COMMENT ERROR:", err);
    res.status(500).json({ msg: "Failed to like comment" });
  }
});

module.exports = router;