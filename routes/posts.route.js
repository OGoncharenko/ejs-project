const express = require('express');
const router = express.Router();
const { getAllPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/post.controller.js');

router.get('/new', (req, res) => {
  res.render('post', { post: null });
});

router.get('/edit/:id', async (req, res) => {
  try {
    const post = await getPost(req, res, true);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }
    res.render('post', { post });
  } catch (error) {
    req.flash('error', 'Error loading post');
    res.redirect('/posts');
  }
});

router.route('/').get(getAllPosts).post(createPost);
router.route('/:id').get(getPost).post(updatePost).delete(deletePost);
router.route('/delete/:id').post(deletePost);

module.exports = router;
