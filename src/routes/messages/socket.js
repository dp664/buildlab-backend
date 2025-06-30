const { Server } = require("socket.io");
const { queryDatabase } = require('../../services/dbQuery');
const APP_CONFIG = require('../../../config');
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const users = new Map(); // userId -> socketId

console.log("Initializing socket...");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cookie: true,
    cors: {
      origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    let userId = null;

    // Parse and verify JWT from cookie
    if (socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      console.log("cookie is", cookie)
      const userToken = cookies['bl_auth'];
console.log("user_token", userToken)
      if (userToken) {
        try {
          const decoded = jwt.verify(userToken, APP_CONFIG.BL_AUTH_SECRET_KEY);
          userId = decoded.userId;

          users.set(userId, socket.id);
          console.log(`User ${userId} connected.`);

          // Notify all users that this user is online
          const allUsers = await getAllUsers();
          notifyUsersStatus(io, allUsers.filter(id => id !== userId), userId, true);
        } catch (err) {
          console.error("Invalid token:", err.message);
        }
      }
    }

    // On-demand status check
    socket.on("checkOnlineStatus", ({ userId: targetId }, callback) => {
      const isOnline = users.has(targetId);
      callback({ userId: targetId, isOnline });
    });

    // Sending a message
    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      try {
        const receiverSocketId = users.get(receiverId);

        const result = await queryDatabase(
          "INSERT INTO messages (sender_id, receiver_id, message, status) VALUES ($1, $2, $3, $4) RETURNING id",
          [senderId, receiverId, message, "sent"]
        );

        const messageId = result[0]?.id;

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", { id: messageId, senderId, message });
          await queryDatabase("UPDATE messages SET status = $1 WHERE id = $2", ["delivered", messageId]);
        }
      } catch (err) {
        console.error("sendMessage error:", err.message);
      }
    });

    // Handle message delivery confirmation
    socket.on("messageDelivered", async ({ messageId }) => {
      try {
        await queryDatabase("UPDATE messages SET status = $1 WHERE id = $2", ["delivered", messageId]);
      } catch (err) {
        console.error("Error updating message status:", err.message);
      }
    });

    // Handle notification events
    socket.on("sendNotification", async (notificationData) => {
      try {
        const { receiverId, type, content, url, created_by } = notificationData;
        
        // Store notification in database
        const result = await queryDatabase(
          "INSERT INTO notifications (created_for_id, type, content, created_by, is_read, url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [receiverId, type, content, created_by, false, url || null]
        );

        const savedNotification = result[0];
        
        // Send to receiver if online
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveNotification", {
            id: savedNotification.id,
            type: savedNotification.type,
            content: savedNotification.content,
            created_by: savedNotification.created_by,
            created_at: savedNotification.created_at,
            url: savedNotification.url,
            is_read: savedNotification.is_read
          });
        }
      } catch (err) {
        console.error("sendNotification error:", err.message);
      }
    });

    // Mark notification as read
    socket.on("markNotificationRead", async ({ notificationId }, callback) => {
      try {
        await queryDatabase(
          "UPDATE notifications SET is_read = true WHERE id = $1 AND created_for_id = $2",
          [notificationId, userId]
        );
        
        if (callback) {
          callback({ success: true });
        }
      } catch (err) {
        console.error("Error marking notification as read:", err.message);
        if (callback) {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Get unread notifications count
    socket.on("getUnreadNotificationsCount", async (callback) => {
      try {
        const result = await queryDatabase(
          "SELECT COUNT(*) as count FROM notifications WHERE created_for_id = $1 AND is_read = false",
          [userId]
        );
        
        const count = parseInt(result[0]?.count || 0);
        if (callback) {
          callback({ count });
        }
      } catch (err) {
        console.error("Error getting unread notifications count:", err.message);
        if (callback) {
          callback({ count: 0, error: err.message });
        }
      }
    });

    // Get user notifications
    socket.on("getUserNotifications", async ({ limit = 20, offset = 0 }, callback) => {
      try {
        const result = await queryDatabase(
          `SELECT n.*, u.name as creator_name 
           FROM notifications n 
           LEFT JOIN users u ON n.created_by = u.id 
           WHERE n.created_for_id = $1 
           ORDER BY n.created_at DESC 
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        );
        
        if (callback) {
          callback({ notifications: result });
        }
      } catch (err) {
        console.error("Error getting user notifications:", err.message);
        if (callback) {
          callback({ notifications: [], error: err.message });
        }
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      if (userId) {
        users.delete(userId);
        console.log(`User ${userId} disconnected.`);

        // Notify all users that this user is offline
        const allUsers = await getAllUsers();
        notifyUsersStatus(io, allUsers.filter(id => id !== userId), userId, false);
      }
    });
  });

  return io;
};

// Helper: Get user's relevant contacts
async function getUserContacts(userId) {
  try {
    const result = await queryDatabase(
      `SELECT DISTINCT 
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as contact_id
      FROM messages 
      WHERE sender_id = $1 OR receiver_id = $1`,
      [userId]
    );
    return result.map(row => row.contact_id);
  } catch (err) {
    console.error("Error fetching contacts:", err.message);
    return [];
  }
}

// Helper: Notify contacts about user's status
function notifyUsersStatus(io, userIds, userId, isOnline) {
  userIds.forEach(contactId => {
    const socketId = users.get(contactId);
    if (socketId) {
      io.to(socketId).emit(isOnline ? "userOnline" : "userOffline", { userId });
    }
  });
}

async function getAllUsers() {
  try {
    const result = await queryDatabase(
      `SELECT id FROM users WHERE role IN ('student', 'mentor')`,
      []
    );
    return result.map(row => row.id);
  } catch (err) {
    console.error("Error fetching all users:", err.message);
    return [];
  }
}

module.exports = initializeSocket;
module.exports.users = users;


// const { Server } = require("socket.io");
// const { queryDatabase } = require('../../services/dbQuery');
// const APP_CONFIG = require('../../../config');
// const cookie = require("cookie");
// const jwt = require("jsonwebtoken");

// const users = new Map(); // userId -> socketId

// console.log("Initializing socket...");

// const initializeSocket = (server) => {
//   const io = new Server(server, {
//     cookie: true,
//     cors: {
//       origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'],
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   io.on("connection", async (socket) => {
//   let userId = null;

//   // Parse and verify JWT from cookie
//   if (socket.handshake.headers.cookie) {
//     const cookies = cookie.parse(socket.handshake.headers.cookie);
//     const userToken = cookies['bl_auth'];

//     if (userToken) {
//       try {
//         const decoded = jwt.verify(userToken, APP_CONFIG.BL_AUTH_SECRET_KEY);
//         userId = decoded.userId;

//         users.set(userId, socket.id);
//         console.log(`User ${userId} connected.`);

//         // Notify all users that this user is online (not just contacts)
//         // This ensures the online status is visible to everyone
//         const allUsers = await getAllUsers();
//         notifyUsersStatus(io, allUsers.filter(id => id !== userId), userId, true);
//       } catch (err) {
//         console.error("Invalid token:", err.message);
//       }
//     }
//   }

//   // On-demand status check
//   socket.on("checkOnlineStatus", ({ userId: targetId }, callback) => {
//     const isOnline = users.has(targetId);
//     callback({ userId: targetId, isOnline });
//   });

//   // Sending a message
//   socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
//     try {
//       const receiverSocketId = users.get(receiverId);

//       const result = await queryDatabase(
//         "INSERT INTO messages (sender_id, receiver_id, message, status) VALUES ($1, $2, $3, $4) RETURNING id",
//         [senderId, receiverId, message, "sent"]
//       );

//       const messageId = result[0]?.id;

//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("receiveMessage", { id: messageId, senderId, message });
//         await queryDatabase("UPDATE messages SET status = $1 WHERE id = $2", ["delivered", messageId]);
//       }
//     } catch (err) {
//       console.error("sendMessage error:", err.message);
//     }
//   });

//   socket.on("messageDelivered", async ({ messageId }) => {
//     try {
//       await queryDatabase("UPDATE messages SET status = $1 WHERE id = $2", ["delivered", messageId]);
//     } catch (err) {
//       console.error("Error updating message status:", err.message);
//     }
//   });

//   // Handle disconnection
//   socket.on("disconnect", async () => {
//     if (userId) {
//       users.delete(userId);
//       console.log(`User ${userId} disconnected.`);

//       // Notify all users that this user is offline
//       const allUsers = await getAllUsers();
//       notifyUsersStatus(io, allUsers.filter(id => id !== userId), userId, false);
//     }
//   });
// });

//   return io;
// };

// // 🔍 Helper: Get user’s relevant contacts (adjust query as needed)
// async function getUserContacts(userId) {
//   try {
//     // Get all users who have exchanged messages with this user
//     const result = await queryDatabase(
//       `SELECT DISTINCT 
//         CASE 
//           WHEN sender_id = $1 THEN receiver_id 
//           ELSE sender_id 
//         END as contact_id
//       FROM messages 
//       WHERE sender_id = $1 OR receiver_id = $1`,
//       [userId]
//     );
//     return result.map(row => row.contact_id);
//   } catch (err) {
//     console.error("Error fetching contacts:", err.message);
//     return [];
//   }
// }


// // 🔔 Helper: Notify contacts about user's status
// function notifyUsersStatus(io, userIds, userId, isOnline) {
//   userIds.forEach(contactId => {
//     const socketId = users.get(contactId);
//     if (socketId) {
//       io.to(socketId).emit(isOnline ? "userOnline" : "userOffline", { userId });
//     }
//   });
// }

// async function getAllUsers() {
//   try {
//     const result = await queryDatabase(
//       `SELECT id FROM users WHERE role IN ('student', 'mentor')`,
//       []
//     );
//     return result.map(row => row.id);
//   } catch (err) {
//     console.error("Error fetching all users:", err.message);
//     return [];
//   }
// }


// module.exports = initializeSocket;
