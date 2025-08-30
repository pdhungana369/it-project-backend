import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { prismaClient } from "../server";

export const create = async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const userExits = await CategoryService.findOne(name);
  if (userExits) {
    return res
      .status(400)
      .json({ status: "failure", message: `${name} already exits.` });
  }
  try {
    const requestPayload = {
      name,
      description,
    };
    const data = await CategoryService.create(requestPayload);
    res.status(201).json({ status: "success", data: data });
  } catch (error) {
    res
      .status(400)
      .json({ status: "failure", message: `something went wrong` });
  }
};

export const getAllCategory = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  try {
    const searchCondition: any = {};
    if (search) {
      searchCondition.name = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    const totalOrders = await prismaClient.category.count({
      where: searchCondition,
    });
    const data = await prismaClient.category.findMany({
      where: searchCondition,
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      include: {
        product: true,
      },
    });
    res.status(200).json({
      status: "success",
      data: data,
      meta: {
        totalOrders,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalOrders / limitNumber),
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ status: "failure", message: `something went wrong` });
  }
};
export const getWithProduct = async (req: Request, res: Response) => {
  try {
    const data = await CategoryService.findWithProduct(req?.params?.id);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    res
      .status(400)
      .json({ status: "failure", message: `something went wrong` });
  }
};
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const data = await CategoryService.update(req.params?.id, req?.body);
    res.status(200).json({
      status: "success",
      message: "category edited successfully",
      data,
    });
  } catch (error) {
    res
      .status(400)
      .json({ status: "failure", message: `Failed to update category` });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const data = await CategoryService.delete(req.params?.id);
    res.status(200).json({
      status: "success",
      message: "category deleted successfully",
      data,
    });
  } catch (error) {
    res
      .status(400)
      .json({ status: "failure", message: `Failed to delete category` });
  }
};

export const getCategoryWithProductParams = async (
  req: Request,
  res: Response,
) => {
  const { categoryId } = req.query;

  try {
    if (categoryId) {
      const category = await prismaClient.category.findUnique({
        where: { id: categoryId.toString() },
        include: { product: true },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      return res.status(200).json({
        success: true,
        data: category,
      });
    } else {
      const categories = await prismaClient.category.findFirst({
        include: { product: true },
      });
      return res.status(200).json({
        success: true,
        data: categories,
      });
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
