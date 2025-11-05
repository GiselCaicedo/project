import * as utilsService from '../../shared/services/utilsService.js';
export const getRoles = async (req, res) => {
    const roles = await utilsService.getRolesFromDB();
    res.status(200).json(roles);
};
export const getclient = async (req, res) => {
    const client = await utilsService.getclientFromDB();
    res.status(200).json(client);
};
