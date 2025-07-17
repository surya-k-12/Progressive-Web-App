import { getCompanies } from "@/api/apiCompanies";
import { addNewJob } from "@/api/apiJobs";
import AddCompanyDrawer from "@/components/add-company-drawer";
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
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  location: z.string().min(1, { message: "Select a location" }),
  company_id: z.string().min(1, { message: "Select or Add a new Company" }),
  requirements: z.string().min(1, { message: "Requirements are required" }),
  salary: z.string().min(1, { message: "Salary is required" }),
  deadline: z.string().min(1, { message: "Deadline is required" }),
  job_type: z.string().min(1, { message: "Job type is required" }),
});

const majorCities = [
  { name: "Mumbai", stateCode: "MH-MUM" },
  { name: "Delhi", stateCode: "DL-DEL" },
  { name: "Bengaluru", stateCode: "KA-BLR" },
  { name: "Hyderabad", stateCode: "TG-HYD" },
  { name: "Chennai", stateCode: "TN-CHN" },
  { name: "Kolkata", stateCode: "WB-KOL" },
  { name: "Pune", stateCode: "MH-PUN" },
  { name: "Ahmedabad", stateCode: "GJ-AHM" },
  { name: "Jaipur", stateCode: "RJ-JAI" },
  { name: "Lucknow", stateCode: "UP-LKW" },
];

const PostJob = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { location: "", company_id: "", requirements: "", salary: "" },
    resolver: zodResolver(schema),
  });

  const jobTitle = watch("title");
  const jobRequirements = watch("requirements");

  const generateJobDescription = async () => {
    if (!jobTitle) return;
    
    setIsGenerating(true);
    try {
      const prompt = `Generate a professional job description for a ${jobTitle} position. 
Include the following sections:
1. Job Overview
2. Key Responsibilities
3. Required Qualifications
4. Preferred Skills
5. Benefits and Perks

Make it engaging and professional.`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + import.meta.env.VITE_GOOGLE_API_KEY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        
        if (response.status === 401) {
          throw new Error("Invalid Google API key. Please check your environment variables.");
        } else if (response.status === 404) {
          throw new Error("API endpoint not found. Please check the API URL and version.");
        } else if (response.status === 429) {
          throw new Error("API rate limit exceeded. Please try again later.");
        } else {
          throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Invalid response format from API");
      }

      setValue("description", data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error("Error generating job description:", error);
      alert(error.message || "Failed to generate job description. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const {
    loading: loadingCompanies,
    data: companies,
    fn: fnCompanies,
  } = useFetch(getCompanies);

  useEffect(() => {
    if (isLoaded) fnCompanies();
  }, [isLoaded]);

  useEffect(() => {
    if (dataCreateJob?.length > 0) navigate("/my-jobs");
  }, [dataCreateJob]);

  if (!isLoaded || loadingCompanies) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to="/jobs" />;
  }

  const onSubmit = (data) => {
    if (!user?.id) {
      console.error("No user ID found");
      return;
    }

    const jobData = {
      title: data.title,
      description: data.description,
      location: data.location,
      company_id: data.company_id,
      requirements: data.requirements,
      salary: data.salary,
      recruiter_id: user.id,
      isOpen: true,
      deadline: data.deadline,
      job_type: data.job_type
    };

    console.log("Submitting job data:", jobData); // Debug log
    fnCreateJob(jobData);
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-10 text-white">
       <button
  onClick={() => navigate("/")}
  className="self-start px-4 py-2 bg-red-600 text-white rounded hover:bg-blue-700 transition duration-200"
>
   Back 
</button>
      <h1 className="text-center text-5xl sm:text-7xl font-extrabold gradient-title mb-10">
        Post a Job
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6"
      >
        <div>
          <div className="flex gap-2">
            <Input
              placeholder="Job Title"
              className="text-lg"
              {...register("title")}
            />
            <Button
              type="button"
              onClick={generateJobDescription}
              disabled={!jobTitle || isGenerating}
              className="bg-green-600 hover:bg-green-700"
              asChild={false}
            >
              {isGenerating ? "Generating..." : "Generate Description"}
            </Button>
          </div>
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Textarea
            placeholder="Job Description"
            className="text-lg"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full">
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                    <SelectGroup>
                      {majorCities.map((city) => (
                        <SelectItem key={city.stateCode} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <Controller
              name="job_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                    <SelectGroup>
                      <SelectItem value="in_office">In Office</SelectItem>
                      <SelectItem value="remote">Work From Home</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.job_type && (
              <p className="text-red-500 text-sm mt-1">
                {errors.job_type.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <Input
              type="date"
              placeholder="Application Deadline"
              className="text-lg"
              {...register("deadline")}
            />
            {errors.deadline && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deadline.message}
              </p>
            )}
          </div>

          <div className="w-full text-white">
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Company">
                    {field.value
                      ? companies?.find((com) => com.id === Number(field.value))
                          ?.name
                      : "Company"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                  <SelectGroup>
                    {companies?.map(({ name, id }) => (
                      <SelectItem key={name} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
            {errors.company_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.company_id.message}
              </p>
            )}
          </div>

          {/* Add Company Button with surrounding bg */}
          <div className="p-2 bg-gray-700 rounded-md">
            <AddCompanyDrawer fetchCompanies={fnCompanies} />
          </div>
        </div>

        <div>
          <Controller
            name="requirements"
            control={control}
            render={({ field }) => (
              <div className="bg-white text-black rounded-md overflow-hidden">
                <MDEditor value={field.value} onChange={field.onChange} />
              </div>
            )}
          />
          {errors.requirements && (
            <p className="text-red-500 text-sm mt-1">
              {errors.requirements.message}
            </p>
          )}
        </div>

        {errorCreateJob?.message && (
          <p className="text-red-500 text-sm">{errorCreateJob.message}</p>
        )}
              <div>
        <Input
          type="text"
          placeholder="Salary (e.g. 10-15 LPA or ₹1,00,000/month)"
          className="text-lg"
          {...register("salary")}
        />
        {errors.salary && (
          <p className="text-red-500 text-sm mt-1">{errors.salary.message}</p>
        )}
      </div>

        {loadingCreateJob && (
          <BarLoader className="mt-2" width={"100%"} color="#36d7b7" />
        )}

        <Button
          type="submit"
          variant="blue"
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 hover:scale-105"
        >
          Submit Job
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
