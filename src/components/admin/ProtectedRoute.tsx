import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

type Props = {
  children: ReactNode;
  redirectTo?: string;
};

export default function ProtectedRoute({ children, redirectTo = "/admin" }: Props) {
  const { isLoading, userId } = useAuth();
  const { isLoading: isRoleLoading, isAdmin } = useIsAdmin(userId);

  if (isLoading || isRoleLoading) return null;
  if (!userId) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}
