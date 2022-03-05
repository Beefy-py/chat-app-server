const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Server Is running ");
});

module.exports = router;
