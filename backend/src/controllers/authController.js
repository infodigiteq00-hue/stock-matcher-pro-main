const { signupUser, loginUser } = require("../services/authService");

const signup = async (req, res) => 
{
  const user = await signupUser(req.body || {});
  res.status(201).json(
  {
    message: "Signup successful.",
    role: "user",
    user,
  }
);
};

const login = async (req, res) => 
{
  const result = await loginUser(req.body || {});
  res.json(
  {
    message: "Login successful.",
    ...result,
  }
);
};

module.exports = { signup, login, };
