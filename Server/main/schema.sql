CREATE TABLE users(
    uid SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    email_verified BOOLEAN,
    date_created DATE,
    last_login DATE
);

CREATE TABLE posts (
    pid SERIAL PRIMARY KEY,
    title VARCHAR(255),
    body TEXT,
    user_id INT REFERENCES users(uid),
    author VARCHAR(255) REFERENCES users(username),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    like_user_id INT[] DEFAULT ARRAY[]::INT[],
    likes INT DEFAULT 0
);

CREATE TABLE comments(
    cid SERIAL PRIMARY KEY,
    comment VARCHAR(255),
    author VARCHAR REFERENCES users(username),
    user_id INT REFERENCES users(uid),
    post_id INT REFERENCES posts(pid),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE messages(
mid SERIAL PRIMARY KEY,
    message_sender VARCHAR(255) REFERENCES users(username),
    message_to VARCHAR(255) REFERENCES users(username),
    message_title VARCHAR(255),
    message_body VARCHAR(255),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE appointments (
    aid SERIAL PRIMARY KEY,
    title VARCHAR(10),
    start_time TIMESTAMP WITH TIME ZONE UNIQUE,
    end_time TIMESTAMP WITH TIME ZONE UNIQUE
);
