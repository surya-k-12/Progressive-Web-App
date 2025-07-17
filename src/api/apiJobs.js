import supabaseClient from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";

// Fetch Jobs
export async function getJobs(token, { location, company_id, searchQuery, appliedJobIds = [] }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)")
    .eq("isOpen", true);

  if (location) {
    query = query.eq("location", location);
  }

  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  // Filter out applied jobs
  const filteredJobs = data.filter(job => !appliedJobIds.includes(job.id));
  console.log("Applied Jobs:", appliedJobIds);
  console.log("Filtered Jobs:", filteredJobs);
  return filteredJobs;
}

// Read Saved Jobs
export async function getSavedJobs(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))");

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

// Read single job
export async function getSingleJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select(
      "*, company: companies(name,logo_url), applications: applications(*)"
    )
    .eq("id", job_id)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }

  return data;
}

// - Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = await supabaseClient(token);

  if (alreadySaved) {
    // If the job is already saved, remove it
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (deleteError) {
      console.error("Error removing saved job:", deleteError);
      return data;
    }

    return data;
  } else {
    // If the job is not saved, add it to saved jobs
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (insertError) {
      console.error("Error saving job:", insertError);
      return data;
    }

    return data;
  }
}

// - job isOpen toggle - (recruiter_id = auth.uid())
export async function updateHiringStatus(token, { job_id }, isOpen) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .select();

  if (error) {
    console.error("Error Updating Hiring Status:", error);
    return null;
  }

  return data;
}

// get my created jobs
export async function getMyJobs(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .select(`
      *,
      company: companies(name,logo_url),
      applications: applications(*)
    `)
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);

  const { data, error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    console.error("Error deleting job:", deleteError);
    return data;
  }

  return data;
}

// - post job
export async function addNewJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  // Validate required fields
  if (!jobData.recruiter_id) {
    throw new Error("Recruiter ID is required");
  }

  // Ensure all required fields are present
  const jobToInsert = {
    title: jobData.title || '',
    description: jobData.description || '',
    location: jobData.location || '',
    company_id: jobData.company_id || null,
    requirements: jobData.requirements || '',
    salary: jobData.salary || '',
    recruiter_id: jobData.recruiter_id,
    isOpen: jobData.isOpen !== undefined ? jobData.isOpen : true,
    deadline: jobData.deadline || new Date().toISOString().split('T')[0],
    job_type: jobData.job_type || 'in_office'
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert([jobToInsert])
    .select();

  if (error) {
    console.error("Error creating job:", error);
    throw new Error("Error Creating Job: " + error.message);
  }

  return data;
}

// Get recommended jobs based on user skills
export async function getRecommendedJobs(token, userSkills, appliedJobIds = []) {
  const supabase = await supabaseClient(token);
  
  // Get all jobs
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)");

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  // Filter out applied jobs and closed jobs
  const availableJobs = jobs.filter(job => 
    !appliedJobIds.includes(job.id) && 
    job.isOpen === true
  );

  // Convert user skills to lowercase for case-insensitive matching
  const userSkillsLower = userSkills.map(skill => skill.toLowerCase());

  // Calculate match score for each job
  const jobsWithScores = availableJobs.map(job => {
    // Split job requirements into words and convert to lowercase
    const jobRequirements = job.requirements.toLowerCase().split(/[\s,]+/);
    
    // Count matching skills
    const matchingSkills = jobRequirements.filter(req => 
      userSkillsLower.some(skill => req.includes(skill))
    ).length;

    // Calculate match percentage
    const matchPercentage = (matchingSkills / userSkillsLower.length) * 100;

    return {
      ...job,
      matchScore: matchPercentage
    };
  });

  // Sort jobs by match score in descending order and take only top 4
  return jobsWithScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

// Get recently posted jobs
export async function getRecentJobs(token, limit = 3) {
  const supabase = await supabaseClient(token);
  
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)")
    .eq("isOpen", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent jobs:", error);
    return [];
  }

  return jobs;
}