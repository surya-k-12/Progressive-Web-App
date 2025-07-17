 // Your existing client

import supabaseClient from "@/utils/supabase";
import { useUser } from "@clerk/clerk-react";

export const syncCandidateDetails = async (clerkUser) => {
  try {
    // Get Supabase access token from Clerk
    const supabaseAccessToken = await clerkUser.getToken({ template: 'supabase' });
    
    // Initialize Supabase client
    const supabase = await supabaseClient(supabaseAccessToken);
    
    // Prepare candidate data
    const candidateData = {
      id: clerkUser.id,
      name: clerkUser.fullName,
      email: clerkUser.primaryEmailAddress.emailAddress
    };

    // Upsert into candidate_details table
    const { data, error } = await supabase
      .from('candiadate_details')
      .upsert(candidateData, { onConflict: 'email' });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error syncing candidate details:', error);
    throw error;
  }
};