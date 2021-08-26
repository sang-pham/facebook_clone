import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link'
import { Avatar, Input } from 'antd'
import { useSelector } from 'react-redux'
import styles from './MessageBoxs.module.scss'
import { baseURL } from '../../utils'
import { closeConversation } from '../../store/reducers/conversation.reducer'

export default function MessageBox({ conversation: {
  participant,
  _id
} }) {
  const userLogin = useSelector(state => state.userReducer.user)
  const [newMessage, setNewMessage] = useState('')
  const dispatch = useDispatch()

  const handleClose = (event) => {
    event.preventDefault()
    dispatch(closeConversation({
      _id
    }))
  }

  const sendMessage = event => {
    event.preventDefault()
  }

  return (
    <div className={styles.messageFrame}>
      <div className={styles.messageHeader}>
        <Link style={{ marginBottom: 0 }}
          href={`/profile/${participant._id}`}>
          <a>
            <Avatar src={`${baseURL}/api/user/avatar/${participant._id}`}
              style={{ marginRight: '10px' }}
            />
            <span>{participant.name}{"   "}{participant.activityStatus}</span>
          </a>
        </Link>

        <i style={{ cursor: 'pointer', padding: '10px' }}
          onClick={handleClose}
          className="fas fa-times"></i>
      </div>
      <div className={styles.messageInput}>
        <Input
          placeholder="Send message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onPressEnter={sendMessage}
          suffix={<i className="fas fa-arrow-right"></i>} />
      </div>
    </div>
  )
}