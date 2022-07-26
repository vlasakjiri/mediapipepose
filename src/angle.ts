import type * as MPPose from "../types/pose";
import type * as MathType from "../types/math";

export function get_angle2d(a: MathType.Matrix, b: MathType.Matrix, width: number, height: number)
{
    let x_diff_a = a.get([0]) * width;
    let y_diff_a = a.get([1]) * height;
    let angle_a = Math.atan2(y_diff_a, x_diff_a);

    let x_diff_b = b.get([0]) * width;
    let y_diff_b = b.get([1]) * height;
    let angle_b = Math.atan2(y_diff_b, x_diff_b);


    return (angle_a - angle_b) * 180 / Math.PI;
}

export function filter_landmarks(idx: number[], landmarks: MPPose.Landmark[])
{
    return landmarks.map((lm: MPPose.Landmark, i: number) =>
    {
        if (!idx.includes(i))
        {
            lm.visibility = 0;
        }
        return lm;
    }
    );
}

// function get_angle(lm: MPPose.LandmarkList)
// {
//     let left = false;
//     let hip: MPPose.Landmark, shoulder: MPPose.Landmark;
//     if (lm[mpPose.POSE_LANDMARKS.LEFT_HIP].z <= lm[mpPose.POSE_LANDMARKS.RIGHT_HIP].z)
//     {
//         left = true;
//         hip = lm[mpPose.POSE_LANDMARKS.LEFT_HIP];
//         shoulder = lm[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
//     }
//     else
//     {
//         hip = lm[mpPose.POSE_LANDMARKS.RIGHT_HIP];
//         shoulder = lm[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
//     }
//     let x_diff = Math.abs(shoulder.x - hip.x);
//     let y_diff = Math.abs(shoulder.y - hip.y);
//     let z_diff = Math.abs(shoulder.z - hip.z);
//     let x_vect = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(z_diff, 2));
//     let y_vect = Math.sqrt(Math.pow(y_diff, 2) + Math.pow(z_diff, 2));

//     let angle = Math.atan2(y_vect, x_vect) * 180 / Math.PI;
//     //  let angle = Math.atan2(y x_vect) * 180 / Math.PI;

//     return { angle, left };
// }

// function get_angle_rotated(lm: MPPose.LandmarkList)
// {
//     let left = false;
//     let hip: MPPose.Landmark, shoulder: MPPose.Landmark;
//     if (lm[mpPose.POSE_LANDMARKS.LEFT_HIP].z <= lm[mpPose.POSE_LANDMARKS.RIGHT_HIP].z)
//     {
//         left = true;
//         hip = lm[mpPose.POSE_LANDMARKS.LEFT_HIP];
//         shoulder = lm[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
//     }
//     else
//     {
//         hip = lm[mpPose.POSE_LANDMARKS.RIGHT_HIP];
//         shoulder = lm[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
//     }
//     let x_diff = Math.abs(shoulder.x - hip.x);
//     let y_diff = Math.abs(shoulder.y - hip.y);
//     let angle = Math.atan2(y_diff, x_diff) * 180 / Math.PI;
//     return { angle, left };
// }



// export function get_angle3d(a: MathType.Matrix, b: MathType.Matrix)
// {
//     const dot_product = math.dot(a, b);
//     const norm1 = math.norm(a) as number;
//     const norm2 = math.norm(b) as number;
//     const cosa = dot_product / (norm1 * norm2);
//     const angle = Math.acos(cosa) * 180 / Math.PI;
//     return angle;

// }


