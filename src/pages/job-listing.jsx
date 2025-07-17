import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch";
import JobCard from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getCompanies } from "@/api/apiCompanies";
import { getJobs, getRecommendedJobs, getRecentJobs } from "@/api/apiJobs";
import { getAppliedApplications, getUserSkills } from "@/api/apiApplications";

const JobListing = () => {
  const { user } = useUser();
  const { session } = useSession();
  const navigate = useNavigate();
  const { isLoaded } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [company_id, setCompany_id] = useState("");
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: companies, fn: fnCompanies } = useFetch(getCompanies);
  const { loading: loadingJobs, data: jobs, fn: fnJobs } = useFetch(getJobs, {
    location,
    company_id,
    searchQuery,
    appliedJobIds: appliedJobs,
  });

  // Fetch all initial data in parallel
  const fetchInitialData = async () => {
    if (!isLoaded || !user?.id) return;

    setIsLoading(true);
    try {
      const supabaseAccessToken = await session.getToken({
        template: "supabase",
      });

      // Fetch all data in parallel
      const [companiesData, appliedData, skillsData, recentData] = await Promise.all([
        fnCompanies(),
        getAppliedApplications(supabaseAccessToken, { user_id: user.id }),
        getUserSkills(supabaseAccessToken, { user_id: user.id }),
        getRecentJobs(supabaseAccessToken),
      ]);

      // Process applied jobs
      const appliedJobIds = appliedData
        ?.filter((app) => app.status === "applied")
        .map((app) => app.job_id) || [];
      setAppliedJobs(appliedJobIds);

      // Process user skills
      if (skillsData && skillsData.length > 0) {
        const allSkills = skillsData
          .map(app => app.skills.split(',').map(skill => skill.trim()))
          .flat()
          .filter((skill, index, self) => self.indexOf(skill) === index);
        setUserSkills(allSkills);
      }

      // Set recent jobs
      setRecentJobs(recentData);

      // Fetch jobs after we have applied jobs
      if (appliedJobIds.length > 0) {
        fnJobs();
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recommended jobs when user skills change
  useEffect(() => {
    const fetchRecommended = async () => {
      if (userSkills.length > 0) {
        const supabaseAccessToken = await session.getToken({
          template: "supabase",
        });
        const recommended = await getRecommendedJobs(supabaseAccessToken, userSkills, appliedJobs);
        setRecommendedJobs(recommended);
      }
    };
    fetchRecommended();
  }, [userSkills, appliedJobs]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, [isLoaded, user?.id]);

  // Function to check and update job status based on deadline
  const checkJobDeadlines = async () => {
    if (!user?.id) return;

    const supabaseAccessToken = await session.getToken({
      template: "supabase",
    });

    try {
      const { data: jobsToCheck } = await supabase
        .from("jobs")
        .select("*")
        .eq("isOpen", true);

      const currentDate = new Date();
      const jobsToClose = jobsToCheck.filter(
        (job) => new Date(job.deadline) < currentDate
      );

      if (jobsToClose.length > 0) {
        await Promise.all(
          jobsToClose.map((job) =>
            supabase
              .from("jobs")
              .update({ isOpen: false })
              .eq("id", job.id)
          )
        );
        // Refresh jobs after updating status
        fnJobs();
      }
    } catch (error) {
      console.error("Error checking job deadlines:", error);
    }
  };

  // Check job deadlines periodically
  useEffect(() => {
    const interval = setInterval(checkJobDeadlines, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSearchQuery(formData.get("search-query") || "");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCompany_id("");
    setLocation("");
  };

  const majorCities = useMemo(
    () => [
      { name: "Mumbai", stateCode: "MH" },
      { name: "Delhi", stateCode: "DL" },
      { name: "Bangalore", stateCode: "KA" },
      { name: "Hyderabad", stateCode: "TG" },
      { name: "Chennai", stateCode: "TN" },
      { name: "Kolkata", stateCode: "WB" },
      { name: "Pune", stateCode: "MH" },
      { name: "Ahmedabad", stateCode: "GJ" },
      { name: "Jaipur", stateCode: "RJ" },
      { name: "Lucknow", stateCode: "UP" },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white px-6 py-10">
      {/* Back Button */}
      <Button
        onClick={() => navigate("/")}
        className="mb-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
      >
        Back 
      </Button>

      <h1 className="text-center text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 pb-6 animate-gradient">
        Latest Jobs
      </h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
        <Input
          type="text"
          placeholder="🔍 Search Jobs by Title.."
          name="search-query"
          className="flex-1 p-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:ring-2 focus:ring-blue-400 backdrop-blur-sm"
        />
        <Button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
          Search
        </Button>
      </form>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 mb-8">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <SelectValue placeholder="🌍 Filter by City" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800/90 border border-gray-700 text-white backdrop-blur-sm">
            <SelectGroup>
              {majorCities.map((city) => (
                <SelectItem key={city.stateCode} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={company_id} onValueChange={setCompany_id}>
          <SelectTrigger className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <SelectValue placeholder="�� Filter by Company" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800/90 border border-gray-700 text-white backdrop-blur-sm">
            <SelectGroup>
              {companies?.map(({ name, id }) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button 
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg" 
          onClick={clearFilters}
        >
          ❌ Clear Filters
        </Button>
      </div>

      {/* Recent Jobs Section */}
      {recentJobs.length > 0 && (
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl -z-10" />
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-gray-800/30 border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Recently Posted Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isApplied={appliedJobs.includes(job.id)}
                  showStatus={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Jobs Section */}
      {recommendedJobs.length > 0 && (
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl -z-10" />
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-gray-800/30 border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Recommended Jobs Based on Your Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isApplied={appliedJobs.includes(job.id)}
                  matchScore={job.matchScore}
                  showStatus={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Jobs Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-2xl -z-10" />
        <div className="p-6 rounded-2xl backdrop-blur-sm bg-gray-800/30 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-300">
            All Jobs
          </h2>
          {loadingJobs ? (
            <div className="flex justify-center">
              <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isApplied={appliedJobs.includes(job.id)}
                  showStatus={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-lg text-gray-400">No Jobs Found 😢</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListing;
