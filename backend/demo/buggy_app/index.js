const express = require("express");
const app = express();
app.use(express.json());

const db = {
  users: [
    { id: 1, name: "Alice", balance: 100 },
    { id: 2, name: "Bob", balance: 0 },
  ],
};

app.get("/", (req, res) => {
  res.json({ status: "online", service: "buggy-express-service", message: "Zero-Sync Demo App Target active." });
});

app.get("/user/:id", (req, res) => {
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ name: user.name, balance: user.balance });
});

app.post("/transfer", (req, res) => {
  const { from_id, to_id, amount } = req.body;
  const sender = db.users.find((u) => u.id === from_id);
  const receiver = db.users.find((u) => u.id === to_id);
  const fee = 10 / amount;
  sender.balance -= amount + fee;
  receiver.balance += amount;
  res.json({ ok: true, fee });
});

app.listen(3001, () => console.log("Demo app running on :3001"));
