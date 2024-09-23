import { Hackathon } from "../models/hackathon.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllHackathons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query,startDate,endDate,registrationDeadline,sortBy, sortType } = req.query;

    const filter = {};

    // Build the filter based on the search parameters
    
    if (query) {
        filter.$or = [
            { name: { $regex: query, $options: 'i' } }, // Case-insensitive match for company name
            { skills: { $elemMatch: { $regex: query, $options: 'i' } } } // Case-insensitive match for skills
        ];
    }
    if (startDate) {
        filter.startDate = { $gte: new Date(startDate) }; // Match start date greater than or equal to the provided date
    }

    if (endDate) {
        filter.endDate = { $lte: new Date(endDate) }; // Match end date less than or equal to the provided date
    }

    if (registrationDeadline) {
        filter.registrationDeadline = { $lte: new Date(registrationDeadline) }; // Match registration deadline less than or equal to the provided date
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
            docs: 'hackathons',
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
        const result = await Hackathon.aggregatePaginate(
            Hackathon.aggregate([
                {
                    $match: filter // Apply filters based on user input
                },
                {
                    $project: {
                        name: 1,
                        prizes: 1,
                        startDate: 1,
                        endDate: 1,
                        registrationDeadline: 1,
                        skills: 1,
                    }
                },
                {
                    $sort: sort // Add sorting based on user input
                },
            ]),
            options
        );

        if (!result || result.hackathons.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No Hackathons found !!"));
        }

        return res.status(200).json(
            new ApiResponse(200, result, "Hackathons fetched successfully")
        );
    } catch (error) {
        res.status(500).json(
            new ApiError(500, error.message || "Error while fetching hackathons from database")
        );
    }
});

export { getAllHackathons };