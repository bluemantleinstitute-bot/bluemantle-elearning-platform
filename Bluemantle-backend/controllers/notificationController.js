const Notification = require("../models/Notification");

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Notification.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error(`Error in getNotifications: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Mark notifications as read
// @route   POST /api/notifications/read
// @access  Private
exports.markAsRead = async (req, res) => {
  const { notificationId, markAll } = req.body;

  try {
    if (markAll) {
      await Notification.updateMany(
        { userId: req.user.id, isRead: false },
        { $set: { isRead: true } }
      );
      
      return res.json({
        success: true,
        message: "All notifications marked as read",
        data: {}
      });
    }

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Please provide notificationId or set markAll to true"
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (err) {
    console.error(`Error in markAsRead: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
