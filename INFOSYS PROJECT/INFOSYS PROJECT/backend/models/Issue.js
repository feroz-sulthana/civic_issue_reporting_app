const mongoose = require("mongoose");

/* ─────────────────────────────────────────
   COMMENT SUB-SCHEMA
───────────────────────────────────────── */
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    /* users who liked this comment */
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────
   ISSUE SCHEMA
───────────────────────────────────────── */
const issueSchema = new mongoose.Schema(
  {
    /* ================= USER ================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ================= ISSUE INFO ================= */

    issueType: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },

    /* ================= LOCATION ================= */

    address: {
      type: String,
      required: true,
      trim: true,
    },

    landmark: {
      type: String,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    /* ================= DESCRIPTION ================= */

    description: {
      type: String,
      trim: true,
    },

    observedOn: {
      type: Date,
    },

    /* ================= IMAGES ================= */

    images: [
      {
        type: String,
      },
    ],

    /* ================= VOTING ================= */

    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* ================= COMMENTS ================= */

    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);