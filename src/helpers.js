export function landmark_to_matrix(math, lm) {
    const mat = math.matrix([lm.x, lm.y, lm.z]);
    return mat;
}
export function landmark_list_to_matrix(lm_list) {
    let mat = [];
    lm_list.forEach(lm => {
        mat.push([lm.x, lm.y, lm.z]);
    });
    return mat;
}
export function landmark_matrix_to_list(lm_mat, lm_list) {
    let new_lm_list = [];
    for (let index = 0; index < lm_list.length; index++) {
        let x = lm_mat.get([index, 0]);
        let y = lm_mat.get([index, 1]);
        let z = lm_mat.get([index, 2]);
        new_lm_list.push({ x: x, y: y, z: z, visibility: lm_list[index].visibility });
    }
    return new_lm_list;
}
//# sourceMappingURL=helpers.js.map