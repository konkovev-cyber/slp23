import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useRole, AppRole } from "@/hooks/use-role";

type Props = {
    children: ReactNode;
    allowedRoles?: AppRole[];
    redirectTo?: string;
};

export default function SchoolProtectedRoute({
    children,
    allowedRoles = ['student', 'teacher', 'admin', 'parent', 'moderator'],
    redirectTo = "/admin"
}: Props) {
    const location = useLocation();
    const { isLoading, userId } = useAuth();
    const { isLoading: isRoleLoading, role } = useRole(userId);

    if (isLoading || isRoleLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!userId) {
        const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate to={`/admin?redirect=${redirect}`} replace />;
    }

    // If role is admin, allow everything
    if (role === 'admin') return <>{children}</>;

    if (role && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
