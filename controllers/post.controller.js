const Post = require('../models/Post.js');


const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ createdBy: req.user._id.toString() }).sort('createdAt');
    res.render("posts", { posts, csrfToken: res.locals._csrf , info: req.flash("info"), errors: req.flash("error") });
  } catch (error) {
    console.error(error);
    req.flash("error", "Error fetching posts");
    res.redirect("/");
  }
};

const getPost = async (req, res, render = false) => {
  try {
    const { user: { _id: userId }, params: { id: postId } } = req;

    const post = await Post.findOne({ _id: postId, createdBy: userId.toString() });

    if (!post) {
      if (render) {
        req.flash("error", "Post not found");
        return res.redirect("/posts");
      }
      return res.status(404).json({ error: "Post not found" });
    }

    if (render) {
      return post;
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    if (render) {
      req.flash("error", "Error loading post");
      return res.redirect("/posts");
    }
    res.status(500).json({ error: "Server error" });
  }
};

const createPost = async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, createdBy: req.user._id.toString() });

    req.flash("info", "Post created successfully");
    res.redirect("/posts");
  } catch (error) {
    req.flash("error", "Error creating post");
    res.redirect("/posts/new");
  }
};
const updatePost = async (req, res) => {
    try {
      const post = await Post.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id.toString() },
        req.body,
        { returnDocument: "after", runValidators: true }
      );
      if (!post) {
        req.flash("error", "Post not found");
        return res.redirect("/posts");
      }
      req.flash("info", "Post updated successfully");
      res.redirect("/posts");
    } catch (error) {
      req.flash("error", "Error updating post");
      res.redirect(`/posts/edit/${req.params.id}`);
    }
};

const deletePost = async (req, res) => {
  const {
    user: {_id: userId},
    params: {id: postId}
  } = req;
  console.log({userId})
  try{
    const post = await Post.findOneAndDelete({_id: postId, createdBy: userId.toString()});

    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }
  } catch (error) {
    req.flash("error", "Error deleting post");
  }
    res.redirect("/posts");
}

module.exports = {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
}