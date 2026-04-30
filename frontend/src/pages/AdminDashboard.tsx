import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, BadgeCheck, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  type AdminUser,
  fetchAdminUsers,
  updateUserPaymentStatusByAdmin,
  updateUserStatusByAdmin,
} from "@/lib/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatDate = (value: string | null) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const authUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("authUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateUserStatusByAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Updated", description: "User status updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update user status.",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: updateUserPaymentStatusByAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Updated", description: "User payment status updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update payment status.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authRole");
    navigate("/login");
  };

  const setStatus = (user: AdminUser, status: "active" | "paused") => {
    if (user.status === status || updateStatusMutation.isPending) {
      return;
    }
    updateStatusMutation.mutate({ userId: user.id, status });
  };

  const setPaymentStatus = (user: AdminUser, paymentStatus: "paid" | "unpaid") => {
    if (user.paymentStatus === paymentStatus || updatePaymentMutation.isPending) {
      return;
    }
    updatePaymentMutation.mutate({ userId: user.id, paymentStatus });
  };

  const summary = usersQuery.data?.summary;
  const users = usersQuery.data?.users ?? [];
  const summaryCards = [
    {
      label: "Total Users",
      value: summary?.totalUsers ?? 0,
      icon: <Users size={18} />,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Active Users",
      value: summary?.activeUsers ?? 0,
      icon: <UserCheck size={18} />,
      color: "bg-success/10 text-success",
    },
    {
      label: "Paused Users",
      value: summary?.pausedUsers ?? 0,
      icon: <UserX size={18} />,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Paid Users",
      value: summary?.paidUsers ?? 0,
      icon: <BadgeCheck size={18} />,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 sm:py-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Shield size={18} />
              </span>
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage user access and payment states from one place.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="rounded-lg bg-secondary/60 px-3 py-2 text-xs sm:text-sm text-muted-foreground truncate flex-1 sm:flex-none">
              {authUser?.email || "Admin"}
            </span>
            <Button type="button" variant="destructive" className="shrink-0" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <Card className="glass-card rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {usersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : usersQuery.isError ? (
              <p className="text-sm text-destructive">
                {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load users."}
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {users.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground">No users found.</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="rounded-xl border border-border/60 bg-background/50 p-3 space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium break-all">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Created: {formatDate(user.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">Last Login: {formatDate(user.lastLogin)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.status === "active" ? "secondary" : "destructive"}>{user.status}</Badge>
                          <Badge variant={user.paymentStatus === "paid" ? "default" : "outline"}>
                            {user.paymentStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => setStatus(user, "active")}
                          >
                            Set Active
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => setStatus(user, "paused")}
                          >
                            Set Paused
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updatePaymentMutation.isPending}
                            onClick={() => setPaymentStatus(user, "paid")}
                          >
                            Mark Paid
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updatePaymentMutation.isPending}
                            onClick={() => setPaymentStatus(user, "unpaid")}
                          >
                            Mark Unpaid
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/40">
                        <TableHead>Email</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} className="hover:bg-secondary/30">
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>{formatDate(user.lastLogin)}</TableCell>
                            <TableCell>
                              <Badge variant={user.status === "active" ? "secondary" : "destructive"}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.paymentStatus === "paid" ? "default" : "outline"}>
                                {user.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={updateStatusMutation.isPending}
                                  onClick={() => setStatus(user, "active")}
                                >
                                  Set Active
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={updateStatusMutation.isPending}
                                  onClick={() => setStatus(user, "paused")}
                                >
                                  Set Paused
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={updatePaymentMutation.isPending}
                                  onClick={() => setPaymentStatus(user, "paid")}
                                >
                                  Mark Paid
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={updatePaymentMutation.isPending}
                                  onClick={() => setPaymentStatus(user, "unpaid")}
                                >
                                  Mark Unpaid
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
