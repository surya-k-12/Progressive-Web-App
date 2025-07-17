import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import companies from "../data/companies.json";
import faqs from "../data/faq.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner"; // optional toast

const LandingPage = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const role = user?.unsafeMetadata?.role;

  const handleFindJobs = () => {
    if (!isSignedIn) {
      navigate("/?sign-in=true");
      return;
    }
  
    if (role === "candidate") {
      navigate("/jobs");
    } else {
      toast.warning("Only candidates can access job listings");
    }
  };
  
  const handlePostJob = () => {
    if (!isSignedIn) {
      navigate("/?sign-in=true");
      return;
    }
  
    if (role === "recruiter") {
      navigate("/post-job");
    } else {
      toast.warning("Only recruiters can post jobs");
    }
  };
  
  return (
    <main className="container mx-auto px-4 flex flex-col gap-10 sm:gap-20 py-10 sm:py-20 bg-black text-white">
      <section className="text-center">
        <h1 className="flex flex-col items-center justify-center gradient-title font-extrabold text-4xl sm:text-6xl lg:text-8xl tracking-tighter py-4">
          Find Your Dream Job
          <span className="flex items-center gap-2 sm:gap-6">
            and get Hired
          </span>
        </h1>
        <p className="text-gray-400 sm:mt-4 text-xs sm:text-xl">
          Explore thousands of job listings or find the perfect candidate
        </p>
      </section>

      <div className="flex gap-6 justify-center">
  <Button
    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg rounded-lg shadow-lg"
    onClick={handleFindJobs}
  >
    Find Jobs
  </Button>
  <Button
    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg rounded-lg shadow-lg"
    onClick={handlePostJob}
  >
    Post a Job
  </Button>
</div>


      <Carousel
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        className="w-full py-10"
      >
        <CarouselContent className="flex gap-5 sm:gap-20 items-center">
          {companies.map(({ name, id, path }) => (
            <CarouselItem key={id} className="basis-1/3 lg:basis-1/6">
              <img
                src={path}
                alt={name}
                className="h-9 sm:h-14 object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <img src="/banner.jpeg" className="w-full" />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">For Job Seekers</CardTitle>
          </CardHeader>
          <CardContent>
            Search and apply for jobs, track applications, and more.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">For Employers</CardTitle>
          </CardHeader>
          <CardContent>
            Post jobs, manage applications, and find the best candidates.
          </CardContent>
        </Card>
      </section>

      <Accordion type="multiple" className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index + 1}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  );
};

export default LandingPage;
