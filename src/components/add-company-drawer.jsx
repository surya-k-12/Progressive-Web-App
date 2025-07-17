/* eslint-disable react/prop-types */
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer";
  import { Button } from "./ui/button";
  import { Input } from "./ui/input";
  import { z } from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useForm } from "react-hook-form";
  import useFetch from "@/hooks/use-fetch";
  import { addNewCompany } from "@/api/apiCompanies";
  import { BarLoader } from "react-spinners";
  import { useEffect } from "react";
  
  const schema = z.object({
    name: z.string().min(1, { message: "Company name is required" }),
    logo: z
      .any()
      .refine(
        (file) =>
          file[0] &&
          (file[0].type === "image/png" || file[0].type === "image/jpeg"),
        {
          message: "Only Images are allowed",
        }
      ),
  });
  
  const AddCompanyDrawer = ({ fetchCompanies }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(schema),
    });
  
    const {
      loading: loadingAddCompany,
      error: errorAddCompany,
      data: dataAddCompany,
      fn: fnAddCompany,
    } = useFetch(addNewCompany);
  
    const onSubmit = async (data) => {
      fnAddCompany({
        ...data,
        logo: data.logo[0],
      });
    };
  
    useEffect(() => {
      if (dataAddCompany?.length > 0) {
        fetchCompanies();
      }
    }, [loadingAddCompany]);
  
    return (
      <Drawer>
        <DrawerTrigger>
          <Button type="button" size="sm" className="bg-blue-700 text-white hover:bg-blue-800">
            Add Company
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-gray-900 text-white">
          <DrawerHeader>
            <DrawerTitle className="text-white">Add a New Company</DrawerTitle>
          </DrawerHeader>
          <form className="flex flex-col gap-4 p-4 pb-0">
            {/* Company Name */}
            <Input
              placeholder="Company name"
              {...register("name")}
              className="bg-gray-800 text-white border border-gray-600 placeholder-gray-400"
            />
  
            {/* Company Logo */}
            <Input
              type="file"
              accept="image/*"
              className="file:text-gray-300 bg-gray-800 border border-gray-600"
              {...register("logo")}
            />
  
            {/* Add Button */}
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="bg-red-700 text-white hover:bg-red-800 w-40"
            >
              Add
            </Button>
          </form>
          <DrawerFooter>
            {errors.name && <p className="text-red-400">{errors.name.message}</p>}
            {errors.logo && <p className="text-red-400">{errors.logo.message}</p>}
            {errorAddCompany?.message && (
              <p className="text-red-400">{errorAddCompany?.message}</p>
            )}
            {loadingAddCompany && <BarLoader width={"100%"} color="#36d7b7" />}
            <DrawerClose asChild>
              <Button type="button" className="bg-gray-700 text-white hover:bg-gray-800">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };
  
  export default AddCompanyDrawer;
  