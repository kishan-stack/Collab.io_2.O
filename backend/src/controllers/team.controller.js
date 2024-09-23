import {ApiResponse }from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Team } from "../models/team.model.js"
import crypto from "crypto"
import mongoose from "mongoose"

const createTeam = asyncHandler(async(req,res)=>{
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400,"Team name is required !")
    }
    const teamFormat = {}
    teamFormat.name = name;
    teamFormat.leader = req.user._id;
    teamFormat.members = [ req.user._id];

    const teamCode = await crypto.randomBytes(4).toString("hex")
    console.log(teamCode);
    teamFormat.teamInviteCode = teamCode;
    const team = await Team.create(teamFormat)

    if (!team) {
        throw new ApiError(500,"Something went wrong while creating team , try again later !")
    }

    return res.status(200).json(new ApiResponse(200,team,"Successfully created team!"))
})

const getTeams = asyncHandler(async(req,res)=>{
    const teams = await Team.aggregate([
        {
            $match: { members: { $in: [req.user._id] } } // Match teams where user is a member
        },
        {
            $lookup: {
                from: 'users', // Assuming your User model is stored in a collection named 'users'
                localField: 'leader',
                foreignField: '_id',
                as: 'leaderDetails' // This will contain an array with leader details
            }
        },
        {
            $lookup: {
                from: 'users', // Join again for members
                localField: 'members',
                foreignField: '_id',
                as: 'memberDetails' // This will contain an array of member details
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                teamInviteCode: 1,
                leader: { $arrayElemAt: ['$leaderDetails.username', 0] }, // Get the leader's username
                members: { 
                    $map: { 
                        input: '$memberDetails', 
                        as: 'member', 
                        in: '$$member.username' // Extract usernames for members
                    } 
                }
            }
        }
    ]);

    if (!teams || teams.length === 0) {
        throw new ApiError(404, "No teams found!");
    }

    return res.status(200).json(new ApiResponse(200, teams, "Successfully fetched teams!"));
});
const getTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params; // Assuming team ID is passed as a URL parameter
    const userId = req.user._id; // Assuming you have the user ID available in req.user._id

    const team = await Team.aggregate([
        {
            $match: { 
                _id: new mongoose.Types.ObjectId(teamId),
                members: { $in: [userId] } // Match the team by ID and check if user is a member
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'leader',
                foreignField: '_id',
                as: 'leaderDetails'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'members',
                foreignField: '_id',
                as: 'memberDetails'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                teamInviteCode: 1,
                leader: { $arrayElemAt: ['$leaderDetails.username', 0] },
                members: { 
                    $map: { 
                        input: '$memberDetails', 
                        as: 'member', 
                        in: '$$member.username' 
                    } 
                }
            }
        }
    ]);

    // Check if the team was found and the user is a member
    if (!team || team.length === 0) {
        throw new ApiError(404, "Team not found or you are not authorized to access it!");
    }

    return res.status(200).json(new ApiResponse(200, team[0], "Successfully fetched team!"));
});
const updateTeam = asyncHandler(async(req,res)=>{
    const { teamId } = req.params; // Assuming team ID is passed as a URL parameter
    const userId = req.user._id; // Assuming you have the user ID available in req.user._id

    const updatedTeam = await Team.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(teamId),
            leader: new mongoose.Types.ObjectId(userId) // Ensure the user is the leader
        },
        { name: req.body.name }, // Update only the name field
        { new: true, runValidators: true } // Options: return the updated document and run validators
    );
    // Check if the team was found and the user is a member
    if (!updatedTeam) {
        throw new ApiError(404, "Team not found or you are not authorized to access it!");
    }
    console.log(updatedTeam);
    return res.status(200).json(new ApiResponse(200, {}, "Successfully deleted team!"));
})

const deleteTeam = asyncHandler(async(req,res)=>{
    const { teamId } = req.params; // Assuming team ID is passed as a URL parameter
    const userId = req.user._id; // Assuming you have the user ID available in req.user._id

   const team = await Team.findOneAndDelete({_id : new mongoose.Types.ObjectId(teamId),leader:new mongoose.Types.ObjectId(userId)})

    // Check if the team was found and the user is a member
    if (!team || team.length === 0) {
        throw new ApiError(404, "Team not found or you are not authorized to access it!");
    }
    console.log(team);
    return res.status(200).json(new ApiResponse(200, team[0], "Successfully deleted team!"));
})

export { createTeam , getTeam,getTeams,updateTeam,deleteTeam}