import supabaseClient, { supabaseUrl } from "@/utils/supabase";


// - Apply to job ( candidate )
export async function applyToJob(token, _, jobData) {
  const supabase = await supabaseClient(token);
  console.log("Received jobData:", jobData);
  const random = Math.floor(Math.random() * 90000);
  const fileName = `resume-${random}-${jobData.candidate_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, jobData.resume);

  if (storageError) throw new Error("Error uploading Resume");

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        ...jobData,
        resume,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Application");
  }
  

  return data;
}
//update applications

export async function updateApplicationStatus(token, { job_id, candidate_id, status }) {
  const supabase = await supabaseClient(token);
  
  try {
    const { data, error } = await supabase
      .from("applications")
      .update({ status: status })
      .eq("job_id", job_id)
      .eq("candidate_id", candidate_id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
}

export async function getApplications(token, { job_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      user:users (
        name,
        email
      )
    `)
    .eq("job_id", job_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return null;
  }

  // Transform the data to include user information directly
  const transformedData = data.map(app => ({
    ...app,
    user_name: app.user?.name || app.user_name,
    user_email: app.user?.email || app.user_email
  }));

  console.log("Transformed applications data:", transformedData);
  return transformedData;
}

export async function getAppliedApplications(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs (
        *,
        company:companies (
          name,
          logo_url
        )
      )
    `)
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return [];
  }

  console.log("Fetched applications:", data);
  return data;
}

export async function getUserSkills(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("skills")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return [];
  }

  return data;
}