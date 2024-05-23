var express = require("express");
var router = express.Router();
var pool = require("./db");

/*
Post Routes Section
*/

router.get("/api/get/allposts", (req, res, next) => {
  pool.query(
    `SELECT * FROM posts ORDER BY date_created DESC LIMIT 10 OFFSET 0`,
    (q_err, q_res) => {
      if (q_err) return next(q_err); // 正确处理错误
      res.json(q_res.rows);
    }
  );
});

router.get('/api/get/searchpost', (req, res, next) => {
  const searchitem = `%${req.query.searchitem}%`; // 使用查询参数，并添加%以进行模糊匹配
  pool.query(
    `SELECT * FROM posts WHERE title ILIKE $1 OR body ILIKE $1 ORDER BY date_created DESC`,
    [searchitem],
    (q_err, q_res) => {
      if (q_err) return next(q_err); // 正确处理错误
      res.json(q_res.rows);
    }
  );
});


router.get("/api/get/post/:post_id", (req, res, next) => {
  const post_id = req.params.post_id;

  pool.query(`SELECT * FROM posts WHERE pid=$1`, [post_id], (q_err, q_res) => {
    if (q_err) return next(q_err);
    if (q_res.rows.length > 0) {
      res.json(q_res.rows[0]); // 返回查询结果中的第一条
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  });
});

router.post("/api/post/poststodb", (req, res, next) => {
  const values = [
    req.body.title,
    req.body.body,
    req.body.user_id,
    req.body.username,
  ];
  pool.query(
    `INSERT INTO posts (title, body, user_id, author, date_created)
       VALUES ($1, $2, $3, $4, NOW())`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.put("/api/put/post", (req, res, next) => {
  const values = [
    req.body.title,
    req.body.body,
    req.body.user_id,
    req.body.pid,
    req.body.username,
  ];
  pool.query(
    `UPDATE posts SET title=$1, body=$2, user_id=$3, author=$5, date_created=NOW() WHERE pid=$4`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.put("/api/put/likes", (req, res, next) => {
  const uid = [req.body.uid];
  const post_id = String(req.body.post_id);
  const values = [uid, post_id];

  pool.query(
    `UPDATE posts SET like_user_id = like_user_id || $1, likes = likes +1 WHERE NOT (like_user_id @> $1) AND pid=$2`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.put("/api/put/unlike", (req, res, next) => {
  const { uid, post_id } = req.body;

  pool.query(
    `UPDATE posts 
     SET like_user_id = array_remove(like_user_id, $1), 
         likes = likes - 1 
     WHERE pid = $2 AND $1 = ANY(like_user_id)`,
    [uid, post_id],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});







router.delete("/api/delete/postcomments", (req, res, next) => {
  const post_id = req.body.post_id;
  pool.query(
    `DELETE FROM comments WHERE post_id=$1`,
    [post_id],
    (q_err, q_res) => {
      if (q_err) return next(q_err); // 正确处理错误
      res.json(q_res.rows);
    }
  );
});



router.delete("/api/delete/post", (req, res, next) => {
  const post_id = req.body.post_id;
  pool.query(`DELETE FROM posts WHERE pid=$1`, [post_id], (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json(q_res.rows);
  });
});

/*
Comment Route Section
*/

router.post("/api/post/commenttodb", (req, res, next) => {
  console.log("Request body:", req.body); // 打印请求体

  const { comment, user_id, username, post_id } = req.body;

  // 检查所有必需的字段是否存在
  if (!comment || !user_id || !username || !post_id) {
    console.error("Missing required fields", {
      comment,
      user_id,
      username,
      post_id,
    }); // 打印缺失的字段
    return res.status(400).json({ error: "Missing required fields" });
  }

  const values = [comment, username, user_id, post_id];

  pool.query(
    `INSERT INTO comments (comment, author, user_id, post_id, date_created)
       VALUES ($1, $2, $3, $4, NOW())`,
    values,
    (q_err, q_res) => {
      if (q_err) {
        console.error("Database error:", q_err); // 打印数据库错误
        return next(q_err);
      }
      res.status(201).json({ message: "Comment added successfully" });
    }
  );
});

router.put("/api/put/commenttodb", (req, res, next) => {
  const values = [
    req.body.comment,
    req.body.user_id,
    req.body.post_id,
    req.body.username,
    req.body.cid,
  ];
  pool.query(
    `UPDATE comments SET comment=$1, user_id=$2, post_id=$3, author=$4, date_created=NOW()
       WHERE cid=$5`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.delete("/api/delete/comment", (req, res, next) => {
  const cid = req.body.cid;

  pool.query(
    `DELETE FROM comments
      WHERE cid=$1`,
    [cid],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

/*router.delete('/api/delete/comment/:cid', (req, res, next) => {
  const cid = req.params.cid; // 使用 req.params 来获取 URL 参数

  pool.query(
    `DELETE FROM comments WHERE cid=$1`,
    [cid],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json({ message: 'Comment deleted successfully' });
    }
  );
});
 */

// router.get("/api/get/allpostcomments/:post_id", (req, res, next) => {
//   const post_id = String(req.query.post_id);

//   pool.query(
//     `SELECT * FROM comments WHERE post_id=$1`,
//     [post_id],
//     (q_err, q_res) => {
//       if (q_err) return next(q_err);
//       res.json(q_res.rows); // 返回查询结果
//     }
//   );
// });

router.get("/api/get/allpostcomments/:post_id", (req, res, next) => {
  const post_id = req.params.post_id;

  pool.query(
    `SELECT * FROM comments WHERE post_id=$1 ORDER BY date_created DESC LIMIT 10 OFFSET 0`,
    [post_id],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      if (q_res.rows.length > 0) {
        res.json(q_res.rows); // 返回查询结果
      } else {
        res.status(404).json({ error: "Comments not found" });
      }
    }
  );
});

/*
User Section
*/
router.post("/api/post/userprofiletodb", (req, res, next) => {
  console.log("Request body:", req.body); // Debug log

  const { nickname, email, email_verified } = req.body;

  // 检查所有必需的字段是否存在
  if (!nickname || !email || email_verified === undefined) {
    console.error("Missing required fields"); // Debug log
    return res.status(400).json({ error: "Missing required fields" });
  }

  const values = [nickname, email, email_verified];
  pool.query(
    `INSERT INTO users (username, email, email_verified, date_created)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT DO NOTHING`, // 指定冲突的目标列
    values,
    (q_err, q_res) => {
      if (q_err) {
        console.error("Database error:", q_err); // Debug log
        return next(q_err);
      }
      console.log("User profile saved successfully"); // Debug log
      res.status(200).json({ message: "User profile saved successfully" });
    }
  );
});

router.get("/api/get/userprofilefromdb", (req, res, next) => {
  const username = String(req.query.username); // 使用 req.query 获取 GET 请求的查询参数

  pool.query(
    `SELECT * FROM users WHERE username=$1`,
    [username],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows); // 返回查询结果
    }
  );
});

router.get("/api/get/userposts", (req, res, next) => {
  const user_id = String(req.query.user_id); // 使用 req.query 获取 GET 请求的查询参数

  pool.query(
    `SELECT * FROM posts WHERE user_id=$1`,
    [user_id],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows); // 返回查询结果
    }
  );
});

// router.get("/hello", function (req, res) {
//   res.json("hello from express");
// });


router.get('/api/get/authorprofilefromdb', (req, res, next) => {
  const username = String(req.query.username);

  pool.query(
    `SELECT * FROM users WHERE username=$1`,
    [username],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.get('/api/get/otheruserposts', (req, res, next) => {
  const username = String(req.query.username);

  pool.query(
    `SELECT * FROM posts WHERE author=$1`,
    [username],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.get('/api/get/allusers', (req, res, next) => {
  pool.query(`SELECT * FROM users`, (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json(q_res.rows);
  });
});

router.delete('/api/delete/usercomments', (req, res, next) => {
  const uid = req.body.uid;
  pool.query(`DELETE FROM comments WHERE user_id=$1`, [uid], (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json({ message: 'User comments deleted successfully' });
  });
});

router.get('/api/get/user_postids', (req, res, next) => {
  const uid = req.query.uid;
  pool.query(`SELECT pid FROM posts WHERE user_id=$1`, [uid], (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json(q_res.rows);
  });
});

router.delete('/api/delete/userpostcomments', (req, res, next) => {
  const post_id = req.body.post_id;
  pool.query(`DELETE FROM comments WHERE post_id=$1`, [post_id], (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json({ message: 'Post comments deleted successfully' });
  });
});

router.delete('/api/delete/userposts', (req, res, next) => {
  const uid = req.body.uid;
  pool.query(`DELETE FROM posts WHERE user_id=$1`, [uid], (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json({ message: 'User posts deleted successfully' });
  });
});

router.delete('/api/delete/user', (req, res, next) => {
  const uid = req.body.uid;
  pool.query(`DELETE FROM users WHERE uid=$1`, [uid], (q_err, q_res) => {
    if (q_err) return next(q_err);
    res.json({ message: 'User deleted successfully' });
  });
});





/*
Message Section
*/

router.post('/api/post/messagetodb', (req, res, next) => {
  const from_username = String(req.body.message_sender);
  const to_username = String(req.body.message_to);
  const title = String(req.body.title);
  const body = String(req.body.body);

  if (!from_username || !to_username || !title || !body) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const values = [from_username, to_username, title, body];

  pool.query(
    `INSERT INTO messages(message_sender, message_to, message_title, message_body, date_created)
    VALUES($1, $2, $3, $4, NOW())`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.status(201).json({ message: "Message sent successfully" });
    }
  );
});

// 获取用户消息
router.get('/api/get/usermessages', (req, res, next) => {
  const username = String(req.query.username);

  pool.query(
    `SELECT * FROM messages WHERE message_to=$1`,
    [username],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

// 删除用户消息
router.delete('/api/delete/usermessage', (req, res, next) => {
  const mid = String(req.body.mid);

  pool.query(
    `DELETE FROM messages WHERE mid=$1`,
    [mid],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json({ message: "Message deleted successfully" });
    }
  );
});


/**
 * Appointment Section
 * 
 */

router.post('/api/post/appointment',(req,res,netx)=>{
  const values=[
    req.body.title,
    req.body.start_time,
    req.body.end_time
  ]
  pool.query(
      `INSERT INTO appointments(title,start_time,end_time)
      VALUES($1,$2,$3)`,
      values,
      (q_err, q_res) => {
        if (q_err) return next(q_err);
        res.json({ message: "Message deleted successfully" });
      }

  )
})


router.get("/api/get/allappointments", (req, res, next) => {
  pool.query(
    `SELECT * FROM appointments`,
    (q_err, q_res) => {
      if (q_err) return next(q_err); // 正确处理错误
      res.json(q_res.rows);
    }
  );
});


module.exports = router;
