import React, { useState } from 'react';
import PostList from '../PostList';
import FriendStatusList from './FriendStatusList';
import InputForm from '../InputForm';
import styles from './home.module.scss';
const HomeComponent = () => {
    return (
        <div className={styles["home-component"]}>
            <div className={styles["home-middle"]}>
                <FriendStatusList />
                <div className="post-form">
                    <InputForm />
                </div>
                <div className="post-article">
                    <PostList />
                </div>
            </div>

        </div>
    );

}

export default HomeComponent;