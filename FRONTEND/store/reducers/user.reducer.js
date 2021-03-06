import { createAsyncThunk, createSlice, } from '@reduxjs/toolkit'
import { axiosInstance, baseURL } from '../../utils/axios.util'
import axios from 'axios'
import extend from 'lodash/extend'
import socket from '../../socketClient'

const initialState = {
  user: { },
  error: null,
  authenticated: false,
  loading: false
}

export const signin = createAsyncThunk('user/signin', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/api/auth/signin', {
      email, password
    });
    if (response.status === 200) {
      console.log(response.data)
      return {
        user: response.data
      }
    }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const update = createAsyncThunk('user/udpate', async (data, { rejectWithValue }) => {
  let user = JSON.parse(localStorage.getItem('user'))
  let keys = Object.keys(data)
  let userData = new FormData()
  for (const key of keys) {
    userData.append(key, data[key])
  }
  console.log(userData)
  try {
    const response = await axios.put(`${baseURL}/api/users/${user._id}`, userData, {
      headers: {
        'Authorization': 'Bearer ' + user.token,
        'Content-Type': 'application/json'
      },
    })
    console.log(response.data)
    return { user: response.data }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const addFriend = createAsyncThunk('user/addfriend', async (data, { getState, rejectWithValue }) => {
  const state = getState().userReducer
  console.log('addfriend', state)
  let userId = state.user._id
  console.log(data)
  try {
    const response = await axios.post(`${baseURL}/api/users/addfriend/${userId}`, data, {
      headers: {
        Authorization: 'Bearer ' + state.user.token
      }
    })
    console.log(response.data)
    return {
      userIdAdded: data.userIdAdded,
      name: response.data.name
    }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const cancelFriendRequest = createAsyncThunk('/user/cancelFrRequest', async (data, { getState, rejectWithValue }) => {
  const state = getState().userReducer
  try {
    let response = await axios.post(`${baseURL}/api/users/cancelrequest/${data.followerId}`, data, {
      headers: {
        Authorization: 'Bearer ' + state.user.token
      }
    })
    console.log(response.data)
    return {
      followingId: response.data.followingId
    }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const confirmFriendRequest = createAsyncThunk('/user/confirmFrRequest', async (data, { getState, rejectWithValue }) => {
  const state = getState().userReducer
  try {
    let response = await axios.post(`${baseURL}/api/users/confirmfriend/${data.followingId}`, data, {
      headers: {
        Authorization: 'Bearer ' + state.user.token
      }
    })
    console.log(response.data)
    return {
      newFriend: response.data.newFriend,
      followerId: data.userId
    }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const removeFollower = createAsyncThunk('/user/removeFollower', async (data, { getState, rejectWithValue }) => {
  const state = getState().userReducer
  try {
    let response = await axios.delete(`${baseURL}/api/users/followers/${data.userId}?followerId=${data.followerId}`, {
      headers: {
        Authorization: 'Bearer ' + state.user.token
      }
    })
    console.log(response.data)
    return {
      followerId: data.followerId
    }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const unfriend = createAsyncThunk('/user/unfriend', async (data, { getState, rejectWithValue }) => {
  const state = getState().userReducer
  try {
    let response = await axios.post(`${baseURL}/api/users/unfriend/${data.userId}`, data, {
      headers: {
        Authorization: 'Bearer ' + state.user.token
      }
    })
    console.log(response.data)
    return {
      friendId: data.friendId
    }
  } catch (error) {
    let { data } = error.response
    if (data && data.error) {
      return rejectWithValue(data)
    }
  }
})

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    isAuthenticated: (state) => {
      const user = JSON.parse(localStorage.getItem('user'))
      if (user) {
        for (const friend of user.friends) {
          friend.activityStatus = 'offline'
        }
        state.user = user
        state.authenticated = true;
        state.loading = false
        state.user.activityStatus = 'online'
        socket.auth = { userId: user._id };
        socket.connect();
      }
    },
    signout: (state) => {
      state.user = { }
      state.authenticated = false
      localStorage.removeItem('user')
    },
    onFriendOnline: (state, action) => {
      let onlineUserList = action.payload.onlineUserList
      for (let user of state.user.friends) {
        if (onlineUserList.indexOf(user._id) >= 0) {
          user.activityStatus = 'online'
        }
      }
    },
    onFriendOffline: (state, action) => {
      let userID = action.payload.userID
      let idx = state.user.friends.map(user => user._id).indexOf(userID)
      if (idx > -1) {
        state.user.friends[idx].activityStatus = 'offline'
      }
    }
  },
  extraReducers: {
    [signin.pending]: (state, action) => {
      state.loading = true
    },
    [signin.fulfilled]: (state, action) => {
      let user = action.payload.user
      state.loading = false
      state.authenticated = true
      for (const key of Object.keys(user)) {
        if (user[key] === 'undefined') {
          state.user[key] = undefined
          user[key] = undefined
        }
      }
      window.localStorage.setItem('user', JSON.stringify(user))
      for (const friend of user.friends) {
        friend.activityStatus = 'offline'
      }
      state.user = extend(state.user, user)
      state.user.activityStatus = 'online'
      socket.auth = { userId: user._id };
      socket.connect()
    },
    [signin.rejected]: (state, action) => {
      console.log(action)
      state.error = action.payload.error
      state.loading = false
    },
    [update.pending]: (state, action) => {
      console.log('update profile pending')
      // state.loading = true
    },
    [update.fulfilled]: (state, action) => {
      let user = action.payload.user
      for (const key of Object.keys(user)) {
        if (user[key] === 'undefined') {
          state.user[key] = undefined
          user[key] = undefined
        }
      }
      state.user = extend(state.user, user)
      let currentUser = JSON.parse(localStorage.getItem('user'))
      for (const friend of user.friends) {
        friend.activityStatus = undefined
      }
      currentUser = extend(currentUser, user)
      localStorage.setItem('user', JSON.stringify(currentUser))
      // state.loading = false
    },
    [update.rejected]: (state, action) => {
      state.error = action.payload.error
      // state.loading = false
    },
    [addFriend.pending]: (state, action) => {
      // state.loading = true
    },
    [addFriend.fulfilled]: (state, action) => {
      state.user.followings.push({
        _id: action.payload.userIdAdded,
        name: action.payload.name
      })
      let currentUser = JSON.parse(localStorage.getItem('user'))
      for (const friend of state.user.friends) {
        friend.activityStatus = undefined
      }
      currentUser = extend(currentUser, state.user)
      localStorage.setItem('user', JSON.stringify(currentUser))
      // state.loading = false
    },
    [addFriend.rejected]: (state, action) => {
      state.error = action.payload.error
      // state.loading = false
    },
    [cancelFriendRequest.pending]: (state, action) => {
      console.log("cancel fr req pending")
    },
    [cancelFriendRequest.fulfilled]: (state, action) => {
      let followingId = action.payload.followingId
      let idx = state.user.followings.map(user => user._id).indexOf(followingId)
      state.user.followings.splice(idx, 1)
      let currentUser = JSON.parse(localStorage.getItem('user'))
      for (const friend of state.user.friends) {
        friend.activityStatus = undefined
      }
      currentUser = extend(currentUser, state.user)
      localStorage.setItem('user', JSON.stringify(currentUser))
    },
    [cancelFriendRequest.rejected]: (state, action) => {
      state.error = action.payload.error
    },
    [confirmFriendRequest.pending]: (state, action) => {
      console.log("confirm fr request peding")
    },
    [confirmFriendRequest.fulfilled]: (state, action) => {
      let newFriend = action.payload.newFriend
      let followerIdx = state.user.followers.indexOf(action.payload.followerId)
      state.user.followers.splice(followerIdx, 1)
      state.user.friends.push(newFriend)
      let currentUser = JSON.parse(localStorage.getItem('user'))
      for (const friend of state.user.friends) {
        friend.activityStatus = undefined
      }
      currentUser = extend(currentUser, state.user)
      localStorage.setItem('user', JSON.stringify(currentUser))
    },
    [confirmFriendRequest.rejected]: (state, action) => {
      state.error = action.payload.error
    },
    [unfriend.pending]: (state, action) => {
      console.log('unfriend pending')
    },
    [unfriend.fulfilled]: (state, action) => {
      let friendId = action.payload.friendId
      let friendIdx = state.user.friends.map(user => user._id).indexOf(friendId)
      if (friendIdx > -1) {
        state.user.friends.splice(friendIdx, 1)
      }
      let currentUser = JSON.parse(localStorage.getItem('user'))
      for (const friend of state.user.friends) {
        friend.activityStatus = undefined
      }
      currentUser = extend(currentUser, state.user)
      localStorage.setItem('user', JSON.stringify(currentUser))
    },
    [unfriend.rejected]: (state, action) => {
      state.error = action.payload.error
    },
    [removeFollower.pending]: (state, action) => {
      console.log('remove fr req pending')
    },
    [removeFollower.fulfilled]: (state, action) => {
      let { followerId } = action.payload
      let idx = state.user.followers.map(user => user._id).indexOf(followerId)
      if (idx >= 0) {
        state.user.followers.splice(idx, 1)
      }
      let currentUser = JSON.parse(localStorage.getItem('user'))
      for (const friend of state.user.friends) {
        friend.activityStatus = undefined
      }
      currentUser = extend(currentUser, state.user)
      localStorage.setItem('user', JSON.stringify(currentUser))
    },
    [removeFollower.rejected]: (state, action) => {
      state.error = action.payload.error
    }
  }
})

export const { isAuthenticated, signout,
  onFriendOnline, onFriendOffline } = userSlice.actions

export default userSlice.reducer