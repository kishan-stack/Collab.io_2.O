import { Internship } from "../models/internship.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const getAllInternshipsForSearch = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, jobLocation, sortBy, sortType } = req.query;

    const filter = {};

    // Build the filter based on the main search query
    if (query) {
        filter.$or = [
            { companyName: { $regex: query, $options: 'i' } }, // Case-insensitive match for company name
            { jobDescription: { $regex: query, $options: 'i' } }, // Case-insensitive match for job description
            { designation: { $regex: query, $options: 'i' } }, // Case-insensitive match for designation
            { skills: { $elemMatch: { $regex: query, $options: 'i' } } } // Case-insensitive match for skills
        ];
    }

    // If jobLocation is provided, add it to the filter
    if (jobLocation) {
        filter.jobLocation = { $regex: jobLocation, $options: 'i' }; // Case-insensitive match for job location
    }

    const sort = {};

    if (sortBy) {
        sort[sortBy] = sortType === 'desc' ? -1 : 1;
    } else {
        sort.createdAt = -1; // Default sorting by creation date if no sort is specified
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
        customLabels: {
            totalDocs: 'totalDocs',
            docs: 'internships',
            limit: 'pageSize',
            page: 'currentPage',
            totalPages: 'totalPages',
            nextPage: 'nextPage',
            prevPage: 'prevPage',
            pagingCounter: 'pagingCounter',
            meta: 'pagination'
        },
    };

    try {
        const result = await Internship.aggregatePaginate(
            Internship.aggregate([
                {
                    $match: filter // Apply filters based on user input
                },
                {
                    $project: {
                        companyName: 1,
                        companyLogo: 1,
                        designation: 1,
                        jobDescription: 1,
                        jobLocation: 1,
                        skills: 1
                    }
                },
                {
                    $sort: sort // Add sorting based on user input
                },
            ]),
            options
        );
        console.log(result);
        if (!result || result.internships.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No Internships found !!"));
        }

        return res.status(200).json(
            new ApiResponse(200, result, "Internships fetched successfully")
        );
    } catch (error) {
        res.status(500).json(
            new ApiError(500, error.message || "Error while fetching internships from database")
        );
    }
});


export { getAllInternshipsForSearch }