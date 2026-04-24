const express = require("express");
const cors = require("cors");
const path = require("path");
const { processData } = require("./logic");

const app = express();

app.use(cors());
app.use(express.json());


const USER_ID = "dikshanaamuthukumar_12082005";
const EMAIL_ID = "dikshamuthukumar@gmail.com";
const ROLL_NUMBER = "RA2311056010148";

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "data must be an array" });
    }
    const result = processData(data);
    return res.status(200).json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: ROLL_NUMBER,
      ...result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));