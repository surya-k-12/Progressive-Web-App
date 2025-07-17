import { useUser } from '@clerk/clerk-react';
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Heart, MapPinIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { deleteJob, saveJob } from '@/api/apiJobs';
import useFetch from '@/hooks/use-fetch';
import { Trash2Icon } from "lucide-react";
import { BarLoader } from 'react-spinners';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


const JobCard = (
  {
    job,
  savedInit = false,
  onJobSaved = () => {},
  isMyJob = false,
  isApplied = false,
  matchScore,
  showStatus = false,
  }) => {
    const [saved, setSaved] = useState(savedInit);
    
    const {
      loading: loadingSavedJob,
      data: savedJob,
      fn: fnSavedJob,
    } = useFetch(saveJob,{
      alreadySaved: saved,
    });
  
    const {user}=useUser();

    const handleSaveJob = async () => {
      await fnSavedJob({
        user_id: user.id,
        job_id: job.id,
      });
      onJobSaved();
    };
    useEffect(() => {
      if (savedJob !== undefined) setSaved(savedJob?.length > 0);
    }, [savedJob]);
   
    
  const { loading: loadingDeleteJob, fn: fnDeleteJob } = useFetch(deleteJob, {
    job_id: job.id,
  });
  const handleDeleteJob = async () => {
    await fnDeleteJob();
    onJobAction();
  };

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus(isOpen).then(() => fnJob());
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getJobTypeBadge = (type) => {
    const types = {
      in_office: { label: 'In Office', color: 'bg-blue-600' },
      remote: { label: 'Remote', color: 'bg-green-600' },
      hybrid: { label: 'Hybrid', color: 'bg-purple-600' }
    };
    return types[type] || { label: 'Unknown', color: 'bg-gray-600' };
  };

  const jobType = getJobTypeBadge(job.job_type);

  return (
    <Card className="flex flex-col text-white">
    {loadingDeleteJob && (
        <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
      )}
    <CardHeader className="flex">
      <CardTitle className="flex justify-between font-bold">
        {job.title}
      
        {isMyJob && (
          <Trash2Icon
            fill="red"
            size={18}
           className="text-red-300 cursor-pointer"
            onClick={handleDeleteJob}
          />
        )}
              <div className="relative">
  </div>
        
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4 flex-1">
      <div className="flex justify-between">
        {job.company && <img src={job.company.logo_url} className="h-6" />}
        <div className="flex gap-2 items-center">
          <MapPinIcon size={15} /> {job.location}
        </div>
      </div>
      <div className="flex gap-2">
        <span className={`text-white text-sm px-3 py-1 rounded-full ${jobType.color}`}>
          {jobType.label}
        </span>
       
      </div>
      <div className="text-sm text-gray-400">
        <span className="font-semibold">Deadline:</span> {formatDeadline(job.deadline)}
      </div>
      <hr />
      {job.description.substring(0, job.description.indexOf("."))}
    </CardContent>
    <CardFooter className="flex gap-2">
      <Link to={`/job/${job.id}`} className="flex-1">
        <Button variant="secondary" className="w-full bg-purple-600 hover:bg-blue-600 text-white">
          More Details
        </Button>
      </Link>
      {!isMyJob && (
  <Button
    variant="outline"
    className="w-15"
    onClick={handleSaveJob}
    disabled={loadingSavedJob}
  >
    {saved ? (
      <Heart size={20} fill="red" stroke="red" />
    ) : (
      <Heart size={20} />
    )}
  </Button>
)}
    </CardFooter>
  </Card>
);
};
  

export default JobCard;