import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import Product from "../models/product.model";
import { ollamaChat } from "../config/ollama";

const MAX_INPUT_LENGTH = 1000;

const getTextInput = (body: unknown, field: string): string => {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "A request body is required");
  }

  const value = (body as Record<string, unknown>)[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${field} is required`);
  }
  if (value.trim().length > MAX_INPUT_LENGTH) {
    throw new ApiError(400, `${field} must be ${MAX_INPUT_LENGTH} characters or fewer`);
  }

  return value.trim();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const chat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const message = getTextInput(req.body, "message");
    const answer = await ollamaChat([
      {
        role: "system",
        content:
          "You are a helpful e-commerce assistant. Answer clearly and do not claim product details you have not been given.",
      },
      { role: "user", content: message },
    ]);

    res
      .status(200)
      .json(new ApiResponse("AI response generated", { message: answer }));
  } catch (error) {
    next(error);
  }
};

export const getProductRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = getTextInput(req.body, "query");
    const products = await Product.find({ isActive: true })
      .select("name slug description")
      .limit(30)
      .lean();

    if (products.length === 0) {
      throw new ApiError(404, "There are no active products to recommend");
    }

    const catalog = products.map(({ name, slug, description }) => ({
      name,
      slug,
      description: description?.slice(0, 500) || "",
    }));
    const answer = await ollamaChat(
      [
        {
          role: "system",
          content:
            "Recommend products only from the provided catalog. Return valid JSON with exactly this shape: {\"recommendations\":[{\"slug\":\"catalog-slug\",\"reason\":\"short explanation\"}]}. Return at most five recommendations and never invent a slug.",
        },
        {
          role: "user",
          content: `Customer request: ${query}\nCatalog: ${JSON.stringify(catalog)}`,
        },
      ],
      { format: "json" },
    );

    let result: unknown;
    try {
      result = JSON.parse(answer);
    } catch {
      throw new ApiError(502, "Ollama returned invalid recommendation data");
    }

    if (!isRecord(result) || !Array.isArray(result.recommendations)) {
      throw new ApiError(502, "Ollama returned invalid recommendation data");
    }

    const productsBySlug = new Map(products.map((product) => [product.slug, product]));
    const recommendations: Array<{
      product: (typeof products)[number];
      reason: string;
    }> = [];
    const seenSlugs = new Set<string>();

    for (const item of result.recommendations) {
      if (!isRecord(item) || typeof item.slug !== "string" || typeof item.reason !== "string") {
        continue;
      }

      const product = productsBySlug.get(item.slug);
      if (!product || seenSlugs.has(item.slug)) {
        continue;
      }

      seenSlugs.add(item.slug);
      recommendations.push({ product, reason: item.reason.trim().slice(0, 500) });
      if (recommendations.length === 5) {
        break;
      }
    }

    if (recommendations.length === 0) {
      throw new ApiError(502, "Ollama did not return valid products from the catalog");
    }

    res
      .status(200)
      .json(new ApiResponse("Product recommendations generated", recommendations));
  } catch (error) {
    next(error);
  }
};
