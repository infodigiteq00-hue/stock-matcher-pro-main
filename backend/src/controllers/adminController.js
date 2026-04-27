const { listUsersForAdmin, updateUserStatusByAdmin, updateUserPaymentStatusByAdmin, } = require("../services/adminService");

const fetchUsersAdminView = async (_req, res) => 
{
  const payload = await listUsersForAdmin();
  res.json(payload);
};

const updateUserStatus = async (req, res) => 
{
  const { id } = req.params;
  const { status } = req.body || {};
  const user = await updateUserStatusByAdmin(id, status);
  res.json(
  {
    message: "User status updated.",
    user,
  }
);
};

const updateUserPaymentStatus = async (req, res) => 
{
  const { id } = req.params;
  const { paymentStatus } = req.body || {};
  const user = await updateUserPaymentStatusByAdmin(id, paymentStatus);
  res.json(
  {
    message: "User payment status updated.",
    user,
  }
  );
};

module.exports = { fetchUsersAdminView, updateUserStatus, updateUserPaymentStatus, };
