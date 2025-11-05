import * as utilsService from '../services/utilsService.js';
export const getRoles = async (req, res) => {
    const roles = await utilsService.getRolesFromDB();
    res.status(200).json(roles);
};
export const getBusiness = async (req, res) => {
    const business = await utilsService.getBusinessFromDB();
    res.status(200).json(business);
};
