const Post = require('../models/Post');
const {StatusCodes} = require('http-status-codes');
const {BadRequestError, NotFoundError} = require('../errors');

const getAllPosts = async (req, res) => {
  const posts = await Post.find({createdBy: req.user.userId}).sort('createdAt');
  res.status(StatusCodes.OK).json({posts, count: posts.length});
}
const getPost = async (req, res) => {
  const {user: {userId}, params: {id: postId}} = req;
  const post = await Post.findOne({
    _id: postId, createdBy: userId
  })

  if (!post) {
    throw new NotFoundError(`No post with id : ${postId}`);
  }
  res.status(StatusCodes.OK).json({post});
}
const createPost = async (req, res) => {
  const post = await Post.create({...req.body, createdBy: req.user.userId});
  res.status(StatusCodes.CREATED).json({post});
}
const updatePost = async (req, res) => {
  const {
    body: {title, description},
    user: {userId},
    params: {id: postId}
  } = req;
  if (title === '' || description === '') {
    throw new BadRequestError('Title or description cannot be empty');
  }
  const post = await Post.findOneAndUpdate(
    {_id: postId, createdBy: userId},
    req.body,
    {new: true, runValidators: true}
  )

  if (!post) {
    throw new NotFoundError(`No post with id : ${postId}`);
  }
  res.status(StatusCodes.OK).json({post});
}
const deletePost = async (req, res) => {
  const {
    user: {userId},
    params: {id: postId}
  } = req;

  const post = await Post.findOneAndRemove({_id: postId, createdBy: userId});

  if (!post) {
    throw new NotFoundError(`No post with id : ${postId}`);
  }
  res.status(StatusCodes.OK).json({ msg: "The entry was deleted." });
}

module.exports = {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
}