const express = require("express");
const { Likes, Posts, Users, sequelize } = require("../models");
const { Op, Sequelize } = require("sequelize");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

// 게시글 좋아요 API
router.post("/posts/:postId/like", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId } = req.params;

  try {
    const createLike = await Likes.findOne({
      where: {
        [Op.and]: [{ PostId: postId }, { UserId: userId }],
      },
    });
    if (createLike) {
      await createLike.destroy();
      const likeCount = await Likes.count({ where: { PostId: postId } });
      return res.status(201).json({
        message: "좋아요 취소완료",
        likeCount,
      });
    }

    await Likes.create({ UserId: userId, PostId: postId });
    const likeCount = await Likes.count({ where: { PostId: postId } });
    res.status(201).json({ message: "좋아요 완료", likeCount });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errorMessage: err.message });
  }
});

// 유저가 좋아요를 누른 게시글 조회 API
router.get("/user/posts/like", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;

  try {
    const postLike = await Posts.findAll({
      attributes: [
        "postId",
        "userId",
        "nickname",
        "title",
        "createdAt",
        "updatedAt",
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM Likes WHERE Likes.PostId = Posts.postId)`),
          "likes",
        ],
        /* [Sequelize.fn("COUNT", Sequelize.col("Likes.likeId")), "likes"]을 사용하게 되면 
          하나의 게시글만 출력되는 현상이 있어서 Sequelize문법을 찾아보니 쿼리문자열(literal)을
           사용하면 쿼리를 날릴 수 있다고 하여 적용*/
      ],
      include: [
        {
          model: Likes,
          attributes: [],
          where: { UserId: userId },
          required: true,
        },
      ],
      order: [
        [Sequelize.literal("likes"), "DESC"],
        ["createdAt", "DESC"],
      ], // alias를 적용한 likes를 Sequelize.literal을 사용하여 불러옴
    });
    return res.status(200).json({
      posts: postLike,
    });
  } catch (err) {
    return res.status(400).json({ errorMessage: err.message });
  }
});

module.exports = router;
