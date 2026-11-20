"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductRecommendations = exports.chat = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const product_model_1 = __importDefault(require("../models/product.model"));
const ollama_1 = require("../config/ollama");
const MAX_INPUT_LENGTH = 1000;
const getTextInput = (body, field) => {
    if (!body || typeof body !== "object") {
        throw new api_error_1.default(400, "A request body is required");
    }
    const value = body[field];
    if (typeof value !== "string" || !value.trim()) {
        throw new api_error_1.default(400, `${field} is required`);
    }
    if (value.trim().length > MAX_INPUT_LENGTH) {
        throw new api_error_1.default(400, `${field} must be ${MAX_INPUT_LENGTH} characters or fewer`);
    }
    return value.trim();
};
const isRecord = (value) => typeof value === "object" && value !== null;
const chat = async (req, res, next) => {
    try {
        const message = getTextInput(req.body, "message");
        const answer = await (0, ollama_1.ollamaChat)([
            {
                role: "system",
                content: "You are a helpful e-commerce assistant. Answer clearly and do not claim product details you have not been given.",
            },
            { role: "user", content: message },
        ]);
        res
            .status(200)
            .json(new api_response_1.default("AI response generated", { message: answer }));
    }
    catch (error) {
        next(error);
    }
};
exports.chat = chat;
const getProductRecommendations = async (req, res, next) => {
    try {
        const query = getTextInput(req.body, "query");
        const products = await product_model_1.default.find({ isActive: true })
            .select("name slug description")
            .limit(30)
            .lean();
        if (products.length === 0) {
            throw new api_error_1.default(404, "There are no active products to recommend");
        }
        const catalog = products.map(({ name, slug, description }) => ({
            name,
            slug,
            description: description?.slice(0, 500) || "",
        }));
        const answer = await (0, ollama_1.ollamaChat)([
            {
                role: "system",
                content: "Recommend products only from the provided catalog. Return valid JSON with exactly this shape: {\"recommendations\":[{\"slug\":\"catalog-slug\",\"reason\":\"short explanation\"}]}. Return at most five recommendations and never invent a slug.",
            },
            {
                role: "user",
                content: `Customer request: ${query}\nCatalog: ${JSON.stringify(catalog)}`,
            },
        ], { format: "json" });
        let result;
        try {
            result = JSON.parse(answer);
        }
        catch {
            throw new api_error_1.default(502, "Ollama returned invalid recommendation data");
        }
        if (!isRecord(result) || !Array.isArray(result.recommendations)) {
            throw new api_error_1.default(502, "Ollama returned invalid recommendation data");
        }
        const productsBySlug = new Map(products.map((product) => [product.slug, product]));
        const recommendations = [];
        const seenSlugs = new Set();
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
            throw new api_error_1.default(502, "Ollama did not return valid products from the catalog");
        }
        res
            .status(200)
            .json(new api_response_1.default("Product recommendations generated", recommendations));
    }
    catch (error) {
        next(error);
    }
};
exports.getProductRecommendations = getProductRecommendations;
