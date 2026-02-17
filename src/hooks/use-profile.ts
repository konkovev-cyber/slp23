import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'moderator' | 'teacher' | 'student' | 'parent' | 'user';

type Profile = {
    id: string;
    auth_id: string;
    role: AppRole;
    is_approved: boolean;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
};

type State = {
    isLoading: boolean;
    role: AppRole | null;
    profile: Profile | null;
    isApproved: boolean;
    refresh: () => Promise<void>;
};

export function useProfile(): State {
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        // Try getting from profiles table
        const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
        }

        if (profileData) {
            setProfile(profileData as any as Profile);
        } else {
            // Create profile if missing
            const { data: newProfile } = await supabase
                .from('profiles')
                .insert([{ auth_id: user.id, full_name: '', role: 'student', is_approved: false } as any])
                .select()
                .single();
            setProfile(newProfile as any as Profile);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return {
        isLoading,
        role: profile?.role || null,
        profile,
        isApproved: !!profile?.is_approved || profile?.role === 'admin',
        refresh: fetchProfile
    };
}
