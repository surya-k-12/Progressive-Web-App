import { useEffect, useRef, useState } from "react";
import { BarLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

import useFetch from "@/hooks/use-fetch";

import ApplyJobDrawer from "@/components/apply-job";
import { getSingleJob, updateHiringStatus } from "@/api/apiJobs";



const JobPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();
  const navigate = useNavigate();
  

  const applicantsRef = useRef(null);

  const {
    loading: loadingJob,
    data: job,
    fn: fnJob,
  } = useFetch(getSingleJob, {
    job_id: id,
  });

  useEffect(() => {
    if (isLoaded) fnJob();
  }, [isLoaded]);
  
  const { fn: fnHiringStatus } = useFetch(updateHiringStatus, {
    job_id: id,
  });

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus(isOpen).then(() => fnJob());
  };

 
  
  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }
  
  return (
    <div className="flex flex-col gap-8 mt-5 p-6 bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg">
      <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
        <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl text-gray-900 dark:text-white">
          {job?.title}
        </h1>
        <img src={job?.company?.logo_url} className="h-16" alt={job?.title} />
      </div>

      {/* Job Details */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <MapPinIcon className="text-blue-500" /> {job?.location}
        </div>

        {/* Only recruiter sees this clickable applicant count */}
        {job?.recruiter_id === user?.id && job?.applications?.length > 0 && (
          <button
          onClick={() => navigate(`/applicants/${id}`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium underline"
        >
          <Briefcase /> {job?.applications.length} Applicants
        </button>
        )}
        {/* Salary */}
          {job?.salary && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              💰 Salary: {job.salary}
            </div>
          )}

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-white ${
            job?.isOpen ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {job?.isOpen ? (
            <>
              <DoorOpen /> Open
            </>
          ) : (
            <>
              <DoorClosed /> Closed
            </>
          )}
        </div>
      </div>

      {/* Hiring Status Dropdown */}
      {job?.recruiter_id === user?.id && (
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-full text-white ${
              job?.isOpen ? "bg-green-700" : "bg-red-700"
            }`}
          >
            <SelectValue
              placeholder={job?.isOpen ? "Hiring Status: Open" : "Hiring Status: Closed"}
            />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 text-white">
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* About Job */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        About the Job
      </h2>
      <p className="text-gray-700 dark:text-gray-300">{job?.description}</p>

      {/* Requirements */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        What We Are Looking For
      </h2>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
        {job?.requirements?.split("\n").map((req, idx) => (
          <li key={idx}>{req}</li>
        ))}
      </ul>

      {job?.recruiter_id !== user?.id && (
        <ApplyJobDrawer
        job={job}
        user={user}
        fetchJob={fnJob}
        applied={job?.applications?.find((ap)=>ap.candidate_id === user.id)}
        />
      )}

     
    </div>
  );
};

export default JobPage;