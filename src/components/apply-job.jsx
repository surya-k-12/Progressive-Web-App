import React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { BarLoader } from 'react-spinners';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { sendApplicationConfirmation } from '@/api/emailSend';
import useFetch from '@/hooks/use-fetch';
import { applyToJob } from '@/api/apiApplications';


const schema = z.object({
  experience: z.number().min(0, { message: "Experience must be at least 0" }).int(),
  skills: z.string().min(1, { message: "Skills are required" }),
  education: z.enum(["Intermediate", "Graduate", "Post Graduate"], {
    message: "Education is required",
  }),
  resume: z.any().refine(
    file => file && file.length > 0 &&
      (file[0].type === "application/pdf" ||
        file[0].type === "application/msword" ||
        file[0].type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    { message: "Only PDF or Word document is allowed" }
  ),
});

const ApplyJobDrawer = ({ user, job, applied = false, fetchJob }) => {

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingApply,
    error: errorApply,
    fn: fnApply,
  } = useFetch(applyToJob);
 

  const onSubmit = async (data) => {
    const getUsername = (user) => {
      return user.username ||                       // Clerk username
             user.fullName ||                       // Full name if available
             user.firstName ||                      // First name only
             user.email?.split('@')[0] ||           // Email prefix
             `user_${user.id.slice(0, 8)}`;        // Fallback to user ID prefix
    };

    const getRawEmail = (user) => {
      // 1. Check primary email address first
      if (user.primaryEmailAddress?.emailAddress) {
        return user.primaryEmailAddress.emailAddress;
      }
      
      // 2. Check first email in emailAddresses array
      if (user.emailAddresses?.[0]?.emailAddress) {
        return user.emailAddresses[0].emailAddress;
      }
      
      // 3. Fallback to basic email field
      return user.email;
    };

    const userEmail = getRawEmail(user);
    const userName = getUsername(user);

    if (!userEmail) {
      console.error("No email found in user object:", user);
      alert("Email address is required to apply");
      return;
    }

    try {
      // Apply to job
      await fnApply({
        ...data,
        job_id: job.id,
        candidate_id: user.id,
        name: userName,
        email: userEmail,
        status: "applied",
        resume: data.resume[0],
      });

      // Send confirmation email
      await sendApplicationConfirmation({
        to: userEmail,
        jobTitle: job.title,
        companyName: job.company?.name || "the company"
      });

      fetchJob();
      reset();
    } catch (error) {
      console.error("Error applying to job:", error);
      alert("Failed to apply to job. Please try again.");
    }
  };

  return (
    <Drawer open={applied? false:undefined}>

      <DrawerTrigger asChild>
            <Button
          size="lg"
          className={`w-full ${
            job?.isOpen && !applied? "bg-blue-600 hover:bg-pink-600 text-white": "bg-red-500 hover:bg-red-600 text-white"
          }`}
          disabled={!job?.isOpen || applied} >
            
          {job?.isOpen ? (applied ? "Applied" : "Apply") : "Hiring Closed"}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="w-full text-white">
        <DrawerHeader>
          <DrawerTitle>
            Apply for {job?.title} at {job?.company?.name}
          </DrawerTitle>
          <DrawerDescription>Please fill the form below</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-0">
          <Input
            type="number"
            placeholder="Years of Experience"
            {...register("experience", { valueAsNumber: true })}
          />
          {errors.experience && <p className="text-red-500">{errors.experience.message}</p>}

          <Input
            type="text"
            placeholder="Skills (Comma Separated)"
            {...register("skills")}
          />
          {errors.skills && <p className="text-red-500">{errors.skills.message}</p>}

          <Controller
            name="education"
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} value={field.value}>
                {["Intermediate", "Graduate", "Post Graduate"].map((val) => (
                  <div key={val} className="flex items-center space-x-2">
                    <RadioGroupItem value={val} id={val.toLowerCase().replace(" ", "-")} />
                    <Label htmlFor={val.toLowerCase().replace(" ", "-")}>{val}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
          {errors.education && <p className="text-red-500">{errors.education.message}</p>}

          <Input
            type="file"
            accept=".pdf, .doc, .docx"
            {...register("resume")}
          />
          {errors.resume && <p className="text-red-500">{errors.resume.message}</p>}
          {errorApply?.message && <p className="text-red-900">{errorApply.message}</p>}

          {loadingApply && <BarLoader width={"100%"} color="#36d7b7" />}

          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            size="lg"
          >
            Apply
          </Button>
        </form>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ApplyJobDrawer;