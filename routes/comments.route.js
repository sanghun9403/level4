const express = require("express");
const { Users, Comments } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

// 댓글 생성 API
router.post("/posts/:postId/comments", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;
  const { comment } = req.body;

  try {
    if (!comment) {
      res.status(412).json({
        message: "내용을 입력해주세요.",
      });
      return;
    }

    await Comments.create({
      PostId: postId,
      UserId: userId,
      comment,
    });

    return res.status(201).json({
      message: "댓글 작성 완료",
    });
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
});

// 댓글 조회 API
router.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await Comments.findAll({
      where: { postId },
      include: [
        {
          model: Users,
          attributes: ["nickname"],
        },
      ],
    });

    const data = comments.map((comments) => {
      return {
        commentId: comments.commentId,
        userId: comments.userId,
        nickname: comments.User.nickname,
        comment: comments.comment,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      };
    });

    if (!comments) {
      return res.status(404).json({
        message: "작성된 댓글이 없습니다.",
      });
    }
    return res.status(200).json({
      comments: data,
    });
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
});

// 댓글 수정 API
router.put("/posts/:postId/comments/:commentId", authMiddleware, async (req, res) => {
  const { commentId, postId } = req.params;
  const { comment } = req.body;
  const { userId } = res.locals.user;

  try {
    const modifyComment = await Comments.findOne({ where: { commentId } });
    if (!modifyComment) {
      res.status(404).json({
        message: "해당 댓글을 찾을 수 없습니다",
      });
    } else if (modifyComment.UserId != userId) {
      return res.status(403).json({
        message: "수정권한이 없습니다.",
      });
    } else if (modifyComment.PostId != postId) {
      return res.status(404).json({
        message: "해당 게시글에 작성된 댓글이 아닙니다.",
      });
    } else if (!comment) {
      return res.status(400).json({
        message: "내용을 입력해주세요.",
      });
    } else {
      await Comments.update({ comment }, { where: { commentId } });
      return res.status(200).json({
        message: "게시글 수정이 완료되었습니다.",
      });
    }
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
});

// 댓글 삭제 API
router.delete("/posts/:postId/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = res.locals.user;
    const deleteComment = await Comments.findOne({ where: { commentId } });

    if (!deleteComment) {
      return res.status(404).json({
        message: "해당 댓글을 찾을 수 없습니다.",
      });
    } else if (deleteComment.UserId != userId) {
      return res.status(403).json({
        message: "삭제권한이 없습니다.",
      });
    } else if (deleteComment.PostId != postId) {
      return res.status(404).json({
        message: "해당 게시글에 작성된 댓글이 아닙니다.",
      });
    } else {
      await Comments.destroy({ where: { commentId } });
      return res.status(204);
    }
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
});

module.exports = router;
