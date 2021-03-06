const express = require('express')
const { signup, getAvatar, getDefaultAvatar,
  userByID, getCoverPhoto, getDefaultCoverPhoto,
  listUser, updateProfile, userProfile, addFriend, removeFollower,
  comfirmFriendRequest, cancelRequest, unfriend } = require('../controllers/user.controller')
const { requireSignin, hasAuthorization } = require('../controllers/auth.controller')

const router = express.Router()

router.route('/api/users')
  .get(listUser)
  .post(signup)

router.route('/api/user/avatar/:userId')
  .get(getAvatar, getDefaultAvatar)

router.route('/api/user/coverphoto/:userId')
  .get(getCoverPhoto, getDefaultCoverPhoto)

router.route('/api/users/addfriend/:userId')
  .post(requireSignin, hasAuthorization, addFriend)

router.route('/api/users/unfriend/:userId')
  .post(requireSignin, hasAuthorization, unfriend)

router.route('/api/users/cancelrequest/:userId')
  .post(requireSignin, hasAuthorization, cancelRequest)

router.route('/api/users/confirmfriend/:userId')
  .post(requireSignin, hasAuthorization, comfirmFriendRequest)

router.route('/api/users/followers/:userId')
  .delete(requireSignin, hasAuthorization, removeFollower)

router.route('/api/users/:userId')
  .get(requireSignin, userProfile)
  .put(requireSignin, hasAuthorization, updateProfile)

router.param('userId', userByID)

module.exports = router