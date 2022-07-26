import type * as MPPose from "../types/pose";
import type * as MathType from "../types/math";


export function landmark_to_matrix(math: typeof MathType, lm: MPPose.Landmark)
{
    const mat = math.matrix([lm.x, -lm.y + 1, lm.z]);

    return mat;
}

export function landmark_list_to_matrix(lm_list: MPPose.LandmarkList)
{
    let mat: number[][] = [];
    lm_list.forEach(lm =>
    {
        mat.push([lm.x, lm.y, lm.z]);
    });
    return mat;
}

export function landmark_matrix_to_list(lm_mat: MathType.Matrix, lm_list: MPPose.LandmarkList)
{
    let new_lm_list: MPPose.LandmarkList = [];
    for (let index = 0; index < lm_list.length; index++)
    {

        let x = lm_mat.get([index, 0]);
        let y = lm_mat.get([index, 1]);
        let z = lm_mat.get([index, 2]);
        new_lm_list.push({ x: x, y: y, z: z, visibility: lm_list[index].visibility });
    }
    return new_lm_list;
}