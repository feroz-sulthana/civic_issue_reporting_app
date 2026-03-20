  exports.updateProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const { name, username, phone, state } = req.body;

      if (name !== undefined) user.name = name;
      if (username !== undefined) user.username = username;
      if (phone !== undefined) user.phone = phone;
      if (state !== undefined) user.state = state;

      await user.save();

      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  };